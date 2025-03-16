
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import QuizDetails from '../components/quiz-creator/QuizDetails';
import QuestionsList from '../components/quiz-creator/QuestionsList';
import QuizSummary from '../components/quiz-creator/QuizSummary';
import { useQuizCreator } from '../hooks/use-quiz-creator';

const CreateQuiz = () => {
  const {
    quizTitle, setQuizTitle,
    quizDescription, setQuizDescription,
    timeLimit, setTimeLimit,
    passingScore, setPassingScore,
    randomizeQuestions, setRandomizeQuestions,
    showResults, setShowResults,
    loading,
    questions,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleSaveDraft,
    handlePublishQuiz
  } = useQuizCreator();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow order-2 lg:order-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Create New Quiz</h1>
              <p className="text-muted-foreground mt-1">
                Design your quiz, add questions, and set preferences
              </p>
            </div>
            
            <QuizDetails
              quizTitle={quizTitle}
              setQuizTitle={setQuizTitle}
              quizDescription={quizDescription}
              setQuizDescription={setQuizDescription}
              timeLimit={timeLimit}
              setTimeLimit={setTimeLimit}
              passingScore={passingScore}
              setPassingScore={setPassingScore}
              randomizeQuestions={randomizeQuestions}
              setRandomizeQuestions={setRandomizeQuestions}
              showResults={showResults}
              setShowResults={setShowResults}
            />
            
            <QuestionsList
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
            />
            
            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={handlePublishQuiz} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Publish Quiz
              </Button>
            </div>
          </div>
          
          <div className="w-full lg:w-80 order-1 lg:order-2">
            <QuizSummary 
              questions={questions} 
              timeLimit={timeLimit} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;
