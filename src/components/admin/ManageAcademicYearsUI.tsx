import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  GraduationCap, Loader2, FileText, ChevronRight, BarChart2
} from 'lucide-react';

interface YearStat {
  year: number;
  documentCount: number;
}

const ManageAcademicYearsUI: React.FC = () => {
  const [yearStats, setYearStats] = useState<YearStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = async () => {
    try {
      setIsLoading(true);
      const materials = await apiClient.getAdminMaterials();
      
      // We will aggregate documents by their paper_year or syllabus_year.
      // If those are not present, they might be in details, or we can check the created_at year
      const countsMap: { [key: number]: number } = {};
      
      // Default list of years to show
      const activeYears = [2021, 2022, 2023, 2024, 2025, 2026];
      activeYears.forEach(y => { countsMap[y] = 0; });

      materials.forEach((m: any) => {
        // Match year from PYQ year, Syllabus year, or created_at
        let year = m.paper_year || m.syllabus_year;
        if (!year && m.created_at) {
          year = new Date(m.created_at).getFullYear();
        }
        if (year && typeof year === 'number') {
          countsMap[year] = (countsMap[year] || 0) + 1;
        } else if (year && typeof year === 'string') {
          const parsed = parseInt(year);
          if (!isNaN(parsed)) {
            countsMap[parsed] = (countsMap[parsed] || 0) + 1;
          }
        }
      });

      const stats: YearStat[] = Object.keys(countsMap)
        .map(key => ({ year: Number(key), documentCount: countsMap[Number(key)] }))
        .sort((a, b) => b.year - a.year);

      setYearStats(stats);
    } catch (error) {
      console.error('Failed to calculate academic year stats:', error);
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
          <GraduationCap className="h-6 w-6 text-primary" /> Academic Year Management
        </h2>
        <p className="text-sm text-muted mt-1 font-semibold">
          Inspect and view document catalog coverage statistics indexed by academic calendar year.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" /> Document Distribution by Year
          </h3>
          <p className="text-sm text-muted mt-2 font-medium leading-relaxed">
            Academic Years index and organize Previous Year Question papers (PYQs) and Curriculum Syllabus documents. They allow students to filter and study content aligned to specific historical exam sessions.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <span className="text-sm text-muted font-bold">Aggregating year metrics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearStats.map((stat) => (
              <div 
                key={stat.year}
                className="p-5 rounded-xl border border-border bg-surface-secondary/50 hover:bg-surface-secondary transition-all flex flex-col justify-between h-36"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Calendar Session</span>
                  <h4 className="font-bold text-text text-lg mt-1">Year {stat.year}</h4>
                </div>
                
                <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3">
                  <span className="text-xs text-muted font-bold flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary" /> {stat.documentCount} Documents
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

export default ManageAcademicYearsUI;
