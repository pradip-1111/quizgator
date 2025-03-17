
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

  // Process the quiz data first before making any network requests
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

  // Process submissions locally first to improve perceived performance
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
    securityViolations: 0,
    completed: true,
    quizTitle: quiz.title
  };
  
  // Store the result in local storage immediately for a faster user experience
  try {
    // Get existing results for this quiz
    const resultsKey = `quiz_results_${quizId}`;
    const storedResults = localStorage.getItem(resultsKey);
    let results = [];
    
    if (storedResults) {
      results = JSON.parse(storedResults);
      
      // Remove any previous submissions with the same student ID
      results = results.filter((r: any) => r.studentId !== studentId);
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
  
  // Start the Supabase database operations in the background
  // This won't block the user interface
  try {
    console.log('Saving quiz attempt to Supabase in the background...');
    
    // Convert UUID string to UUID format if needed
    let formattedQuizId = quizId;
    if (!quizId.includes('-') && quizId.length >= 32) {
      formattedQuizId = [
        quizId.slice(0, 8),
        quizId.slice(8, 12),
        quizId.slice(12, 16),
        quizId.slice(16, 20),
        quizId.slice(20)
      ].join('-');
    }

    // Use a single async operation to check for existing attempts
    saveToDatabaseAsync(formattedQuizId, studentName, studentId, studentEmail, score, totalPoints, submittedAt, formattedAnswers, quiz.title);
  } catch (supabaseError) {
    console.error('Error initiating Supabase operations:', supabaseError);
    // Don't block the user experience, just log the error
  }
  
  // Return the complete result object for immediate use
  return result;
}

// Separate function for database operations to avoid blocking the UI
async function saveToDatabaseAsync(
  quizId: string,
  studentName: string,
  studentId: string,
  studentEmail: string | undefined,
  score: number,
  totalPoints: number,
  submittedAt: Date,
  formattedAnswers: QuizAnswer[],
  quizTitle: string | undefined
) {
  try {
    // Check if a submission for this student and quiz already exists
    const { data: existingAttempt, error: checkError } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing attempts:', checkError);
      return;
    }
    
    let attemptId: string | null = null;
    
    // If an attempt already exists, update it instead of creating a new one
    if (existingAttempt?.id) {
      console.log(`Updating existing attempt with ID: ${existingAttempt.id} for student ${studentId}`);
      
      const { data: updatedData, error: updateError } = await supabase
        .from('quiz_attempts')
        .update({
          score: score,
          total_points: totalPoints,
          completed: true,
          security_violations: 0,
          submitted_at: submittedAt.toISOString()
        })
        .eq('id', existingAttempt.id)
        .select('id')
        .single();
        
      if (updateError) {
        console.error('Error updating quiz attempt:', updateError);
        return;
      } else if (updatedData) {
        console.log('Successfully updated quiz attempt with ID:', updatedData.id);
        attemptId = updatedData.id;
        
        // Now update individual answers
        if (formattedAnswers.length > 0) {
          // First delete any existing answers
          const { error: deleteError } = await supabase
            .from('quiz_answers')
            .delete()
            .eq('attempt_id', updatedData.id);
            
          if (deleteError) {
            console.error('Error deleting existing answers:', deleteError);
            return;
          }
          
          // Then insert new answers
          const answersForInsert = formattedAnswers.map(answer => ({
            attempt_id: updatedData.id,
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
            console.error('Error saving updated quiz answers:', answersError);
            return;
          } else {
            console.log(`Successfully saved ${answersForInsert.length} updated answers`);
          }
        }
      }
    } else {
      // No existing attempt, create a new one
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
        return;
      } else if (attemptData) {
        console.log('Successfully saved quiz attempt to Supabase with ID:', attemptData.id);
        attemptId = attemptData.id;
        
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
          .upsert(answersForInsert);
        
        if (answersError) {
          console.error('Error saving quiz answers to Supabase:', answersError);
          return;
        } else {
          console.log(`Successfully saved ${answersForInsert.length} answers to Supabase`);
        }
      }
    }
    
    // Also log email request if email is provided
    if (studentEmail) {
      const { error: emailError } = await supabase
        .from('email_notifications')
        .upsert({
          quiz_id: quizId,
          quiz_title: quizTitle,
          student_name: studentName,
          student_id: studentId,
          student_email: studentEmail,
          submitted_at: submittedAt.toISOString()
        });
      
      if (emailError) {
        console.error('Error logging email notification request:', emailError);
        return;
      } else {
        console.log('Successfully saved email notification request');
        
        // Call the Edge Function to send an email confirmation
        // This is also done in the background
        sendConfirmationEmail(quizId, quizTitle || 'Quiz', studentName, studentId, studentEmail)
          .then(result => {
            console.log('Email confirmation result:', result);
          })
          .catch(error => {
            console.error('Error sending confirmation email:', error);
          });
      }
    }
  } catch (error) {
    console.error('Unexpected error in database operations:', error);
  }
}

export async function sendConfirmationEmail(
  quizId: string,
  quizTitle: string,
  studentName: string,
  studentId: string,
  studentEmail?: string
): Promise<boolean> {
  if (!studentEmail) {
    console.error('No email provided for confirmation');
    return false;
  }
  
  console.log(`Sending confirmation email to ${studentEmail} for quiz ${quizTitle}`);
  
  try {
    // Call the Supabase Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-quiz-confirmation', {
      body: {
        quizId,
        quizTitle,
        studentName,
        studentId,
        studentEmail
      }
    });
    
    if (error) {
      console.error('Error calling send-quiz-confirmation function:', error);
      return false;
    }
    
    console.log('Email confirmation sent successfully:', data);
    
    // Update the email notification record to mark as sent
    const { error: updateError } = await supabase
      .from('email_notifications')
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('quiz_id', quizId)
      .eq('student_id', studentId);
      
    if (updateError) {
      console.error('Error updating email notification status:', updateError);
    } else {
      console.log('Successfully updated email notification status');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}
