export const SCHEMA_SQL = `
-- ===== 01_taxonomy.sql =====
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS exam_body (
    exam_body_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    conducting_authority TEXT,
    official_url    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exam_variant (
    exam_variant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_body_id    INTEGER NOT NULL REFERENCES exam_body(exam_body_id),
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    short_name      TEXT,
    description     TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exam_variant_body ON exam_variant(exam_body_id);

CREATE TABLE IF NOT EXISTS exam_pattern_version (
    pattern_version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_variant_id INTEGER NOT NULL REFERENCES exam_variant(exam_variant_id),
    effective_year  INTEGER NOT NULL,
    label           TEXT NOT NULL,
    notes           TEXT,
    is_current      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(exam_variant_id, effective_year)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_current_pattern
    ON exam_pattern_version(exam_variant_id)
    WHERE is_current = 1;

CREATE TABLE IF NOT EXISTS exam_stage (
    stage_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_version_id INTEGER NOT NULL REFERENCES exam_pattern_version(pattern_version_id),
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    stage_order     INTEGER NOT NULL,
    is_qualifying_only INTEGER NOT NULL DEFAULT 0,
    counts_toward_merit INTEGER NOT NULL DEFAULT 1,
    UNIQUE(pattern_version_id, code)
);

CREATE INDEX IF NOT EXISTS idx_exam_stage_pattern ON exam_stage(pattern_version_id);

CREATE TABLE IF NOT EXISTS exam_paper (
    paper_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_id        INTEGER NOT NULL REFERENCES exam_stage(stage_id),
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    paper_order     INTEGER NOT NULL,
    is_optional     INTEGER NOT NULL DEFAULT 0,
    applies_to_post_category TEXT,
    duration_minutes INTEGER,
    UNIQUE(stage_id, code)
);

CREATE INDEX IF NOT EXISTS idx_exam_paper_stage ON exam_paper(stage_id);

CREATE TABLE IF NOT EXISTS canonical_subject (
    canonical_subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subject_area (
    subject_area_id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_body_id    INTEGER NOT NULL REFERENCES exam_body(exam_body_id),
    canonical_subject_id INTEGER REFERENCES canonical_subject(canonical_subject_id),
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    parent_subject_area_id INTEGER REFERENCES subject_area(subject_area_id),
    UNIQUE(exam_body_id, code)
);

CREATE INDEX IF NOT EXISTS idx_subject_area_body ON subject_area(exam_body_id);
CREATE INDEX IF NOT EXISTS idx_subject_area_canonical ON subject_area(canonical_subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_area_parent ON subject_area(parent_subject_area_id);

CREATE TABLE IF NOT EXISTS test_module (
    module_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id        INTEGER NOT NULL REFERENCES exam_paper(paper_id),
    parent_module_id INTEGER REFERENCES test_module(module_id),
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    module_order    INTEGER NOT NULL,
    subject_area_id INTEGER REFERENCES subject_area(subject_area_id),
    question_count  INTEGER NOT NULL,
    marks_per_question REAL NOT NULL DEFAULT 1.0,
    negative_marks_per_wrong REAL NOT NULL DEFAULT 0.0,
    negative_marking_basis TEXT,
    duration_minutes INTEGER,
    has_sectional_timer INTEGER NOT NULL DEFAULT 0,
    qualifying_cutoff_marks REAL,
    is_qualifying_only INTEGER NOT NULL DEFAULT 0,
    min_level_note     TEXT,
    UNIQUE(paper_id, code)
);

CREATE INDEX IF NOT EXISTS idx_test_module_paper ON test_module(paper_id);
CREATE INDEX IF NOT EXISTS idx_test_module_parent ON test_module(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_test_module_subject ON test_module(subject_area_id);

CREATE TABLE IF NOT EXISTS topic_tag (
    topic_tag_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_area_id INTEGER NOT NULL REFERENCES subject_area(subject_area_id),
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    UNIQUE(subject_area_id, code)
);

CREATE INDEX IF NOT EXISTS idx_topic_tag_subject ON topic_tag(subject_area_id);

CREATE TABLE IF NOT EXISTS mock_test (
    mock_test_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id        INTEGER NOT NULL REFERENCES exam_paper(paper_id),
    title           TEXT NOT NULL,
    source_label    TEXT,
    is_previous_year_paper INTEGER NOT NULL DEFAULT 0,
    year            INTEGER,
    language        TEXT NOT NULL DEFAULT 'en',
    status          TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
    imported_from_json_id INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mock_test_paper ON mock_test(paper_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_status ON mock_test(status);

CREATE TABLE IF NOT EXISTS question (
    question_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_area_id INTEGER NOT NULL REFERENCES subject_area(subject_area_id),
    question_type   TEXT NOT NULL DEFAULT 'single_choice'
                        CHECK(question_type IN ('single_choice','multi_choice','numeric_answer','descriptive')),
    question_text   TEXT NOT NULL,
    question_text_html TEXT,
    explanation     TEXT,
    difficulty      TEXT CHECK(difficulty IN ('easy','medium','hard')),
    source_reference TEXT,
    correct_numeric_answer REAL,
    numeric_answer_tolerance REAL,
    is_bilingual_pair_of INTEGER REFERENCES question(question_id),
    language        TEXT NOT NULL DEFAULT 'en',
    status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','flagged','retired')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_question_subject ON question(subject_area_id);
CREATE INDEX IF NOT EXISTS idx_question_type ON question(question_type);
CREATE INDEX IF NOT EXISTS idx_question_status ON question(status);
CREATE INDEX IF NOT EXISTS idx_question_bilingual_pair ON question(is_bilingual_pair_of);

CREATE TABLE IF NOT EXISTS question_topic_tag (
    question_id     INTEGER NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
    topic_tag_id    INTEGER NOT NULL REFERENCES topic_tag(topic_tag_id),
    PRIMARY KEY (question_id, topic_tag_id)
);

CREATE INDEX IF NOT EXISTS idx_qtt_topic ON question_topic_tag(topic_tag_id);

CREATE TABLE IF NOT EXISTS question_option (
    option_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id     INTEGER NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
    option_label    TEXT NOT NULL,
    option_text     TEXT NOT NULL,
    is_correct      INTEGER NOT NULL DEFAULT 0,
    option_order    INTEGER NOT NULL,
    UNIQUE(question_id, option_label)
);

CREATE INDEX IF NOT EXISTS idx_question_option_question ON question_option(question_id);
CREATE INDEX IF NOT EXISTS idx_question_option_correct ON question_option(question_id) WHERE is_correct = 1;

CREATE TABLE IF NOT EXISTS question_paper_slot (
    slot_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    mock_test_id    INTEGER NOT NULL REFERENCES mock_test(mock_test_id) ON DELETE CASCADE,
    module_id       INTEGER NOT NULL REFERENCES test_module(module_id),
    question_id     INTEGER NOT NULL REFERENCES question(question_id),
    position_in_module INTEGER NOT NULL,
    marks_override  REAL,
    negative_marks_override REAL,
    UNIQUE(mock_test_id, module_id, position_in_module),
    UNIQUE(mock_test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_qps_mock ON question_paper_slot(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_qps_module ON question_paper_slot(module_id);
CREATE INDEX IF NOT EXISTS idx_qps_question ON question_paper_slot(question_id);

CREATE TABLE IF NOT EXISTS module_timer_policy (
    module_id       INTEGER PRIMARY KEY REFERENCES test_module(module_id),
    timer_scope     TEXT NOT NULL CHECK(timer_scope IN ('composite_paper','own_module','inherit_parent')),
    allow_free_navigation INTEGER NOT NULL DEFAULT 1,
    auto_submit_on_expiry INTEGER NOT NULL DEFAULT 1,
    locks_after_expiry INTEGER NOT NULL DEFAULT 1,
    warning_at_seconds_remaining INTEGER DEFAULT 300
);

CREATE TABLE IF NOT EXISTS exam_variant_config (
    exam_variant_id INTEGER PRIMARY KEY REFERENCES exam_variant(exam_variant_id),
    allows_medium_choice INTEGER NOT NULL DEFAULT 0,
    default_language TEXT NOT NULL DEFAULT 'en',
    available_languages TEXT NOT NULL DEFAULT 'en',
    allows_answer_review_before_submit INTEGER NOT NULL DEFAULT 1,
    allows_question_marking_for_review INTEGER NOT NULL DEFAULT 1,
    shows_running_score_during_attempt INTEGER NOT NULL DEFAULT 0,
    calculator_allowed INTEGER NOT NULL DEFAULT 0,
    rough_sheet_note   TEXT,
    total_attempt_duration_minutes INTEGER,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS app_user (
    user_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name    TEXT NOT NULL,
    email           TEXT UNIQUE,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    target_exam_variant_id INTEGER REFERENCES exam_variant(exam_variant_id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_app_user_target_exam ON app_user(target_exam_variant_id);

CREATE TABLE IF NOT EXISTS user_practice_preference (
    user_id         INTEGER NOT NULL REFERENCES app_user(user_id),
    exam_variant_id INTEGER NOT NULL REFERENCES exam_variant(exam_variant_id),
    negative_marking_enabled INTEGER NOT NULL DEFAULT 1,
    timer_enabled   INTEGER NOT NULL DEFAULT 1,
    preferred_language TEXT,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, exam_variant_id)
);

CREATE TABLE IF NOT EXISTS test_attempt (
    attempt_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES app_user(user_id),
    mock_test_id    INTEGER NOT NULL REFERENCES mock_test(mock_test_id),
    attempt_number  INTEGER NOT NULL DEFAULT 1,
    attempt_mode    TEXT NOT NULL DEFAULT 'full_mock'
                        CHECK(attempt_mode IN ('full_mock','sectional_practice','custom_topic_drill')),
    negative_marking_enabled INTEGER NOT NULL,
    started_at      TEXT NOT NULL DEFAULT (datetime('now')),
    submitted_at    TEXT,
    status          TEXT NOT NULL DEFAULT 'in_progress'
                        CHECK(status IN ('in_progress','submitted','auto_submitted_timeout','abandoned')),
    total_score     REAL,
    total_correct   INTEGER,
    total_wrong     INTEGER,
    total_unattempted INTEGER,
    total_time_taken_seconds INTEGER,
    UNIQUE(user_id, mock_test_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_attempt_user ON test_attempt(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_mock_test ON test_attempt(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_attempt_status ON test_attempt(status);
CREATE INDEX IF NOT EXISTS idx_attempt_user_started ON test_attempt(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS attempt_module_scope (
    attempt_id      INTEGER NOT NULL REFERENCES test_attempt(attempt_id) ON DELETE CASCADE,
    module_id       INTEGER NOT NULL REFERENCES test_module(module_id),
    PRIMARY KEY (attempt_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_ams_module ON attempt_module_scope(module_id);

CREATE TABLE IF NOT EXISTS attempt_answer (
    answer_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id      INTEGER NOT NULL REFERENCES test_attempt(attempt_id) ON DELETE CASCADE,
    question_id     INTEGER NOT NULL REFERENCES question(question_id),
    selected_option_id INTEGER REFERENCES question_option(option_id),
    selected_numeric_answer REAL,
    is_marked_for_review INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER,
    answered_at     TEXT NOT NULL DEFAULT (datetime('now')),
    is_correct      INTEGER,
    marks_awarded   REAL,
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answer_attempt ON attempt_answer(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answer_question ON attempt_answer(question_id);

CREATE TABLE IF NOT EXISTS attempt_module_result (
    attempt_id      INTEGER NOT NULL REFERENCES test_attempt(attempt_id) ON DELETE CASCADE,
    module_id       INTEGER NOT NULL REFERENCES test_module(module_id),
    correct_count   INTEGER NOT NULL DEFAULT 0,
    wrong_count     INTEGER NOT NULL DEFAULT 0,
    unattempted_count INTEGER NOT NULL DEFAULT 0,
    score           REAL NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER,
    cleared_qualifying_cutoff INTEGER,
    PRIMARY KEY (attempt_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_amr_module ON attempt_module_result(module_id);

CREATE TABLE IF NOT EXISTS import_batch (
    import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_filename TEXT NOT NULL,
    imported_by_user_id INTEGER REFERENCES app_user(user_id),
    raw_json        TEXT NOT NULL,
    target_exam_variant_id INTEGER REFERENCES exam_variant(exam_variant_id),
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','validating','validated','committed','rejected','partially_committed')),
    validation_summary TEXT,
    committed_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staged_question (
    staged_question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_batch_id INTEGER NOT NULL REFERENCES import_batch(import_batch_id) ON DELETE CASCADE,
    source_index    INTEGER NOT NULL,
    raw_question_json TEXT NOT NULL,
    module_code     TEXT,
    question_text   TEXT,
    question_type   TEXT,
    difficulty      TEXT,
    explanation     TEXT,
    options_json    TEXT,
    correct_answer_json TEXT,
    validation_status TEXT NOT NULL DEFAULT 'pending'
                        CHECK(validation_status IN ('pending','valid','error','warning')),
    validation_errors TEXT,
    committed_question_id INTEGER REFERENCES question(question_id)
);

CREATE INDEX IF NOT EXISTS idx_staged_question_batch ON staged_question(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_staged_question_status ON staged_question(validation_status);

CREATE TABLE IF NOT EXISTS question_asset (
    asset_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id     INTEGER REFERENCES question(question_id) ON DELETE CASCADE,
    option_id       INTEGER REFERENCES question_option(option_id) ON DELETE CASCADE,
    asset_type      TEXT NOT NULL CHECK(asset_type IN ('image','diagram','audio')),
    asset_role      TEXT NOT NULL DEFAULT 'illustration'
                        CHECK(asset_role IN ('illustration','answer_figure','shared_passage_figure')),
    file_path       TEXT NOT NULL,
    alt_text        TEXT,
    display_order   INTEGER NOT NULL DEFAULT 1,
    CHECK ((question_id IS NOT NULL AND option_id IS NULL)
        OR (question_id IS NULL AND option_id IS NOT NULL)),
    CHECK (asset_role != 'answer_figure' OR (alt_text IS NOT NULL AND trim(alt_text) != ''))
);

CREATE INDEX IF NOT EXISTS idx_question_asset_question ON question_asset(question_id);
CREATE INDEX IF NOT EXISTS idx_question_asset_option ON question_asset(option_id);

CREATE TABLE IF NOT EXISTS question_asset_share (
    question_id     INTEGER NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
    question_asset_id INTEGER NOT NULL REFERENCES question_asset(asset_id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, question_asset_id)
);

CREATE INDEX IF NOT EXISTS idx_qas_asset ON question_asset_share(question_asset_id);
`;

export const TRIGGERS_SQL = `
CREATE TRIGGER IF NOT EXISTS trg_block_insert_after_submit
BEFORE INSERT ON attempt_answer
FOR EACH ROW
WHEN (SELECT status FROM test_attempt WHERE attempt_id = NEW.attempt_id) != 'in_progress'
BEGIN
    SELECT RAISE(ABORT, 'Cannot record an answer: this attempt is no longer in progress.');
END;

CREATE TRIGGER IF NOT EXISTS trg_block_update_after_submit
BEFORE UPDATE ON attempt_answer
FOR EACH ROW
WHEN (SELECT status FROM test_attempt WHERE attempt_id = NEW.attempt_id) != 'in_progress'
BEGIN
    SELECT RAISE(ABORT, 'Cannot change an answer: this attempt is no longer in progress.');
END;

DROP VIEW IF EXISTS v_attempt_question_slot;
CREATE VIEW v_attempt_question_slot AS
SELECT
    ta.attempt_id,
    q.question_id,
    CASE ta.attempt_mode
        WHEN 'sectional_practice' THEN
            (SELECT qps.slot_id FROM question_paper_slot qps
               JOIN attempt_module_scope ams ON ams.module_id = qps.module_id AND ams.attempt_id = ta.attempt_id
               WHERE qps.question_id = q.question_id)
        WHEN 'custom_topic_drill' THEN
            (SELECT qps.slot_id FROM question_paper_slot qps
               JOIN attempt_module_scope ams ON ams.module_id = qps.module_id AND ams.attempt_id = ta.attempt_id
               WHERE qps.question_id = q.question_id)
        ELSE
            (SELECT qps.slot_id FROM question_paper_slot qps
               WHERE qps.mock_test_id = ta.mock_test_id AND qps.question_id = q.question_id)
    END AS slot_id
FROM test_attempt ta
CROSS JOIN question q;

CREATE TRIGGER IF NOT EXISTS trg_block_out_of_scope_insert
BEFORE INSERT ON attempt_answer
FOR EACH ROW
WHEN (SELECT slot_id FROM v_attempt_question_slot WHERE attempt_id = NEW.attempt_id AND question_id = NEW.question_id) IS NULL
BEGIN
    SELECT RAISE(ABORT, 'Cannot record an answer: this question is not part of this attempt''s scope.');
END;

CREATE TRIGGER IF NOT EXISTS trg_autograde_insert
AFTER INSERT ON attempt_answer
FOR EACH ROW
BEGIN
    UPDATE attempt_answer
    SET
        is_correct = CASE
            WHEN (SELECT question_type FROM question WHERE question_id = NEW.question_id) IN ('single_choice','multi_choice')
                THEN COALESCE((SELECT is_correct FROM question_option WHERE option_id = NEW.selected_option_id), 0)
            WHEN (SELECT question_type FROM question WHERE question_id = NEW.question_id) = 'numeric_answer'
                THEN CASE WHEN NEW.selected_numeric_answer IS NOT NULL
                          AND ABS(NEW.selected_numeric_answer - (SELECT correct_numeric_answer FROM question WHERE question_id = NEW.question_id))
                              <= COALESCE((SELECT numeric_answer_tolerance FROM question WHERE question_id = NEW.question_id), 0)
                     THEN 1 ELSE 0 END
            ELSE 0
        END,
        marks_awarded = CASE
            WHEN (
                (SELECT question_type FROM question WHERE question_id = NEW.question_id) IN ('single_choice','multi_choice')
                AND COALESCE((SELECT is_correct FROM question_option WHERE option_id = NEW.selected_option_id), 0) = 1
            ) OR (
                (SELECT question_type FROM question WHERE question_id = NEW.question_id) = 'numeric_answer'
                AND NEW.selected_numeric_answer IS NOT NULL
                AND ABS(NEW.selected_numeric_answer - (SELECT correct_numeric_answer FROM question WHERE question_id = NEW.question_id))
                    <= COALESCE((SELECT numeric_answer_tolerance FROM question WHERE question_id = NEW.question_id), 0)
            )
            THEN (SELECT COALESCE(qps.marks_override, tm.marks_per_question)
                  FROM v_attempt_question_slot vaqs
                  JOIN question_paper_slot qps ON qps.slot_id = vaqs.slot_id
                  JOIN test_module tm ON tm.module_id = qps.module_id
                  WHERE vaqs.attempt_id = NEW.attempt_id AND vaqs.question_id = NEW.question_id)
            WHEN NEW.selected_option_id IS NOT NULL OR NEW.selected_numeric_answer IS NOT NULL
            THEN -1 * (
                SELECT CASE WHEN ta.negative_marking_enabled = 1
                    THEN COALESCE(qps.negative_marks_override, tm.negative_marks_per_wrong) ELSE 0 END
                FROM test_attempt ta
                JOIN v_attempt_question_slot vaqs ON vaqs.attempt_id = ta.attempt_id AND vaqs.question_id = NEW.question_id
                JOIN question_paper_slot qps ON qps.slot_id = vaqs.slot_id
                JOIN test_module tm ON tm.module_id = qps.module_id
                WHERE ta.attempt_id = NEW.attempt_id
            )
            ELSE 0
        END
    WHERE answer_id = NEW.answer_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_autograde_update
AFTER UPDATE OF selected_option_id, selected_numeric_answer ON attempt_answer
FOR EACH ROW
BEGIN
    UPDATE attempt_answer
    SET
        is_correct = CASE
            WHEN (SELECT question_type FROM question WHERE question_id = NEW.question_id) IN ('single_choice','multi_choice')
                THEN COALESCE((SELECT is_correct FROM question_option WHERE option_id = NEW.selected_option_id), 0)
            WHEN (SELECT question_type FROM question WHERE question_id = NEW.question_id) = 'numeric_answer'
                THEN CASE WHEN NEW.selected_numeric_answer IS NOT NULL
                          AND ABS(NEW.selected_numeric_answer - (SELECT correct_numeric_answer FROM question WHERE question_id = NEW.question_id))
                              <= COALESCE((SELECT numeric_answer_tolerance FROM question WHERE question_id = NEW.question_id), 0)
                     THEN 1 ELSE 0 END
            ELSE 0
        END,
        marks_awarded = CASE
            WHEN (
                (SELECT question_type FROM question WHERE question_id = NEW.question_id) IN ('single_choice','multi_choice')
                AND COALESCE((SELECT is_correct FROM question_option WHERE option_id = NEW.selected_option_id), 0) = 1
            ) OR (
                (SELECT question_type FROM question WHERE question_id = NEW.question_id) = 'numeric_answer'
                AND NEW.selected_numeric_answer IS NOT NULL
                AND ABS(NEW.selected_numeric_answer - (SELECT correct_numeric_answer FROM question WHERE question_id = NEW.question_id))
                    <= COALESCE((SELECT numeric_answer_tolerance FROM question WHERE question_id = NEW.question_id), 0)
            )
            THEN (SELECT COALESCE(qps.marks_override, tm.marks_per_question)
                  FROM v_attempt_question_slot vaqs
                  JOIN question_paper_slot qps ON qps.slot_id = vaqs.slot_id
                  JOIN test_module tm ON tm.module_id = qps.module_id
                  WHERE vaqs.attempt_id = NEW.attempt_id AND vaqs.question_id = NEW.question_id)
            WHEN NEW.selected_option_id IS NOT NULL OR NEW.selected_numeric_answer IS NOT NULL
            THEN -1 * (
                SELECT CASE WHEN ta.negative_marking_enabled = 1
                    THEN COALESCE(qps.negative_marks_override, tm.negative_marks_per_wrong) ELSE 0 END
                FROM test_attempt ta
                JOIN v_attempt_question_slot vaqs ON vaqs.attempt_id = ta.attempt_id AND vaqs.question_id = NEW.question_id
                JOIN question_paper_slot qps ON qps.slot_id = vaqs.slot_id
                JOIN test_module tm ON tm.module_id = qps.module_id
                WHERE ta.attempt_id = NEW.attempt_id
            )
            ELSE 0
        END
    WHERE answer_id = NEW.answer_id;
END;
`;

export const SEED_SQL = `
INSERT OR IGNORE INTO exam_body (code, name, conducting_authority, official_url) VALUES
    ('SSC', 'Staff Selection Commission', 'Government of India', 'https://ssc.gov.in'),
    ('TNPSC', 'Tamil Nadu Public Service Commission', 'Government of Tamil Nadu', 'https://tnpsc.gov.in');

INSERT OR IGNORE INTO exam_variant (exam_body_id, code, name, short_name) VALUES
    ((SELECT exam_body_id FROM exam_body WHERE code = 'SSC'), 'SSC_CGL', 'Combined Graduate Level', 'CGL'),
    ((SELECT exam_body_id FROM exam_body WHERE code = 'TNPSC'), 'TNPSC_GRP1', 'Combined Civil Services Examination - I', 'Group 1');

INSERT OR IGNORE INTO exam_pattern_version (exam_variant_id, effective_year, label, is_current) VALUES
    ((SELECT exam_variant_id FROM exam_variant WHERE code = 'SSC_CGL'), 2025,
     'SSC CGL 2025 Pattern (Tier 1 + Tier 2, post-restructure)', 1),
    ((SELECT exam_variant_id FROM exam_variant WHERE code = 'TNPSC_GRP1'), 2026,
     'TNPSC Group 1 2026 Pattern (Prelims)', 1);

INSERT OR IGNORE INTO exam_stage (pattern_version_id, code, name, stage_order, is_qualifying_only, counts_toward_merit) VALUES
    ((SELECT pattern_version_id FROM exam_pattern_version WHERE label LIKE 'SSC CGL 2025%'),
     'TIER_1', 'Tier I', 1, 1, 0),
    ((SELECT pattern_version_id FROM exam_pattern_version WHERE label LIKE 'SSC CGL 2025%'),
     'TIER_2', 'Tier II', 2, 0, 1);

INSERT OR IGNORE INTO exam_stage (pattern_version_id, code, name, stage_order, is_qualifying_only, counts_toward_merit) VALUES
    ((SELECT pattern_version_id FROM exam_pattern_version WHERE label LIKE 'TNPSC Group 1%'),
     'PRELIMS', 'Preliminary Examination', 1, 1, 0);

INSERT OR IGNORE INTO exam_paper (stage_id, code, name, paper_order, is_optional, duration_minutes) VALUES
    ((SELECT stage_id FROM exam_stage WHERE code = 'TIER_1'
        AND pattern_version_id = (SELECT pattern_version_id FROM exam_pattern_version WHERE label LIKE 'SSC CGL 2025%')),
     'TIER1_PAPER', 'Tier I - Single Paper', 1, 0, 60),
    ((SELECT stage_id FROM exam_stage WHERE code = 'TIER_2'
        AND pattern_version_id = (SELECT pattern_version_id FROM exam_pattern_version WHERE label LIKE 'SSC CGL 2025%')),
     'PAPER_1', 'Paper I - Compulsory (Mathematical Abilities, Reasoning, English, GA, Computer Knowledge)', 1, 0, 150);

INSERT OR IGNORE INTO exam_paper (stage_id, code, name, paper_order, duration_minutes) VALUES
    ((SELECT stage_id FROM exam_stage WHERE code = 'PRELIMS'),
     'PRELIMS_PAPER', 'Preliminary Exam - Single Paper', 1, 180);

INSERT OR IGNORE INTO canonical_subject (code, name) VALUES
    ('REASONING', 'Reasoning / General Intelligence'),
    ('QUANT', 'Quantitative Aptitude'),
    ('GK_GS', 'General Knowledge / General Studies'),
    ('ENGLISH', 'English Language');

INSERT OR IGNORE INTO subject_area (exam_body_id, canonical_subject_id, code, name) VALUES
    ((SELECT exam_body_id FROM exam_body WHERE code = 'SSC'),
     (SELECT canonical_subject_id FROM canonical_subject WHERE code = 'REASONING'), 'SSC_REASONING', 'General Intelligence & Reasoning'),
    ((SELECT exam_body_id FROM exam_body WHERE code = 'SSC'),
     (SELECT canonical_subject_id FROM canonical_subject WHERE code = 'QUANT'), 'SSC_QUANT', 'Quantitative Aptitude'),
    ((SELECT exam_body_id FROM exam_body WHERE code = 'SSC'),
     (SELECT canonical_subject_id FROM canonical_subject WHERE code = 'GK_GS'), 'SSC_GA', 'General Awareness'),
    ((SELECT exam_body_id FROM exam_body WHERE code = 'SSC'),
     (SELECT canonical_subject_id FROM canonical_subject WHERE code = 'ENGLISH'), 'SSC_ENGLISH', 'English Comprehension');

INSERT OR IGNORE INTO subject_area (exam_body_id, canonical_subject_id, code, name) VALUES
    ((SELECT exam_body_id FROM exam_body WHERE code = 'TNPSC'),
     (SELECT canonical_subject_id FROM canonical_subject WHERE code = 'GK_GS'), 'TNPSC_GS', 'General Studies'),
    ((SELECT exam_body_id FROM exam_body WHERE code = 'TNPSC'),
     (SELECT canonical_subject_id FROM canonical_subject WHERE code = 'QUANT'), 'TNPSC_APTITUDE', 'Aptitude and Mental Ability');

INSERT OR IGNORE INTO test_module (paper_id, code, name, module_order, subject_area_id, question_count, marks_per_question, negative_marks_per_wrong, negative_marking_basis, has_sectional_timer) VALUES
    ((SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER'), 'GI_REASONING', 'General Intelligence & Reasoning', 1, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_REASONING'), 25, 2.0, 0.5, 'flat', 0),
    ((SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER'), 'GA', 'General Awareness', 2, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_GA'), 25, 2.0, 0.5, 'flat', 0),
    ((SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER'), 'QUANT', 'Quantitative Aptitude', 3, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_QUANT'), 25, 2.0, 0.5, 'flat', 0),
    ((SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER'), 'ENGLISH', 'English Comprehension', 4, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_ENGLISH'), 25, 2.0, 0.5, 'flat', 0);

INSERT OR IGNORE INTO test_module (paper_id, code, name, module_order, subject_area_id, question_count, marks_per_question, negative_marks_per_wrong, negative_marking_basis, has_sectional_timer, duration_minutes, min_level_note) VALUES
    ((SELECT paper_id FROM exam_paper WHERE code = 'PAPER_1'), 'SEC1_MATH', 'Section I - Mathematical Abilities', 1, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_QUANT'), 30, 3.0, 1.0, 'flat', 1, 45, 'Matriculation level'),
    ((SELECT paper_id FROM exam_paper WHERE code = 'PAPER_1'), 'SEC2_REASONING', 'Section II - Reasoning and General Intelligence', 2, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_REASONING'), 30, 3.0, 1.0, 'flat', 1, 45, NULL),
    ((SELECT paper_id FROM exam_paper WHERE code = 'PAPER_1'), 'SEC3_MOD1_GA', 'Section III, Module 1 - General Awareness', 3, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_GA'), 20, 3.0, 1.0, 'flat', 1, 30, NULL),
    ((SELECT paper_id FROM exam_paper WHERE code = 'PAPER_1'), 'SEC3_MOD2_COMPUTER', 'Section III, Module 2 - Computer Knowledge', 4, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_ENGLISH'), 15, 3.0, 0.5, 'flat', 1, 15, NULL);

INSERT OR IGNORE INTO test_module (paper_id, code, name, module_order, subject_area_id, question_count, marks_per_question, negative_marks_per_wrong, negative_marking_basis, has_sectional_timer) VALUES
    ((SELECT paper_id FROM exam_paper WHERE code = 'PRELIMS_PAPER'), 'PART_A_GS', 'Part A - General Studies', 1, (SELECT subject_area_id FROM subject_area WHERE code = 'TNPSC_GS'), 175, 1.5, 0.0, NULL, 0),
    ((SELECT paper_id FROM exam_paper WHERE code = 'PRELIMS_PAPER'), 'PART_B_APTITUDE', 'Part B - Aptitude and Mental Ability', 2, (SELECT subject_area_id FROM subject_area WHERE code = 'TNPSC_APTITUDE'), 25, 1.5, 0.0, NULL, 0);

INSERT OR IGNORE INTO module_timer_policy (module_id, timer_scope, allow_free_navigation)
SELECT module_id, 'composite_paper', 1 FROM test_module WHERE code IN ('GI_REASONING','GA','QUANT','ENGLISH') AND NOT EXISTS (SELECT 1 FROM module_timer_policy WHERE module_id = test_module.module_id);

INSERT OR IGNORE INTO module_timer_policy (module_id, timer_scope, allow_free_navigation)
SELECT module_id, 'own_module', 0 FROM test_module WHERE code IN ('SEC1_MATH','SEC2_REASONING','SEC3_MOD1_GA','SEC3_MOD2_COMPUTER') AND NOT EXISTS (SELECT 1 FROM module_timer_policy WHERE module_id = test_module.module_id);

INSERT OR IGNORE INTO module_timer_policy (module_id, timer_scope, allow_free_navigation)
SELECT module_id, 'composite_paper', 1 FROM test_module WHERE code IN ('PART_A_GS','PART_B_APTITUDE') AND NOT EXISTS (SELECT 1 FROM module_timer_policy WHERE module_id = test_module.module_id);

INSERT OR IGNORE INTO exam_variant_config (exam_variant_id, allows_medium_choice, default_language, available_languages, calculator_allowed, total_attempt_duration_minutes) VALUES
    ((SELECT exam_variant_id FROM exam_variant WHERE code = 'SSC_CGL'), 1, 'en', 'en,hi', 0, 60),
    ((SELECT exam_variant_id FROM exam_variant WHERE code = 'TNPSC_GRP1'), 1, 'en', 'en,ta', 0, 180);

-- Mocks
INSERT OR IGNORE INTO mock_test (paper_id, title, source_label, is_previous_year_paper, year) VALUES
    ((SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER'), 'SSC CGL Tier 1 - Mock 01', 'Community Set 1', 0, NULL),
    ((SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER'), 'SSC CGL Tier 1 - Mock 02', 'Community Set 2', 0, NULL),
    ((SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER'), 'SSC CGL Tier 1 - 2024 PYQ (Shift 1)', 'Previous Year 2024', 1, 2024);

INSERT OR IGNORE INTO question (question_id, subject_area_id, question_type, question_text, explanation, difficulty, source_reference) VALUES
    (1, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_REASONING'), 'single_choice', 'Find the odd one out: Triangle, Square, Circle, Draw', '"Draw" is a verb; the others are shapes (nouns).', 'easy', 'Mock 01'),
    (2, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_REASONING'), 'single_choice', 'If MADRAS is coded as NBESBT, how is BOMBAY coded?', 'Each letter is shifted forward by one position in the alphabet.', 'medium', 'Mock 02'),
    (3, (SELECT subject_area_id FROM subject_area WHERE code = 'SSC_REASONING'), 'single_choice', 'A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?', 'A and B are siblings; C is B''s sibling and D''s father, so A is D''s uncle or aunt depending on A''s gender -- for this MCQ, the answer key specifies Uncle.', 'medium', 'SSC CGL 2024 Tier 1, Shift 1');

INSERT OR IGNORE INTO question_option (question_id, option_label, option_text, is_correct, option_order) VALUES
    (1, 'A', 'Triangle', 0, 1), (1, 'B', 'Square', 0, 2), (1, 'C', 'Circle', 0, 3), (1, 'D', 'Draw', 1, 4),
    (2, 'A', 'CPNCBZ', 1, 1), (2, 'B', 'BNLABX', 0, 2), (2, 'C', 'CPNCBX', 0, 3), (2, 'D', 'BPNCBZ', 0, 4),
    (3, 'A', 'Uncle', 1, 1), (3, 'B', 'Cousin', 0, 2), (3, 'C', 'Nephew', 0, 3), (3, 'D', 'Brother', 0, 4);

INSERT OR IGNORE INTO question_paper_slot (mock_test_id, module_id, question_id, position_in_module) VALUES
    (1, (SELECT module_id FROM test_module WHERE code = 'GI_REASONING' AND paper_id = (SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER')), 1, 1),
    (2, (SELECT module_id FROM test_module WHERE code = 'GI_REASONING' AND paper_id = (SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER')), 2, 1),
    (3, (SELECT module_id FROM test_module WHERE code = 'GI_REASONING' AND paper_id = (SELECT paper_id FROM exam_paper WHERE code = 'TIER1_PAPER')), 3, 1);
`;
