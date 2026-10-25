import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  CheckCircle,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Timer } from '@/components/quiz/timer';
import { QuestionNavigator } from '@/components/quiz/question-navigator';
import { QuestionRenderer } from '@/components/quiz/question-renderer';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Question, QuestionType } from '@/types';
import { apiClient } from '@/api/client';

export default function QuizAttempt() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string>('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load quiz details and start attempt session
  useEffect(() => {
    const initQuizAttempt = async () => {
      if (!quizId) return;
      try {
        const quizData = await apiClient.getQuiz(quizId);
        setQuiz(quizData);
        setQuestions(quizData.questions || []);

        const attemptData = await apiClient.startAttempt(quizId);
        const id = attemptData.attempt?.id || attemptData.id || '';
        setAttemptId(id);
        
        // Restore pre-saved answers if any
        if (attemptData.responses) {
          const restored: Record<number, any> = {};
          (quizData.questions || []).forEach((q: any, idx: number) => {
            const resp = attemptData.responses.find((r: any) => r.questionId === q.id);
            if (resp) {
              restored[idx] = resp.selectedOptionId || resp.textResponse;
            }
          });
          setAnswers(restored);
        }
      } catch (err) {
        console.error('Failed to load quiz attempt:', err);
        toast.error('Failed to load quiz details.');
      } finally {
        setLoading(false);
      }
    };
    initQuizAttempt();
  }, [quizId]);

  // Proctoring: Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const nextVal = prev + 1;
          toast.warning(`Tab switch detected! Warning ${nextVal}/3. The test will auto-submit on 3 switches.`, {
            duration: 5000,
            icon: <AlertTriangle className="text-amber-500" />
          });
          if (nextVal >= 3) {
            handleFinalSubmit();
          }
          return nextVal;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attemptId, questions]);

  // Proctoring: Copy/Paste block
  useEffect(() => {
    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      toast.error('Copy/Paste is disabled during the exam.');
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, []);

  const requestFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const handleAnswerChange = async (value: any) => {
    setAnswers({ ...answers, [currentIndex]: value });
    
    // Auto-save choice to the backend D1 database
    if (attemptId && questions[currentIndex]) {
      const q = questions[currentIndex];
      let selectedOptionId: string | undefined = undefined;
      let textResponse: string | undefined = undefined;
      
      // Map correctly based on question type
      if (q.type === QuestionType.SINGLE_CORRECT || q.type === QuestionType.TRUE_FALSE) {
        selectedOptionId = value;
      } else {
        textResponse = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }

      try {
        await apiClient.autoSaveResponse(attemptId, q.id, selectedOptionId, textResponse);
      } catch (e) {
        console.error('Error auto-saving answer:', e);
      }
    }
  };

  const toggleFlag = () => {
    setFlagged({ ...flagged, [currentIndex]: !flagged[currentIndex] });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTimeWarning = (minutesLeft: number) => {
    toast.error(`Warning: Only ${minutesLeft} minute(s) left in the exam!`, {
      duration: 10000
    });
  };

  const handleFinalSubmit = async () => {
    if (!attemptId) return;
    toast.success('Submitting attempt and calculating results...');
    
    try {
      await apiClient.submitAttempt(attemptId);
      // Save attempt ID to localStorage to fetch result dynamically on next screen
      localStorage.setItem(`quiz-attempt-${quizId}`, attemptId);
      
      setTimeout(() => {
        navigate(`/student/quiz/${quizId}/result`);
      }, 1000);
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      toast.error('Failed to submit attempt.');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-sm font-bold">Loading exam environment...</div>;
  }

  if (questions.length === 0) {
    return <div className="py-8 text-center text-sm font-bold text-red-500">No questions found in this quiz.</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary/20 text-primary uppercase">
            {quiz?.moduleType || 'EXAM'}
          </Badge>
          <h2 className="font-display font-bold text-lg text-foreground">
            {quiz?.title}
          </h2>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!isFullscreen && (
            <Button variant="outline" size="sm" onClick={requestFullscreen} className="gap-1.5 text-xs">
              <Maximize2 className="h-4 w-4" /> Fullscreen Mode
            </Button>
          )}
          
          <Timer 
            durationMinutes={quiz?.durationMinutes || 30} 
            onTimeExpired={handleFinalSubmit} 
            onTimeWarning={handleTimeWarning} 
          />
        </div>
      </div>

      {/* EXAM CORE LAYOUT */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* QUESTION DISPLAY PANEL */}
        <Card className="md:col-span-8 p-6 space-y-6 min-h-[400px]">
          <QuestionRenderer 
            question={currentQuestion} 
            selectedAnswer={answers[currentIndex]} 
            onChange={handleAnswerChange} 
          />

          <div className="flex justify-between items-center pt-6 border-t mt-8">
            <div className="flex gap-2">
              <Button 
                onClick={handlePrev} 
                disabled={currentIndex === 0} 
                variant="outline" 
                size="sm"
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
              <Button 
                onClick={toggleFlag} 
                variant="outline" 
                size="sm"
                className={flagged[currentIndex] ? 'bg-amber-500 text-white hover:bg-amber-600 border-transparent' : 'gap-1.5'}
              >
                <Flag className="h-4 w-4" /> {flagged[currentIndex] ? 'Flagged' : 'Flag'}
              </Button>
            </div>

            {currentIndex === questions.length - 1 ? (
              <Button 
                onClick={handleFinalSubmit} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle className="h-4 w-4" /> Submit Exam
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                size="sm"
                className="gap-1.5 bg-brand-orange text-white hover:bg-brand-hover"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* SIDE NAVIGATOR PANEL */}
        <div className="md:col-span-4 space-y-6">
          <QuestionNavigator 
            totalQuestions={questions.length} 
            currentIndex={currentIndex} 
            onSelect={setCurrentIndex} 
            answers={answers} 
            flagged={flagged} 
          />
        </div>
      </div>
    </div>
  );
}
