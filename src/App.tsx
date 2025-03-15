
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import QuizComplete from "./pages/QuizComplete";
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import ViewResults from "./pages/ViewResults";
import EditQuiz from "./pages/EditQuiz";

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Add debugging for navigation
console.log("App rendering");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/quiz-complete" element={<QuizComplete />} />
            <Route path="/create-quiz" element={<CreateQuiz />} />
            <Route path="/take-quiz/:quizId" element={<TakeQuiz />} />
            <Route path="/view-results/:quizId" element={<ViewResults />} />
            <Route path="/edit-quiz/:quizId" element={<EditQuiz />} />
            <Route path="/forgot-password" element={<div className="min-h-screen flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Password Reset</CardTitle>
                  <CardDescription>Enter your email to reset your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This feature is not implemented in the demo. Please use the demo credentials instead.</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/login'}>Back to Login</Button>
                </CardContent>
              </Card>
            </div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
