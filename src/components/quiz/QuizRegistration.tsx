
import React from 'react';
import StudentRegistration from './StudentRegistration';
import { QuizData } from '@/types/quiz';

interface QuizRegistrationProps {
  quiz: QuizData;
  name: string;
  setName: (name: string) => void;
  rollNumber: string;
  setRollNumber: (rollNumber: string) => void;
  email: string;
  setEmail: (email: string) => void;
  onStartQuiz: () => void;
  requiresAuth: boolean;
}

const QuizRegistration: React.FC<QuizRegistrationProps> = (props) => {
  // This component now just forwards props to StudentRegistration
  return <StudentRegistration {...props} />;
};

export default QuizRegistration;
