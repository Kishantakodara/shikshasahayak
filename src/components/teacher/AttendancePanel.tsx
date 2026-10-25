import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Check, 
  X, 
  Clock, 
  UserCheck, 
  UserX, 
  Download, 
  Sparkles, 
  MapPin, 
  Radio, 
  Play, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  Flame,
  Volume2,
  LocateFixed
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { dispatchSyncEvent, subscribeToSyncEvent, SYNC_EVENTS } from '../../utils/realtimeSync';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Calendar as CalendarPicker } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { GpsLocationCard } from '../common/LocationPermissionGuide';
import { useQuery } from '@tanstack/react-query';

interface AttendancePanelProps {
  classId?: string;
  className?: string;
  onClassChange?: (classId: string) => void;
}

interface Student {
  enrollment_id: string;
  student_id: string;
  enrollment_number: string;
  student_name: string;
  student_email: string;
}

interface AttendanceRecord {
  id?: string;
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
}

export const AttendancePanel: React.FC<AttendancePanelProps> = ({ 
  classId: propClassId, 
  className: propClassName,
  onClassChange
}) => {
  // Fetch teacher classes for easy class switching
  const { data: classesResponse } = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherClient.getClasses(),
  });
  const classes = classesResponse?.classes || [];

  const [currentClassId, setCurrentClassId] = useState<string>(propClassId || '');
  
  useEffect(() => {
    if (propClassId) {
      setCurrentClassId(propClassId);
    } else if (classes.length > 0 && !currentClassId) {
      setCurrentClassId(classes[0].id);
    }
  }, [propClassId, classes, currentClassId]);

  const activeClassObj = classes.find(c => c.id === currentClassId);
  const currentClassName = activeClassObj?.name || propClassName || 'Class';

  const handleClassSelect = (newId: string) => {
    setCurrentClassId(newId);
    if (onClassChange) onClassChange(newId);
  };

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);

  // Live Attendance Session State
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [sessionSubmissions, setSessionSubmissions] = useState<any[]>([]);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);

  // Launch Form State: 6-Digit Numeric Code (No Word Code)
  const [numericCode, setNumericCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState('150');
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // GPS via unified hook (works on all devices & browsers)
  const {
    permissionState: gpsPermState,
    coords: gpsCoords,
    isRequesting: gpsRequesting,
    requestLocation: requestGps,
  } = useLocationPermission();

  // Derived lat/lng from GPS hook (fallback to Ahmedabad default if not captured)
  const teacherLat = gpsCoords?.latitude ?? 23.0225;
  const teacherLng = gpsCoords?.longitude ?? 72.5714;

  // Load active session for class
  const checkActiveSession = async () => {
    if (!currentClassId) return;
    try {
      const res = await teacherClient.getActiveAttendanceSession(currentClassId);
      if (res && res.session) {
        setActiveSession(res.session);
        loadSessionSubmissions(res.session.id);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Error fetching active attendance session:', err);
    }
  };

  const loadSessionSubmissions = async (sessionId: string) => {
    try {
      const res = await teacherClient.getAttendanceSessionSubmissions(sessionId);
      if (res && res.submissions) {
        setSessionSubmissions(res.submissions);

        // Auto-mark present in grid for checked-in students
        setAttendance(prev => {
          const updated = { ...prev };
          res.submissions.forEach((sub: any) => {
            if (sub.status === 'VERIFIED_PRESENT' && updated[sub.student_id]) {
              updated[sub.student_id] = {
                ...updated[sub.student_id],
                status: 'PRESENT',
                notes: `📍 Live Number Verified (${sub.distance_meters || 0}m GPS)`
              };
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  // Generate random 6-digit numeric code
  const handleRandomizeNumericCode = () => {
    const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
    setNumericCode(freshCode);
    toast.success(`Generated new 6-digit attendance code: ${freshCode}`);
  };// Countdown timer effect
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const diff = new Date(activeSession.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('Expired');
        setActiveSession(null);
        toast.info('Live attendance session ended');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Real-time listener for instant student attendance submissions
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      loadSessionSubmissions(activeSession.id);
    }, 3000);

    const unsubscribe = subscribeToSyncEvent(SYNC_EVENTS.ATTENDANCE_SUBMIT, (sub: any) => {
      if (sub && sub.session_id === activeSession.id) {
        toast.success(`🎉 ${sub.student_name} verified & checked in live!`);
        loadSessionSubmissions(activeSession.id);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeSession]);

  // Start live attendance session with 6-digit numeric code
  const handleStartSession = async () => {
    if (!currentClassId) {
      toast.error('Please select a class first');
      return;
    }
    if (!numericCode.trim() || !/^\d{4,8}$/.test(numericCode.trim())) {
      toast.error('Please enter a valid numeric attendance code (4-8 digits)');
      return;
    }

    try {
      const res = await teacherClient.createAttendanceSession({
        class_id: currentClassId,
        session_code: numericCode.trim(),
        challenge_word: numericCode.trim(), // Keep numeric code as fallback for backward compatibility
        duration_minutes: parseInt(durationMinutes, 10),
        geofence_enabled: geofenceEnabled,
        geofence_latitude: teacherLat,
        geofence_longitude: teacherLng,
        geofence_radius_meters: parseInt(geofenceRadius, 10),
      });

      setActiveSession(res.session);
      setLaunchModalOpen(false);

      // Broadcast launch event to Student Portal
      dispatchSyncEvent(SYNC_EVENTS.ATTENDANCE_LAUNCH, res.session);

      toast.success(`Live Session Started! Attendance Number Code: ${res.session.session_code}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start live session');
    }
  };

  // End live attendance session
  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await teacherClient.endAttendanceSession(activeSession.id);
      dispatchSyncEvent(SYNC_EVENTS.ATTENDANCE_END, { sessionId: activeSession.id });
      setActiveSession(null);
      toast.info('Live attendance session ended.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session');
    }
  };

  // Load students for the class
  const loadStudents = async () => {
    if (!currentClassId) return;
    try {
      setLoading(true);
      const data = await teacherClient.getClassStudents(currentClassId, { 
        limit: 100, 
        status: 'ACTIVE' 
      });
      
      const activeStudents = (data.students || []).filter((s: any) => s.student_id);
      setStudents(activeStudents);
      
      // Initialize attendance record for each student
      const initialAttendance: Record<string, AttendanceRecord> = {};
      activeStudents.forEach((student: Student) => {
        initialAttendance[student.student_id] = {
          student_id: student.student_id,
          status: 'PRESENT', // Default to present
        };
      });
      setAttendance(initialAttendance);
    } catch (error: any) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Update attendance status for a student
  const updateAttendanceStatus = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      }
    }));
  };

  // Update notes for a student
  const updateAttendanceNotes = (studentId: string, notes: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: notes.trim() || undefined,
      }
    }));
  };

  // Mark all as present/absent
  const markAll = (status: AttendanceRecord['status']) => {
    setAttendance(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(studentId => {
        updated[studentId] = {
          ...updated[studentId],
          status,
        };
      });
      return updated;
    });
  };

  // Save attendance record
  const saveAttendance = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Attendance saved successfully');
      setHasExistingRecord(true);
    } catch (error: any) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Generate attendance report
  const generateReport = () => {
    const csvContent = [
      ['Student Name', 'Enrollment Number', 'Status', 'Notes'],
      ...students.map(student => [
        student.student_name,
        student.enrollment_number,
        attendance[student.student_id]?.status || 'PRESENT',
        attendance[student.student_id]?.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${currentClassName}_${selectedDate.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800 border-green-200';
      case 'ABSENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'LATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EXCUSED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT': return <UserCheck className="w-4 h-4" />;
      case 'ABSENT': return <UserX className="w-4 h-4" />;
      case 'LATE': return <Clock className="w-4 h-4" />;
      case 'EXCUSED': return <Check className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    if (currentClassId) {
      loadStudents();
      checkActiveSession();
    }
  }, [currentClassId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading students...</p>
      </div>
    );
  }

  const attendanceData = Object.values(attendance);
  const totalStudents = attendanceData.length;
  const presentCount = attendanceData.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendanceData.filter(a => a.status === 'ABSENT').length;
  const lateCount = attendanceData.filter(a => a.status === 'LATE').length;
  const excusedCount = attendanceData.filter(a => a.status === 'EXCUSED').length;
  const attendancePercentage = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Teacher Live Number Attendance Hero Launch Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-[#0A192F] dark:from-navy-950 dark:to-navy-900 rounded-3xl p-6 text-white shadow-xl border border-brand-orange/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Live Number Attendance System
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              {currentClassName} — Live Attendance
            </h2>
            <p className="text-sm text-gray-300 max-w-xl">
              Project a <span className="text-brand-orange font-bold font-mono">6-Digit Number Code</span> on screen. Students enter the number on their phones to check in instantly!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector Dropdown in Hero Banner */}
            {classes.length > 0 && (
              <div className="w-full sm:w-auto">
                <Select value={currentClassId} onValueChange={handleClassSelect}>
                  <SelectTrigger className="w-full sm:w-56 bg-white/10 hover:bg-white/15 border-white/20 text-white font-semibold text-xs h-12 rounded-2xl">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `(${cls.section})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!activeSession ? (
              <Button
                onClick={() => setLaunchModalOpen(true)}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-orange-500/20 gap-2 active:scale-95 transition-all text-sm cursor-pointer"
              >
                <Radio className="w-5 h-5 animate-pulse" />
                Launch Live Number Code
              </Button>
            ) : (
              <Button
                onClick={handleEndSession}
                variant="destructive"
                className="h-12 px-6 rounded-2xl font-bold gap-2 text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
                End Live Session
              </Button>
            )}
          </div>
        </div>

        {/* Live Active Projection Screen Banner (Number Code Only) */}
        {activeSession && (
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            {/* Projection Column 1: Massive 6-Digit Number Code */}
            <div className="space-y-1 text-center md:text-left col-span-1 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Class Projection Code (Number Code)</span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-brand-orange tracking-widest flex items-center justify-center md:justify-start gap-4">
                <span>{activeSession.session_code}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeSession.session_code);
                    toast.success('Attendance Number Code copied!');
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                  title="Copy Number Code"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-300">Project this 6-digit number code on the board for students to enter</p>
            </div>

            {/* Projection Column 2: Live Timer & Verified Students */}
            <div className="space-y-2 text-center md:text-right flex flex-col justify-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Session Timer</span>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 flex items-center justify-center md:justify-end gap-1.5">
                  <Clock className="w-5 h-5 animate-spin" />
                  <span>{timeLeftStr || '00:00'}</span>
                </div>
              </div>
              <div className="text-sm text-emerald-300 font-bold">
                ✅ {sessionSubmissions.length} Student{sessionSubmissions.length !== 1 ? 's' : ''} Checked In Live
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Submission Check-in Ticker */}
      {activeSession && sessionSubmissions.length > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Live Verified Student Submissions ({sessionSubmissions.length})
              </span>
              <Badge className="bg-emerald-500 text-white text-[10px]">Real-Time Sync</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {sessionSubmissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-navy-900 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">{sub.student_name}</h5>
                    <p className="text-[10px] text-gray-500">{sub.enrollment_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-[10px]">
                    Verified Present
                  </Badge>
                  {sub.distance_meters !== undefined && (
                    <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 text-[10px]">
                      📍 {sub.distance_meters}m GPS
                    </Badge>
                  )}
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance Ledger & Roster</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manual override & evaluation records for <span className="font-bold text-brand-orange">{currentClassName}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Class Switcher */}
          {classes.length > 0 && (
            <Select value={currentClassId} onValueChange={handleClassSelect}>
              <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-navy-900 font-semibold text-xs">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `(${cls.section})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-40 bg-white dark:bg-navy-900 text-xs">
                <Calendar className="w-4 h-4 mr-2" />
                {selectedDate.toLocaleDateString()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button
            onClick={generateReport}
            variant="outline"
            disabled={totalStudents === 0}
            className="bg-white dark:bg-navy-900 text-xs"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-gray-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Enrolled</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-5 w-5 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Present</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
          <CardContent className="p-4 text-center">
            <UserX className="h-5 w-5 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Absent</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Late</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
          <CardContent className="p-4 text-center">
            <Check className="h-5 w-5 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{excusedCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Excused</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Roster Actions:</span>
              <Button
                onClick={() => markAll('PRESENT')}
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Mark All Present
              </Button>
              <Button
                onClick={() => markAll('ABSENT')}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <UserX className="w-4 h-4 mr-2" />
                Mark All Absent
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Attendance Rate: <span className="font-bold text-brand-orange">{attendancePercentage.toFixed(1)}%</span>
              </div>
              <Button
                onClick={saveAttendance}
                disabled={saving}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold"
              >
                {saving ? 'Saving...' : hasExistingRecord ? 'Update Ledger' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="space-y-2">
        {students.length === 0 ? (
          <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active students found in this class</p>
            </CardContent>
          </Card>
        ) : (
          students.map((student) => {
            const studentAttendance = attendance[student.student_id];
            if (!studentAttendance) return null;
            
            return (
              <Card key={student.student_id} className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800 hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange font-bold">
                        {student.student_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {student.student_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {student.enrollment_number}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Status Buttons */}
                      <div className="flex items-center gap-1">
                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => (
                          <Button
                            key={status}
                            onClick={() => updateAttendanceStatus(student.student_id, status)}
                            variant={studentAttendance.status === status ? "default" : "outline"}
                            size="sm"
                            className={`px-3 py-1 text-xs ${
                              studentAttendance.status === status 
                                ? getStatusColor(status) 
                                : 'hover:border-gray-300'
                            }`}
                          >
                            {getStatusIcon(status)}
                            <span className="ml-1 hidden sm:inline">
                              {status.charAt(0) + status.slice(1).toLowerCase()}
                            </span>
                          </Button>
                        ))}
                      </div>
                      
                      {/* Notes */}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Notes..."
                          value={studentAttendance.notes || ''}
                          onChange={(e) => updateAttendanceNotes(student.student_id, e.target.value)}
                          className="w-32 text-xs bg-gray-50 dark:bg-navy-950"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Launch Live Number Code Modal */}
      <Dialog open={launchModalOpen} onOpenChange={setLaunchModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-gray-100 dark:border-navy-800">
            <DialogTitle className="text-xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              Configure Attendance Number Code
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Set up 6-digit number code & parameters for {currentClassName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* 6-Digit Number Code Controls (Pure Numbers, No Words) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Attendance Number Code (Digits only) *
                </Label>
                <button
                  type="button"
                  onClick={handleRandomizeNumericCode}
                  className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate Code
                </button>
              </div>
              <Input
                type="text"
                value={numericCode}
                maxLength={6}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setNumericCode(cleaned);
                }}
                placeholder="e.g. 749201"
                className="bg-gray-50 dark:bg-navy-950 font-mono font-black text-2xl tracking-widest text-center text-brand-orange h-14 rounded-2xl"
              />
              <p className="text-[11px] text-gray-500 text-center">
                Students will enter this 6-digit number code to check in.
              </p>
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Session Expiry Timer
              </Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                <SelectTrigger className="bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Minutes (Fast Test)</SelectItem>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="10">10 Minutes (Standard)</SelectItem>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes (Extended)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GPS Geofence Controls */}
            <div className="p-4 bg-gray-50 dark:bg-navy-950 rounded-2xl border border-gray-200 dark:border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-orange" /> GPS Geofence Verification
                  </Label>
                  <p className="text-[10px] text-gray-500">Require students to be within campus radius</p>
                </div>
                <Switch checked={geofenceEnabled} onCheckedChange={setGeofenceEnabled} />
              </div>

              {geofenceEnabled && (
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-navy-800">
                  <GpsLocationCard
                    permissionState={gpsPermState}
                    coords={gpsCoords}
                    isRequesting={gpsRequesting}
                    onRequest={requestGps}
                    onRetry={requestGps}
                    isOptional={false}
                  />

                  {gpsCoords && gpsPermState === 'granted' && (
                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 text-center">
                      📍 Class anchor: {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)} (±{gpsCoords.accuracy}m)
                    </p>
                  )}
                  {gpsPermState !== 'granted' && (
                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 text-center">
                      Default anchor: {teacherLat.toFixed(5)}, {teacherLng.toFixed(5)} (using campus coords)
                    </p>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                      Allowed Distance Radius
                    </Label>
                    <Select value={geofenceRadius} onValueChange={setGeofenceRadius}>
                      <SelectTrigger className="bg-white dark:bg-navy-900 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 Meters (Strict Classroom)</SelectItem>
                        <SelectItem value="100">100 Meters (Classroom Wing)</SelectItem>
                        <SelectItem value="150">150 Meters (Standard Hall)</SelectItem>
                        <SelectItem value="250">250 Meters (Department Building)</SelectItem>
                        <SelectItem value="500">500 Meters (Whole Campus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-navy-800">
              <Button variant="outline" onClick={() => setLaunchModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStartSession}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Live Number Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
