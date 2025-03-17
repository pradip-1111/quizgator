
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    console.log("Login page loaded, current user:", user);
    if (user) {
      console.log("User already logged in, redirecting to dashboard");
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted with email:", email);
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting login...");
      await login(email, password);
      console.log("Login successful");
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      navigate('/admin-dashboard', { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Invalid credentials";
      
      if (error instanceof Error) {
        // If the error is from Supabase, it will have a message
        errorMessage = error.message;
      }
      
      if (email === 'admin@example.com') {
        errorMessage += ". Use admin@example.com / password for demo.";
      } else {
        errorMessage += ". Make sure you've registered and confirmed your email if required.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (user) {
    return null; // Don't render if already logged in
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          className="inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Button>
        
        <Card className="w-full shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => navigate('/forgot-password')} 
                    className="text-xs h-auto p-0"
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p className="mb-2">For demo, use:</p>
              <p><strong>Email:</strong> admin@example.com</p>
              <p><strong>Password:</strong> password</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto"
                onClick={() => navigate('/signup')}
              >
                Sign up
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
