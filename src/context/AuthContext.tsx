
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerStudent: (name: string, rollNumber: string, email: string, quizId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup auth state listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // For real Supabase users, we'll use their session data
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          role: 'admin' as const
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('supabase.auth.token');
      }
    });

    // Check if user is logged in from localStorage for initial state
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // For the demo user, ensure we have a token in localStorage
      if (parsedUser.email === 'admin@example.com') {
        // For demo user, set up a proper session with Supabase
        const setupDemoSession = async () => {
          console.log("Setting up demo session for admin@example.com");
          
          // Create a demo token format that mimics the structure Supabase expects
          const demoToken = {
            currentSession: {
              access_token: 'demo_token',
              refresh_token: 'demo_refresh_token',
              user: {
                id: parsedUser.id,
                email: parsedUser.email,
                role: 'authenticated',
                aud: 'authenticated',
              }
            }
          };
          
          localStorage.setItem('supabase.auth.token', JSON.stringify(demoToken));
          
          // Also set the session in Supabase client
          try {
            await supabase.auth.setSession({
              access_token: 'demo_token',
              refresh_token: 'demo_refresh_token',
            });
            console.log("Demo session set successfully");
          } catch (err) {
            console.error("Error setting demo session:", err);
          }
        };
        
        setupDemoSession();
      }
    }
    setLoading(false);

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // For demo purposes, we're just checking for admin@example.com / password
      // We'll skip the actual Supabase auth for this demo user to avoid validation errors
      if (email === 'admin@example.com' && password === 'password') {
        const user = {
          id: crypto.randomUUID(), // Generate a random UUID
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin' as const
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Create a demo token format that mimics the structure Supabase expects
        const demoToken = {
          currentSession: {
            access_token: 'demo_token',
            refresh_token: 'demo_refresh_token',
            user: {
              id: user.id,
              email: user.email,
              role: 'authenticated',
              aud: 'authenticated',
            }
          }
        };
        
        localStorage.setItem('supabase.auth.token', JSON.stringify(demoToken));
        
        // Also set the session in Supabase client for the demo user
        try {
          await supabase.auth.setSession({
            access_token: 'demo_token',
            refresh_token: 'demo_refresh_token',
          });
        } catch (err) {
          console.error("Error setting demo session:", err);
        }
      } else {
        // For non-demo users, use Supabase auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (authError) throw new Error(authError.message);
        
        if (authData.user) {
          const user = {
            id: authData.user.id,
            name: authData.user.user_metadata?.name || 'User',
            email: authData.user.email || '',
            role: 'admin' as const
          };
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Skip Supabase registration for the demo account
      if (email === 'admin@example.com') {
        console.log('Demo account registration skipped');
        return;
      }
      
      // Register with Supabase for other accounts
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) throw new Error(error.message);
      
      console.log('Register user:', { name, email, password });
      console.log('Supabase registration:', data);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local state
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('supabase.auth.token');
  };

  const registerStudent = async (name: string, rollNumber: string, email: string, quizId: string) => {
    try {
      // Create a temporary account for the student without Supabase auth
      const student = {
        id: crypto.randomUUID(),
        name: name,
        email: email,
        role: 'student' as const
      };
      
      setUser(student);
      localStorage.setItem('user', JSON.stringify(student));
      localStorage.setItem('currentQuizId', quizId);
      
      // Create a demo token format that mimics the structure Supabase expects for students
      const studentToken = {
        currentSession: {
          access_token: 'student_token',
          refresh_token: 'student_refresh_token',
          user: {
            id: student.id,
            email: student.email,
            role: 'authenticated',
            aud: 'authenticated',
          }
        }
      };
      
      localStorage.setItem('supabase.auth.token', JSON.stringify(studentToken));
      
      // Set the session in Supabase client
      try {
        await supabase.auth.setSession({
          access_token: 'student_token',
          refresh_token: 'student_refresh_token',
        });
      } catch (err) {
        console.error("Error setting student session:", err);
      }
    } catch (error) {
      console.error('Student registration error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, registerStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
