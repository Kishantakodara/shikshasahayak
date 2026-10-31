import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Plus, CheckCircle2, Clock, MapPin, 
  BookOpen, AlertCircle, FileText, Sparkles, Filter, ChevronLeft, ChevronRight, 
  Trash2, Download, CalendarCheck, Flame, Bell, Target, ArrowRight,
  GraduationCap, CheckCircle, ExternalLink, Bookmark, Layers, RefreshCw
} from 'lucide-react';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { CalendarEventType, CalendarEvent } from '../../types/learning-ecosystem';
import { Link } from 'react-router-dom';

type ViewMode = 'month' | 'agenda' | 'timetable';

export const AcademicCalendarPage: React.FC = () => {
  const { academicProfile } = useStudentAcademic();
  const { calendarEvents, addCalendarEvent, toggleCalendarEventCompleted, deleteCalendarEvent } = useLearningEcosystem();

  // Navigation & View States
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('internal_exam');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:30 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [subjectName, setSubjectName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Quick Preset Semester Subjects
  const suggestedSubjects = useMemo(() => {
    const sem = academicProfile?.semester || 5;
    const branch = (academicProfile?.branchName || '').toLowerCase();
    if (branch.includes('computer') || branch.includes('cse') || branch.includes('it')) {
      if (sem === 5) return ['Computer Networks', 'Analysis & Design of Algorithms', 'Software Engineering', 'Cyber Security', 'Professional Ethics'];
      if (sem === 6) return ['Advanced Java', 'Web Technology', 'Machine Learning', 'Data Warehousing', 'Compiler Design'];
      if (sem === 3) return ['Data Structures', 'Database Management Systems', 'Digital Fundamentals', 'Discrete Mathematics'];
      if (sem === 4) return ['Operating Systems', 'Object Oriented Programming with Java', 'Computer Organization', 'Principles of Economics'];
    }
    return ['Engineering Mathematics', 'Basic Electrical', 'Physics', 'Programming in C', 'Mechanics of Solids'];
  }, [academicProfile]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(ev => {
      const matchesFilter = activeFilter === 'all' || ev.eventType === activeFilter;
      const matchesSearch = !searchQuery.trim() || 
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.subjectName && ev.subjectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ev.notes && ev.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [calendarEvents, activeFilter, searchQuery]);

  // Next Major Upcoming Exam (Countdown)
  const nextMajorExam = useMemo(() => {
    const now = new Date();
    const upcomingExams = calendarEvents
      .filter(ev => (ev.eventType === 'univ_exam' || ev.eventType === 'internal_exam') && !ev.isCompleted)
      .map(ev => ({ ...ev, dateObj: new Date(`${ev.startDate}T10:00:00`) }))
      .filter(ev => ev.dateObj.getTime() >= now.getTime() - 86400000)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    if (upcomingExams.length === 0) return null;
    const next = upcomingExams[0];
    const diffTime = next.dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { event: next, daysLeft: Math.max(0, diffDays) };
  }, [calendarEvents]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = calendarEvents.length;
    const completed = calendarEvents.filter(e => e.isCompleted).length;
    const examsCount = calendarEvents.filter(e => e.eventType === 'univ_exam' || e.eventType === 'internal_exam').length;
    const assignmentsCount = calendarEvents.filter(e => e.eventType === 'assignment').length;
    return { total, completed, examsCount, assignmentsCount, pending: total - completed };
  }, [calendarEvents]);

  // Month Calendar Matrix Computation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, isCurrentMonth: false, dateStr, isToday: false });
    }
    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, isCurrentMonth: true, dateStr, isToday: dateStr === todayStr });
    }
    // Next month filler days (fill up to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, isCurrentMonth: false, dateStr, isToday: false });
    }
    return days;
  }, [currentDate]);

  // Events on Selected Date
  const selectedDateEvents = useMemo(() => {
    return calendarEvents.filter(ev => ev.startDate === selectedDateStr);
  }, [calendarEvents, selectedDateStr]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleTodayJump = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Add Event Form Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addCalendarEvent({
      title: title.trim(),
      eventType,
      startDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      subjectName: subjectName.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setNotes('');
    setLocation('');
    setShowAddModal(false);
  };

  // 1-Click Load GTU Default Exam & Academic Schedule
  const handleLoadGtuPresetSchedule = () => {
    const baseDate = new Date();
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();

    const presets: Array<Omit<CalendarEvent, 'id' | 'isCompleted'>> = [
      {
        title: `${suggestedSubjects[0] || 'Core Subject'} — Mid-Sem Exam 1`,
        eventType: 'internal_exam',
        startDate: new Date(y, m, baseDate.getDate() + 5).toISOString().split('T')[0],
        startTime: '10:30 AM',
        endTime: '12:00 PM',
        subjectName: suggestedSubjects[0] || 'Core Subject',
        location: 'Department Hall 204',
        notes: 'Units 1 & 2 Syllabus. 30 Marks internal assessment.',
      },
      {
        title: `${suggestedSubjects[1] || 'Major Subject'} — Mid-Sem Exam 1`,
        eventType: 'internal_exam',
        startDate: new Date(y, m, baseDate.getDate() + 7).toISOString().split('T')[0],
        startTime: '10:30 AM',
        endTime: '12:00 PM',
        subjectName: suggestedSubjects[1] || 'Major Subject',
        location: 'Department Hall 204',
        notes: 'Units 1 & 2 Syllabus. Theory & Derivations.',
      },
      {
        title: `${suggestedSubjects[0] || 'Core Subject'} — Lab Practical Viva Submission`,
        eventType: 'practical',
        startDate: new Date(y, m, baseDate.getDate() + 12).toISOString().split('T')[0],
        startTime: '02:00 PM',
        endTime: '05:00 PM',
        subjectName: suggestedSubjects[0] || 'Core Subject',
        location: 'Software Lab 3',
        notes: 'Submit lab journal with 10 completed experiments and code printouts.',
      },
      {
        title: 'GTU University Final Exam Phase — Theory Exam 1',
        eventType: 'univ_exam',
        startDate: new Date(y, m + 1, 15).toISOString().split('T')[0],
        startTime: '10:30 AM',
        endTime: '01:00 PM',
        subjectName: suggestedSubjects[0] || 'Core Subject',
        location: 'GTU Exam Centre / Seat Assigned',
        notes: 'Complete 70 Marks GTU Paper. Passing criteria: 23/70.',
      },
      {
        title: 'GTU University Final Exam Phase — Theory Exam 2',
        eventType: 'univ_exam',
        startDate: new Date(y, m + 1, 18).toISOString().split('T')[0],
        startTime: '10:30 AM',
        endTime: '01:00 PM',
        subjectName: suggestedSubjects[1] || 'Major Subject',
        location: 'GTU Exam Centre',
        notes: 'Units 1 to 5 Full Syllabus. PYQ revision recommended.',
      }
    ];

    presets.forEach(p => addCalendarEvent(p));
  };

  // Export to .ics format for Google Calendar / Apple Calendar
  const handleExportICS = () => {
    if (calendarEvents.length === 0) return;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ShikshaSahayak//AcademicCalendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    calendarEvents.forEach(ev => {
      const cleanDate = ev.startDate.replace(/-/g, '');
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:shiksha-${ev.id}@shikshasahayak.org`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:${ev.title}`,
        `DESCRIPTION:${ev.notes ? ev.notes.replace(/\n/g, ' ') : ''} [Subject: ${ev.subjectName || 'Academic'}]`,
        `LOCATION:${ev.location || 'Gujarat Technological University'}`,
        `STATUS:${ev.isCompleted ? 'COMPLETED' : 'CONFIRMED'}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shikshasahayak_academic_calendar_sem${academicProfile?.semester || 5}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Event Badging Helper
  const getEventBadge = (type: CalendarEventType) => {
    switch (type) {
      case 'internal_exam':
        return { 
          label: 'Internal Mid-Sem', 
          color: 'bg-red-50 text-red-600 dark:bg-red-950/40 border-red-200 dark:border-red-800/50',
          dot: 'bg-red-500',
          icon: FileText
        };
      case 'univ_exam':
        return { 
          label: 'GTU Final Paper', 
          color: 'bg-orange-50 text-brand-orange dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/50',
          dot: 'bg-[#f97316]',
          icon: GraduationCap
        };
      case 'practical':
        return { 
          label: 'Lab Practical & Viva', 
          color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50',
          dot: 'bg-purple-500',
          icon: BookOpen
        };
      case 'assignment':
        return { 
          label: 'Assignment Due', 
          color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
          dot: 'bg-blue-500',
          icon: Target
        };
      case 'revision':
        return { 
          label: 'Revision Sprint', 
          color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
          dot: 'bg-emerald-500',
          icon: Flame
        };
      default:
        return { 
          label: 'Academic Reminder', 
          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: Bell
        };
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Top Banner: Academic Command Center */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-navy-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-black uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>GTU Academic Schedule & Exam Timetable</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display tracking-tight text-white">
              Academic Calendar & Exam Radar
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Plan and track internal mid-semesters, GTU 70-mark university final papers, laboratory vivas, and assignment deadlines for <span className="text-brand-orange font-bold">{academicProfile?.branchName || 'Engineering'} (Semester {academicProfile?.semester || 5})</span>.
            </p>

            {/* Quick Metrics Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700/60 text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                <span><strong className="text-white font-bold">{stats.examsCount}</strong> Scheduled Exams</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700/60 text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span><strong className="text-white font-bold">{stats.completed}</strong> Completed</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700/60 text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span><strong className="text-white font-bold">{stats.pending}</strong> Upcoming Tasks</span>
              </div>
            </div>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
            {calendarEvents.length === 0 && (
              <button
                onClick={handleLoadGtuPresetSchedule}
                className="px-4 py-3 rounded-2xl bg-navy-800 hover:bg-navy-750 text-white font-bold text-xs border border-navy-700 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                title="Load recommended GTU timeline dates"
              >
                <Sparkles className="w-4 h-4 text-brand-orange" />
                <span>Load Sem {academicProfile?.semester || 5} GTU Schedule</span>
              </button>
            )}

            <button
              onClick={handleExportICS}
              disabled={calendarEvents.length === 0}
              className="px-4 py-3 rounded-2xl bg-navy-800 hover:bg-navy-750 text-slate-200 hover:text-white font-bold text-xs border border-navy-700 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Export to Google Calendar or Apple Calendar (.ics)"
            >
              <Download className="w-4 h-4" />
              <span>Export .ICS</span>
            </button>

            <button
              onClick={() => {
                setStartDate(selectedDateStr || new Date().toISOString().split('T')[0]);
                setShowAddModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event / Exam</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Exam Countdown Alert Card (If applicable) */}
      {nextMajorExam && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 p-5 dark:bg-navy-900/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-brand-orange text-white px-2 py-0.5 rounded-md">
                  Next Major Exam
                </span>
                <span className="text-xs font-bold text-brand-orange">
                  {nextMajorExam.daysLeft === 0 ? 'Today!' : `${nextMajorExam.daysLeft} Days Remaining`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                {nextMajorExam.event.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <span>📅 {new Date(nextMajorExam.event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {nextMajorExam.event.startTime && <span>⏰ {nextMajorExam.event.startTime}</span>}
                {nextMajorExam.event.location && <span>📍 {nextMajorExam.event.location}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <Link
              to="/resources/study-material"
              className="px-4 py-2 rounded-xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-bold text-xs hover:bg-brand-orange dark:hover:bg-brand-orange dark:hover:text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study Notes & PYQs</span>
            </Link>
          </div>
        </div>
      )}

      {/* Control Bar: View Mode Switcher, Date Jump & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200 dark:border-navy-800 shadow-sm">
        
        {/* View Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 self-start">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Monthly Grid</span>
          </button>

          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline Agenda</span>
          </button>

          <button
            onClick={() => setViewMode('timetable')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'timetable'
                ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Exam Timetable</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'univ_exam', label: 'GTU Finals' },
            { id: 'internal_exam', label: 'Mid-Sem' },
            { id: 'practical', label: 'Lab Viva' },
            { id: 'assignment', label: 'Assignments' },
            { id: 'revision', label: 'Revision' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-brand-orange text-white shadow-xs'
                  : 'bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-slate-600 dark:text-slate-300 hover:border-brand-orange/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. MONTHLY CALENDAR GRID VIEW                             */}
      {/* ========================================================= */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Month Grid (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-navy-900 rounded-3xl border border-gray-200 dark:border-navy-800 p-5 sm:p-6 shadow-sm space-y-4">
            
            {/* Month Header Controller */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white">
                  {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={handleTodayJump}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-brand-orange hover:text-white transition cursor-pointer"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-navy-855 border border-gray-200 dark:border-navy-750 hover:bg-gray-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-navy-855 border border-gray-200 dark:border-navy-750 hover:bg-gray-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {monthData.map((cell, idx) => {
                const dayEvents = calendarEvents.filter(ev => ev.startDate === cell.dateStr);
                const isSelected = selectedDateStr === cell.dateStr;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${
                      !cell.isCurrentMonth
                        ? 'bg-gray-50/50 dark:bg-navy-950/30 border-transparent text-slate-400 dark:text-slate-600'
                        : isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-brand-orange shadow-md ring-2 ring-brand-orange/20'
                        : cell.isToday
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 text-navy-900 dark:text-white'
                        : 'bg-white dark:bg-navy-900 border-gray-150 dark:border-navy-800 text-navy-900 dark:text-white hover:border-brand-orange/40 hover:bg-orange-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isSelected
                          ? 'bg-brand-orange text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {cell.dayNumber}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-extrabold text-brand-orange bg-orange-100 dark:bg-orange-950/60 px-1.5 py-0.2 rounded-md">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Mini event tags */}
                    <div className="space-y-1 w-full mt-1">
                      {dayEvents.slice(0, 2).map(ev => {
                        const b = getEventBadge(ev.eventType);
                        return (
                          <div
                            key={ev.id}
                            className={`text-[9px] sm:text-[10px] truncate px-1.5 py-0.5 rounded-md font-bold border ${b.color}`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] font-bold text-slate-400 pl-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-navy-900 rounded-3xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">Selected Date</p>
                <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                  {new Date(`${selectedDateStr}T10:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
              <button
                onClick={() => {
                  setStartDate(selectedDateStr);
                  setShowAddModal(true);
                }}
                className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-brand-orange hover:bg-brand-orange hover:text-white transition cursor-pointer"
                title="Add event on this date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Event List on Selected Date */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center mx-auto text-slate-400">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy-900 dark:text-white">No events scheduled</p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto mt-0.5">Click "Add Event" to attach an exam or study milestone.</p>
                  </div>
                  <button
                    onClick={() => {
                      setStartDate(selectedDateStr);
                      setShowAddModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-orange text-white text-xs font-bold shadow-xs hover:bg-orange-600 transition cursor-pointer"
                  >
                    + Schedule on {new Date(`${selectedDateStr}T10:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </button>
                </div>
              ) : (
                selectedDateEvents.map(event => {
                  const b = getEventBadge(event.eventType);

                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        event.isCompleted
                          ? 'bg-slate-50 dark:bg-navy-950/60 border-gray-200 dark:border-navy-800 opacity-60'
                          : 'bg-white dark:bg-navy-850 border-gray-200 dark:border-navy-750 shadow-xs hover:border-brand-orange/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${b.color}`}>
                            {b.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleCalendarEventCompleted(event.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              event.isCompleted
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'text-slate-400 hover:text-emerald-500 border-gray-200 dark:border-navy-700'
                            }`}
                            title={event.isCompleted ? 'Mark Pending' : 'Mark Done'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCalendarEvent(event.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 border border-gray-200 dark:border-navy-700 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className={`text-sm font-extrabold ${event.isCompleted ? 'line-through text-slate-400' : 'text-navy-900 dark:text-white'}`}>
                        {event.title}
                      </h4>

                      {event.subjectName && (
                        <p className="text-xs font-bold text-brand-orange flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{event.subjectName}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-navy-800">
                        {event.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {event.startTime} {event.endTime ? `– ${event.endTime}` : ''}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {event.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-gray-50 dark:bg-navy-900 p-2.5 rounded-xl border border-gray-150 dark:border-navy-800 leading-relaxed">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. AGENDA / TIMELINE LIST VIEW                            */}
      {/* ========================================================= */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-navy-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">
                Upcoming Academic Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Sorted chronologically for semester roadmap execution.
              </p>
            </div>
            
            <input
              type="text"
              placeholder="Search schedule..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange w-full sm:w-64"
            />
          </div>

          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-navy-900 dark:text-white">No Schedule Entries Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Try clearing your filters or click "Add Event" to add exams or study milestones.
                </p>
              </div>
            ) : (
              filteredEvents
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map(event => {
                  const b = getEventBadge(event.eventType);

                  return (
                    <div
                      key={event.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        event.isCompleted
                          ? 'bg-gray-50 dark:bg-navy-950/60 border-gray-200 dark:border-navy-800 opacity-60'
                          : 'bg-white dark:bg-navy-850 border-gray-200 dark:border-navy-750 shadow-xs hover:border-brand-orange/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleCalendarEventCompleted(event.id)}
                          className={`mt-1 w-6 h-6 rounded-full border flex items-center justify-center transition shrink-0 cursor-pointer ${
                            event.isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 dark:border-navy-700 hover:border-brand-orange'
                          }`}
                        >
                          {event.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${b.color}`}>
                              {b.label}
                            </span>
                            {event.subjectName && (
                              <span className="text-xs font-bold text-navy-900 dark:text-white">
                                {event.subjectName}
                              </span>
                            )}
                          </div>

                          <h3 className={`text-base font-extrabold ${event.isCompleted ? 'line-through text-slate-400' : 'text-navy-900 dark:text-white'}`}>
                            {event.title}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                            <span className="flex items-center gap-1 font-bold text-brand-orange">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {new Date(`${event.startDate}T10:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {event.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {event.startTime} {event.endTime ? `– ${event.endTime}` : ''}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.location}
                              </span>
                            )}
                          </div>

                          {event.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-gray-50 dark:bg-navy-900 p-2.5 rounded-xl border border-gray-150 dark:border-navy-800">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => deleteCalendarEvent(event.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition rounded-lg cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. GTU EXAM TIMETABLE CARD VIEW                           */}
      {/* ========================================================= */}
      {viewMode === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-navy-800 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-orange" />
                  <span>GTU & Internal Exam Timetable Matrix</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Subject-wise examination schedules, seat allocation & syllabus revision plans.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                GTU Passing Standard: <strong className="text-brand-orange">23 / 70 Marks (Theory)</strong>
              </div>
            </div>

            {/* Exam Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {calendarEvents.filter(ev => ev.eventType === 'univ_exam' || ev.eventType === 'internal_exam').length === 0 ? (
                <div className="col-span-full py-16 text-center space-y-3">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-navy-900 dark:text-white">No Exam Papers Configured</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click "Load Sem {academicProfile?.semester || 5} GTU Schedule" to auto-populate your semester paper dates and syllabus coverage.
                  </p>
                  <button
                    onClick={handleLoadGtuPresetSchedule}
                    className="px-4 py-2 rounded-xl bg-brand-orange text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Auto-Populate Exam Timetable
                  </button>
                </div>
              ) : (
                calendarEvents
                  .filter(ev => ev.eventType === 'univ_exam' || ev.eventType === 'internal_exam')
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map(exam => {
                    const isGtu = exam.eventType === 'univ_exam';
                    const examDate = new Date(`${exam.startDate}T10:00:00`);
                    const daysAway = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={exam.id}
                        className="rounded-3xl border border-gray-200 dark:border-navy-750 bg-white dark:bg-navy-850 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-orange/60 transition-all group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                              isGtu
                                ? 'bg-orange-50 text-brand-orange dark:bg-orange-950/40 border-orange-200'
                                : 'bg-red-50 text-red-600 dark:bg-red-950/40 border-red-200'
                            }`}>
                              {isGtu ? 'GTU University Final' : 'Internal Mid-Sem'}
                            </span>

                            <span className="text-[11px] font-extrabold text-brand-orange">
                              {daysAway < 0 ? 'Concluded' : daysAway === 0 ? 'Today!' : `In ${daysAway} Days`}
                            </span>
                          </div>

                          <h3 className="text-lg font-extrabold text-navy-900 dark:text-white leading-snug">
                            {exam.title}
                          </h3>

                          {exam.subjectName && (
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              Subject: <span className="text-brand-orange">{exam.subjectName}</span>
                            </p>
                          )}

                          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-navy-900 p-3 rounded-2xl border border-gray-150 dark:border-navy-800">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-400">Date:</span>
                              <span className="font-bold text-navy-900 dark:text-white">
                                {examDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-400">Timing:</span>
                              <span className="font-bold text-navy-900 dark:text-white">
                                {exam.startTime || '10:30 AM'} – {exam.endTime || '01:00 PM'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-400">Weightage:</span>
                              <span className="font-bold text-navy-900 dark:text-white">
                                {isGtu ? '70 Marks (Ext)' : '30 Marks (Int)'}
                              </span>
                            </div>
                            {exam.location && (
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-400">Location:</span>
                                <span className="font-bold text-navy-900 dark:text-white">{exam.location}</span>
                              </div>
                            )}
                          </div>

                          {exam.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {exam.notes}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between gap-2">
                          <Link
                            to={`/resources/study-material`}
                            className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
                          >
                            <span>Open Question Papers</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={() => toggleCalendarEventCompleted(exam.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              exam.isCompleted
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{exam.isCompleted ? 'Done' : 'Mark Given'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT EVENT MODAL                                    */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5 animate-scale-in my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-3">
              <h3 className="text-lg font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-orange" />
                <span>Schedule Academic Milestone</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Computer Networks GTU Final Paper"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Event Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange font-medium"
                  >
                    <option value="univ_exam">🎓 GTU University Final Exam (70M)</option>
                    <option value="internal_exam">📝 Internal Mid-Sem Exam (30M)</option>
                    <option value="practical">🔬 Laboratory Practical & Viva</option>
                    <option value="assignment">📑 Assignment Submission</option>
                    <option value="revision">🔥 Revision Sprint Plan</option>
                    <option value="reminder">🔔 Academic Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange font-medium"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    placeholder="01:00 PM"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Subject Suggester */}
              <div>
                <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder="e.g. Analysis & Design of Algorithms"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange mb-1.5"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Quick Pick:</span>
                  {suggestedSubjects.map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setSubjectName(sub)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-brand-orange hover:text-white transition cursor-pointer"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location & Hall */}
              <div>
                <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                  Exam Hall / Location (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Block B, Room 304, Seat No. 42"
                  className="w-full px-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Notes / Syllabus coverage */}
              <div>
                <label className="text-xs font-extrabold text-navy-900 dark:text-white block mb-1">
                  Syllabus Coverage / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Unit 1 OSI Model, Unit 2 TCP/IP, Formula derivations..."
                  className="w-full px-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange h-16 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-gray-100 dark:hover:bg-navy-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 transition cursor-pointer"
                >
                  Save to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AcademicCalendarPage;
