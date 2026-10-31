import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  HelpCircle, 
  BookOpen, 
  Eye, 
  Edit, 
  Trash2,
  Sparkles,
  Layers
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface QuestionItem {
  id: string;
  question: string;
  subject: string;
  type: 'MCQ' | 'Descriptive' | 'Subjective' | 'Numerical';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const DEFAULT_QUESTIONS: QuestionItem[] = [];

export default function TeacherQuestionBankPage() {
  const { currentUser } = useAuth();
  const storageKey = `shiksha_teacher_question_bank_${currentUser?.uid || 'guest'}`;

  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [newQuestion, setNewQuestion] = useState('');
  const [newSubject, setNewSubject] = useState('Power Electronics');
  const [newType, setNewType] = useState<'MCQ' | 'Descriptive' | 'Subjective' | 'Numerical'>('MCQ');
  const [newDifficulty, setNewDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(questions));
    } catch {
      // ignore
    }
  }, [questions, storageKey]);

  // Real dynamic counts computed from state
  const totalQuestions = questions.length;
  const mcqCount = questions.filter(q => q.type === 'MCQ').length;
  const descriptiveCount = questions.filter(q => q.type === 'Descriptive').length;
  const subjectiveCount = questions.filter(q => q.type === 'Subjective' || q.type === 'Numerical').length;

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) || q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || q.type === typeFilter;
    const matchesDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesType && matchesDiff;
  });

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      toast.error('Question text is required');
      return;
    }
    const created: QuestionItem = {
      id: `q_${Date.now()}`,
      question: newQuestion.trim(),
      subject: newSubject,
      type: newType,
      difficulty: newDifficulty,
    };
    setQuestions([created, ...questions]);
    setAddModalOpen(false);
    setNewQuestion('');
    toast.success('Question added to Question Bank!');
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success('Question removed from bank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" /> Assessment Repository
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">Question Bank</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Repository of MCQs, descriptive questions, numerical problems, and PYQ sets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => toast.info('Question bank export downloaded')} variant="outline" className="text-xs border-gray-200 dark:border-navy-700">
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
          <Button onClick={() => setAddModalOpen(true)} className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        </div>
      </div>

      {/* Top 4 Stats (Computed dynamically) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Total Questions</span>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{totalQuestions.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400">Available bank</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">MCQs</span>
          <p className="text-2xl font-black text-brand-orange">{mcqCount}</p>
          <p className="text-[11px] text-brand-orange font-semibold">Multiple Choice</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Descriptive</span>
          <p className="text-2xl font-black text-blue-500">{descriptiveCount}</p>
          <p className="text-[11px] text-gray-400">Theory & Explanation</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Subjective / Numerical</span>
          <p className="text-2xl font-black text-purple-500">{subjectiveCount}</p>
          <p className="text-[11px] text-gray-400">Calculations & Derivations</p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search questions by keyword or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Types</option>
            <option value="MCQ">MCQ</option>
            <option value="Descriptive">Descriptive</option>
            <option value="Subjective">Subjective</option>
            <option value="Numerical">Numerical</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Question Bank Table */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs overflow-hidden">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-navy-900 dark:text-white">No questions found</p>
            <p className="text-[11px] text-gray-400 mt-1">Try adjusting your filters or click 'Add Question' to contribute.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-navy-950 text-gray-400 uppercase font-bold border-b border-gray-100 dark:border-navy-800">
                <tr>
                  <th className="p-4">Question</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800 text-gray-700 dark:text-gray-300 font-medium">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition">
                    <td className="p-4 font-bold text-navy-900 dark:text-white max-w-md">{q.question}</td>
                    <td className="p-4 text-brand-orange font-bold">{q.subject}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 font-bold text-[10px]">
                        {q.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        q.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => toast.success('Added to current Quiz!')} variant="outline" className="text-[10px] py-1 px-2">
                          + Add to Quiz
                        </Button>
                        <button 
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Add Question */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200 dark:border-navy-800 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" /> Add Question to Bank
            </h3>
            <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Question Text</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter full question text..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Subject</label>
                <select 
                  value={newSubject} 
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="Power Electronics">Power Electronics</option>
                  <option value="Power System">Power System</option>
                  <option value="Control System">Control System</option>
                  <option value="Electrical Machines">Electrical Machines</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="Computer Networks">Computer Networks</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Question Type</label>
                  <select 
                    value={newType} 
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="Descriptive">Descriptive</option>
                    <option value="Subjective">Subjective</option>
                    <option value="Numerical">Numerical</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Difficulty</label>
                  <select 
                    value={newDifficulty} 
                    onChange={(e: any) => setNewDifficulty(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold">
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
