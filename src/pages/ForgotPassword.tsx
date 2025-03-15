
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send a password reset email
    // For demo purposes, we'll just show a message
    alert('This feature is not implemented in the demo. Please use the demo credentials instead.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          className="inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Login
        </Button>
        
        <Card className="w-full shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full">
                Send Reset Instructions
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto"
                onClick={() => navigate('/login')}
              >
                Back to login
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
