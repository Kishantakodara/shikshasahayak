import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Image as ImageIcon, Sparkles, CheckCircle2, Copy, Users, ArrowRight } from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { CreateClassSchema, type CreateClassDTO, GradingSystem } from '../../types/teacher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';

interface CreateClassModalProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

type CreateClassFormInput = z.input<typeof CreateClassSchema>;

/**
 * CreateClassModal Component
 * 
 * Modal form for creating a new class with immediate Join Code display
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export const CreateClassModal: React.FC<CreateClassModalProps> = ({ open, onClose, onOpenChange }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createdClassResult, setCreatedClassResult] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateClassFormInput>({
    resolver: zodResolver(CreateClassSchema),
    defaultValues: {
      grading_system: GradingSystem.PERCENTAGE,
      max_students: 50,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClassDTO) => teacherClient.createClass(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'overview'] });
      const newClass = res?.class || res;
      const className = newClass?.name || 'Class';
      const code = newClass?.join_code || newClass?.joinCode || '';
      toast.success(`Class "${className}" created! Join Code: ${code}`);
      setCreatedClassResult(newClass);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create class: ${error.message}`);
    },
  });

  const onSubmit = (data: CreateClassFormInput) => {
    let formattedAcademicYear: string | undefined = undefined;
    if (data.academic_year?.trim()) {
      const match = data.academic_year.trim().match(/^(\d{4})-(\d{2,4})$/);
      if (match) {
        formattedAcademicYear = `${match[1]}-${match[2].slice(-2)}`;
      } else {
        formattedAcademicYear = data.academic_year.trim();
      }
    }

    const payload: CreateClassDTO = {
      name: data.name.trim(),
      grading_system: data.grading_system || GradingSystem.PERCENTAGE,
      max_students: (typeof data.max_students === 'number' && !isNaN(data.max_students) && data.max_students > 0) ? data.max_students : 50,
      subject_id: data.subject_id || undefined,
      semester: data.semester ? Number(data.semester) : undefined,
      section: data.section?.trim() ? data.section.trim() : undefined,
      description: data.description?.trim() ? data.description.trim() : undefined,
      academic_year: formattedAcademicYear,
      cover_image: data.cover_image?.trim() ? data.cover_image.trim() : undefined,
    };
    createMutation.mutate(payload);
  };

  const handleClose = (newOpenState?: boolean) => {
    if (!isSubmitting) {
      setCreatedClassResult(null);
      reset({
        grading_system: GradingSystem.PERCENTAGE,
        max_students: 50,
      });
      onClose?.();
      onOpenChange?.(typeof newOpenState === 'boolean' ? newOpenState : false);
    }
  };

  const gradingSystem = watch('grading_system');
  const semesterValue = watch('semester');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-6 shadow-2xl">
        {createdClassResult ? (
          /* Class Creation Success View with Join Code */
          <div className="py-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-navy-900 dark:text-white font-display">
                Class Created Successfully! 🎉
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Your classroom batch <span className="font-bold text-navy-900 dark:text-white">"{createdClassResult.name}"</span> is ready. Share the Join Code with students so they can enroll.
              </p>
            </div>

            {/* Generated Join Code Display Box */}
            <div className="p-6 bg-gradient-to-br from-navy-900 via-navy-850 to-navy-800 rounded-3xl border border-brand-orange/40 text-white space-y-4 shadow-xl">
              <div className="text-xs text-brand-orange font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Student Join Code
              </div>

              <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-brand-orange select-all py-1">
                {createdClassResult.join_code || createdClassResult.joinCode}
              </div>

              <p className="text-xs text-gray-300">
                Students can enter this code in their student portal to join this class batch.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    const code = createdClassResult.join_code || createdClassResult.joinCode;
                    navigator.clipboard.writeText(code);
                    toast.success(`Join Code "${code}" copied!`);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </Button>

                <Button
                  onClick={() => {
                    const code = createdClassResult.join_code || createdClassResult.joinCode;
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://beta.shikshasahayak.org';
                    const link = `${baseUrl}/login?joinCode=${encodeURIComponent(code)}`;
                    navigator.clipboard.writeText(link);
                    toast.success('Student Invite Link copied to clipboard!');
                  }}
                  size="sm"
                  className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold gap-2 shadow-md"
                >
                  <Users className="w-3.5 h-3.5" /> Copy Student Invite Link
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-navy-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                className="text-xs font-bold"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const classId = createdClassResult.id;
                  handleClose(false);
                  if (classId) {
                    navigate(`/teacher/classes/${classId}`);
                  }
                }}
                className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold gap-2 shadow-md cursor-pointer"
              >
                <span>Go to Class</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Create New Class</DialogTitle>
              <DialogDescription>
                Set up a new classroom for your students. A unique join code will be generated automatically.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Class Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="required">
              Class Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Advanced Web Development"
              className="w-full"
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the class content and objectives..."
              rows={3}
              className="w-full resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Section and Semester - Two columns on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section (Optional)</Label>
              <Input
                id="section"
                {...register('section')}
                placeholder="e.g., A, B, C (Optional)"
                className="w-full"
              />
              {errors.section && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.section.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={semesterValue ? semesterValue.toString() : ''}
                onValueChange={(value) => setValue('semester', parseInt(value), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.semester && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.semester.message}</p>
              )}
            </div>
          </div>

          {/* Academic Year and Grading System */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academic_year">Academic Year</Label>
              <Input
                id="academic_year"
                {...register('academic_year')}
                placeholder="e.g., 2026-27"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Format: YYYY-YY (e.g. 2026-27 or 2026-2027)</p>
              {errors.academic_year && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.academic_year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grading_system">Grading System <span className="text-red-500">*</span></Label>
              <Select
                value={gradingSystem || GradingSystem.PERCENTAGE}
                onValueChange={(value) => setValue('grading_system', value as GradingSystem, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (0-100%)</SelectItem>
                  <SelectItem value="GPA">GPA (0.0-10.0)</SelectItem>
                  <SelectItem value="LETTER">Letter Grades (A-F)</SelectItem>
                  <SelectItem value="PASS_FAIL">Pass/Fail</SelectItem>
                </SelectContent>
              </Select>
              {errors.grading_system && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.grading_system.message}</p>
              )}
            </div>
          </div>

          {/* Max Students */}
          <div className="space-y-2">
            <Label htmlFor="max_students">Maximum Students</Label>
            <Input
              id="max_students"
              type="number"
              {...register('max_students', { valueAsNumber: true })}
              placeholder="50"
              min={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of students allowed in this class
            </p>
            {errors.max_students && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.max_students.message}</p>
            )}
          </div>

          {/* Cover Image URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="cover_image">Cover Image URL (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="cover_image"
                {...register('cover_image')}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" disabled>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Provide a URL to a cover image for your class card
            </p>
            {errors.cover_image && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.cover_image.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-orange hover:bg-brand-hover text-white gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Class'
              )}
            </Button>
          </div>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
};
