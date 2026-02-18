export interface AnswerOption {
  id: number;
  label: string;
  isCorrect?: boolean;
}

export type Mode =
  | 'hex-to-dec'
  | 'hex-to-oct'
  | 'hex-to-bin'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'random';

export interface Question {
  id: number;
  display: string;       // что показываем пользователю: "1F + 2D = ?"
  mode: Mode;
  correct: string;
  options: AnswerOption[];
}

export interface AttemptResult {
  isCorrect: boolean;
  correct: string;
  solution: SolutionStep[];
}

export interface SolutionStep {
  step: number;
  description: string;
  value: string;
}

export interface UserStats {
  total: number;
  correct: number;
  successRate: number;
}

export interface HistoryItem {
  display: string;
  correct: string;
  answer: string;
  isCorrect: boolean;
  mode: string;
}