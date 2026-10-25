import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, AlertCircle, FileSpreadsheet, MessageSquare, CreditCard } from 'lucide-react';

export const ParentPortalPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/national/parent?parentId=prnt_101')
      .then(res => res.json())
      .then((res: any) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading Parent Portal Insights...
      </div>
    );
  }

  const { student, attendance, examMarks, feeStatus, teacherMessages } = data || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 to-navy-950 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-sm font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Parent Monitoring Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{student?.name || 'Student'}'s Academic Overview</h1>
          <p className="text-blue-200 text-sm mt-1">
            Roll No: {student?.rollNumber} • {student?.branch} (Semester {student?.semester})
          </p>
        </div>

        <div className="flex items-center gap-3 bg-navy-900/80 px-4 py-2 rounded-xl border border-navy-700">
          <div className="text-right">
            <div className="text-xs text-gray-400">Fee Status</div>
            <div className={`text-xs font-bold ${feeStatus?.status === 'PAID' ? 'text-green-400' : 'text-amber-400'}`}>
              {feeStatus?.status} (₹{feeStatus?.pendingAmount} Due)
            </div>
          </div>
          <CreditCard className="w-5 h-5 text-brand-orange" />
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-navy-900 dark:text-white">{attendance?.overallPercentage}%</div>
            <span className="text-xs text-green-600 font-bold">GTU Criteria Met</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-navy-900 h-2.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${attendance?.overallPercentage}%` }} />
          </div>
        </div>

        {/* Mid-Sem Exam Marks */}
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic Marks</span>
            <FileSpreadsheet className="w-5 h-5 text-brand-orange" />
          </div>
          <div className="space-y-2">
            {examMarks?.map((mark: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs font-medium border-b dark:border-navy-700 pb-1.5">
                <span className="text-navy-900 dark:text-gray-200">{mark.subject}</span>
                <span className="font-bold text-brand-orange">{mark.marksObtained} / {mark.totalMarks}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Communication */}
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Notes</span>
            <MessageSquare className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3">
            {teacherMessages?.map((msg: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-navy-900 dark:text-white">
                  <span>{msg.teacherName}</span>
                  <span className="text-gray-400 font-normal">{msg.date}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentPortalPage;
