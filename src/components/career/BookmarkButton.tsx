import React, { useState, useRef } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';

interface BookmarkButtonProps {
  itemId: string;
  itemTitle: string;
  itemType?: 'internship' | 'job';
  isSaved: boolean;
  onToggle: (id: string, e: React.MouseEvent) => Promise<boolean | void> | void;
  variant?: 'icon-only' | 'button-with-text';
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  itemId,
  itemTitle,
  itemType = 'internship',
  isSaved,
  onToggle,
  variant = 'icon-only',
  className = '',
}) => {
  const [isPending, setIsPending] = useState(false);
  const clickLockRef = useRef(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent duplicate rapid clicks
    if (clickLockRef.current || isPending) return;
    clickLockRef.current = true;
    setIsPending(true);

    try {
      await onToggle(itemId, e);
    } catch (err) {
      console.error(`Failed to update bookmark for ${itemTitle}:`, err);
    } finally {
      setIsPending(false);
      // Short debouncing window
      setTimeout(() => {
        clickLockRef.current = false;
      }, 350);
    }
  };

  const actionText = isSaved ? 'Remove saved internship' : 'Save for later';
  const accessibleLabel = isSaved
    ? `Remove ${itemTitle} from saved ${itemType} bookmarks`
    : `Save ${itemTitle} ${itemType} for later`;

  if (variant === 'button-with-text') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={accessibleLabel}
        aria-pressed={isSaved}
        className={`px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        ) : isSaved ? (
          <BookmarkCheck className="w-4 h-4 text-orange-600 dark:text-orange-400 fill-orange-500/20" />
        ) : (
          <Bookmark className="w-4 h-4 text-slate-500" />
        )}
        <span>{isSaved ? 'Saved' : 'Save for later'}</span>
      </button>
    );
  }

  // Icon-only variant for card corner
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={accessibleLabel}
      aria-pressed={isSaved}
      title={actionText}
      className={`p-2 rounded-xl transition text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed ${
        isSaved ? 'text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20' : ''
      } ${className}`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-orange-500" />
      ) : isSaved ? (
        <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 fill-orange-500/20" />
      ) : (
        <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  );
};

export default BookmarkButton;
