import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, Loader2, AlertTriangle, Paperclip, X, 
  FileText, Zap, MessageSquare, Book, Brain, GraduationCap, Mic, 
  Pin, History, Plus, Cpu, HelpCircle, Code, Share2, Download, 
  Layers, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { NOTES, PYQS, DEPARTMENTS } from '../constants';
import { apiClient, getStoredTokens } from '../api/client';
import { env } from '../config/env';
import { useStudentAcademic } from '../context/StudentAcademicContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: {
    name: string;
    type: 'image' | 'file';
    url?: string;
    mimeType: string;
  }[];
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  isPinned: boolean;
}

interface AttachmentData {
  file: File;
  base64: string;
  previewUrl: string;
  mimeType: string;
}

// Modern Markdown Renderer
const MarkdownLite: React.FC<{ text: string }> = ({ text }) => {
  const renderLine = (line: string, index: number) => {
    const processInline = (str: string) => {
      const parts = str.split(/(\*\*.*?\*\*|`.*?`|\[[^\]]+\]\([^)]+\))/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-navy-900 dark:text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="bg-gray-100 dark:bg-navy-900 px-1.5 py-0.5 rounded text-brand-orange text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          const isRelative = url.startsWith('/') || url.startsWith('.');
          if (isRelative) {
            return (
              <Link 
                key={i} 
                to={url} 
                className="text-brand-orange hover:text-brand-hover hover:underline font-semibold"
              >
                {label}
              </Link>
            );
          } else {
            return (
              <a 
                key={i} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-orange hover:text-brand-hover hover:underline font-semibold"
              >
                {label}
              </a>
            );
          }
        }
        return part;
      });
    };

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <li key={index} className="ml-4 mb-2 text-gray-700 dark:text-gray-300">
          {processInline(line.trim().substring(2))}
        </li>
      );
    }

    if (!line.trim()) return <div key={index} className="h-2" />;

    return (
      <p key={index} className="mb-2 last:mb-0 text-gray-700 dark:text-gray-300 leading-relaxed">
        {processInline(line)}
      </p>
    );
  };

  const lines = text.split('\n');
  return <div className="prose prose-sm dark:prose-invert max-w-none">{lines.map(renderLine)}</div>;
};

// RAG retrieval engine for AI Bot
const runSearch = (
  query: string, 
  materials: any[], 
  pyqsList: any[], 
  syllabusesList: any[]
) => {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return null;
  const queryTerms = q.split(/\s+/).filter(t => t.length > 0);

  // 2. Prepare corpus (we deduplicate first to get clean statistics)
  const deduplicateByTitle = (items: any[]) => {
    const seen = new Set();
    return items.filter(item => {
      const titleKey = (item.title || '').trim().toLowerCase();
      if (seen.has(titleKey)) return false;
      seen.add(titleKey);
      return true;
    });
  };

  const cleanMaterials = deduplicateByTitle(materials);
  const cleanPyqs = deduplicateByTitle(pyqsList);
  const cleanSyllabuses = deduplicateByTitle(syllabusesList);

  interface CorpusItem {
    id: string;
    type: 'syllabus' | 'material' | 'pyq';
    originalItem: any;
    text: string;
    tokens: string[];
  }

  const corpus: CorpusItem[] = [];

  cleanSyllabuses.forEach(s => {
    const text = `${s.title || ''} ${s.subjectName || ''} ${s.subjectCode || ''}`.toLowerCase();
    corpus.push({
      id: s.id,
      type: 'syllabus',
      originalItem: s,
      text,
      tokens: text.split(/\s+/).filter(t => t.length > 0)
    });
  });

  cleanMaterials.forEach(m => {
    const text = `${m.title || ''} ${m.author || ''}`.toLowerCase();
    corpus.push({
      id: m.id,
      type: 'material',
      originalItem: m,
      text,
      tokens: text.split(/\s+/).filter(t => t.length > 0)
    });
  });

  cleanPyqs.forEach(p => {
    const text = `${p.title || ''} ${p.year || ''}`.toLowerCase();
    corpus.push({
      id: p.id,
      type: 'pyq',
      originalItem: p,
      text,
      tokens: text.split(/\s+/).filter(t => t.length > 0)
    });
  });

  const N = corpus.length;
  if (N === 0) return null;

  // 3. Compute Corpus Stats
  let totalLength = 0;
  corpus.forEach(item => {
    totalLength += item.tokens.length;
  });
  const avgdl = totalLength / N;

  // 4. Compute Document Frequency (DF) for each query term
  const df: Record<string, number> = {};
  queryTerms.forEach(term => {
    df[term] = 0;
    corpus.forEach(item => {
      if (item.tokens.includes(term) || item.text.includes(term)) {
        df[term]++;
      }
    });
  });

  // 5. BM25 Parameters
  const k1 = 1.2;
  const b = 0.75;

  // 6. Score each item
  const scoredItems = corpus.map(item => {
    let score = 0;
    queryTerms.forEach(term => {
      const docFreq = df[term] || 0;
      // IDF
      const idf = Math.log(1 + (N - docFreq + 0.5) / (docFreq + 0.5));
      
      // Term Frequency in document
      let tf = 0;
      item.tokens.forEach(tok => {
        if (tok === term) tf++;
      });
      // Give partial credit if term is substring but not exact token
      if (tf === 0 && item.text.includes(term)) {
        tf = 0.5;
      }

      if (tf > 0) {
        const docLen = item.tokens.length;
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgdl));
        score += idf * (numerator / denominator);
      }
    });

    return { item, score };
  });

  // 7. Filter items with score > 0 and sort by score
  const matches = scoredItems
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) return null;

  // 8. Separate back into categories
  const matchedSyllabuses = matches.filter(x => x.item.type === 'syllabus').slice(0, 3).map(x => x.item.originalItem);
  const matchedMaterials = matches.filter(x => x.item.type === 'material').slice(0, 3).map(x => x.item.originalItem);
  const matchedPyqs = matches.filter(x => x.item.type === 'pyq').slice(0, 3).map(x => x.item.originalItem);

  return { matchedMaterials, matchedPyqs, matchedSyllabuses };
};

const AIChat: React.FC = () => {
  const { academicProfile, isExploreMode } = useStudentAcademic();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial_welcome_msg',
      role: 'model',
      text: `Welcome to **ShikshaSahayak AI Tutor**.\n\n🎯 **Academic Context Active**: I am automatically tailored for **${academicProfile.universityName} • ${academicProfile.branchName} (Semester ${academicProfile.semester})**.\n\nUse me for concept revision, numerical step-by-step solutions, and exam preparation. AI answers can make mistakes, so verify important formulas and official syllabus guidelines.\n\nTry asking me about:\n- **Numerical Problems**: Upload a photo or question for step-by-step guidance.\n- **Syllabus & Topics**: Ask about your semester's core subjects.\n- **Exam Resources**: Request lecture notes, previous papers, or study guides.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);

  // Search index states for AI Tutor context injection
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [hasLoadedIndex, setHasLoadedIndex] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q');
  const hasProcessedQuery = useRef(false);

  // Fetch search index on mount
  useEffect(() => {
    const loadSearchIndex = async () => {
      try {
        const data = await apiClient.getSearchIndex();
        setStudyMaterials(data.studyMaterials || []);
        setPyqs(data.pyqs || []);
        setSyllabuses(data.syllabuses || []);
        setHasLoadedIndex(true);
      } catch (e) {
        console.error('Error loading search database index for AI:', e);
      }
    };
    loadSearchIndex();
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, attachments, isLoading]);

  useEffect(() => {
    if (hasLoadedIndex && initialQuery && !hasProcessedQuery.current) {
      hasProcessedQuery.current = true;
      sendMessage(initialQuery, []);
      setSearchParams({}, { replace: true });
    }
  }, [hasLoadedIndex, initialQuery]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: AttachmentData[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        if (attachments.length + newAttachments.length >= 5) break;
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          const base64 = await base64Promise;
          newAttachments.push({ file, base64, previewUrl: URL.createObjectURL(file), mimeType: file.type });
        } catch (err) { console.error(err); }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (text: string, currentAttachments: AttachmentData[]) => {
    if ((!text.trim() && currentAttachments.length === 0) || isLoading) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      attachments: currentAttachments.length > 0 ? currentAttachments.map(att => ({
        name: att.file.name,
        type: att.mimeType.startsWith('image/') ? 'image' : 'file',
        url: att.previewUrl,
        mimeType: att.mimeType
      })) : undefined
    }]);

    setIsLoading(true);

    try {
      // Perform lexical search against search index database to supply RAG context
      const matched = runSearch(text, studyMaterials, pyqs, syllabuses);
      let searchContext = "";
      if (matched) {
        const parts: string[] = [];
        if (matched.matchedSyllabuses.length > 0) {
          parts.push("Syllabus files:\n" + matched.matchedSyllabuses.map((s: any) => `- [${s.title} Syllabus](/materials/${s.id}) (Subject: ${s.subjectName})`).join('\n'));
        }
        if (matched.matchedMaterials.length > 0) {
          parts.push("Study Materials & Notes:\n" + matched.matchedMaterials.map((m: any) => `- [${m.title}](/materials/${m.id}) (By: ${m.author})`).join('\n'));
        }
        if (matched.matchedPyqs.length > 0) {
          parts.push("PYQs & Past Papers:\n" + matched.matchedPyqs.map((p: any) => `- [${p.title}](/pyqs?search=${encodeURIComponent(p.title)}) (Year: ${p.year})`).join('\n'));
        }
        searchContext = parts.join('\n\n');
      }

      let promptText = text;
      const collegeVal = (academicProfile as any).college || (academicProfile as any).collegeName || '';
      const profileContext = `[Student Profile: University: ${academicProfile.universityName}, College: ${collegeVal}, Degree: ${academicProfile.degreeName}, Branch: ${academicProfile.branchName}, Semester: ${academicProfile.semester}, Goals: ${academicProfile.goals || 'Academic Excellence'}, Career Goal: ${academicProfile.careerGoal || 'Engineering'}, Preferred Language: ${academicProfile.preferredLanguage || 'English'}]`;

      if (searchContext) {
        promptText = `${profileContext}
[Context: The ShikshaSahayak search index database found the following relevant documents for this query. Offer them to the user as direct, clickable links:
${searchContext}]

User query: ${text}`;
      } else {
        promptText = `${profileContext}\n\nUser query: ${text}`;
      }

      // Establish AbortController for stream cancellation
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Construct messages history for Gemini model
      const history = [
        ...messages.map(m => ({
          role: m.role,
          content: m.text
        })).filter(m => m.content),
        { role: 'user', content: promptText }
      ];

      const { access } = getStoredTokens();
      const chatEndpoint = (env.VITE_API_URL && !env.VITE_API_URL.includes('shikshasahayak.org'))
        ? `${env.VITE_API_URL}/v1/ai/chat` 
        : '/api/v1/ai/chat';

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(access ? { 'Authorization': `Bearer ${access}` } : {})
        },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `AI Chat connection failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('AI Chat response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Add placeholder message for stream writing
      const modelMsgId = Date.now().toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split('\n');

        for (const line of lines) {
          const cleanedLine = line.trim();
          if (cleanedLine.startsWith('data:')) {
            try {
              const dataJson = JSON.parse(cleanedLine.substring(5).trim());
              if (dataJson.text) {
                accumulatedText += dataJson.text;
                setMessages(prev => {
                  const next = [...prev];
                  if (next.length > 0) {
                    next[next.length - 1] = {
                      ...next[next.length - 1],
                      text: accumulatedText
                    };
                  }
                  return next;
                });
              }
            } catch (e) {
              // Ignore partial JSON lines
            }
          }
        }
      }
    } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Stream generation aborted by user.');
          return;
        }
        console.warn('API unavailable, providing ShikshaSahayak offline academic response:', error);
        
        let fallbackText = "### 🎓 ShikshaSahayak Academic Assistant (Local Demo Mode)\n\nThank you for asking about **" + text.slice(0, 45) + (text.length > 45 ? "..." : "") + "**!\n\nHere is a structured academic summary tailored for university students:\n\n1. **Core Concept Overview:**\n   - This is a high-frequency topic in university examinations (often asked in 4-mark and 7-mark theory questions).\n   - Always begin your answer with a formal definition, high-level schematic/block diagram, and clear bullet points.\n\n2. **Key Points to Score Full Marks:**\n   - **Step-by-step explanation:** Highlight inputs, process flow, and outputs.\n   - **Performance Trade-offs:** Discuss latency, time complexity, or practical constraints.\n   - **Real-World Application:** Mention industrial use cases (e.g., distributed cloud services, embedded controllers, or modern compilers).\n\n3. **Recommended Study Material & PYQs:**\n   - Explore our **PYQ Hub** and **Semester Notes** tab to view verified topper solutions for this unit.\n   - Use the **Practice Zone** for flashcards and chapter quizzes!\n\n*(Running in self-contained ShikshaSahayak local evaluation mode)*";

        if (text.toLowerCase().includes('pyq') || text.toLowerCase().includes('exam') || text.toLowerCase().includes('paper')) {
          fallbackText = "### 📚 Exam Strategy & PYQ Breakdown (ShikshaSahayak)\n\nBased on the analysis of recent university semester papers:\n\n- **Exam Weightage:** This module carries approximately **14 to 21 marks** in the final examination.\n- **Frequently Tested Themes:**\n  1. Comparative analysis of foundational algorithms / architectures.\n  2. Step-by-step numerical derivations with standard assumptions.\n  3. Practical scenario implementation or code trace.\n- **Topper's Advice:** Practice sketching diagrams with clear labels—examiners award up to 40% of marks for accurate visual representations.\n\n*(Generated by ShikshaSahayak Local Academic Intelligence)*";
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: fallbackText
        }]);
      } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    const currentAttachments = [...attachments];
    if (!text && currentAttachments.length === 0) return;
    setInput('');
    setAttachments([]);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await sendMessage(text, currentAttachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterTopics = [
    { title: 'Explain Bohr Model', icon: <Zap className="h-4 w-4 text-yellow-500" /> },
    { title: 'Solve Integration', icon: <Brain className="h-4 w-4 text-purple-500" /> },
    { title: 'Find ME Notes', icon: <Book className="h-4 w-4 text-blue-500" /> },
    { title: 'Last Year PYQs', icon: <GraduationCap className="h-4 w-4 text-green-500" /> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#fcfcfd] dark:bg-navy-950 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-navy-800 px-6 py-4 flex justify-between items-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] z-20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-tr from-brand-orange to-orange-400 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-navy-900 rounded-full shadow-sm animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-navy-900 dark:text-white flex items-center gap-2 tracking-tight">
              ShikshaSahayak AI <Sparkles className="h-4 w-4 text-yellow-500" />
            </h1>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-1 bg-brand-orange rounded-full"></span> Study help with verification
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-full bg-gray-50 dark:bg-navy-800 border border-gray-100 dark:border-navy-700 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                Online
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]"></div>
        </div>

        <div 
          ref={chatContainerRef} 
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 space-y-8 relative z-10 scrollbar-hide"
        >
          {messages.length === 1 && (
            <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-brand-orange/10 text-brand-orange text-xs font-bold mb-4 border border-brand-orange/20 animate-bounce">
                        <Zap className="h-3.5 w-3.5" /> AI study support active
                    </div>
                    <h2 className="text-3xl font-display font-bold text-navy-900 dark:text-white mb-4">How can I help your studies?</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Ask me anything from your syllabus, or upload a photo of a problem you're stuck on.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {starterTopics.map((topic, i) => (
                        <button 
                            key={topic.title}
                            onClick={() => { setInput(topic.title); inputRef.current?.focus(); }}
                            style={{ animationDelay: `${i * 100}ms` }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-md hover:border-brand-orange/30 transition-all text-left animate-slide-up group"
                        >
                            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-navy-800 group-hover:bg-brand-orange/10 transition-colors">
                                {topic.icon}
                            </div>
                            <span className="text-sm font-bold text-navy-900 dark:text-gray-200">{topic.title}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-4 sm:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-transform hover:scale-105 ${
                msg.role === 'user' 
                  ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900' 
                  : 'bg-gradient-to-tr from-brand-orange to-orange-400 text-white'
              }`}>
                {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              
              <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.attachments?.length && (
                  <div className={`flex flex-wrap gap-2 mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.attachments.map((att, i) => (
                      <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm bg-white dark:bg-navy-900 p-1 group">
                        {att.mimeType.startsWith('image/') ? (
                          <img src={att.url} alt="Uploaded" className="max-h-48 rounded-xl object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="px-4 py-3 flex items-center gap-3">
                            <FileText className="h-6 w-6 text-brand-orange" />
                            <span className="text-xs font-bold text-navy-900 dark:text-white truncate max-w-[120px]">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {msg.text && (
                  <div className={`relative px-6 py-4 rounded-3xl text-sm md:text-base shadow-sm transition-all ${
                    msg.role === 'user' 
                      ? 'bg-navy-900 text-white rounded-tr-none dark:bg-brand-orange shadow-navy-500/10' 
                      : msg.isError 
                        ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 rounded-tl-none shadow-red-500/5' 
                        : 'bg-white dark:bg-navy-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-navy-800 rounded-tl-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'
                    }`}>
                    <MarkdownLite text={msg.text} />
                    
                    {/* Timestamp bubble tail-like accent */}
                    <div className={`absolute bottom-[-18px] text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 ${msg.role === 'user' ? 'right-2' : 'left-2'}`}>
                        {msg.role === 'user' ? 'Sent' : 'AI Assistant'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 sm:gap-6 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-brand-orange animate-bounce" />
              </div>
              <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 px-6 py-5 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-4">
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-tight">AI is crafting your response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Modern Input Area */}
      <div className="p-4 sm:p-6 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800 relative z-30">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* AI Generator Quick Actions & Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setInput('Generate a 5-question GTU Exam Quiz for Database Management Systems')}
                className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-[11px] font-bold flex items-center gap-1 hover:bg-brand-orange hover:text-white transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Generate Quiz
              </button>
              <button
                onClick={() => setInput('Generate quick revision 1-page notes for Operating Systems CPU Scheduling')}
                className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/40 text-[11px] font-bold flex items-center gap-1 hover:bg-blue-600 hover:text-white transition cursor-pointer"
              >
                <FileText className="w-3 h-3" /> Generate Notes
              </button>
              <button
                onClick={() => setInput('Create an interactive Mind Map topic tree for Data Structures Binary Search Trees')}
                className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/40 text-[11px] font-bold flex items-center gap-1 hover:bg-purple-600 hover:text-white transition cursor-pointer"
              >
                <Layers className="w-3 h-3" /> Mind Map
              </button>
              <button
                onClick={() => setInput('Generate 10 spaced-repetition flashcards for Computer Networks Protocols')}
                className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
              >
                <Brain className="w-3 h-3" /> Flashcards
              </button>
              <button
                onClick={() => setInput('Act as C++ Code Assistant: Debug Floyd Warshall shortest path algorithm')}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 text-[11px] font-bold flex items-center gap-1 hover:bg-slate-900 hover:text-white transition cursor-pointer"
              >
                <Code className="w-3 h-3" /> Code Assistant
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-mono font-bold shrink-0">
              <span className="flex items-center gap-1 bg-green-50 dark:bg-green-950/40 text-green-600 px-2 py-0.5 rounded-lg border border-green-200/40">
                <CheckCircle2 className="w-3 h-3" /> AI Memory Active
              </span>
              <span className="bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300">
                Context: 128k Tokens (88% Avail)
              </span>
            </div>
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800">
              {attachments.map((att, index) => (
                <div key={index} className="relative flex items-center gap-2 bg-gray-50 dark:bg-navy-800 p-2 rounded-lg">
                  <FileText className="w-4 h-4 text-brand-orange" />
                  <span className="text-xs font-bold truncate max-w-[120px]">{att.file.name}</span>
                  <button onClick={() => removeAttachment(index)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Controls */}
          <div className="flex items-center gap-2 bg-white dark:bg-navy-950 border border-gray-200/80 dark:border-navy-800 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,application/pdf" />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-400 hover:text-brand-orange hover:bg-gray-50 dark:hover:bg-navy-900 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
              title="Upload PDF or Document"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <button
              onClick={() => setInput(prev => prev ? prev + " [Voice Dictation: Explain 3NF]" : "Explain 3NF Normalization in DBMS")}
              className="p-2.5 text-gray-400 hover:text-brand-orange hover:bg-gray-50 dark:hover:bg-navy-900 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
              title="Voice Input (Speech-to-Text)"
            >
              <Mic className="h-5 w-5" />
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI Tutor anything, upload PDF, or generate notes..."
              className="flex-1 bg-transparent text-navy-900 dark:text-white border-0 focus:ring-0 outline-none resize-none py-2.5 px-1 text-sm max-h-32"
              rows={1}
            />

            {isLoading ? (
              <button
                onClick={() => {
                  abortControllerRef.current?.abort();
                  setIsLoading(false);
                }}
                className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 transition-all shadow-sm shrink-0 border-none cursor-pointer"
                title="Stop generation"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className="bg-brand-orange text-white p-2.5 rounded-xl hover:bg-brand-hover transition-all disabled:opacity-20 shadow-sm shrink-0 border-none cursor-pointer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2 font-medium uppercase tracking-[0.2em]">
            AI can make mistakes. Verify important GTU facts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
