
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
};
