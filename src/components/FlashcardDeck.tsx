
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, X, CheckCircle } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onClose: () => void;
  title: string;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onClose, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setTimeout(() => setCurrentIndex(currentIndex - 1), 300);
    }
  };

  if (completed) {
    return (
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-8 border border-gray-100 dark:border-navy-800 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">Great Job!</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">You've reviewed all the flashcards for this section.</p>
            <button 
                onClick={onClose}
                className="bg-brand-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-hover transition-colors"
            >
                Finish Review
            </button>
        </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="relative animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-navy-900 dark:text-white">{title}</h3>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Card Area */}
      <div 
        className="relative w-full h-80 perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full text-center transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-navy-800 border-2 border-gray-100 dark:border-navy-700 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 group-hover:border-brand-orange/30 transition-colors">
             <span className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-4">Question</span>
             <p className="text-xl font-medium text-navy-900 dark:text-white leading-relaxed">
                {currentCard.question}
             </p>
             <p className="absolute bottom-6 text-xs text-gray-400">Click to flip</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-navy-900 dark:bg-navy-950 border-2 border-navy-800 dark:border-navy-700 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 rotate-y-180">
             <span className="text-xs font-bold text-green-400 uppercase tracking-wider mb-4">Answer</span>
             <p className="text-lg font-medium text-white leading-relaxed">
                {currentCard.answer}
             </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-6">
        <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
        >
            <ChevronLeft className="h-6 w-6" />
        </button>

        <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2 text-sm font-medium text-brand-orange hover:text-brand-hover"
        >
            <RotateCw className="h-4 w-4" /> Flip Card
        </button>

        <button 
            onClick={handleNext}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 text-navy-900 dark:text-white"
        >
            <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
