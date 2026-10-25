import React, { useState, useEffect } from 'react';
import { Plus, Search, Book, Clock, Award, Eye, EyeOff, Trash2 } from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';

interface QuizAssignmentPanelProps {
  classId: string;
}

export const QuizAssignmentPanel: React.FC<QuizAssignmentPanelProps> = ({ classId }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  
  // Filters for available quizzes
  const [filters, setFilters] = useState<{
    subjects: string[];
    categories: string[];
    difficulties: string[];
  }>({ subjects: [], categories: [], difficulties: [] });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  // Load quiz assignments for the class
  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await teacherClient.getClassQuizAssignments(classId);
      setAssignments(data.assignments || []);
    } catch (error: any) {
      console.error('Failed to load quiz assignments:', error);
      toast.error(error.message || "Failed to load quiz assignments");
    } finally {
      setLoading(false);
    }
  };

  // Load available quizzes for assignment
  const loadAvailableQuizzes = async () => {
    try {
      const params: any = {
        class_id: classId,
        search: searchQuery || undefined,
        subject: selectedSubject || undefined,
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
      };
      
      const data = await teacherClient.getAvailableQuizzes(params);
      setAvailableQuizzes(data.quizzes || []);
      if (data.filters) {
        setFilters(data.filters);
      }
    } catch (error: any) {
      console.error('Failed to load available quizzes:', error);
      toast.error(error.message || "Failed to load available quizzes");
    }
  };

  // Assign quiz to class
  const assignQuiz = async (quizId: string) => {
    try {
      await teacherClient.assignQuizToClass(classId, {
        quiz_id: quizId,
        is_visible: true,
      });
      
      toast.success("Quiz assigned to class successfully");
      
      setAssignModalOpen(false);
      loadAssignments();
      loadAvailableQuizzes(); // Refresh to remove assigned quiz from available list
    } catch (error: any) {
      console.error('Failed to assign quiz:', error);
      toast.error(error.message || "Failed to assign quiz to class");
    }
  };

  // Toggle quiz visibility
  const toggleVisibility = async (assignmentId: string, currentVisibility: boolean) => {
    try {
      await teacherClient.updateQuizAssignment(classId, assignmentId, {
        is_visible: !currentVisibility,
      });
      
      toast.success(`Quiz ${!currentVisibility ? 'shown to' : 'hidden from'} students`);
      
      loadAssignments();
    } catch (error: any) {
      console.error('Failed to update quiz visibility:', error);
      toast.error(error.message || "Failed to update quiz visibility");
    }
  };

  // Remove quiz assignment
  const removeAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this quiz assignment?')) return;
    
    try {
      await teacherClient.removeQuizAssignment(classId, assignmentId);
      
      toast.success("Quiz assignment removed successfully");
      
      loadAssignments();
      loadAvailableQuizzes(); // Refresh to add quiz back to available list
    } catch (error: any) {
      console.error('Failed to remove quiz assignment:', error);
      toast.error(error.message || "Failed to remove quiz assignment");
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  useEffect(() => {
    if (assignModalOpen) {
      loadAvailableQuizzes();
    }
  }, [assignModalOpen, searchQuery, selectedSubject, selectedCategory, selectedDifficulty]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';  
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quiz Assignments</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage quiz assignments for this class
          </p>
        </div>
        
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-orange hover:bg-brand-orange/90">
              <Plus className="w-4 h-4 mr-2" />
              Assign Quiz
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Quiz to Class</DialogTitle>
            </DialogHeader>
            
            {/* Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subjects</SelectItem>
                      {filters.subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {filters.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      {filters.difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Available Quizzes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableQuizzes.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No quizzes available for assignment</p>
                  </div>
                ) : (
                  availableQuizzes.map((quiz) => (
                    <Card key={quiz.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm line-clamp-2">{quiz.title}</CardTitle>
                          <Badge className={getDifficultyColor(quiz.difficulty)}>
                            {quiz.difficulty}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {quiz.subject} • {quiz.category}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {quiz.duration}m
                            </span>
                            <span className="flex items-center gap-1">
                              <Book className="w-3 h-3" />
                              {quiz.total_questions}Q
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {quiz.xp_reward}XP
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full bg-brand-orange hover:bg-brand-orange/90"
                          onClick={() => assignQuiz(quiz.id)}
                        >
                          Assign to Class
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz Assignments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading quiz assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No quiz assignments yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Assign quizzes to your class to get started
              </p>
              <Button
                variant="outline"
                className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white"
                onClick={() => setAssignModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.assignment_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm line-clamp-2">{assignment.quiz_title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(assignment.difficulty)}>
                        {assignment.difficulty}
                      </Badge>
                      {assignment.is_visible ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {assignment.subject} • {assignment.category}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {assignment.duration}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {assignment.xp_reward}XP
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      {assignment.total_attempts} attempts • {assignment.completed_attempts} completed
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleVisibility(assignment.assignment_id, assignment.is_visible)}
                        className="px-2 py-1 h-7"
                      >
                        {assignment.is_visible ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeAssignment(assignment.assignment_id)}
                        className="px-2 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};