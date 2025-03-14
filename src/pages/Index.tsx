
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { Check, FileText, LogIn, Shield } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <header className="bg-background py-6 border-b border-border">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">QuizGator</h1>
            </div>
            <div>
              {user ? (
                <Link to="/admin-dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-slide-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                Secure Online Quizzes for Modern Education
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create, distribute, and analyze quizzes with advanced proctoring features. 
                Designed for educators who value academic integrity.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/take-quiz">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Take a Quiz
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 py-12">
              <div className="bg-background rounded-lg p-6 shadow-subtle border border-border animate-fade-in">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Effortless Creation</h3>
                <p className="text-muted-foreground">
                  Create professional quizzes with multiple question types, time limits, and customizable settings.
                </p>
              </div>
              
              <div className="bg-background rounded-lg p-6 shadow-subtle border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Secure Testing</h3>
                <p className="text-muted-foreground">
                  Advanced proctoring features including full-screen mode and tab-switching prevention.
                </p>
              </div>
              
              <div className="bg-background rounded-lg p-6 shadow-subtle border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Instant Results</h3>
                <p className="text-muted-foreground">
                  Automatic grading, detailed analytics, and exportable reports to track student performance.
                </p>
              </div>
            </div>

            <div className="mt-8 bg-primary/5 rounded-xl p-8 border border-primary/10 animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-4 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">1</div>
                  <div>
                    <h3 className="font-medium">Create a Quiz</h3>
                    <p className="text-muted-foreground">Design your quiz with various question types, point values, and time limits.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-4 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">2</div>
                  <div>
                    <h3 className="font-medium">Share with Students</h3>
                    <p className="text-muted-foreground">Generate and distribute a secure link for students to access the quiz.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-4 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">3</div>
                  <div>
                    <h3 className="font-medium">Students Take the Quiz</h3>
                    <p className="text-muted-foreground">Students enter their details and take the quiz in a secure environment.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-4 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">4</div>
                  <div>
                    <h3 className="font-medium">Review Results</h3>
                    <p className="text-muted-foreground">Access comprehensive reports and download results in PDF format.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="bg-secondary py-6 border-t border-border mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold">QuizGator</h2>
              <p className="text-sm text-muted-foreground">Secure online quizzes for modern education</p>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} QuizGator. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
