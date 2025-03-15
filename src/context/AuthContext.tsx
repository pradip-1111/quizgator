
import React, { createContext, useContext, useState, useEffect } from 'react';

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
  registerStudent: (name: string, rollNumber: string, quizId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Simulating API call for authentication
      // In a real app, this would be a call to your authentication service
      
      // For demo purposes, we're just checking for admin@example.com / password
      if (email === 'admin@example.com' && password === 'password') {
        const user = {
          id: '1',
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
      // This is a placeholder for actual registration logic
      // In a real app, this would call your backend API to create a new user
      console.log('Register user:', { name, email, password });
      
      // For demo purposes, we'll simulate a successful registration
      // In a real app, the backend would handle user creation and return the user data
      // For now, we don't automatically log the user in after registration
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const registerStudent = async (name: string, rollNumber: string, quizId: string) => {
    try {
      // In a real app, this would register the student for the quiz
      const student = {
        id: rollNumber,
        name: name,
        email: `${rollNumber}@student.example.com`,
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
