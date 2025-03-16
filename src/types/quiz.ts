
export type Question = {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'long-answer';
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  points: number;
  required: boolean;
};

export type QuizData = {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  questions: Question[];
};

export type QuizResult = {
  quizId: string;
  studentName: string;
  studentId: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  answers: Record<string, any>;
  correctAnswers: Record<string, any>; // Store correct answers for each question
  securityViolations?: number; // Track security violations like tab switches
  completed: boolean; // Whether the quiz was completed or forcibly submitted
};

export type QuizStatus = 'draft' | 'active' | 'completed';

export type StudentResponse = {
  studentName: string;
  studentId: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  percentageScore: number;
  securityViolations?: number;
  completed?: boolean;
};
