
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
      
      // Attempt to sign in with Supabase for existing users
      if (parsedUser.email === 'admin@example.com') {
        // For demo user, sign in with hardcoded credentials
        supabase.auth.signInWithPassword({
          email: parsedUser.email,
          password: 'password'
        }).then(({ error }) => {
          if (error) console.error('Supabase auth error:', error);
        });
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // First authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw new Error(authError.message);
      
      // For demo purposes, we're just checking for admin@example.com / password
      if (email === 'admin@example.com' && password === 'password') {
        const user = {
          id: authData?.user?.id || '1', // Use Supabase user ID if available
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin' as const
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Register with Supabase
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
      
      // For demo purposes, we don't automatically log the user in after registration
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
  };

  const registerStudent = async (name: string, rollNumber: string, email: string, quizId: string) => {
    try {
      // In a real app, this would register the student for the quiz
      // For now, just create a temporary account for the student
      const { data, error } = await supabase.auth.signUp({
        email,
        password: `temp-pass-${rollNumber}`,
        options: {
          data: {
            name,
            roll_number: rollNumber
          }
        }
      });
      
      if (error && error.message !== 'User already registered') {
        throw new Error(error.message);
      }
      
      const student = {
        id: data?.user?.id || rollNumber,
        name: name,
        email: email,
        role: 'student' as const
      };
      
      setUser(student);
      localStorage.setItem('user', JSON.stringify(student));
      localStorage.setItem('currentQuizId', quizId);
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
