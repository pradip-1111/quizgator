
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

  // Check if this student has already submitted this quiz
  try {
    const { data: existingSubmission, error: checkError } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .limit(1);
      
    if (checkError) {
      console.error('Error checking for existing submissions:', checkError);
    } else if (existingSubmission && existingSubmission.length > 0) {
      console.log(`Student ${studentId} has already submitted this quiz. Using existing submission.`);
      // Return the existing submission result
      const { data: existingData, error: fetchError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', existingSubmission[0].id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching existing submission:', fetchError);
      } else if (existingData) {
        // Return existing submission data as a QuizResult
        return {
          quizId,
          studentName: existingData.student_name,
          studentId: existingData.student_id,
          studentEmail: existingData.student_email,
          score: existingData.score,
          totalPoints: existingData.total_points,
          percentageScore: existingData.total_points > 0 
            ? (existingData.score / existingData.total_points) * 100 
            : 0,
          answers: [], // We don't have the detailed answers here
          submittedAt: new Date(existingData.submitted_at),
          securityViolations: existingData.security_violations,
          completed: existingData.completed,
          quizTitle: quiz.title
        };
      }
    }
  } catch (error) {
    console.error('Error checking for existing submissions:', error);
    // Continue with submission to ensure user can still submit
  }

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
  
  // Also try to save to Supabase
  try {
    console.log('Attempting to save quiz attempt to Supabase...');
    
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
    
    // First check if a submission for this student and quiz already exists
    const { data: existingAttempt, error: checkError } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', formattedQuizId)
      .eq('student_id', studentId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing attempts:', checkError);
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
          quiz_id: formattedQuizId,
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
        } else {
          console.log(`Successfully saved ${answersForInsert.length} answers to Supabase`);
        }
      }
    }
    
    // Also log email request
    if (studentEmail) {
      const { error: emailError } = await supabase
        .from('email_notifications')
        .upsert({
          quiz_id: quizId,
          quiz_title: quiz.title,
          student_name: studentName,
          student_id: studentId,
          student_email: studentEmail,
          submitted_at: submittedAt.toISOString()
        });
      
      if (emailError) {
        console.error('Error logging email notification request:', emailError);
      } else {
        console.log('Successfully saved email notification request');
        
        // Call the Edge Function to send an email confirmation
        const emailResult = await sendConfirmationEmail(quizId, quiz.title, studentName, studentId, studentEmail);
        console.log('Email confirmation result:', emailResult);
      }
    }
  } catch (supabaseError) {
    console.error('Supabase error in quiz submission:', supabaseError);
  }
  
  // Return the complete result object for internal use
  return result;
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
