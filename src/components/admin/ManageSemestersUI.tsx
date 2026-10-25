import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Calendar, Loader2, BookOpen, ChevronRight, Award
} from 'lucide-react';

interface SemesterStat {
  semester: number;
  subjectCount: number;
}

const ManageSemestersUI: React.FC = () => {
  const [semesterStats, setSemesterStats] = useState<SemesterStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = async () => {
    try {
      setIsLoading(true);
      const subjects = await apiClient.getSubjects();
      
      const stats: SemesterStat[] = [1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
        const count = subjects.filter((sub: any) => Number(sub.semester_no) === sem).length;
        return { semester: sem, subjectCount: count };
      });
      
      setSemesterStats(stats);
    } catch (error) {
      console.error('Failed to calculate semester stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Semester Management
        </h2>
        <p className="text-sm text-muted mt-1 font-semibold">
          Analyze and inspect academic course semesters (Sem 1 to Sem 8) mapping status.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Semester Catalog Summary
          </h3>
          <p className="text-sm text-muted mt-2 font-medium leading-relaxed">
            Semesters are schema-enforced constraints (1 to 12) inside the ShikshaSahayak database. Rather than being independently editable tables, they serve as indexing partitions to filter and structure subjects, study guides, and previous year question papers.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <span className="text-sm text-muted font-bold">Aggregating semester metrics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {semesterStats.map((stat) => (
              <div 
                key={stat.semester}
                className="p-5 rounded-xl border border-border bg-surface-secondary/50 hover:bg-surface-secondary transition-all flex flex-col justify-between h-36"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Academic Step</span>
                  <h4 className="font-bold text-text text-lg mt-1">Semester {stat.semester}</h4>
                </div>
                
                <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3">
                  <span className="text-xs text-muted font-bold flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-primary" /> {stat.subjectCount} Subjects
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSemestersUI;
