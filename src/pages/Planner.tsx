
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Trash2, Clock } from 'lucide-react';
import { ANNOUNCEMENTS } from '../constants';
import { CalendarEvent } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Planner: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // New Event Form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('study');

  useEffect(() => {
    // Load events from local storage
    const savedEvents = localStorage.getItem('padhakuPortal_events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents).map((e: any) => ({
        ...e,
        date: new Date(e.date)
      })));
    } else {
        setEvents([]);
    }
  }, []);

  const saveEvents = (newEvents: CalendarEvent[]) => {
      setEvents(newEvents);
      localStorage.setItem('padhakuPortal_events', JSON.stringify(newEvents));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setIsModalOpen(true);
  };

  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDate || !newEventTitle) return;
      
      const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: newEventTitle,
          date: selectedDate,
          type: newEventType
      };
      
      const updatedEvents = [...events, newEvent];
      saveEvents(updatedEvents);
      
      setNewEventTitle('');
      setIsModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
      const updated = events.filter(e => e.id !== id);
      saveEvents(updated);
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50/50 dark:bg-navy-900/30 border border-gray-100 dark:border-navy-800"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(e => 
        e.date.getDate() === day && 
        e.date.getMonth() === month && 
        e.date.getFullYear() === year
      );
      
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div 
            key={day} 
            onClick={() => handleDayClick(day)}
            className={`h-24 md:h-32 border border-gray-100 dark:border-navy-800 p-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-navy-800 relative group ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-white dark:bg-navy-900'}`}
        >
            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                {day}
            </div>
            
            <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)] scrollbar-hide">
                {dayEvents.map(event => (
                    <div 
                        key={event.id} 
                        className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate font-medium ${
                            event.type === 'exam' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            event.type === 'assignment' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                        title={event.title}
                    >
                        {event.title}
                    </div>
                ))}
            </div>

            <button className="absolute bottom-2 right-2 p-1 bg-brand-orange text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <Plus className="h-3 w-3" />
            </button>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-8 animate-fade-in-up">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-display font-bold text-navy-900 dark:text-white flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8 text-brand-orange" /> Study Planner
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Track your exams, assignments, and study sessions.</p>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-navy-900 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-navy-800">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors">
                    <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-lg font-bold text-navy-900 dark:text-white min-w-[140px] text-center">
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors">
                    <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-gray-200 dark:border-navy-800 overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-navy-950 border-b border-gray-200 dark:border-navy-800">
                {DAYS.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            
            {/* Calendar Body */}
            <div className="grid grid-cols-7">
                {renderCalendarDays()}
            </div>
        </div>

        {/* Upcoming List */}
        <div className="mt-8 bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-100 dark:border-navy-800">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" /> Upcoming Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                    .filter(e => e.date >= new Date())
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 3)
                    .map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-navy-800/50 border border-gray-100 dark:border-navy-800">
                             <div>
                                 <div className="font-bold text-navy-900 dark:text-white mb-1">{event.title}</div>
                                 <div className="text-xs text-gray-500 dark:text-gray-400">
                                     {event.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                 </div>
                             </div>
                             <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                 event.type === 'exam' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                             }`}>
                                 {event.type}
                             </div>
                        </div>
                    ))}
                 {events.filter(e => e.date >= new Date()).length === 0 && (
                     <p className="text-gray-400 text-sm">No upcoming events scheduled.</p>
                 )}
            </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <div className="relative bg-white dark:bg-navy-900 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in-up border border-gray-100 dark:border-navy-700">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                          Add Event for {selectedDate?.toLocaleDateString()}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                  </div>
                  
                  <form onSubmit={handleAddEvent}>
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label>
                          <input 
                              type="text" 
                              value={newEventTitle}
                              onChange={(e) => setNewEventTitle(e.target.value)}
                              className="w-full p-2 rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
                              placeholder="e.g. Math Midsem"
                              required
                              autoFocus
                          />
                      </div>
                      
                      <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                          <div className="flex gap-2">
                              {(['study', 'exam', 'assignment'] as const).map(type => (
                                  <button
                                      key={type}
                                      type="button"
                                      onClick={() => setNewEventType(type)}
                                      className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border ${
                                          newEventType === type 
                                            ? 'bg-navy-900 text-white border-navy-900 dark:bg-brand-orange dark:border-brand-orange' 
                                            : 'bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-navy-700'
                                      }`}
                                  >
                                      {type}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <button type="submit" className="w-full py-2.5 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-hover shadow-md">
                          Add Event
                      </button>
                  </form>
                  
                  {/* Events for this day list */}
                  <div className="mt-6 border-t border-gray-100 dark:border-navy-700 pt-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Events on this day</h4>
                      <div className="space-y-2">
                           {selectedDate && events.filter(e => 
                                e.date.getDate() === selectedDate.getDate() && 
                                e.date.getMonth() === selectedDate.getMonth() &&
                                e.date.getFullYear() === selectedDate.getFullYear()
                            ).map(e => (
                                <div key={e.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-navy-800 rounded-lg">
                                    <span className="text-navy-900 dark:text-white">{e.title}</span>
                                    <button onClick={() => handleDeleteEvent(e.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                            {selectedDate && events.filter(e => 
                                e.date.getDate() === selectedDate.getDate() && 
                                e.date.getMonth() === selectedDate.getMonth()
                            ).length === 0 && <p className="text-xs text-gray-400">No events.</p>}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Planner;
