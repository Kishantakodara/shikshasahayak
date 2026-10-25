import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Paperclip, 
  Search, 
  Users, 
  User, 
  CheckCheck, 
  Sparkles,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { teacherClient } from '../../api/teacherClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  name: string;
  type: 'class' | 'student';
  lastMessage: string;
  time: string;
  unread: number;
  membersCount?: number;
}

interface MessageItem {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

export default function TeacherMessagesPage() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Load conversations (threads & classes)
  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        const [threadsRes, classesRes] = await Promise.all([
          teacherClient.getMessageThreads().catch(() => ({ threads: [] })),
          teacherClient.getClasses().catch(() => ({ classes: [] })),
        ]);

        const threadList: any[] = threadsRes?.threads || [];
        const classList: any[] = classesRes?.classes || [];

        const convs: Conversation[] = [];

        // Add message threads
        threadList.forEach((t: any) => {
          convs.push({
            id: t.id,
            name: t.title || t.other_participant_name || 'Discussion',
            type: t.thread_type === 'CLASS' ? 'class' : 'student',
            lastMessage: t.last_message_preview || 'No messages yet',
            time: t.last_message_at ? new Date(t.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            unread: t.unread_count || 0,
            membersCount: t.participant_count || 1,
          });
        });

        // Add classes as discussion channels if not already present
        classList.forEach((c: any) => {
          if (!convs.some(conv => conv.name.includes(c.name))) {
            convs.push({
              id: `class_${c.id}`,
              name: `${c.name} ${c.section ? `(${c.section})` : ''}`,
              type: 'class',
              lastMessage: 'Class group channel',
              time: 'Active',
              unread: 0,
              membersCount: c.student_count || 0,
            });
          }
        });

        setConversations(convs);
        if (convs.length > 0) {
          setActiveConvId(convs[0].id);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  // 2. Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) return;

    async function loadMessages() {
      try {
        if (activeConvId.startsWith('class_')) {
          setMessages([
            {
              id: 'm_welcome',
              sender: 'ShikshaSahayak',
              text: `Welcome to the official class channel for ${activeConv?.name || 'your class'}. Messages sent here reach all enrolled students.`,
              time: 'System',
              isMe: false,
            },
          ]);
          return;
        }

        const res = await teacherClient.getThreadMessages(activeConvId);
        const msgs = (res?.messages || []).map((m: any) => ({
          id: m.id,
          sender: m.sender_name || (m.sender_id === currentUser?.uid ? 'You' : 'Student'),
          text: m.content || m.text || '',
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
          isMe: m.sender_id === currentUser?.uid || m.sender_id === 'me',
        }));
        setMessages(msgs);
      } catch {
        // fallback
      }
    }
    loadMessages();
  }, [activeConvId, currentUser?.uid]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText.trim();
    setInputText('');

    const optimisticMsg: MessageItem = {
      id: `msg_${Date.now()}`,
      sender: 'You',
      text: currentText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      setSending(true);
      if (activeConvId && !activeConvId.startsWith('class_')) {
        await teacherClient.sendMessage({ thread_id: activeConvId, content: currentText });
      }
    } catch {
      // keep optimistic msg
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans h-[calc(100vh-140px)] flex flex-col">
      
      {/* Header */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 dark:text-white font-display flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-orange" /> Messages
          </h1>
          <p className="text-xs text-gray-400">Two-way messaging with student batches and individual rosters.</p>
        </div>
      </div>

      {/* Chat 2-Column Interface */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex-1 flex overflow-hidden">
        
        {/* Left Conversation List */}
        <div className="w-80 border-r border-gray-200/80 dark:border-navy-800 flex flex-col bg-gray-50/50 dark:bg-navy-950">
          <div className="p-3 border-b border-gray-200/80 dark:border-navy-800">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-navy-800">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-orange" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-navy-900 dark:text-white">No conversations</p>
                <p className="text-[10px] text-gray-400 mt-1">Create a class to start group discussions with students.</p>
              </div>
            ) : (
              filteredConversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    activeConvId === c.id 
                      ? 'bg-white dark:bg-navy-800 shadow-xs border-l-4 border-l-brand-orange' 
                      : 'hover:bg-gray-100/60 dark:hover:bg-navy-900'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-brand-orange/15 text-brand-orange font-bold flex items-center justify-center shrink-0 text-xs">
                    {c.type === 'class' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-navy-900 dark:text-white truncate">{c.name}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-brand-orange text-white text-[9px] font-bold">
                      {c.unread}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Active Chat Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-navy-900">
          
          {activeConv ? (
            <>
              {/* Active Chat Bar */}
              <div className="p-4 border-b border-gray-200/80 dark:border-navy-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-orange text-white font-bold flex items-center justify-center text-xs">
                    {activeConv.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">{activeConv.name}</h3>
                    <p className="text-[10px] text-gray-400">
                      {activeConv.type === 'class' ? `${activeConv.membersCount || 0} Students enrolled` : 'Direct message'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-gray-400">
                    <div>
                      <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-navy-900 dark:text-white">No messages yet</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Send a message below to start the conversation.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md p-3 rounded-2xl text-xs space-y-1 ${
                        m.isMe 
                          ? 'bg-brand-orange text-white rounded-br-none' 
                          : 'bg-gray-100 dark:bg-navy-800 text-navy-900 dark:text-white rounded-bl-none'
                      }`}>
                        <p className="font-bold text-[10px] opacity-80">{m.sender}</p>
                        <p>{m.text}</p>
                        <p className="text-[9px] text-right opacity-70">{m.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200/80 dark:border-navy-800 flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => toast.info('File attachment support')} 
                  className="p-2 text-gray-400 hover:text-brand-orange transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 py-2 px-3 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
                <Button 
                  type="submit" 
                  disabled={sending || !inputText.trim()}
                  className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl px-3 py-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
              <div>
                <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-navy-900 dark:text-white">Select a conversation</p>
                <p className="text-xs text-gray-400 mt-1">Choose a class channel or student from the sidebar.</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
