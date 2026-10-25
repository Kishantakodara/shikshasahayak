
import React, { createContext, useContext, useEffect, useState } from 'react';

interface GamificationContextType {
  streak: number;
  points: number;
  addPoints: (amount: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);

  useEffect(() => {
    // Load from local storage
    const savedStreak = parseInt(localStorage.getItem('padhakuPortal_streak') || '0');
    const savedPoints = parseInt(localStorage.getItem('padhakuPortal_points') || '0');
    const savedLastLogin = localStorage.getItem('padhakuPortal_lastLogin');

    setPoints(savedPoints);

    // Streak Logic
    const today = new Date().toISOString().split('T')[0];
    
    if (savedLastLogin !== today) {
      if (savedLastLogin) {
        const last = new Date(savedLastLogin);
        const current = new Date();
        const diffTime = Math.abs(current.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1 || (diffDays === 0 && savedLastLogin !== today)) {
             // Consecutive day
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             const yesterdayStr = yesterday.toISOString().split('T')[0];

             if (savedLastLogin === yesterdayStr) {
                 const newStreak = savedStreak + 1;
                 setStreak(newStreak);
                 localStorage.setItem('padhakuPortal_streak', newStreak.toString());
             } else {
                 // Streak broken
                 setStreak(1);
                 localStorage.setItem('padhakuPortal_streak', '1');
             }
        } else {
            // Missed a day or more
             setStreak(1);
             localStorage.setItem('padhakuPortal_streak', '1');
        }
      } else {
        // First time
        setStreak(1);
        localStorage.setItem('padhakuPortal_streak', '1');
      }
      setLastLoginDate(today);
      localStorage.setItem('padhakuPortal_lastLogin', today);
    } else {
        setStreak(savedStreak);
        setLastLoginDate(savedLastLogin);
    }
  }, []);

  const addPoints = (amount: number) => {
    setPoints(prev => {
        const newPoints = prev + amount;
        localStorage.setItem('padhakuPortal_points', newPoints.toString());
        return newPoints;
    });
  };

  return (
    <GamificationContext.Provider value={{ streak, points, addPoints }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
