
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ResultsWarningProps {
  error: string | null;
}

const ResultsWarning = ({ error }: ResultsWarningProps) => {
  if (!error) return null;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          Warning
        </CardTitle>
        <CardDescription>{error}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default ResultsWarning;
