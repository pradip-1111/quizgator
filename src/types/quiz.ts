
import { z } from "zod";

export const QuestionTypeEnum = z.enum([
  "multiple-choice",
  "true-false", 
  "short-answer",
  "long-answer"
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
  points: number;
}

export interface QuizDetails {
  id: string;
  title: string;
  description?: string;
  duration: number;
  status: 'draft' | 'active' | 'completed';
}

export interface StudentInfo {
  name: string;
  id: string;
  email?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, QuizAnswer>;
  timeRemaining: number;
  startTime: Date | null;
  endTime: Date | null;
  securityViolations: number;
  isCompleted: boolean;
}

export interface QuizResult {
  quizId: string;
  studentName: string;
  studentId: string;
  studentEmail?: string;
  score: number;
  totalPoints: number;
  percentageScore: number;
  answers: QuizAnswer[];
  submittedAt: Date;
  securityViolations: number;
  completed: boolean;
  quizTitle?: string;
}

// Added missing types
export interface QuizData {
  id: string;
  title: string;
  description?: string;
  duration: number;
  created?: string;
  questions?: Question[];
  timeLimit?: number;
}

export interface StudentResponse {
  studentName: string;
  studentId: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  percentageScore: number;
  securityViolations: number;
  completed: boolean;
  quizTitle?: string;
}
