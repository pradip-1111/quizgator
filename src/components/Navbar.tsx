
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { ChevronRight, LogOut, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Don't show navbar on quiz taking page
  if (location.pathname.includes('/take-quiz/')) {
    return null;
  }

  return (
    <nav className="py-4 border-b border-border animate-fade-in">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-1">
          <Link to="/" className="text-xl font-semibold transition-colors hover:text-primary">
            QuizGator
          </Link>
          {location.pathname !== '/' && (
            <div className="flex items-center text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm capitalize">
                {location.pathname.split('/')[1].replace('-', ' ')}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center mr-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-4 w-4" />
                </div>
                <span className="ml-2 font-medium hidden sm:inline-block">
                  {user.name}
                </span>
              </div>
              
              {user.role === 'admin' && (
                <Link to="/admin-dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline-block">Logout</span>
              </Button>
            </>
          ) : (
            <div className="space-x-2">
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
