
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-500 dark:text-gray-400 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 dark:focus-visible:ring-offset-navy-950 group overflow-hidden cursor-pointer"
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* In Dark mode, show Sun icon to switch to Light mode */}
        <Sun 
          className={`absolute inset-0 h-5 w-5 text-amber-400 transition-all duration-300 transform ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`} 
        />
        {/* In Light mode, show Moon icon to switch to Dark mode */}
        <Moon 
          className={`absolute inset-0 h-5 w-5 text-slate-700 transition-all duration-300 transform ${
            !isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
          }`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
