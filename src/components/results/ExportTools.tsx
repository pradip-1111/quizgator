
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileCog, FileText, RefreshCw } from 'lucide-react';
import { StudentResponse } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';

interface ExportToolsProps {
  results: StudentResponse[];
  quizTitle: string;
  isAdmin: boolean;
  onRefresh: () => void;
}

const ExportTools = ({ results, quizTitle, isAdmin, onRefresh }: ExportToolsProps) => {
  const { toast } = useToast();

  const handleDownloadCSV = () => {
    try {
      // Create CSV content
      const headers = ['Student Name', 'Roll Number', 'Submitted At'];
      // Only add score columns if admin
      if (isAdmin) {
        headers.push('Score', 'Total Points', 'Percentage');
      }
      
      const csvRows = [headers];

      results.forEach(result => {
        const row = [
          result.studentName,
          result.studentId,
          new Date(result.submittedAt).toLocaleString()
        ];
        
        // Only add score data if admin
        if (isAdmin) {
          row.push(
            result.score.toString(),
            result.totalPoints.toString(),
            `${result.percentageScore}%`
          );
        }
        
        csvRows.push(row);
      });

      // Convert to CSV format
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quizTitle.replace(/\s+/g, '-')}-results.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "CSV Downloaded",
        description: "Results have been exported as CSV",
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        title: "Error",
        description: "Failed to download results as CSV",
        variant: "destructive",
      });
    }
  };

  const handlePrintPDF = () => {
    try {
      // Create a printable version of the page
      const printContent = document.createElement('div');
      
      // Different content based on user role
      if (isAdmin) {
        printContent.innerHTML = `
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1, h2 { margin-bottom: 10px; }
            .header { margin-bottom: 20px; }
            .score-good { color: green; }
            .score-average { color: orange; }
            .score-poor { color: red; }
          </style>
          <div class="header">
            <h1>${quizTitle} - Results</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total submissions: ${results.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(result => `
                <tr>
                  <td>${result.studentName}</td>
                  <td>${result.studentId}</td>
                  <td>${result.score}/${result.totalPoints}</td>
                  <td class="${
                    result.percentageScore >= 80 ? 'score-good' : 
                    result.percentageScore >= 60 ? 'score-average' : 'score-poor'
                  }">${result.percentageScore}%</td>
                  <td>${
                    result.percentageScore >= 80 ? 'Excellent' : 
                    result.percentageScore >= 60 ? 'Satisfactory' : 'Needs Improvement'
                  }</td>
                  <td>${new Date(result.submittedAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        // Student view - no scores
        printContent.innerHTML = `
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1, h2 { margin-bottom: 10px; }
            .header { margin-bottom: 20px; }
          </style>
          <div class="header">
            <h1>${quizTitle} - Submissions</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total submissions: ${results.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(result => `
                <tr>
                  <td>${result.studentName}</td>
                  <td>${result.studentId}</td>
                  <td>${new Date(result.submittedAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Print after content is loaded
        printWindow.onload = function() {
          printWindow.print();
        };
        
        toast({
          title: "PDF Generated",
          description: "Results have been prepared for printing as PDF",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to open print window. Please check your popup settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh Data
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
        <FileCog className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrintPDF}>
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
};

export default ExportTools;
