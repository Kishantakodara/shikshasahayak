import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  BarChart4
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface StudentResult {
  id: string;
  name: string;
  rollNo: string;
  classBatch: string;
  internal: number;
  quiz: number;
  assignment: number;
  midterm: number;
  totalPercent: number;
  grade: string;
}

import { useQuery } from '@tanstack/react-query';
import { teacherClient } from '../../api/teacherClient';

export default function TeacherResultsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const { data: apiData } = useQuery({
    queryKey: ['teacher', 'students'],
    queryFn: () => teacherClient.getStudents().catch(() => ({ students: [], count: 0 })),
  });

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherClient.getClasses().catch(() => ({ classes: [] })),
  });

  const classList: any[] = classesData?.classes || [];

  const results: StudentResult[] = (apiData?.students || []).map((s: any) => ({
    id: s.id || s.student_id,
    name: s.display_name || s.name || 'Student',
    rollNo: s.roll_no || s.student_id?.substring(0, 8) || 'N/A',
    classBatch: s.class_name || 'Assigned Batch',
    internal: s.internal || 0,
    quiz: s.quiz || 0,
    assignment: s.assignment || 0,
    midterm: s.midterm || 0,
    totalPercent: s.avg_marks || 0,
    grade: s.grade || 'A'
  }));

  const avgMarks = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.totalPercent, 0) / results.length) : 0;
  const highestMarks = results.length > 0 ? Math.max(...results.map(r => r.totalPercent)) : 0;
  const lowestMarks = results.length > 0 ? Math.min(...results.map(r => r.totalPercent)) : 0;
  const passPercent = results.length > 0 ? Math.round((results.filter(r => r.totalPercent >= 40).length / results.length) * 100) : 0;

  const filteredResults = results.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || r.classBatch.includes(classFilter);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart2 className="w-4 h-4" /> Academic Analytics
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">8. Results & Performance</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Analyze class averages, exam marks, grade distribution, and individual student progress reports.
          </p>
        </div>

        <Button 
          onClick={() => toast.success('Exporting full marksheet spreadsheet...')}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs gap-2"
        >
          <Download className="w-4 h-4" /> Export Marksheet
        </Button>
      </div>

      {/* Top 4 Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Average Score</span>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{avgMarks}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Class Average
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Highest Score</span>
          <p className="text-2xl font-black text-emerald-600">{highestMarks}%</p>
          <p className="text-[11px] text-gray-400">Class Topper</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Lowest Score</span>
          <p className="text-2xl font-black text-rose-500">{lowestMarks}%</p>
          <p className="text-[11px] text-gray-400">Needs Support</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Passing Rate</span>
          <p className="text-2xl font-black text-blue-500">{passPercent}%</p>
          <p className="text-[11px] text-blue-500 font-semibold">Target: 85%+</p>
        </div>
      </div>

      {/* 2 Side-by-Side Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Visual Chart */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <BarChart4 className="w-4 h-4 text-brand-orange" /> Class Performance Overview
          </h3>
          {classList.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No classes configured yet.</p>
          ) : (
            <div className="space-y-3">
              {classList.map((cls: any, i: number) => {
                const colors = ['bg-brand-orange', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500'];
                return (
                  <div key={cls.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{cls.name}</span>
                      <span className="font-bold">{cls.student_count || 0} Students</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-navy-950 rounded-full h-2">
                      <div className={`${colors[i % colors.length]} h-2 rounded-full`} style={{ width: `100%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Assessments List */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-orange" /> Recent Assessments Summary
          </h3>
          <div className="space-y-3 text-xs">
            {classList.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No active classroom evaluations logged.</p>
            ) : (
              classList.map((cls: any) => (
                <div key={cls.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-navy-950 rounded-xl border border-gray-100 dark:border-navy-800">
                  <span className="font-bold text-navy-900 dark:text-white truncate">{cls.name}</span>
                  <span className="font-black text-brand-orange">Active</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Classes</option>
          {classList.map((cls: any) => (
            <option key={cls.id} value={cls.name}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Results Table (Matching Reference Image 8) */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-navy-950 text-gray-400 uppercase font-bold border-b border-gray-100 dark:border-navy-800">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Roll No.</th>
                <th className="p-4">Internal (30)</th>
                <th className="p-4">Quiz (20)</th>
                <th className="p-4">Assignment (20)</th>
                <th className="p-4">Midterm (30)</th>
                <th className="p-4">Total %</th>
                <th className="p-4">Grade</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800 text-gray-700 dark:text-gray-300 font-medium">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold">
                    No student evaluation or result records found in database.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition">
                  <td className="p-4 font-bold text-navy-900 dark:text-white">{r.name}</td>
                  <td className="p-4 font-mono font-bold text-brand-orange">{r.rollNo}</td>
                  <td className="p-4">{r.internal}</td>
                  <td className="p-4">{r.quiz}</td>
                  <td className="p-4">{r.assignment}</td>
                  <td className="p-4">{r.midterm}</td>
                  <td className="p-4 font-black text-navy-900 dark:text-white">{r.totalPercent}%</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange font-extrabold text-[10px]">
                      {r.grade}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => toast.info(`Editing marks for ${r.name}`)} className="p-1 text-gray-400 hover:text-brand-orange">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
