
import { QuizData, QuizResult, Question } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

export const calculateScore = (quiz: QuizData, answers: Record<string, any>) => {
  let score = 0;
  let totalPoints = 0;
  
  quiz.questions.forEach(question => {
    totalPoints += question.points;
    
    if (!answers[question.id]) return;
    
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const selectedOption = question.options.find(opt => opt.id === answers[question.id]);
      if (selectedOption && selectedOption.isCorrect) {
        score += question.points;
      }
    } 
    else if (answers[question.id] && answers[question.id].trim().length > 0) {
      score += question.points;
    }
  });
  
  return { score, totalPoints };
};

export const submitQuiz = async (
  quizId: string, 
  quiz: QuizData, 
  answers: Record<string, any>, 
  name: string, 
  rollNumber: string, 
  email: string
) => {
  try {
    const { score, totalPoints } = calculateScore(quiz, answers);
    
    const correctAnswers: Record<string, any> = {};
    quiz.questions.forEach(question => {
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption) {
          correctAnswers[question.id] = correctOption.id;
        }
      } else if (question.type === 'short-answer' || question.type === 'long-answer') {
        correctAnswers[question.id] = null;
      }
    });
    
    // Insert the quiz attempt into the database
    const { data: attemptData, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_name: name,
        student_id: rollNumber,
        student_email: email,
        score: score,
        total_points: totalPoints,
        security_violations: 1,
        completed: true
      })
      .select()
      .single();
    
    if (attemptError) {
      console.error('Error inserting quiz attempt:', attemptError);
      throw attemptError;
    }
    
    const attemptId = attemptData.id;
    
    // Insert each answer individually
    for (const questionId in answers) {
      const question = quiz.questions.find(q => q.id === questionId);
      if (!question) continue;
      
      let isCorrect = false;
      let pointsAwarded = 0;
      let selectedOptionId = null;
      let textAnswer = null;
      
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        selectedOptionId = answers[questionId];
        const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
        
        if (selectedOption && selectedOption.isCorrect) {
          isCorrect = true;
          pointsAwarded = question.points;
        }
      } else if (question.type === 'short-answer' || question.type === 'long-answer') {
        textAnswer = answers[questionId];
        // For text answers, we'll consider them "correct" if they provided an answer
        // Note: In a real system, these would need manual grading
        isCorrect = !!textAnswer && textAnswer.trim().length > 0;
        if (isCorrect) {
          pointsAwarded = question.points;
        }
      }
      
      await supabase
        .from('quiz_answers')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          text_answer: textAnswer,
          is_correct: isCorrect,
          points_awarded: pointsAwarded
        });
    }
    
    // For backward compatibility, create the same result object structure
    const result: QuizResult = {
      quizId: quizId,
      studentName: name,
      studentId: rollNumber,
      score,
      totalPoints,
      submittedAt: new Date().toISOString(),
      answers,
      correctAnswers,
      securityViolations: 1,
      completed: true
    };
    
    console.log("Saved quiz results to Supabase:", result);
    
    return result;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    // Fall back to localStorage for reliability
    const { score, totalPoints } = calculateScore(quiz, answers);
    
    const correctAnswers: Record<string, any> = {};
    quiz.questions.forEach(question => {
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption) {
          correctAnswers[question.id] = correctOption.id;
        }
      } else if (question.type === 'short-answer' || question.type === 'long-answer') {
        correctAnswers[question.id] = null;
      }
    });
    
    const result: QuizResult = {
      quizId: quizId,
      studentName: name,
      studentId: rollNumber,
      score,
      totalPoints,
      submittedAt: new Date().toISOString(),
      answers,
      correctAnswers,
      securityViolations: 1,
      completed: false
    };
    
    const resultsKey = `quiz_results_${quizId}`;
    console.log(`Falling back to localStorage for quiz ID: ${quizId} to key: ${resultsKey}`);
    
    const existingResults = localStorage.getItem(resultsKey) || '[]';
    const results = JSON.parse(existingResults);
    results.push(result);
    
    localStorage.setItem(resultsKey, JSON.stringify(results));
    console.log("Saved quiz results to localStorage:", result);
    
    throw error;
  }
};

export const sendConfirmationEmail = async (
  quizId: string, 
  quizTitle: string, 
  result: QuizResult, 
  email: string
) => {
  try {
    console.log("Sending confirmation email for quiz submission");
    
    // Insert record into email_notifications table
    const { data, error } = await supabase
      .from('email_notifications')
      .insert({
        quiz_id: quizId,
        quiz_title: quizTitle || 'Quiz',
        student_name: result.studentName,
        student_id: result.studentId,
        student_email: email
      });
    
    if (error) {
      console.error("Error recording email notification:", error);
      throw error;
    }
    
    const response = await supabase.functions.invoke('send-quiz-confirmation', {
      body: {
        quizId: quizId,
        quizTitle: quizTitle || 'Quiz',
        studentName: result.studentName,
        studentId: result.studentId,
        studentEmail: email
      }
    });
    
    if (!response.data?.success) {
      throw new Error('Failed to send confirmation email');
    }
    
    // Update the notification record to mark email as sent
    await supabase
      .from('email_notifications')
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('quiz_id', quizId)
      .eq('student_id', result.studentId);
    
    console.log("Email confirmation sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};
