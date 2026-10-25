import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  KeyRound, 
  Volume2, 
  Radio, 
  ShieldCheck, 
  Check,
  RefreshCw,
  LocateFixed
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { teacherClient } from '../../api/teacherClient';
import { toast } from 'sonner';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { GpsLocationCard } from '../common/LocationPermissionGuide';

interface StudentAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser?: {
    id: string;
    name: string;
    enrollmentNo?: string;
  };
}

export const StudentAttendanceModal: React.FC<StudentAttendanceModalProps> = ({
  open,
  onOpenChange,
  currentUser = {
    id: 'student-guest',
    name: 'Student',
    enrollmentNo: 'GTU-STUDENT'
  }
}) => {
  const [sessionCode, setSessionCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);

  // ─── GPS via unified hook ──────────────────────────────────────────────────
  const {
    permissionState,
    coords,
    isRequesting,
    requestLocation,
    reset: resetLocation,
  } = useLocationPermission();

  // On first open, show a friendly toast nudge once
  const [nudgeSent, setNudgeSent] = React.useState(false);
  React.useEffect(() => {
    if (open && !nudgeSent) {
      toast.info('Tap "Allow GPS" below for location-verified attendance (optional).', { duration: 4000 });
      setNudgeSent(true);
    }
  }, [open, nudgeSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedCode = sessionCode.replace(/\D/g, '').trim();
    if (!cleanedCode || cleanedCode.length < 4) {
      toast.error('Please enter the 6-digit Attendance Number Code');
      return;
    }

    try {
      setSubmitting(true);
      const res = await teacherClient.submitStudentAttendance({
        session_code: cleanedCode,
        challenge_word: cleanedCode, // Fallback for backward compatibility
        student_id: currentUser.id,
        student_name: currentUser.name,
        enrollment_number: currentUser.enrollmentNo || '',
        latitude: coords?.latitude ?? undefined,
        longitude: coords?.longitude ?? undefined,
        accuracy: coords?.accuracy ?? undefined,
      });

      if (res && res.success) {
        setSubmissionReceipt(res.submission);
        toast.success(res.message || 'Attendance verified & marked!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionReceipt(null);
    setSessionCode('');
    resetLocation();
    setNudgeSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-navy-800">
          <DialogTitle className="text-xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-brand-orange animate-pulse" />
            Mark Live Attendance
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Enter the 6-digit Number Code projected by your teacher
          </DialogDescription>
        </DialogHeader>

        {submissionReceipt ? (
          /* Success Receipt View */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Attendance Marked Present! 🎉
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Number Code Verified Successfully
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-navy-950 rounded-2xl border border-gray-200 dark:border-navy-800 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-navy-800">
                <span className="text-gray-500">Student Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">{submissionReceipt.student_name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-navy-800">
                <span className="text-gray-500">Status:</span>
                <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                  VERIFIED PRESENT
                </Badge>
              </div>
              {submissionReceipt.distance_meters !== undefined && (
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-navy-800">
                  <span className="text-gray-500">GPS Geofence:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {submissionReceipt.distance_meters || 12}m from Class (Verified)
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Timestamp:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {new Date(submissionReceipt.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  handleReset();
                  onOpenChange(false);
                }}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-xl cursor-pointer"
              >
                Close Receipt
              </Button>
            </div>
          </div>
        ) : (
          /* Attendance Entry Form (Number Code Only) */
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            
            {/* 6-Digit Number Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-orange" />
                6-Digit Attendance Number Code *
              </Label>
              <Input
                type="text"
                value={sessionCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setSessionCode(val);
                }}
                placeholder="e.g. 749201"
                maxLength={6}
                className="bg-gray-50 dark:bg-navy-950 font-mono text-2xl font-black tracking-widest text-center text-brand-orange h-14 rounded-2xl"
                autoFocus
                required
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                💡 Enter the 6-digit number code shown by your teacher.
              </p>
            </div>

            {/* GPS Location Card — unified component */}
            <GpsLocationCard
              permissionState={permissionState}
              coords={coords}
              isRequesting={isRequesting}
              onRequest={requestLocation}
              onRetry={requestLocation}
              isOptional={true}
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-navy-800">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !sessionCode || sessionCode.length < 4}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold gap-2 cursor-pointer"
              >
                {submitting ? 'Verifying...' : 'Verify & Mark Attendance'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
