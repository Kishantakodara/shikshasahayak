import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Flame, 
  Award, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  CreditCard, 
  Download, 
  Bell, 
  Search,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Sibling {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  school: string;
  streak: number;
  xp: number;
  attendance: number;
}

export default function ParentDashboard() {
  const [activeSibling, setActiveSibling] = useState<string>('sib-1');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sibling List
  const siblings: Sibling[] = [
    { 
      id: 'sib-1', 
      name: 'Aarav Pandey', 
      grade: 'Class 8-A', 
      avatar: 'AP', 
      school: 'ShikshaSahayak Public School', 
      streak: 14, 
      xp: 2450, 
      attendance: 94 
    },
    { 
      id: 'sib-2', 
      name: 'Ananya Pandey', 
      grade: 'Class 11-C', 
      avatar: 'AP', 
      school: 'ShikshaSahayak Public School', 
      streak: 8, 
      xp: 1890, 
      attendance: 98 
    }
  ];

  const currentChild = siblings.find(s => s.id === activeSibling) || siblings[0];

  // Subject Performance Mock
  const subjectsData = activeSibling === 'sib-1' ? [
    { name: 'Mathematics', score: 88, max: 100, status: 'Exemplary' },
    { name: 'Science & Tech', score: 92, max: 100, status: 'Exemplary' },
    { name: 'Social Studies', score: 76, max: 100, status: 'Developing' },
    { name: 'Computer Applications', score: 95, max: 100, status: 'Outstanding' },
  ] : [
    { name: 'Physics', score: 85, max: 100, status: 'Exemplary' },
    { name: 'Chemistry', score: 79, max: 100, status: 'Developing' },
    { name: 'Mathematics', score: 91, max: 100, status: 'Exemplary' },
    { name: 'English Literature', score: 88, max: 100, status: 'Exemplary' },
  ];

  // AI Tutor Interactions Reports
  const aiTutorInteractions = activeSibling === 'sib-1' ? [
    { concept: 'Floyd\'s Cycle Detection Algorithm', date: 'Today, 2:45 PM', questionsAsked: 4, sentiment: 'Highly Engaged' },
    { concept: 'Linear Equations with Two Variables', date: 'Yesterday', questionsAsked: 8, sentiment: 'Resolved' },
    { concept: 'Structure of Human Cell', date: '3 days ago', questionsAsked: 11, sentiment: 'Needs Practice' },
  ] : [
    { concept: 'Organic Chemistry Alkane Isomerism', date: 'Today, 11:15 AM', questionsAsked: 6, sentiment: 'Resolved' },
    { concept: 'Vector Calculations & Dot Product', date: 'Yesterday', questionsAsked: 3, sentiment: 'Highly Engaged' },
    { concept: 'Newtonian Fluid Dynamics Equations', date: '4 days ago', questionsAsked: 14, sentiment: 'Needs Review' },
  ];

  // Fee Details Mock
  const feeRecords = [
    { id: 'fee-1', title: 'Q2 Tuition Fees', amount: '₹18,500', due: 'Paid', date: 'Aug 01, 2026' },
    { id: 'fee-2', title: 'Annual Transportation Fee', amount: '₹6,200', due: 'Pending', date: 'Aug 15, 2026' },
  ];

  // Academic Action Items
  const actionItems = [
    { id: 'act-1', text: 'Sign Permission Slip for Science Museum Field Trip', type: 'signature' },
    { id: 'act-2', text: 'Schedule Teacher-Parent Conference (PTM) for Term 1', type: 'booking' },
    { id: 'act-3', text: 'Approve Campus Coins Rewards Redemptions Request', type: 'reward' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      
      {/* TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            👨‍👩‍👧‍👦 Parent Observatory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
            Real-time insights, academic progress metrics, and school updates for your children.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Child Switcher Pill Tab */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700">
            {siblings.map((sib) => (
              <button
                key={sib.id}
                onClick={() => {
                  setActiveSibling(sib.id);
                  toast.success(`Switched dashboard view to ${sib.name}`);
                }}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeSibling === sib.id
                    ? 'bg-white dark:bg-slate-900 text-[#5B5CEB] shadow-sm border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-bold text-[#5B5CEB]">
                  {sib.avatar}
                </div>
                <span>{sib.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNotificationModal(true)}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 relative cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7C3AED] rounded-full animate-ping" />
          </button>
        </div>
      </div>

      {/* CORE BENTO METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Child Attendance */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#131926]">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Attendance Rate</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400 tracking-tight">
              {currentChild.attendance}%
            </div>
            <p className="text-[10px] text-slate-400 font-bold">Target school average requirement is 90%</p>
          </div>
          <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentChild.attendance}%` }} />
          </div>
        </Card>

        {/* Child Learning Streak */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#131926]">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Learning Streak</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
              <Flame className="h-4 w-4 text-[#5B5CEB]" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black font-display text-[#5B5CEB] tracking-tight">
              {currentChild.streak} Days
            </div>
            <p className="text-[10px] text-slate-400 font-bold">Daily streak multiplier +1.4x active</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full ${
                  i < 5 ? 'bg-gradient-to-r from-[#5B5CEB] to-[#7C3AED]' : 'bg-slate-100 dark:bg-slate-800'
                }`} 
              />
            ))}
          </div>
        </Card>

        {/* Child XP Points */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#131926]">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">XP Accumulated</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
              <Award className="h-4 w-4 text-[#7C3AED]" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black font-display text-[#7C3AED] tracking-tight">
              {currentChild.xp} pts
            </div>
            <p className="text-[10px] text-slate-400 font-bold">Level 12 Scholar rank unlocked</p>
          </div>
          <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-950 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '70%' }} />
          </div>
        </Card>

        {/* Sibling Grade & Standing */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#131926]">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Academic Grade</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black font-display text-amber-600 dark:text-amber-400 tracking-tight">
              {activeSibling === 'sib-1' ? 'A Grade' : 'A+ Grade'}
            </div>
            <p className="text-[10px] text-slate-400 font-bold">Class Standing: Top 5% of cohort</p>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }} />
          </div>
        </Card>

      </div>

      {/* DETAILED CONTENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACADEMICS & REPORT CARD */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Subjects Progress & Performance */}
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-[#131926]">
            <CardHeader className="text-left border-b border-slate-150 dark:border-slate-800/80">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#5B5CEB]" /> Subject Performance Breakdown
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Weekly assessment results and target learning milestones.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {subjectsData.map((sub, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-350">{sub.name}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 dark:text-white">{sub.score} / {sub.max}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        sub.status === 'Outstanding' || sub.status === 'Exemplary'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-[#5B5CEB] dark:text-[#8d8ffd]'
                      }`}>{sub.status}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        sub.status === 'Outstanding' || sub.status === 'Exemplary'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-[#5B5CEB] to-[#7C3AED]'
                      }`} 
                      style={{ width: `${sub.score}%` }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-900/30 p-4 border-t border-slate-150 dark:border-slate-850 flex justify-between rounded-b-3xl">
              <span className="text-[11px] text-slate-400 font-bold">Updated: Today at 4:00 AM</span>
              <Button variant="ghost" size="sm" className="text-xs text-[#5B5CEB] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                View Full Report Card &rarr;
              </Button>
            </CardFooter>
          </Card>

          {/* AI Tutor Summary (Notion-style logs) */}
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-[#131926]">
            <CardHeader className="text-left border-b border-slate-150 dark:border-slate-800/80">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#7C3AED]" /> Child's AI Tutor Activity Summary
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Tailored audit trail tracking self-learning prompts and difficult topics.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {aiTutorInteractions.map((act, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10">
                    <div className="space-y-0.5 text-left">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{act.concept}</h4>
                      <p className="text-[10px] text-slate-400">Queried: {act.date} • {act.questionsAsked} prompts</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                      act.sentiment === 'Highly Engaged'
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#a855f7]'
                        : act.sentiment === 'Resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    }`}>{act.sentiment}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: ACTION ITEMS & SCHOOL BILLING */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Parents Action Board */}
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-[#131926]">
            <CardHeader className="text-left border-b border-slate-150 dark:border-slate-800/80">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-[#5B5CEB]" /> Parent Action Center
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {actionItems.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-left">
                  <div className="p-1 bg-white dark:bg-slate-800 border rounded-md mt-0.5 text-slate-400 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-350 font-bold leading-normal truncate-2-lines">{item.text}</p>
                    <button
                      onClick={() => {
                        toast.success('Action item completed!');
                      }}
                      className="px-2.5 py-1 bg-[#5B5CEB] hover:bg-[#4b4acb] text-white font-extrabold text-[9px] rounded-lg shadow-sm cursor-pointer"
                    >
                      Process & Sign
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Billing & Fees Portal */}
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-[#131926]">
            <CardHeader className="text-left border-b border-slate-150 dark:border-slate-800/80">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#7C3AED]" /> Fees & Bills Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {feeRecords.map((fee) => (
                <div key={fee.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-left">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{fee.title}</h4>
                    <span className="text-[10px] text-slate-400">Due Date: {fee.date}</span>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white">{fee.amount}</div>
                    <button
                      onClick={() => {
                        if (fee.due === 'Paid') {
                          toast.success('Downloading fee receipt PDF...');
                        } else {
                          toast.success('Opening payment gateway portal...');
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold block cursor-pointer transition-colors ${
                        fee.due === 'Paid' 
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200' 
                          : 'bg-[#5B5CEB] hover:bg-[#4b4acb] text-white shadow-sm'
                      }`}
                    >
                      {fee.due === 'Paid' ? 'Receipt 📥' : 'Pay Now'}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Live School Notifications Overlay modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="h-5 w-5 text-[#5B5CEB]" /> School Notice Board
              </h3>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-left max-h-[300px] overflow-y-auto">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100/60 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-[#5B5CEB]">Aug 02, 2026:</span>
                <h4 className="font-bold text-slate-900 dark:text-white mt-0.5">Term 1 Examination Syllabus Released</h4>
                <p className="text-slate-500 mt-1">Class 8 term exams start September 10th. Syllabus guidelines can be downloaded via the student portal dashboard.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100/60 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-[#5B5CEB]">Jul 28, 2026:</span>
                <h4 className="font-bold text-slate-900 dark:text-white mt-0.5">Annual Science Project Exhibition</h4>
                <p className="text-slate-500 mt-1">Parents are cordially invited to review student projects in the main library auditorium on August 20th.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
