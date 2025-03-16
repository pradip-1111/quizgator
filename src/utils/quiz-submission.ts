
import { QuizData, QuizResult, QuizAnswer } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

export async function submitQuiz(
  quizId: string,
  quiz: QuizData,
  answers: Record<string, any>,
  studentName: string,
  studentId: string,
  studentEmail?: string
): Promise<QuizResult> {
  console.log(`Submitting quiz ${quizId} for student ${studentName} (${studentId})`);

  // Find the correct quiz questions
  let questions = quiz.questions || [];
  
  // If the quiz doesn't have questions, try to get them from localStorage
  if (!questions || questions.length === 0) {
    try {
      const storedQuestions = localStorage.getItem(`quiz_questions_${quizId}`);
      if (storedQuestions) {
        questions = JSON.parse(storedQuestions);
        console.log(`Loaded ${questions.length} questions from localStorage for submission`);
      }
    } catch (e) {
      console.error('Error loading questions from localStorage for submission:', e);
    }
  }

  // Convert the answers record to an array of QuizAnswer objects
  const formattedAnswers: QuizAnswer[] = [];
  let score = 0;
  let totalPoints = 0;
  
  // Process each question and corresponding answer
  questions.forEach(question => {
    totalPoints += question.points;
    const answer = answers[question.id];
    let isCorrect = false;
    let pointsAwarded = 0;
    
    if (answer) {
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        // For multiple choice, check if selected option is correct
        const selectedOption = question.options?.find(option => option.id === answer);
        isCorrect = Boolean(selectedOption?.isCorrect);
        pointsAwarded = isCorrect ? question.points : 0;
      } else if (question.type === 'short-answer' || question.type === 'long-answer') {
        // Text-based answers need instructor grading in a real system
        // Here we'll just award partial credit as a placeholder
        pointsAwarded = question.points * 0.5; // Arbitrary 50% credit
        isCorrect = false; // Needs manual grading
      }
      
      formattedAnswers.push({
        questionId: question.id,
        selectedOptionId: question.type === 'multiple-choice' || question.type === 'true-false' ? answer : undefined,
        textAnswer: question.type === 'short-answer' || question.type === 'long-answer' ? answer : undefined,
        isCorrect,
        pointsAwarded
      });
      
      score += pointsAwarded;
    } else {
      // No answer provided for this question
      formattedAnswers.push({
        questionId: question.id,
        isCorrect: false,
        pointsAwarded: 0
      });
    }
  });
  
  const percentageScore = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  const submittedAt = new Date();
  
  // Create the result object
  const result: QuizResult = {
    quizId,
    studentName,
    studentId,
    studentEmail,
    score,
    totalPoints, 
    percentageScore,
    answers: formattedAnswers,
    submittedAt,
    securityViolations: 0, // This would be populated from security tracking
    completed: true,
    quizTitle: quiz.title
  };
  
  // Store the result in local storage first
  try {
    // Get existing results for this quiz
    const resultsKey = `quiz_results_${quizId}`;
    const storedResults = localStorage.getItem(resultsKey);
    let results = [];
    
    if (storedResults) {
      results = JSON.parse(storedResults);
    }
    
    // Add new result with a formatted date string
    const resultForStorage = {
      ...result,
      submittedAt: submittedAt.toISOString()
    };
    
    results.push(resultForStorage);
    localStorage.setItem(resultsKey, JSON.stringify(results));
    console.log(`Saved result to localStorage: ${resultsKey}`);
  } catch (e) {
    console.error('Error saving result to localStorage:', e);
  }
  
  // Also try to save to Supabase
  try {
    // Attempt to store in Supabase
    const { data: attemptData, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_name: studentName,
        student_id: studentId,
        student_email: studentEmail,
        score: score,
        total_points: totalPoints,
        completed: true,
        security_violations: 0,
        submitted_at: submittedAt.toISOString()
      })
      .select('id')
      .single();
    
    if (attemptError) {
      console.error('Error saving quiz attempt to Supabase:', attemptError);
    } else if (attemptData) {
      console.log('Successfully saved quiz attempt to Supabase with ID:', attemptData.id);
      
      // Now save individual answers linked to this attempt
      const answersForInsert = formattedAnswers.map(answer => ({
        attempt_id: attemptData.id,
        question_id: answer.questionId,
        selected_option_id: answer.selectedOptionId,
        text_answer: answer.textAnswer,
        is_correct: answer.isCorrect,
        points_awarded: answer.pointsAwarded
      }));
      
      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersForInsert);
      
      if (answersError) {
        console.error('Error saving quiz answers to Supabase:', answersError);
      } else {
        console.log(`Successfully saved ${answersForInsert.length} answers to Supabase`);
      }
      
      // Also log email request
      if (studentEmail) {
        const { error: emailError } = await supabase
          .from('email_notifications')
          .insert({
            quiz_id: quizId,
            quiz_title: quiz.title,
            student_name: studentName,
            student_id: studentId,
            student_email: studentEmail
          });
        
        if (emailError) {
          console.error('Error logging email notification request:', emailError);
        }
      }
    }
  } catch (supabaseError) {
    console.error('Supabase error in quiz submission:', supabaseError);
  }
  
  return result;
}

export async function sendConfirmationEmail(
  quizId: string,
  quizTitle: string,
  result: QuizResult,
  email: string | undefined
): Promise<boolean> {
  if (!email) {
    console.error('No email provided for confirmation');
    return false;
  }
  
  console.log(`Sending confirmation email to ${email} for quiz ${quizTitle}`);
  
  try {
    // In a real app, you would call your backend API to send the email
    // For demo purposes, we'll just log it and pretend it worked
    
    console.log('Email would contain:');
    console.log(`Subject: Quiz Submission Confirmation: ${quizTitle}`);
    console.log(`Body: Thank you ${result.studentName} for completing the quiz.`);
    console.log(`Your submission has been recorded.`);
    
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}
