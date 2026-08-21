export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn';

export interface LocalizedText {
  en: string;
  hi?: string;
  ta?: string;
  te?: string;
  bn?: string;
  mr?: string;
  gu?: string;
  kn?: string;
  [key: string]: string | undefined;
}

export interface Option {
  id: string;
  text: LocalizedText;
  media?: MediaItem[];
}

export type QuestionType =
  | 'mcq'
  | 'multiple_correct'
  | 'true_false'
  | 'assertion_reason'
  | 'match_the_following'
  | 'numerical'
  | 'statement_based'
  | 'passage'
  | 'image_based'
  | 'chart_based';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface MediaItem {
  type: 'image' | 'diagram' | 'chart' | 'table' | 'math_figure';
  url: string;
  alt?: LocalizedText;
}

export interface RichSolution {
  short?: LocalizedText;
  detailed?: LocalizedText;
  steps?: LocalizedText[];
  formula?: LocalizedText;
}

export interface QuestionMetadata {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  source?: string;
  year?: number;
  shift?: string;
  tags?: string[];
}

export interface QuestionGroup {
  id: string;
  type: 'passage' | 'di_set' | 'puzzle' | 'case_study';
  title?: LocalizedText;
  content: LocalizedText;
  media?: MediaItem[];
}

export interface Question {
  id: string;
  section: string;
  text: LocalizedText;
  options: Option[];
  correctOptionId: string;
  explanation?: LocalizedText;
  solution?: RichSolution;
  metadata?: QuestionMetadata;
  media?: MediaItem[];
  groupId?: string | null;
  tags?: string[];
}

export interface SectionDef {
  name: string | LocalizedText;
  timeLimit: number; // in seconds
  id?: string;
  order?: number;
  questionCount?: number;
  scoring?: ScoringConfig | null;
  questionIds?: string[];
}

export interface ScoringConfig {
  correct: number;
  incorrect: number;
  unattempted?: number;
}

export interface MockTestSettings {
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  allowBackNavigation?: boolean;
  showQuestionPalette?: boolean;
  allowMarkForReview?: boolean;
  autoSubmitOnTimeUp?: boolean;
  showResultImmediately?: boolean;
  showCorrectAnswersAfterSubmit?: boolean;
  strictSectionalTiming?: boolean;
  allowSectionSwitching?: boolean;
  allowForceSkipSection?: boolean;
  isScheduled?: boolean;
  scheduledStartTime?: number; // ms timestamp
  scheduledEndTime?: number;   // ms timestamp
}

export interface ExamMetadata {
  id?: string;
  name: string;
  category: string;
  tier?: string;
  year?: number;
  paper?: string;
  shift?: string;
  languages: string[];
  source?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  sections: SectionDef[]; 
  timeLimit: number; // overall time limit in seconds
  themeColor?: string;
  examCategory?: string;
  positiveMarks?: number;
  negativeMarks?: number;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  isPublic?: boolean;
  exam?: ExamMetadata;
  scoring?: ScoringConfig;
  settings?: MockTestSettings;
  createdAt?: number | string;
  updatedAt?: number | string;
}

export interface ProductionMockTestBundle {
  schemaVersion: string;
  generatedAt?: string;
  exam?: ExamMetadata;
  scoring?: ScoringConfig;
  settings?: MockTestSettings;
  questionGroups?: QuestionGroup[];
  questionBank: Question[];
  mockTests: {
    id: string;
    title: string;
    description: string;
    timeLimit: number;
    themeColor?: string;
    examCategory?: string;
    scoring?: ScoringConfig;
    settings?: MockTestSettings;
    sections: {
      id: string;
      name: LocalizedText | string;
      order: number;
      questionCount: number;
      timeLimit: number;
      scoring?: ScoringConfig | null;
      questionIds: string[];
    }[];
  }[];
  answerKeys: Record<string, Record<string, string>>;
}

export type QuestionStatus = 'unvisited' | 'visited' | 'answered' | 'unanswered' | 'not_answered' | 'marked' | 'marked_for_review' | 'answered_marked' | 'answered_and_marked';

export interface UserQuestionAttempt {
  selectedOptionId?: string | null;
  status: QuestionStatus;
  markedForReview: boolean;
  timeSpent: number; // in seconds
}

export interface TestAttempt {
  id: string;
  testId: string;
  startTime: number;
  endTime?: number;
  answers: Record<string, string>; 
  statuses: Record<string, QuestionStatus>; 
  timeSpent: Record<string, number>; 
  completed: boolean;
  score?: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  userAttempts?: Record<string, UserQuestionAttempt>;
  createdAt?: number | string;
}

export interface ActiveTestSession {
  testId: string;
  currentQuestionIndex: number;
  currentSectionIndex?: number;
  sectionTimeLeft?: Record<number, number>;
  sectionDurations?: Record<number, number>;
  sectionStartTimes?: Record<number, number>;
  sectionEndTimes?: Record<number, number>;
  answers: Record<string, string>;
  statuses: Record<string, QuestionStatus>;
  timeLeft: number;
  timeSpent: Record<string, number>;
  isPaused: boolean;
  reportedQuestions?: Record<string, { reason: string; comment?: string }>;
  lastUpdated: number;
  startTime?: number;
  endTime?: number;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
}


