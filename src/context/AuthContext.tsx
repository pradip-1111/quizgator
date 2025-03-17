
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
      console.log("Auth state changed:", event, "Session:", session);
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
        console.log("User signed in, userData set:", userData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('supabase.auth.token');
        console.log("User signed out, state cleared");
      }
    });

    // Check if user is logged in from localStorage for initial state
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("Found stored user on init:", parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('user');
      }
    }
    
    // Check Supabase session as well
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Initial session check:", sessionData);
      if (sessionData?.session && !user) {
        const supabaseUser = sessionData.session.user;
        const userData = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || 'User',
          email: supabaseUser.email || '',
          role: 'admin' as const
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log("Set user from Supabase session:", userData);
      }
      setLoading(false);
    };
    
    checkSession();

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("Login attempt for:", email);
    try {
      setLoading(true);
      
      // For demo purposes, we'll check for admin@example.com / password
      if (email === 'admin@example.com' && password === 'password') {
        console.log("Demo user login successful");
        const demoUser = {
          id: 'demo-user-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin' as const
        };
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
        return;
      }

      // For non-demo users, use Supabase auth
      console.log("Attempting Supabase login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }
      
      if (!data || !data.user) {
        console.error("No user data returned from Supabase");
        throw new Error('Invalid credentials');
      }
      
      // User successfully authenticated
      console.log("Supabase login successful:", data.user);
      const userData = {
        id: data.user.id,
        name: data.user.user_metadata?.name || 'User',
        email: data.user.email || '',
        role: 'admin' as const
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log("User state set after login:", userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    console.log("Register attempt for:", email, "with name:", name);
    try {
      setLoading(true);
      // Skip Supabase registration for the demo account
      if (email === 'admin@example.com') {
        console.log('Demo account registration skipped');
        throw new Error('Cannot register with demo account email');
      }
      
      // Register with Supabase for other accounts
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim()
          }
        }
      });
      
      if (error) {
        console.error("Registration error:", error);
        throw error;
      }
      
      console.log("Registration response:", data);
      
      // In Supabase, users need to confirm their email before they can log in
      if (data.user) {
        console.log("Registration successful, user:", data.user);
        return;
      } else {
        console.log("Registration completed but awaiting email confirmation");
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log("Logout initiated");
    setLoading(true);
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during sign out:", error);
      }
      
      // Clear local state
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('supabase.auth.token');
      console.log("User logged out, state cleared");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (name: string, rollNumber: string, email: string, quizId: string) => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Student registration error:', error);
      throw error;
    } finally {
      setLoading(false);
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
