
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, AlertTriangle, Shield } from 'lucide-react';

type QuizHeaderProps = {
  quizTitle: string;
  studentName: string;
  studentRollNumber: string;
  timeLeft: number;
  onQuit: () => void;
  tabSwitchWarnings?: number;
};

const QuizHeader = ({
  quizTitle,
  studentName,
  studentRollNumber,
  timeLeft,
  onQuit,
  tabSwitchWarnings = 0,
}: QuizHeaderProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWarningStyles = (warnings: number) => {
    if (warnings === 0) return 'hidden';
    if (warnings === 1) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (warnings === 2) return 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse';
    return 'bg-red-50 text-red-700 border-red-200 animate-pulse';
  };

  return (
    <header className="border-b border-border bg-card py-2 px-4 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">{quizTitle}</h1>
          <div className="text-sm text-muted-foreground">
            {studentName} • {studentRollNumber}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`
            px-3 py-1 rounded-full border flex items-center 
            ${getWarningStyles(tabSwitchWarnings)}
          `}>
            <AlertTriangle className={`h-4 w-4 mr-1 ${tabSwitchWarnings >= 2 ? 'animate-ping opacity-70' : ''}`} />
            <span className="font-medium">Warnings: {tabSwitchWarnings}/3</span>
            {tabSwitchWarnings >= 2 && (
              <span className="ml-1 text-xs font-bold">
                {tabSwitchWarnings === 3 ? 'Auto-submitting!' : 'Final warning!'}
              </span>
            )}
          </div>
          <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span className="font-medium">{formatTime(timeLeft)}</span>
          </div>
          <div className="hidden md:flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
            <Shield className="h-4 w-4 mr-1" />
            <span className="font-medium text-xs">Secure Mode</span>
          </div>
          <Button variant="outline" size="sm" onClick={onQuit} className="text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" />
            Quit
          </Button>
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;
