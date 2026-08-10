export type Language = 'en' | 'hi';

export interface LocalizedText {
  en: string;
  hi?: string;
  [key: string]: string | undefined;
}

export interface Option {
  id: string;
  text: LocalizedText;
}

export interface Question {
  id: string;
  section: string;
  text: LocalizedText;
  options: Option[];
  correctOptionId: string;
  explanation?: LocalizedText;
  tags?: string[];
}

export interface SectionDef {
  name: string;
  timeLimit: number; // in seconds
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
}

export type QuestionStatus = 'unvisited' | 'answered' | 'unanswered' | 'marked' | 'answered_marked';

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
}

export interface SRSItem {
  questionId: string;
  nextReviewDate: number; // timestamp
  interval: number; // days
  easeFactor: number;
  repetitions: number;
}
