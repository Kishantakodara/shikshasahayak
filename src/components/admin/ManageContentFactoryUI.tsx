import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Sparkles, 
  Layers, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  Send, 
  Eye, 
  Trash2, 
  Check, 
  ArrowRight,
  HelpCircle,
  Hash,
  ListOrdered,
  BookMarked,
  Zap,
  Filter,
  X,
  ExternalLink,
  Upload,
  FileCode,
  Copy
} from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

const CONTENT_TYPES_CONFIG = [
  { id: 'detailed_notes', label: 'Detailed Notes', icon: BookOpen, desc: 'Comprehensive technical and architectural explanation' },
  { id: 'short_notes', label: 'Short Notes', icon: FileText, desc: 'Crisp revision notes and exam key points' },
  { id: 'definitions', label: 'Definitions & Terms', icon: BookMarked, desc: 'Formal academic definitions and keywords' },
  { id: 'examples', label: 'Real-world Examples', icon: Zap, desc: 'Practical scenarios and applied case studies' },
  { id: 'mcqs', label: 'MCQs', icon: CheckCircle, desc: 'GATE/GTU style multiple-choice questions' },
  { id: 'short_questions', label: 'Short Questions (2-3M)', icon: HelpCircle, desc: 'Conceptual short-answer questions' },
  { id: 'long_questions', label: 'Long Questions (5-7M)', icon: ListOrdered, desc: 'Detailed descriptive and derivation questions' },
  { id: 'numerical_problems', label: 'Numerical Problems', icon: Hash, desc: 'Step-by-step mathematical problems' },
  { id: 'viva_questions', label: 'Viva Voce Questions', icon: HelpCircle, desc: 'Lab exam and practical viva questions' },
  { id: 'quick_revision', label: 'Quick Revision', icon: Zap, desc: 'Last-minute summary, formulas, and pitfalls' },
];

const DEFAULT_TOPICS_SUGGESTIONS = [
  'OSI Model & 7-Layer Architecture',
  'TCP/IP Protocol Suite vs OSI Model',
  'Network Topologies (Bus, Star, Ring, Mesh)',
  'Transmission Media (Guided vs Unguided)',
  'Data Link Layer Framing & Error Detection (CRC)',
  'Sliding Window Protocols (Go-Back-N, Selective Repeat)',
  'IP Addressing & Subnetting (IPv4 & IPv6)',
  'Routing Algorithms (Distance Vector & Link State)',
  'TCP Handshake & Congestion Control',
  'Application Layer Protocols (HTTP, DNS, DHCP)'
];

const SAMPLE_IMPORT_TEMPLATE = JSON.stringify({
  university: "GTU",
  branch: "Computer Engineering",
  semester: 5,
  subject: "Computer Networks",
  unit: 1,
  unit_title: "Introduction to Computer Networks & Physical Layer",
  topic: "OSI Model & 7-Layer Architecture",
  detailedNotes: "The Open Systems Interconnection (OSI) model characterizes and standardizes the communication functions of a telecommunication or computing system without regard to its underlying internal structure and technology...",
  shortNotes: "• 7 Layers from Physical to Application\n• Layer 1-3: Hardware & Network Delivery\n• Layer 4: End-to-End Reliability (TCP/UDP)\n• Layer 5-7: Software Application Support",
  definitions: [
    {
      term: "Encapsulation",
      definition: "The process of appending headers and trailers to protocol data units as they move down the protocol stack."
    }
  ],
  mcqs: [
    {
      question: "Which layer in the OSI model provides end-to-end reliable transmission and flow control?",
      options: ["Network Layer", "Transport Layer", "Data Link Layer", "Session Layer"],
      answer: 1,
      explanation: "The Transport Layer (Layer 4) ensures complete message transfer, segmentation, and flow control."
    }
  ],
  shortQuestions: [
    {
      question: "What is the difference between Layer 2 (Data Link) and Layer 3 (Network) addressing?",
      answer: "Layer 2 uses physical MAC addresses within a single local broadcast domain, whereas Layer 3 uses logical IP addresses for internetwork routing."
    }
  ],
  quickRevision: {
    summaryPoints: ["OSI is conceptual (7 layers), TCP/IP is practical (4 layers)"],
    formulas: ["Propagation Delay = Distance / Speed", "Transmission Delay = Packet Size / Bandwidth"],
    commonMistakes: ["Thinking IP packet routing occurs at Layer 2 instead of Layer 3"]
  }
}, null, 2);

const ManageContentFactoryUI: React.FC = () => {
  // Navigation & View Mode
  const [currentView, setCurrentView] = useState<'import' | 'generate' | 'queue' | 'review'>('import');

  // Import State (MODE A — Google AI Pro Workflow)
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Hierarchy Selection State
  const [university, setUniversity] = useState('gtu');
  const [branchId, setBranchId] = useState('branch_computer');
  const [branchName, setBranchName] = useState('Computer Engineering');
  const [semester, setSemester] = useState(5);
  const [subjectId, setSubjectId] = useState('sub_cn_sem5');
  const [subjectName, setSubjectName] = useState('Computer Networks');
  const [unitNo, setUnitNo] = useState(1);
  const [unitTitle, setUnitTitle] = useState('Introduction to Computer Networks & Physical Layer');

  // Topic Input & Content Types
  const [topicsText, setTopicsText] = useState('OSI Model\nTCP/IP Model\nNetwork Topologies\nTransmission Media');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'detailed_notes',
    'short_notes',
    'definitions',
    'examples',
    'mcqs',
    'short_questions',
    'long_questions',
    'numerical_problems',
    'viva_questions',
    'quick_revision'
  ]);

  // Question counts
  const [mcqCount, setMcqCount] = useState(5);
  const [shortQCount, setShortQCount] = useState(3);
  const [longQCount, setLongQCount] = useState(2);
  const [vivaCount, setVivaCount] = useState(3);
  const [numericalCount, setNumericalCount] = useState(1);

  // Status & List States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ total: number; completed: number; currentTopic?: string } | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editMarkdown, setEditMarkdown] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Items & Jobs
  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getContentFactoryItems(statusFilter ? { status: statusFilter } : undefined);
      setItems(data);
    } catch (err: any) {
      showToast(`Failed to load content items: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await apiClient.getContentFactoryJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadItems();
    loadJobs();
  }, [statusFilter]);

  // Toggle Content Type
  const toggleContentType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  // Handle Manual/Batch JSON Import (MODE A)
  const handleImportSubmit = async () => {
    if (!importJsonText.trim()) {
      showToast('Please paste valid structured JSON content to import.');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(importJsonText);
    } catch (err: any) {
      showToast(`Invalid JSON format: ${err.message}`);
      return;
    }

    setIsImporting(true);
    try {
      const res = await apiClient.importContentFactoryItems(parsed);
      showToast(`Successfully imported ${res.imported_count} content item(s) as DRAFT!`);
      setImportJsonText('');
      loadItems();
      setCurrentView('review');
    } catch (err: any) {
      showToast(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Start Batch Generation
  const handleGenerateBatch = async () => {
    const topicsList = topicsText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (topicsList.length === 0) {
      showToast('Please enter at least one topic to generate.');
      return;
    }

    if (selectedTypes.length === 0) {
      showToast('Please select at least one content type.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ total: topicsList.length, completed: 0, currentTopic: topicsList[0] });

    try {
      const res = await apiClient.generateContentFactoryBatch({
        university_id: university,
        branch_id: branchId,
        semester,
        subject_id: subjectId,
        subject_name: subjectName,
        unit_no: unitNo,
        unit_title: unitTitle,
        topics: topicsList,
        content_types: selectedTypes,
        config: {
          mcqCount,
          shortQuestionCount: shortQCount,
          longQuestionCount: longQCount,
          vivaQuestionCount: vivaCount,
          numericalCount
        }
      });

      showToast(`Batch generation complete! Generated ${res.completed_topics}/${res.total_topics} topics.`);
      loadItems();
      loadJobs();
      setCurrentView('review');
    } catch (err: any) {
      showToast(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Update Status Action (Approve / Publish / Move to Review)
  const handleUpdateStatus = async (itemId: string, newStatus: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED') => {
    try {
      await apiClient.updateContentFactoryItem({
        id: itemId,
        status: newStatus,
        raw_markdown: editMarkdown || undefined
      });
      showToast(`Status updated to ${newStatus}`);
      if (selectedItem && selectedItem.id === itemId) {
        setSelectedItem((prev: any) => ({ ...prev, status: newStatus, raw_markdown: editMarkdown || prev.raw_markdown }));
      }
      loadItems();
    } catch (err: any) {
      showToast(`Error updating item: ${err.message}`);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this content item?')) return;
    try {
      await apiClient.deleteContentFactoryItem(itemId);
      showToast('Content item deleted.');
      if (selectedItem?.id === itemId) setSelectedItem(null);
      loadItems();
    } catch (err: any) {
      showToast(`Error deleting item: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-navy-950 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Content Factory V1 • Dual Workflow</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Curriculum Content Pipeline</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-xl">
            Import Google AI Pro bulk educational content or run API batches. Validates structure, quality flags, and publishes directly into student documents.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setCurrentView('import')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentView === 'import' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import (AI Pro)</span>
          </button>
          <button
            onClick={() => setCurrentView('generate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentView === 'generate' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>API Batch</span>
          </button>
          <button
            onClick={() => setCurrentView('review')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentView === 'review' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Review & Publish ({items.length})</span>
          </button>
          <button
            onClick={() => setCurrentView('queue')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentView === 'queue' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Jobs ({jobs.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 0: IMPORT STRUCTURED CONTENT (MODE A — Google AI Pro Workflow) */}
      {currentView === 'import' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                <span>Import Structured Content (Google AI Pro Workflow)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Paste generated JSON output from your Google AI Pro sessions. The system will automatically validate the schema, check for quality review flags (formulas & technical definitions), and stage the items as <strong>DRAFT</strong> in the review queue.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setImportJsonText(SAMPLE_IMPORT_TEMPLATE)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-orange-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Load Sample Template</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Structured JSON Payload (Single Object or Array of Objects):
            </label>
            <textarea
              rows={14}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-emerald-400 font-mono focus:ring-2 focus:ring-orange-500 outline-none leading-relaxed"
              placeholder={`{\n  "university": "GTU",\n  "branch": "Computer Engineering",\n  "semester": 5,\n  "subject": "Computer Networks",\n  "unit": 1,\n  "topic": "OSI Model & 7-Layer Architecture",\n  "detailedNotes": "...",\n  "mcqs": [...]\n}`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              disabled={isImporting || !importJsonText.trim()}
              onClick={handleImportSubmit}
              className={`px-8 py-3.5 rounded-2xl font-black text-xs text-white shadow-xl flex items-center gap-2 transition-all ${
                isImporting || !importJsonText.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 cursor-pointer hover:shadow-orange-600/20'
              }`}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating & Staging...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Validate & Stage to Drafts</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: GENERATION FORM */}
      {currentView === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Academic Hierarchy */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>1. Academic Hierarchy</span>
              </h2>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">University</label>
                <select 
                  value={university} 
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="gtu">Gujarat Technological University (GTU)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Branch</label>
                  <select 
                    value={branchId} 
                    onChange={(e) => {
                      setBranchId(e.target.value);
                      const nameMap: Record<string, string> = {
                        'branch_computer': 'Computer Engineering',
                        'branch_it': 'Information Technology',
                        'branch_mechanical': 'Mechanical Engineering',
                        'branch_civil': 'Civil Engineering',
                        'branch_electrical': 'Electrical Engineering',
                        'branch_ece': 'Electronics and Communication'
                      };
                      setBranchName(nameMap[e.target.value] || 'Engineering');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="branch_computer">Computer Engineering</option>
                    <option value="branch_it">Information Technology</option>
                    <option value="branch_mechanical">Mechanical Engineering</option>
                    <option value="branch_civil">Civil Engineering</option>
                    <option value="branch_electrical">Electrical Engineering</option>
                    <option value="branch_ece">ECE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Semester</label>
                  <select 
                    value={semester} 
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Subject Name</label>
                <input 
                  type="text" 
                  value={subjectName}
                  onChange={(e) => {
                    setSubjectName(e.target.value);
                    setSubjectId(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Computer Networks"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Unit No.</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={unitNo}
                    onChange={(e) => setUnitNo(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-1">Unit Title</label>
                  <input 
                    type="text" 
                    value={unitTitle}
                    onChange={(e) => setUnitTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. Physical Layer & OSI"
                  />
                </div>
              </div>
            </div>

            {/* Quick Quantities */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-3">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-4 h-4 text-orange-500" />
                <span>2. Content Quantities</span>
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">MCQs Count</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={20} 
                    value={mcqCount}
                    onChange={(e) => setMcqCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Short Qs (2-3M)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={shortQCount}
                    onChange={(e) => setShortQCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Long Qs (5-7M)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={longQCount}
                    onChange={(e) => setLongQCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Viva Qs</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={vivaCount}
                    onChange={(e) => setVivaCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Topics & Content Types */}
          <div className="lg:col-span-8 space-y-6">
            {/* Topics Batch Box */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-orange-500" />
                  <span>3. Topics Batch List (One per line)</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setTopicsText(DEFAULT_TOPICS_SUGGESTIONS.slice(0, 4).join('\n'))}
                  className="text-[11px] font-bold text-orange-400 hover:text-orange-300"
                >
                  + Load GTU Pilot Topics
                </button>
              </div>

              <textarea 
                rows={4}
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-orange-500 outline-none font-mono leading-relaxed"
                placeholder="OSI Model&#10;TCP/IP Model&#10;Network Topologies&#10;Transmission Media"
              />
              <p className="text-[11px] text-slate-500">
                The generator will create structured content packages for each topic sequentially and place them in the Review Queue.
              </p>
            </div>

            {/* Content Types Selector */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>4. Content Types to Generate ({selectedTypes.length}/10 selected)</span>
                </h2>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setSelectedTypes(CONTENT_TYPES_CONFIG.map(c => c.id))}
                    className="text-[10px] font-bold text-orange-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button 
                    type="button"
                    onClick={() => setSelectedTypes([])}
                    className="text-[10px] font-bold text-slate-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CONTENT_TYPES_CONFIG.map(c => {
                  const Icon = c.icon;
                  const isSelected = selectedTypes.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleContentType(c.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected 
                          ? 'bg-orange-500/10 border-orange-500/50 text-white' 
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                        isSelected ? 'bg-orange-600 text-white' : 'border border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-orange-400" />
                          <span>{c.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                disabled={isGenerating}
                onClick={handleGenerateBatch}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
                  isGenerating 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 cursor-pointer hover:shadow-orange-600/20 hover:scale-[1.005]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                    <span>Generating Batch... ({generationProgress?.completed}/{generationProgress?.total} topics)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Structured Batch ({topicsText.split('\n').filter(t => t.trim()).length} Topics)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: REVIEW & APPROVAL LIST */}
      {currentView === 'review' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-300">Filter by Status:</span>
              <div className="flex gap-1.5">
                {['', 'DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === st ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st || 'All'}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={loadItems}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Items Table / Cards */}
          {items.length === 0 ? (
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-12 text-center">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Content Items in this status</h3>
              <p className="text-xs text-slate-400 mt-1">Use the Generator tab to create topics for your subjects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => {
                let parsedContent: any = {};
                try {
                  parsedContent = JSON.parse(item.structured_content || '{}');
                } catch (e) {}

                let validation: any = {};
                try {
                  validation = JSON.parse(item.validation_notes || '{}');
                } catch (e) {}

                const isWarning = item.validation_status === 'warning' || (validation.flags && validation.flags.length > 0);

                return (
                  <div
                    key={item.id}
                    className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Status Badges */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                          item.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          item.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          item.status === 'REVIEW' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {item.status}
                        </span>

                        {isWarning && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Quality Review Flag</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white line-clamp-1">{item.topic}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {item.subject_name || 'Subject'} • Unit {item.unit_no}
                      </p>

                      {/* Content summary badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {parsedContent.detailedNotes && <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded font-bold">Notes</span>}
                        {parsedContent.mcqs && <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded font-bold">{parsedContent.mcqs.length} MCQs</span>}
                        {parsedContent.shortQuestions && <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded font-bold">{parsedContent.shortQuestions.length} Short Qs</span>}
                        {parsedContent.longQuestions && <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded font-bold">{parsedContent.longQuestions.length} Long Qs</span>}
                        {parsedContent.numericalProblems && parsedContent.numericalProblems.length > 0 && (
                          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] rounded font-bold">Numericals</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setEditMarkdown(item.raw_markdown || '');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-400" />
                        <span>Inspect & Review</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {item.status !== 'APPROVED' && item.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs"
                            title="Approve Item"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'PUBLISHED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <span>Publish</span>
                            <Send className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: BATCH JOBS LOGS */}
      {currentView === 'queue' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Batch Generation Jobs</h2>
            <button 
              onClick={loadJobs}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Jobs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Subject & Unit</th>
                  <th className="py-3 px-4">Topics</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-4 font-mono font-bold text-orange-400">{job.id}</td>
                    <td className="py-3 px-4">{job.subject_name || 'Subject'} • Unit {job.unit_no}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                      {(() => {
                        try {
                          const t = JSON.parse(job.topics);
                          return Array.isArray(t) ? t.join(', ') : job.topics;
                        } catch(e) {
                          return job.topics;
                        }
                      })()}
                    </td>
                    <td className="py-3 px-4 font-bold">{job.completed_topics} / {job.total_topics}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        job.status === 'processing' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{job.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION & REVIEW MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    selectedItem.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' :
                    selectedItem.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedItem.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{selectedItem.id}</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">{selectedItem.topic}</h2>
                <p className="text-xs text-slate-400">
                  {selectedItem.subject_name || 'Subject'} • Unit {selectedItem.unit_no} ({selectedItem.unit_title})
                </p>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Markdown Editor / Inspector */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4" data-color-mode="dark">
              {/* Quality & Validation Alerts */}
              {(() => {
                try {
                  const val = JSON.parse(selectedItem.validation_notes || '{}');
                  const flags = val.flags || [];
                  const issues = val.issues || [];
                  if (flags.length === 0 && issues.length === 0) return null;
                  return (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-1">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Automated Quality & Review Advisory:</span>
                      </div>
                      {flags.map((f: string, idx: number) => (
                        <p key={idx} className="text-amber-200/80">• {f}</p>
                      ))}
                      {issues.map((iss: string, idx: number) => (
                        <p key={idx} className="text-rose-400">• Issue: {iss}</p>
                      ))}
                    </div>
                  );
                } catch(e) {
                  return null;
                }
              })()}

              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <MDEditor
                  value={editMarkdown}
                  onChange={(val?: string) => setEditMarkdown(val || '')}
                  height={450}
                  className="bg-[#020617] border-none"
                  preview="live"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedItem.id, 'DRAFT')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Mark as Draft
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedItem.id, 'REVIEW')}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold"
                >
                  Request Review
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedItem.id, 'APPROVED')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  Approve Content
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedItem.id, 'PUBLISHED')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish to Student Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageContentFactoryUI;
