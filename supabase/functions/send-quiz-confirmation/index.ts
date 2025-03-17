
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuizSubmissionRequest {
  quizId: string;
  quizTitle: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-quiz-confirmation function");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);
    
    const { quizId, quizTitle, studentName, studentId, studentEmail }: QuizSubmissionRequest = body;
    
    if (!studentEmail) {
      throw new Error("Student email is required");
    }
    
    console.log(`Sending quiz confirmation email to ${studentEmail} for ${studentName} (Quiz: ${quizTitle})`);

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Quiz System <onboarding@resend.dev>",
      to: [studentEmail],
      subject: `Quiz Submission Confirmation: ${quizTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Quiz Submission Confirmation</h1>
          
          <p style="font-size: 16px; line-height: 1.5;">Hello ${studentName},</p>
          
          <p style="font-size: 16px; line-height: 1.5;">This is to confirm that your submission for <strong>${quizTitle}</strong> has been received successfully.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Quiz:</strong> ${quizTitle}</p>
            <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
            <p style="margin: 5px 0;"><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5;">Your answers have been recorded and will be reviewed by your instructor.</p>
          
          <p style="font-size: 16px; line-height: 1.5;">Thank you for completing the quiz!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sending response:", emailResponse);

    if (!emailResponse.id) {
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-quiz-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
