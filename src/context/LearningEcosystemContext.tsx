import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BookmarkItem,
  BookmarkType,
  ContinueLearningState,
  DownloadItem,
  NotificationItem,
  CalendarEvent,
  LibraryFolder,
  LearningAnalyticsData
} from '../types/learning-ecosystem';
import { useAuth } from './AuthContext';
import { useStudentAcademic } from './StudentAcademicContext';
import { getStoredTokens } from '../api/client';
import { auth } from '../utils/firebase';

interface LearningEcosystemContextType {
  // Bookmarks
  bookmarks: BookmarkItem[];
  addBookmark: (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => void;
  removeBookmark: (idOrTargetId: string) => void;
  isBookmarked: (targetId: string) => boolean;

  // Continue Learning
  continueLearning: ContinueLearningState;
  updateContinueLearning: (update: Partial<ContinueLearningState>) => void;
  resumeLastLearning: () => void;

  // Downloads
  downloads: DownloadItem[];
  startDownload: (title: string, fileType: DownloadItem['fileType'], sizeBytes: number, storagePath: string, subjectCode?: string) => void;
  removeDownload: (id: string) => void;
  redownload: (id: string) => void;
  storageUsageBytes: number;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  archiveNotification: (id: string) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'isCompleted'>) => void;
  toggleCalendarEventCompleted: (id: string) => void;
  deleteCalendarEvent: (id: string) => void;

  // Folders
  folders: LibraryFolder[];
  createFolder: (name: string, description?: string, color?: string) => void;
  deleteFolder: (folderId: string) => void;
  addItemToFolder: (folderId: string, itemId: string) => void;
  removeItemFromFolder: (folderId: string, itemId: string) => void;

  // Analytics & Study Time
  analytics: LearningAnalyticsData;
  logStudyMinutes: (minutes: number, subjectId?: string) => void;
}

const DEFAULT_CONTINUE_LEARNING: ContinueLearningState = {
  lastSubjectId: '',
  lastSubjectName: '',
  lastUnitNo: 1,
  lastPdfId: '',
  lastPdfTitle: '',
  lastPdfPage: 1,
  lastBlogSlug: '',
  lastPyqTitle: '',
  lastAiChatQuery: '',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_BOOKMARKS: BookmarkItem[] = [];
const DEFAULT_DOWNLOADS: DownloadItem[] = [];
const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];
const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [];
const DEFAULT_FOLDERS: LibraryFolder[] = [];

const DEFAULT_ANALYTICS: LearningAnalyticsData = {
  dailyStudyTimeMinutes: 0,
  weeklyStudyTimeMinutes: 0,
  monthlyStudyTimeMinutes: 0,
  subjectProgressPercent: {},
  learningStreakDays: 0,
  goalProgressPercent: 0,
  weeklyLogs: [],
};

const DEFAULT_CONTEXT_VALUE: LearningEcosystemContextType = {
  bookmarks: DEFAULT_BOOKMARKS,
  addBookmark: () => {},
  removeBookmark: () => {},
  isBookmarked: () => false,

  continueLearning: DEFAULT_CONTINUE_LEARNING,
  updateContinueLearning: () => {},
  resumeLastLearning: () => {},

  downloads: DEFAULT_DOWNLOADS,
  startDownload: () => {},
  removeDownload: () => {},
  redownload: () => {},
  storageUsageBytes: 0,

  notifications: DEFAULT_NOTIFICATIONS,
  unreadNotificationCount: 0,
  markNotificationAsRead: () => {},
  markAllNotificationsAsRead: () => {},
  archiveNotification: () => {},

  calendarEvents: DEFAULT_CALENDAR_EVENTS,
  addCalendarEvent: () => {},
  toggleCalendarEventCompleted: () => {},
  deleteCalendarEvent: () => {},

  folders: DEFAULT_FOLDERS,
  createFolder: () => {},
  deleteFolder: () => {},
  addItemToFolder: () => {},
  removeItemFromFolder: () => {},

  analytics: DEFAULT_ANALYTICS,
  logStudyMinutes: () => {},
};

const LearningEcosystemContext = createContext<LearningEcosystemContextType>(DEFAULT_CONTEXT_VALUE);

export const LearningEcosystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { academicProfile } = useStudentAcademic();
  const userId = currentUser?.uid || 'guest_student';

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem(`shiksha_bookmarks_${userId}`);
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });

  // Fetch real bookmarks from Cloudflare D1 for authenticated user
  useEffect(() => {
    let active = true;
    if (currentUser?.uid) {
      const loadUserBookmarks = async () => {
        try {
          const { access } = getStoredTokens();
          const token = access || (await auth.currentUser?.getIdToken());
          const res = await fetch('/api/student/bookmarks', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const data = await res.json();
            if (active && Array.isArray(data)) {
              const mapped: BookmarkItem[] = data.map((b: any) => ({
                id: b.id,
                targetId: b.resourceId,
                title: b.title,
                itemType: (b.resourceType || 'notes') as BookmarkType,
                url: b.url,
                subjectCode: b.subjectName,
                createdAt: b.createdAt
              }));
              setBookmarks(mapped);
            }
          }
        } catch (err) {
          console.warn("Notice fetching user bookmarks:", err);
        }
      };

      loadUserBookmarks();
    }
    return () => { active = false; };
  }, [currentUser?.uid]);

  const [continueLearning, setContinueLearning] = useState<ContinueLearningState>(() => {
    try {
      const saved = localStorage.getItem(`shiksha_continue_learning_${userId}`);
      return saved ? JSON.parse(saved) : DEFAULT_CONTINUE_LEARNING;
    } catch {
      return DEFAULT_CONTINUE_LEARNING;
    }
  });

  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem(`shiksha_downloads_${userId}`);
      return saved ? JSON.parse(saved) : DEFAULT_DOWNLOADS;
    } catch {
      return DEFAULT_DOWNLOADS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(`shiksha_notifications_${userId}`);
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`shiksha_calendar_${userId}`);
      return saved ? JSON.parse(saved) : DEFAULT_CALENDAR_EVENTS;
    } catch {
      return DEFAULT_CALENDAR_EVENTS;
    }
  });

  const [folders, setFolders] = useState<LibraryFolder[]>(() => {
    try {
      const saved = localStorage.getItem(`shiksha_library_folders_${userId}`);
      return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [analytics, setAnalytics] = useState<LearningAnalyticsData>(() => {
    try {
      const saved = localStorage.getItem(`shiksha_analytics_${userId}`);
      return saved ? JSON.parse(saved) : DEFAULT_ANALYTICS;
    } catch {
      return DEFAULT_ANALYTICS;
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem(`shiksha_bookmarks_${userId}`, JSON.stringify(bookmarks));
  }, [bookmarks, userId]);

  useEffect(() => {
    localStorage.setItem(`shiksha_continue_learning_${userId}`, JSON.stringify(continueLearning));
  }, [continueLearning, userId]);

  useEffect(() => {
    localStorage.setItem(`shiksha_downloads_${userId}`, JSON.stringify(downloads));
  }, [downloads, userId]);

  useEffect(() => {
    localStorage.setItem(`shiksha_notifications_${userId}`, JSON.stringify(notifications));
  }, [notifications, userId]);

  useEffect(() => {
    localStorage.setItem(`shiksha_calendar_${userId}`, JSON.stringify(calendarEvents));
  }, [calendarEvents, userId]);

  useEffect(() => {
    localStorage.setItem(`shiksha_library_folders_${userId}`, JSON.stringify(folders));
  }, [folders, userId]);

  useEffect(() => {
    localStorage.setItem(`shiksha_analytics_${userId}`, JSON.stringify(analytics));
  }, [analytics, userId]);

  // Bookmarks Actions
  const addBookmark = (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => {
    const newItem: BookmarkItem = {
      ...item,
      id: `bm_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBookmarks(prev => [newItem, ...prev.filter(b => b.targetId !== item.targetId)]);

    if (currentUser?.uid) {
      (async () => {
        try {
          const { access } = getStoredTokens();
          const token = access || (await auth.currentUser?.getIdToken());
          await fetch('/api/student/bookmarks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              userId: currentUser.uid,
              resourceId: item.targetId,
              resourceType: item.itemType,
              title: item.title,
              url: item.url,
              subjectName: item.subjectCode
            })
          });
        } catch (err) {
          console.warn("Notice saving bookmark to backend:", err);
        }
      })();
    }
  };

  const removeBookmark = (idOrTargetId: string) => {
    const found = bookmarks.find(b => b.id === idOrTargetId || b.targetId === idOrTargetId || b.title === idOrTargetId);
    const targetResourceId = found ? found.targetId : idOrTargetId;
    const removedId = found ? found.id : idOrTargetId;

    setBookmarks(prev => prev.filter(b => b.id !== idOrTargetId && b.targetId !== idOrTargetId && b.title !== idOrTargetId));
    setFolders(prev => prev.map(f => ({
      ...f,
      itemIds: f.itemIds.filter(id => id !== removedId && id !== targetResourceId)
    })));

    if (currentUser?.uid && targetResourceId) {
      (async () => {
        try {
          const { access } = getStoredTokens();
          const token = access || (await auth.currentUser?.getIdToken());
          await fetch(`/api/student/bookmarks?resourceId=${encodeURIComponent(targetResourceId)}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
        } catch (err) {
          console.warn("Notice deleting bookmark from backend:", err);
        }
      })();
    }
  };

  const isBookmarked = (targetId: string) => {
    if (!targetId) return false;
    return bookmarks.some(b => 
      b.targetId === targetId || 
      b.id === targetId || 
      b.title?.toLowerCase() === targetId.toLowerCase() ||
      (b.url && b.url === targetId)
    );
  };

  // Continue Learning Actions
  const updateContinueLearning = (update: Partial<ContinueLearningState>) => {
    setContinueLearning(prev => ({
      ...prev,
      ...update,
      updatedAt: new Date().toISOString(),
    }));
  };

  const resumeLastLearning = () => {
    if (continueLearning.lastPdfId || continueLearning.lastSubjectId) {
      window.location.href = `/resources/study-material/${academicProfile?.branchId || 'computer'}/semester/${academicProfile?.semester || 5}`;
    }
  };

  // Downloads Actions
  const startDownload = (title: string, fileType: DownloadItem['fileType'], sizeBytes: number, storagePath: string, subjectCode?: string) => {
    const newDl: DownloadItem = {
      id: `dl_${Date.now()}`,
      title,
      fileType,
      sizeBytes,
      downloadedAt: new Date().toISOString(),
      isOfflineAvailable: true,
      hasUpdate: false,
      storagePath,
      subjectCode,
      downloadProgress: 100,
      isDownloading: false,
    };
    setDownloads(prev => [newDl, ...prev.filter(d => d.title !== title)]);
  };

  const removeDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  const redownload = (id: string) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, downloadedAt: new Date().toISOString(), hasUpdate: false } : d));
  };

  const storageUsageBytes = downloads.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);

  // Notifications Actions
  const unreadNotificationCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: true } : n));
  };

  // Calendar Actions
  const addCalendarEvent = (event: Omit<CalendarEvent, 'id' | 'isCompleted'>) => {
    const newEv: CalendarEvent = {
      ...event,
      id: `cal_${Date.now()}`,
      isCompleted: false,
    };
    setCalendarEvents(prev => [...prev, newEv]);
  };

  const toggleCalendarEventCompleted = (id: string) => {
    setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, isCompleted: !e.isCompleted } : e));
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  // Folder Actions
  const createFolder = (name: string, description?: string, color = '#f97316') => {
    const newFolder: LibraryFolder = {
      id: `folder_${Date.now()}`,
      name,
      description,
      color,
      itemIds: [],
      createdAt: new Date().toISOString(),
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const deleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
  };

  const addItemToFolder = (folderId: string, itemId: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemIds: Array.from(new Set([...f.itemIds, itemId])) } : f));
  };

  const removeItemFromFolder = (folderId: string, itemId: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemIds: f.itemIds.filter(id => id !== itemId) } : f));
  };

  // Analytics Actions
  const logStudyMinutes = (minutes: number, subjectId?: string) => {
    setAnalytics(prev => {
      const today = new Date().toISOString().split('T')[0];
      const existingLogIndex = prev.weeklyLogs.findIndex(l => l.date === today);
      let updatedLogs = [...prev.weeklyLogs];

      if (existingLogIndex >= 0) {
        const existing = updatedLogs[existingLogIndex];
        updatedLogs[existingLogIndex] = {
          ...existing,
          minutesSpent: existing.minutesSpent + minutes,
          subjectsStudied: subjectId && !existing.subjectsStudied.includes(subjectId) 
            ? [...existing.subjectsStudied, subjectId] 
            : existing.subjectsStudied,
        };
      } else {
        updatedLogs.push({
          date: today,
          minutesSpent: minutes,
          subjectsStudied: subjectId ? [subjectId] : [],
          materialsReadCount: 1,
          quizzesTakenCount: 0,
        });
      }

      return {
        ...prev,
        dailyStudyTimeMinutes: prev.dailyStudyTimeMinutes + minutes,
        weeklyStudyTimeMinutes: prev.weeklyStudyTimeMinutes + minutes,
        monthlyStudyTimeMinutes: prev.monthlyStudyTimeMinutes + minutes,
        weeklyLogs: updatedLogs,
      };
    });
  };

  return (
    <LearningEcosystemContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,

        continueLearning,
        updateContinueLearning,
        resumeLastLearning,

        downloads,
        startDownload,
        removeDownload,
        redownload,
        storageUsageBytes,

        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        archiveNotification,

        calendarEvents,
        addCalendarEvent,
        toggleCalendarEventCompleted,
        deleteCalendarEvent,

        folders,
        createFolder,
        deleteFolder,
        addItemToFolder,
        removeItemFromFolder,

        analytics,
        logStudyMinutes,
      }}
    >
      {children}
    </LearningEcosystemContext.Provider>
  );
};

export const useLearningEcosystem = () => {
  const context = useContext(LearningEcosystemContext);
  return context || DEFAULT_CONTEXT_VALUE;
};
