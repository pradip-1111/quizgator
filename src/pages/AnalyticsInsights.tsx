
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, BarChart, Brain, LineChart, Info, Users, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types for insights data
interface InsightData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'performance' | 'engagement' | 'difficulty' | 'improvement';
  priority: 'high' | 'medium' | 'low';
}

interface QuizPerformance {
  quizId: string;
  quizTitle: string;
  averageScore: number;
  completionRate: number;
  totalAttempts: number;
}

// Hard-to-answer questions
interface DifficultQuestion {
  questionId: string;
  quizTitle: string;
  questionText: string;
  correctRate: number;
}

const AnalyticsInsights = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformance[]>([]);
  const [difficultQuestions, setDifficultQuestions] = useState<DifficultQuestion[]>([]);
  const [completionData, setCompletionData] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('summary');

  // Colors for charts
  const COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#10B981', '#6366F1'];

  useEffect(() => {
    const fetchInsightsData = async () => {
      setLoading(true);
      try {
        // Fetch quiz attempts to generate insights
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            id, 
            score, 
            total_points, 
            completed,
            quiz_id,
            quizzes(title)
          `);

        if (attemptsError) throw attemptsError;

        // Fetch questions and answers for difficulty analysis
        const { data: answersData, error: answersError } = await supabase
          .from('quiz_answers')
          .select(`
            id,
            is_correct,
            question_id,
            points_awarded,
            questions(text, quiz_id, quizzes(title))
          `);

        if (answersError) throw answersError;

        // Process the data to generate performance metrics
        const quizData: Record<string, any> = {};
        attemptsData?.forEach(attempt => {
          const quizId = attempt.quiz_id;
          if (!quizData[quizId]) {
            quizData[quizId] = {
              quizId,
              quizTitle: attempt.quizzes?.title || 'Unknown Quiz',
              scores: [],
              completed: 0,
              totalAttempts: 0
            };
          }
          
          quizData[quizId].totalAttempts++;
          if (attempt.completed) {
            quizData[quizId].completed++;
          }
          
          const percentageScore = attempt.total_points > 0 
            ? (attempt.score / attempt.total_points) * 100 
            : 0;
          quizData[quizId].scores.push(percentageScore);
        });

        // Calculate average scores and completion rates
        const processedQuizPerformance = Object.values(quizData).map((quiz: any) => {
          const avgScore = quiz.scores.length > 0 
            ? quiz.scores.reduce((sum: number, score: number) => sum + score, 0) / quiz.scores.length
            : 0;
          
          const completionRate = quiz.totalAttempts > 0
            ? (quiz.completed / quiz.totalAttempts) * 100
            : 0;
            
          return {
            quizId: quiz.quizId,
            quizTitle: quiz.quizTitle,
            averageScore: Math.round(avgScore),
            completionRate: Math.round(completionRate),
            totalAttempts: quiz.totalAttempts
          };
        });

        // Process question difficulty
        const questionData: Record<string, any> = {};
        answersData?.forEach(answer => {
          if (!answer.question_id) return;
          
          if (!questionData[answer.question_id]) {
            questionData[answer.question_id] = {
              questionId: answer.question_id,
              questionText: answer.questions?.text || 'Unknown Question',
              quizTitle: answer.questions?.quizzes?.title || 'Unknown Quiz',
              totalAnswers: 0,
              correctAnswers: 0
            };
          }
          
          questionData[answer.question_id].totalAnswers++;
          if (answer.is_correct) {
            questionData[answer.question_id].correctAnswers++;
          }
        });

        // Find difficult questions (correct rate < 40%)
        const hardQuestions = Object.values(questionData)
          .map((question: any) => {
            const correctRate = question.totalAnswers > 0
              ? (question.correctAnswers / question.totalAnswers) * 100
              : 0;
              
            return {
              questionId: question.questionId,
              questionText: question.questionText,
              quizTitle: question.quizTitle,
              correctRate: Math.round(correctRate)
            };
          })
          .filter((q: any) => q.correctRate < 40)
          .sort((a: any, b: any) => a.correctRate - b.correctRate)
          .slice(0, 5); // Get top 5 hardest questions

        // Create completion rate chart data
        const completionChartData = [
          { name: 'Completed', value: attemptsData?.filter(a => a.completed).length || 0 },
          { name: 'Incomplete', value: attemptsData?.filter(a => !a.completed).length || 0 }
        ];

        // Generate insights based on the data
        const generatedInsights: InsightData[] = [];

        // Low completion rate insight
        const lowCompletionQuizzes = processedQuizPerformance.filter(q => q.completionRate < 60 && q.totalAttempts > 5);
        if (lowCompletionQuizzes.length > 0) {
          generatedInsights.push({
            id: 'completion-rate',
            title: 'Low Quiz Completion Rates',
            description: `${lowCompletionQuizzes.length} quizzes have completion rates below 60%. Consider reviewing the time limit or difficulty level.`,
            icon: <Clock className="h-5 w-5 text-amber-500" />,
            category: 'engagement',
            priority: 'high'
          });
        }

        // Difficult questions insight
        if (hardQuestions.length > 0) {
          generatedInsights.push({
            id: 'difficult-questions',
            title: 'Questions with Low Success Rates',
            description: `${hardQuestions.length} questions have correct answer rates below 40%. Consider reviewing or providing more context.`,
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            category: 'difficulty',
            priority: 'high'
          });
        }

        // High performing quizzes
        const highPerformingQuizzes = processedQuizPerformance.filter(q => q.averageScore > 80 && q.totalAttempts > 5);
        if (highPerformingQuizzes.length > 0) {
          generatedInsights.push({
            id: 'high-performance',
            title: 'High-Performing Quizzes',
            description: `${highPerformingQuizzes.length} quizzes have average scores above 80%. Consider using these as templates for future quizzes.`,
            icon: <BarChart className="h-5 w-5 text-green-500" />,
            category: 'performance',
            priority: 'medium'
          });
        }

        // Overall engagement insight
        const totalAttempts = attemptsData?.length || 0;
        if (totalAttempts > 0) {
          generatedInsights.push({
            id: 'overall-engagement',
            title: 'Student Engagement',
            description: `Students have attempted quizzes ${totalAttempts} times. ${Math.round((attemptsData?.filter(a => a.completed).length || 0) / totalAttempts * 100)}% of all quiz attempts were completed.`,
            icon: <Users className="h-5 w-5 text-blue-500" />,
            category: 'engagement',
            priority: 'medium'
          });
        }

        // General improvement suggestion
        generatedInsights.push({
          id: 'general-improvement',
          title: 'Quiz Improvement Strategy',
          description: 'Consider adding more interactive elements and providing context before difficult questions to improve student performance.',
          icon: <Brain className="h-5 w-5 text-purple-500" />,
          category: 'improvement',
          priority: 'low'
        });

        // Update state with processed data
        setQuizPerformance(processedQuizPerformance);
        setDifficultQuestions(hardQuestions);
        setCompletionData(completionChartData);
        setInsights(generatedInsights);
      } catch (error) {
        console.error('Error fetching insights data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics insights. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInsightsData();
  }, [toast]);

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'performance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'engagement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'difficulty':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'improvement':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link to="/admin-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Quiz Insights</h1>
        <p className="text-muted-foreground mb-6">
          AI-powered analytics and recommendations to improve your quizzes
        </p>
        
        <Tabs defaultValue="summary" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Key Insights</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="difficulty">Difficult Questions</TabsTrigger>
          </TabsList>
          
          {loading ? (
            <Card>
              <CardContent className="py-10 flex justify-center">
                <p>Loading insights...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="summary">
                <div className="grid grid-cols-1 gap-4">
                  {insights.length > 0 ? (
                    insights.map((insight) => (
                      <Card key={insight.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="mr-3 p-2 rounded-full bg-purple-100">
                                {insight.icon}
                              </div>
                              <CardTitle className="text-lg">{insight.title}</CardTitle>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getCategoryClass(insight.category)}>
                                {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                              </Badge>
                              <Badge className={getPriorityClass(insight.priority)}>
                                {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)} Priority
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{insight.description}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <Info className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <p className="mb-2 font-medium">Not Enough Data</p>
                        <p className="text-muted-foreground">
                          We need more quiz attempts to generate meaningful insights.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Performance Overview</CardTitle>
                    <CardDescription>Average scores across all quizzes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={quizPerformance}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <XAxis 
                            dataKey="quizTitle" 
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis 
                            label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
                            domain={[0, 100]}
                          />
                          <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                          <Bar dataKey="averageScore" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {quizPerformance.length > 0 ? (
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">Performance Details</h3>
                        <div className="space-y-2">
                          {quizPerformance.map(quiz => (
                            <div key={quiz.quizId} className="flex justify-between items-center p-2 rounded border border-border">
                              <span className="font-medium truncate max-w-[250px]">{quiz.quizTitle}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm">
                                  <span className="text-muted-foreground mr-2">Avg Score:</span>
                                  <span className={`font-medium ${quiz.averageScore >= 70 ? 'text-green-600' : quiz.averageScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {quiz.averageScore}%
                                  </span>
                                </span>
                                <span className="text-sm">
                                  <span className="text-muted-foreground mr-2">Attempts:</span>
                                  <span className="font-medium">{quiz.totalAttempts}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No performance data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="completion">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz Completion Rates</CardTitle>
                      <CardDescription>Percentage of students who completed vs. abandoned quizzes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={completionData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {completionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend />
                            <Tooltip formatter={(value) => [value, 'Attempts']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Completion by Quiz</CardTitle>
                      <CardDescription>Individual quiz completion rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            data={quizPerformance}
                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                          >
                            <XAxis 
                              dataKey="quizTitle" 
                              tick={{ fontSize: 12 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                            />
                            <YAxis 
                              label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }}
                              domain={[0, 100]}
                            />
                            <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                            <Bar dataKey="completionRate" fill="#D946EF" radius={[4, 4, 0, 0]} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="difficulty">
                <Card>
                  <CardHeader>
                    <CardTitle>Difficult Questions</CardTitle>
                    <CardDescription>Questions with the lowest correct answer rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {difficultQuestions.length > 0 ? (
                      <div className="space-y-4">
                        {difficultQuestions.map((question) => (
                          <div key={question.questionId} className="border border-border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-sm text-muted-foreground">{question.quizTitle}</h3>
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                {question.correctRate}% correct
                              </Badge>
                            </div>
                            <p className="text-sm">{question.questionText}</p>
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center text-sm">
                                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Suggestion: Consider providing more context or reformulating this question.
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Info className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No difficult questions identified yet. This section will populate as more students answer questions.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsInsights;
