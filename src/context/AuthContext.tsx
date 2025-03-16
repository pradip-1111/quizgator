
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
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
    setLoading(false);
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
        
        // Also store a fake auth token for Supabase RLS
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: {
            user: {
              id: user.id,
              email: user.email,
            }
          }
        }));
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
      
      // Also store a fake auth token for Supabase RLS
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: {
            id: student.id,
            email: student.email,
          }
        }
      }));
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
