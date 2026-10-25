import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Trophy, 
  ArrowLeft, 
  Award,
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  BrainCircuit,
  Share2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QuestionRenderer } from '@/components/quiz/question-renderer';
import { Question, QuestionType } from '@/types';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

export default function QuizResult() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [violations, setViolations] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stats calculation
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);

  useEffect(() => {
    const loadAttemptResult = async () => {
      if (!quizId) return;
      const attemptId = localStorage.getItem(`quiz-attempt-${quizId}`);
      if (!attemptId) {
        toast.error('No recent attempt session found for this quiz.');
        setLoading(false);
        return;
      }
      try {
        const quizData = await apiClient.getQuiz(quizId);
        setQuiz(quizData);
        setQuestions(quizData.questions || []);

        const resultData = await apiClient.getAttemptResult(attemptId);
        const result = resultData.result || resultData;

        // Populate scoring statistics
        setScore(result.score !== undefined ? result.score : (result.obtainedMarks || 0));
        setTotalMarks(result.totalMarks || quizData.totalMarks || 100);
        setCorrectCount(result.correctCount || 0);
        setWrongCount(result.incorrectCount || result.wrongCount || 0);
        
        // Proctor warning switches stored locally during exam
        const savedSwitches = localStorage.getItem(`quiz-switches-${quizId}`);
        if (savedSwitches) {
          setViolations(Number(savedSwitches));
        }

        // Map evaluation responses
        const restored: Record<number, any> = {};
        if (result.evaluatedResponses) {
          (quizData.questions || []).forEach((q: any, idx: number) => {
            const er = result.evaluatedResponses.find((item: any) => item.questionId === q.id);
            if (er) {
              restored[idx] = er.userResponse;
            }
          });
        }
        setAnswers(restored);
      } catch (err) {
        console.error('Failed to load quiz results:', err);
        toast.error('Failed to fetch evaluation details.');
      } finally {
        setLoading(false);
      }
    };
    loadAttemptResult();
  }, [quizId]);

  if (loading) {
    return <div className="py-8 text-center text-sm font-bold">Evaluating attempt and rendering dashboard...</div>;
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  
  const getGrade = () => {
    if (percentage >= 90) return { label: 'A+', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (percentage >= 80) return { label: 'A', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
    if (percentage >= 70) return { label: 'B+', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (percentage >= 60) return { label: 'B', color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
    return { label: 'C', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
  };

  const grade = getGrade();

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Link to="/student">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold font-display tracking-tight text-foreground">
              Quiz Attempt Evaluation
            </h1>
            <p className="text-xs text-muted-foreground">
              Detailed breakdown of scores, answers, and weak chapters.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="h-4 w-4" /> Share Score
          </Button>
          <Link to={`/student/quiz/${quizId}/attempt`}>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/95 text-white">
              <RefreshCw className="h-4 w-4" /> Re-Attempt
            </Button>
          </Link>
        </div>
      </div>

      {/* CORE EVALUATION RESULT GRID */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* SCORE SUMMARY CARD */}
        <Card className="md:col-span-4 p-6 flex flex-col items-center justify-between text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">Your Score</h3>
            <div className="text-5xl font-black font-display text-primary tracking-tight">
              {score} <span className="text-xl text-muted-foreground font-normal">/ {totalMarks}</span>
            </div>
            <Badge className={grade.color}>{grade.label} Grade</Badge>
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Accuracy</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2 bg-primary/10" />
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t text-xs">
            <div className="space-y-1">
              <div className="text-emerald-500 flex items-center justify-center gap-1 font-bold">
                <CheckCircle2 className="h-4 w-4" /> {correctCount}
              </div>
              <span className="text-muted-foreground">Correct</span>
            </div>
            <div className="space-y-1">
              <div className="text-red-500 flex items-center justify-center gap-1 font-bold">
                <XCircle className="h-4 w-4" /> {wrongCount}
              </div>
              <span className="text-muted-foreground">Wrong</span>
            </div>
            <div className="space-y-1">
              <div className="text-amber-500 flex items-center justify-center gap-1 font-bold">
                <AlertCircle className="h-4 w-4" /> {violations}
              </div>
              <span className="text-muted-foreground">Proctor Warnings</span>
            </div>
          </div>

          {/* Certificate reward if score >= 80% */}
          {percentage >= 80 && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 w-full space-y-3">
              <Award className="h-10 w-10 text-primary mx-auto animate-float" />
              <div className="space-y-1">
                <h5 className="font-bold text-xs">Certificate Generated!</h5>
                <p className="text-[10px] text-muted-foreground">You scored above 80%. A verified certificate has been added to your profile.</p>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs">
                View Certificate
              </Button>
            </div>
          )}
        </Card>

        {/* DETAILED QUESTION REVIEW */}
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Topic Recommendations</CardTitle>
              <CardDescription>AI-driven recommendations based on answers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl border bg-primary/5 border-primary/10 flex items-start gap-3">
                <BrainCircuit className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Study "Database Isolation Levels"</h4>
                  <p className="text-xs text-muted-foreground">
                    You made an error on transaction concurrency. Try revision questions on Repeatable Read and Serializable rules.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h3 className="font-display font-bold text-lg text-foreground pt-4 border-t">
            Question-by-Question Review
          </h3>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const studentAns = answers[idx];
              
              let isCorrectAnswer = false;
              if (q.type === QuestionType.SINGLE_CORRECT || q.type === QuestionType.TRUE_FALSE) {
                isCorrectAnswer = studentAns === q.correctAnswer;
              } else if (q.type === QuestionType.MULTIPLE_CORRECT) {
                let correctOpts = [];
                try {
                  correctOpts = typeof q.correctAnswers === 'string' ? JSON.parse(q.correctAnswers) : q.correctAnswers || [];
                } catch { correctOpts = []; }
                isCorrectAnswer = Array.isArray(studentAns) && 
                  studentAns.length === correctOpts.length && 
                  studentAns.every(val => correctOpts.includes(val));
              } else if (q.type === QuestionType.FILL_IN_BLANK) {
                isCorrectAnswer = String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
              }

              return (
                <Card key={q.id} className="p-6">
                  <QuestionRenderer 
                    question={q} 
                    selectedAnswer={studentAns} 
                    onChange={() => {}} 
                    showFeedback={true}
                    isCorrect={isCorrectAnswer}
                    explanation={q.explanation}
                  />
                </Card>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
