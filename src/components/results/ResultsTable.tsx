
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StudentResponse } from '@/types/quiz';

interface ResultsTableProps {
  results: StudentResponse[];
  isAdmin: boolean;
}

const ResultsTable = ({ results, isAdmin }: ResultsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student Name</TableHead>
          <TableHead>Roll Number</TableHead>
          {isAdmin && (
            <>
              <TableHead>Score</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Status</TableHead>
            </>
          )}
          <TableHead>Submitted At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{result.studentName}</TableCell>
            <TableCell>{result.studentId}</TableCell>
            {isAdmin && (
              <>
                <TableCell>{result.score}/{result.totalPoints}</TableCell>
                <TableCell>{result.percentageScore}%</TableCell>
                <TableCell>
                  <Badge className={
                    result.percentageScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' : 
                    result.percentageScore >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                    'bg-red-100 text-red-800 border-red-200'
                  }>
                    {result.percentageScore >= 80 ? 'Excellent' : 
                    result.percentageScore >= 60 ? 'Satisfactory' : 
                    'Needs Improvement'}
                  </Badge>
                </TableCell>
              </>
            )}
            <TableCell>{new Date(result.submittedAt).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ResultsTable;
