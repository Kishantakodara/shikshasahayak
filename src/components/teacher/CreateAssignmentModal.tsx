import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Upload, Calendar, Clock, FileText, Trash2, GripVertical } from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';

const QuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
  question_type: z.enum(['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'FILE_UPLOAD', 'CODE']),
  max_marks: z.number().min(0.1, 'Max marks must be greater than 0'),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  required: z.boolean().default(true),
});

const CreateAssignmentSchema = z.object({
  class_id: z.string().min(1, 'Class is required'),
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  total_marks: z.number().min(0.1, 'Total marks must be greater than 0'),
  due_date: z.string().min(1, 'Due date is required'),
  allow_late_submission: z.boolean().default(true),
  late_penalty_percent: z.number().min(0).max(100).optional(),
  max_file_size_mb: z.number().min(0.1).optional(),
  allowed_file_types: z.array(z.string()).optional(),
  questions: z.array(QuestionSchema).optional(),
});

type CreateAssignmentFormData = z.infer<typeof CreateAssignmentSchema>;
type CreateAssignmentFormInput = z.input<typeof CreateAssignmentSchema>;

interface CreateAssignmentModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  classId?: string;
  teacherClasses: Array<{ id: string; name: string; section?: string | null }>;
}

const questionTypes = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
  { value: 'FILE_UPLOAD', label: 'File Upload' },
  { value: 'CODE', label: 'Code Submission' },
];

const commonFileTypes = [
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  'jpg', 'jpeg', 'png', 'gif',
  'zip', 'rar', '7z',
  'ppt', 'pptx', 'xls', 'xlsx'
];

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  classId,
  teacherClasses
}) => {
  const isModalOpen = isOpen ?? open ?? false;

  const handleClose = (newOpenState?: boolean) => {
    onClose?.();
    onOpenChange?.(typeof newOpenState === 'boolean' ? newOpenState : false);
  };
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'settings'>('basic');

  const form = useForm<CreateAssignmentFormInput>({
    resolver: zodResolver(CreateAssignmentSchema),
    defaultValues: {
      class_id: classId || '',
      title: '',
      description: '',
      instructions: '',
      total_marks: 100,
      due_date: '',
      allow_late_submission: true,
      late_penalty_percent: 10,
      max_file_size_mb: 10,
      allowed_file_types: ['pdf', 'doc', 'docx'],
      questions: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  // Calculate total marks from questions
  const watchedQuestions = form.watch('questions') || [];
  const calculatedTotalMarks = watchedQuestions.reduce((sum, q) => sum + (q.max_marks || 0), 0);

  const createAssignmentMutation = useMutation({
    mutationFn: teacherClient.createAssignment,
    onSuccess: () => {
      toast.success('Assignment created successfully');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      handleClose(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assignment');
    },
  });

  const handleSubmit = (data: CreateAssignmentFormInput) => {
    // Use calculated total marks if questions exist
    const finalData = {
      ...data,
      total_marks: calculatedTotalMarks > 0 ? calculatedTotalMarks : data.total_marks,
    };
    createAssignmentMutation.mutate(finalData as CreateAssignmentFormData);
  };

  const addQuestion = () => {
    append({
      question_text: '',
      question_type: 'SHORT_ANSWER',
      max_marks: 10,
      options: [],
      correct_answer: '',
      required: true,
    });
    setActiveTab('questions');
  };

  const addMCQOption = (questionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`) || [];
    form.setValue(`questions.${questionIndex}.options`, [...currentOptions, '']);
  };

  const removeMCQOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`) || [];
    const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
    form.setValue(`questions.${questionIndex}.options`, newOptions);
  };

  // Set minimum due date to current time + 1 hour
  const minDueDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  useEffect(() => {
    if (isModalOpen && !form.getValues('due_date')) {
      const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      form.setValue('due_date', defaultDueDate.toISOString().slice(0, 16));
    }
  }, [isModalOpen, form]);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="questions">Questions ({fields.length})</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class_id">Class *</Label>
                  <Select
                    value={form.watch('class_id')}
                    onValueChange={(value) => form.setValue('class_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.section && `- Section ${cls.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.class_id && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.class_id.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    type="datetime-local"
                    min={minDueDate}
                    {...form.register('due_date')}
                  />
                  {form.formState.errors.due_date && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.due_date.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  placeholder="Enter assignment title"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  placeholder="Brief description of the assignment"
                  rows={3}
                  {...form.register('description')}
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  placeholder="Detailed instructions for students"
                  rows={6}
                  {...form.register('instructions')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_marks">Total Marks *</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.5"
                    {...form.register('total_marks', { valueAsNumber: true })}
                  />
                  {calculatedTotalMarks > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      Questions total: {calculatedTotalMarks} marks
                    </p>
                  )}
                  {form.formState.errors.total_marks && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.total_marks.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addQuestion}
                      className="w-full border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Questions
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Assignment Questions</h3>
                  <Button
                    type="button"
                    onClick={addQuestion}
                    size="sm"
                    className="bg-brand-orange hover:bg-brand-orange/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No questions added yet</p>
                      <Button
                        type="button"
                        onClick={addQuestion}
                        variant="outline"
                        className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Question
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const questionType = form.watch(`questions.${index}.question_type`);
                      const options = form.watch(`questions.${index}.options`) || [];
                      
                      return (
                        <Card key={field.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Question Type *</Label>
                                <Select
                                  value={questionType}
                                  onValueChange={(value) => form.setValue(`questions.${index}.question_type`, value as any)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {questionTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Max Marks *</Label>
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="0.5"
                                  {...form.register(`questions.${index}.max_marks`, { valueAsNumber: true })}
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Question Text *</Label>
                              <Textarea
                                placeholder="Enter your question"
                                rows={3}
                                {...form.register(`questions.${index}.question_text`)}
                              />
                            </div>

                            {questionType === 'MCQ' && (
                              <div>
                                <Label>Options</Label>
                                <div className="space-y-2">
                                  {options.map((_, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                      <Input
                                        placeholder={`Option ${optionIndex + 1}`}
                                        value={form.watch(`questions.${index}.options.${optionIndex}`) || ''}
                                        onChange={(e) => {
                                          const currentOptions = form.getValues(`questions.${index}.options`) || [];
                                          currentOptions[optionIndex] = e.target.value;
                                          form.setValue(`questions.${index}.options`, currentOptions);
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeMCQOption(index, optionIndex)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addMCQOption(index)}
                                    className="w-full"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Option
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={form.watch(`questions.${index}.required`)}
                                onCheckedChange={(checked) => form.setValue(`questions.${index}.required`, checked)}
                              />
                              <Label className="text-sm">Required question</Label>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="flex-1 overflow-y-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Allow Late Submissions</Label>
                      <p className="text-sm text-gray-600">Students can submit after the due date</p>
                    </div>
                    <Switch
                      checked={form.watch('allow_late_submission')}
                      onCheckedChange={(checked) => form.setValue('allow_late_submission', checked)}
                    />
                  </div>

                  {form.watch('allow_late_submission') && (
                    <div>
                      <Label htmlFor="late_penalty_percent">Late Penalty (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...form.register('late_penalty_percent', { valueAsNumber: true })}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="max_file_size_mb">Max File Size (MB)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      {...form.register('max_file_size_mb', { valueAsNumber: true })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Allowed File Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {commonFileTypes.map((fileType) => {
                      const selectedTypes = form.watch('allowed_file_types') || [];
                      const isSelected = selectedTypes.includes(fileType);
                      
                      return (
                        <Button
                          key={fileType}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`text-xs ${isSelected ? 'bg-brand-orange hover:bg-brand-orange/90' : 'hover:border-brand-orange hover:text-brand-orange'}`}
                          onClick={() => {
                            const currentTypes = selectedTypes.filter(t => t !== fileType);
                            if (!isSelected) {
                              currentTypes.push(fileType);
                            }
                            form.setValue('allowed_file_types', currentTypes);
                          }}
                        >
                          {fileType.toUpperCase()}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="text-sm text-gray-500">
              {calculatedTotalMarks > 0 && (
                <span>Total Questions: {fields.length} • Total Marks: {calculatedTotalMarks}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAssignmentMutation.isPending}
                className="bg-brand-orange hover:bg-brand-orange/90"
              >
                {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};