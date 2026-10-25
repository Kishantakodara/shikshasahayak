import React, { useState } from 'react';
import { 
  Plus, 
  KeyRound, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  GraduationCap, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { teacherClient } from '../../api/teacherClient';
import { toast } from 'sonner';

interface JoinClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    enrollmentNo?: string;
  };
  onSuccessJoined?: (classData: any) => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({
  open,
  onOpenChange,
  initialCode = '',
  currentUser = {
    id: 'student-guest',
    name: 'Student',
    email: '',
    enrollmentNo: ''
  },
  onSuccessJoined
}) => {
  const [joinCode, setJoinCode] = useState(initialCode ? initialCode.trim().toUpperCase() : '');
  const [enrollmentNo, setEnrollmentNo] = useState(currentUser.enrollmentNo || '');
  const [submitting, setSubmitting] = useState(false);
  const [joinedClass, setJoinedClass] = useState<any | null>(null);

  React.useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode.trim().toUpperCase());
    }
  }, [initialCode]);

  React.useEffect(() => {
    if (currentUser?.enrollmentNo && !enrollmentNo) {
      setEnrollmentNo(currentUser.enrollmentNo);
    }
  }, [currentUser?.enrollmentNo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      toast.error('Please enter a Class Join Code');
      return;
    }

    try {
      setSubmitting(true);
      const cleanEnrollment = (enrollmentNo || currentUser.enrollmentNo || '').trim();
      const res = await teacherClient.enrollStudentByJoinCode({
        join_code: joinCode.trim().toUpperCase(),
        student_id: currentUser.id,
        student_name: currentUser.name,
        student_email: currentUser.email,
        enrollment_number: cleanEnrollment,
      });

      if (res && res.success) {
        setJoinedClass(res.classData);
        toast.success(res.message);
        if (onSuccessJoined) {
          onSuccessJoined(res.classData);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to join class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setJoinedClass(null);
    setJoinCode('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-navy-800">
          <DialogTitle className="text-xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-orange" />
            Join Teacher's Class
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Ask your teacher for the 6-character Join Code (e.g. DBM3A99) to enroll
          </DialogDescription>
        </DialogHeader>

        {joinedClass ? (
          /* Joined Class Success Card */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-display">
                Enrolled Successfully! 🎉
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You are now connected to your teacher's class roster
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl border border-brand-orange/30 text-white text-left space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-brand-orange text-white text-[10px]">
                  Sem {joinedClass.semester || 1} • Sec {joinedClass.section || 'A'}
                </Badge>
                <span className="text-[10px] font-mono text-gray-300">Code: {joinedClass.join_code}</span>
              </div>
              <h4 className="font-bold text-base text-white">{joinedClass.name}</h4>
              <p className="text-xs text-gray-300 line-clamp-2">{joinedClass.description}</p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  handleReset();
                  onOpenChange(false);
                }}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-xl"
              >
                Done & View Materials
              </Button>
            </div>
          </div>
        ) : (
          /* Join Code Entry Form */
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-orange" />
                Class Join Code *
              </Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. D0GL9Q"
                maxLength={10}
                className="bg-gray-50 dark:bg-navy-950 font-mono text-lg font-bold tracking-widest text-center text-brand-orange uppercase"
                required
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Enter the 6-character code provided by your course professor.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-orange" />
                Enrollment / Roll Number (Optional)
              </Label>
              <Input
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                placeholder="e.g. 210280116001 (Optional)"
                className="bg-gray-50 dark:bg-navy-950 text-xs font-medium"
              />
            </div>

            {/* Quick Benefits Card */}
            <div className="p-3 bg-gray-50 dark:bg-navy-950 rounded-2xl border border-gray-200 dark:border-navy-800 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                What happens when you join:
              </div>
              <ul className="space-y-1 pl-5 list-disc text-[11px]">
                <li>Unlock official lecture slides & study handouts</li>
                <li>Submit assignments & view teacher evaluation feedback</li>
                <li>Attempt live classroom quizzes & mark challenge attendance</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-navy-800">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold gap-2"
              >
                {submitting ? 'Enrolling...' : 'Join Class Now'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
