
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentResponse } from '@/types/quiz';

interface PerformanceChartProps {
  results: StudentResponse[];
}

const PerformanceChart = ({ results }: PerformanceChartProps) => {
  const chartData = results.map(result => ({
    name: result.studentName,
    score: result.percentageScore
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" />
          <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="score" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
