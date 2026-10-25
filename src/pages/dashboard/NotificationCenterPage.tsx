import React, { useState } from 'react';
import { 
  Bell, Check, CheckCheck, Archive, Filter, AlertTriangle, 
  BookOpen, FileText, Award, Info, Settings, Trash2, ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';
import { NotificationCategory } from '../../types/learning-ecosystem';

export const NotificationCenterPage: React.FC = () => {
  const { 
    notifications, 
    unreadNotificationCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    archiveNotification 
  } = useLearningEcosystem();

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredNotifications = notifications.filter(n => {
    if (n.isArchived) return false;
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'exam':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'material':
        return <BookOpen className="w-5 h-5 text-brand-orange" />;
      case 'pyq':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'result':
        return <Award className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-navy-750">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
              <Bell className="w-3.5 h-3.5" />
              <span>Real-Time Updates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              Notification Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
              Personalized announcements, exam alerts, assignment deadlines, and new syllabus releases filtered specifically for your branch and semester.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All Notifications' },
          { id: 'exam', label: 'Exams' },
          { id: 'announcement', label: 'Announcements' },
          { id: 'pyq', label: 'PYQs' },
          { id: 'material', label: 'Study Notes' },
          { id: 'system', label: 'System' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeCategory === tab.id
                ? 'bg-[#f97316] text-white shadow-md shadow-orange-500/20'
                : 'bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 text-gray-600 dark:text-gray-300 hover:border-brand-orange'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-navy-900 rounded-3xl border border-gray-200 dark:border-navy-800 p-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">All Caught Up!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              You have no pending notifications in this category.
            </p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                !notif.isRead
                  ? 'bg-orange-50/40 dark:bg-navy-850 border-orange-200 dark:border-navy-750 shadow-xs'
                  : 'bg-white dark:bg-navy-900 border-gray-150 dark:border-navy-800 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-navy-800 border border-gray-150 dark:border-navy-750 shadow-xs shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-navy-900 dark:text-white">
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-orange inline-block animate-ping" />
                    )}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {notif.message}
                  </p>

                  <span className="text-[10px] text-gray-400 block pt-1 font-medium">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notif.actionUrl && (
                  <Link
                    to={notif.actionUrl}
                    className="px-3 py-1.5 rounded-xl bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {!notif.isRead && (
                  <button
                    onClick={() => markNotificationAsRead(notif.id)}
                    className="p-1.5 text-gray-400 hover:text-emerald-500 transition rounded-lg"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => archiveNotification(notif.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition rounded-lg"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
