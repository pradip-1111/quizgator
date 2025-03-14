
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
              <h1 className="text-2xl font-bold text-primary">QuizGator</h1>
            </div>
            <div>
              {user ? (
                <Link to="/admin-dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="border-primary hover:bg-primary/10">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main>
          {/* Hero section with gradient background */}
          <section className="bg-gradient-to-br from-primary/20 via-primary/10 to-background py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12 animate-slide-in">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    Secure Online Quizzes for Modern Education
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Create, distribute, and analyze quizzes with advanced proctoring features. 
                    Designed for educators who value academic integrity.
                  </p>
                  <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/login">
                      <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90">
                        Get Started
                      </Button>
                    </Link>
                    <Link to="/take-quiz">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10">
                        Take a Quiz
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  <div className="bg-background rounded-lg p-8 shadow-subtle border border-border hover:shadow-md transition-all hover:border-primary/20 animate-fade-in">
                    <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-3">Effortless Creation</h3>
                    <p className="text-muted-foreground">
                      Create professional quizzes with multiple question types, time limits, and customizable settings.
                    </p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-8 shadow-subtle border border-border hover:shadow-md transition-all hover:border-primary/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                      <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-3">Secure Testing</h3>
                    <p className="text-muted-foreground">
                      Advanced proctoring features including full-screen mode and tab-switching prevention.
                    </p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-8 shadow-subtle border border-border hover:shadow-md transition-all hover:border-primary/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                      <Check className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-3">Instant Results</h3>
                    <p className="text-muted-foreground">
                      Automatic grading, detailed analytics, and exportable reports to track student performance.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-blue-400/5 rounded-xl p-10 border border-primary/10 animate-fade-in shadow-lg">
                  <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="mr-5 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium shrink-0">1</div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Create a Quiz</h3>
                        <p className="text-muted-foreground">Design your quiz with various question types, point values, and time limits.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-5 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium shrink-0">2</div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Share with Students</h3>
                        <p className="text-muted-foreground">Generate and distribute a secure link for students to access the quiz.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-5 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium shrink-0">3</div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Students Take the Quiz</h3>
                        <p className="text-muted-foreground">Students enter their details and take the quiz in a secure environment.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-5 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium shrink-0">4</div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Review Results</h3>
                        <p className="text-muted-foreground">Access comprehensive reports and download results in PDF format.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="bg-primary/5 py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold text-primary">QuizGator</h2>
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
