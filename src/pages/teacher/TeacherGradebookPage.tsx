import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Plus } from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { GradebookGrid } from '../../components/teacher/GradebookGrid';
import { CreateClassModal } from '../../components/teacher/CreateClassModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';

export default function TeacherGradebookPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false);

  // Fetch teacher classes
  const { data: classesResponse, isLoading } = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherClient.getClasses(),
  });
  const classes = classesResponse?.classes || [];

  useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.some(c => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Class Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-navy-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-orange" />
            Grading & Results Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Spreadsheet view of student evaluations, class averages, and grade exports
          </p>
        </div>

        {classes.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Select Class:</span>
            <Select 
              value={selectedClassId} 
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="w-full sm:w-56 bg-white dark:bg-navy-900">
                <SelectValue placeholder="Choose a class" />
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
      </div>

      {/* Main Gradebook Grid Component */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading Gradebook...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-8 space-y-4">
          <Award className="w-12 h-12 text-brand-orange mx-auto" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Classes Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Create a class first to view student gradebook matrix and grade analytics.
          </p>
          <Button
            onClick={() => setCreateClassModalOpen(true)}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Class
          </Button>
        </div>
      ) : (
        <GradebookGrid classId={selectedClassId || classes[0].id} />
      )}

      <CreateClassModal
        open={createClassModalOpen}
        onClose={() => setCreateClassModalOpen(false)}
        onOpenChange={setCreateClassModalOpen}
      />

    </div>
  );
}
