
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { 
  LogOut, 
  User, 
  FileText, 
  BarChart, 
  Clock, 
  Settings, 
  Home,
  GraduationCap, 
  Plus,
  UserPlus,
  Users,
  ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Navigation handler
  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  return (
    <nav className="py-4 border-b border-border animate-fade-in bg-gradient-to-r from-purple-900/95 to-purple-800/95 text-white">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="link" 
            className="text-xl font-semibold hover:text-purple-200 transition-colors flex items-center mr-8 p-0 h-auto text-white"
            onClick={() => handleNavigation('/')}
          >
            <GraduationCap className="h-6 w-6 mr-2" />
            <span>QuizGator</span>
          </Button>
          
          {user && (
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Button 
                    onClick={() => handleNavigation('/')} 
                    className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-white/10 text-white")}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Quizzes
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-3">
                        <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-purple-800 to-purple-900 p-6 no-underline outline-none focus:shadow-md">
                          <Plus className="h-6 w-6 mb-2" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Create New Quiz
                          </div>
                          <p className="text-sm leading-tight text-white/80">
                            Design your customized quiz with multiple question types and settings
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
                            onClick={() => handleNavigation('/create-quiz')}
                          >
                            Get Started
                          </Button>
                        </div>
                      </li>
                      <li>
                        <Button 
                          variant="ghost"
                          className="w-full justify-start" 
                          onClick={() => handleNavigation('/admin-dashboard')}
                        >
                          <div className="text-left">
                            <div className="text-sm font-medium leading-none">My Quizzes</div>
                            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                              View and manage all your created quizzes
                            </p>
                          </div>
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost"
                          className="w-full justify-start" 
                          onClick={() => handleNavigation('/admin-dashboard?tab=active')}
                        >
                          <div className="text-left">
                            <div className="text-sm font-medium leading-none">Active Quizzes</div>
                            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                              Currently active quizzes ready to share
                            </p>
                          </div>
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost"
                          className="w-full justify-start" 
                          onClick={() => handleNavigation('/admin-dashboard?tab=draft')}
                        >
                          <div className="text-left">
                            <div className="text-sm font-medium leading-none">Draft Quizzes</div>
                            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                              Incomplete quizzes saved for later
                            </p>
                          </div>
                        </Button>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className={cn("bg-transparent hover:bg-white/10 text-white px-4 py-2 rounded flex items-center gap-1")}
                      >
                        <BarChart className="h-4 w-4 mr-1" />
                        Analytics
                        <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-white/95 backdrop-blur-sm border border-purple-200">
                      <DropdownMenuItem onClick={() => handleNavigation('/analytics/overview')} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium">Quiz Performance</span>
                          <span className="text-xs text-muted-foreground">Overall metrics for your quizzes</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/user-responses')} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium">Student Responses</span>
                          <span className="text-xs text-muted-foreground">View all student responses</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/analytics/insights')} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium">Insights</span>
                          <span className="text-xs text-muted-foreground">AI-powered quiz analytics</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>
                
                {user.role === 'admin' && (
                  <NavigationMenuItem>
                    <Button
                      className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-white/10 text-white")}
                      onClick={() => handleNavigation('/admin-dashboard')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center mr-4">
                <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-800">
                  <User className="h-4 w-4" />
                </div>
                <span className="ml-2 font-medium hidden sm:inline-block">
                  {user.name}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-purple-200 hover:text-white hover:bg-purple-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline-block">Logout</span>
              </Button>
            </>
          ) : (
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleNavigation('/signup')}
                className="bg-purple-700/80 text-white border-purple-600 hover:bg-purple-600"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline-block">Register</span>
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleNavigation('/login')}
                className="bg-white text-purple-900 hover:bg-purple-100"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
