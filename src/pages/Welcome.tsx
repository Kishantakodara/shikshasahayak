import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { GraduationCap, Bot, FileText, BookOpen, Users } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const hasSeenSplash = sessionStorage.getItem('splashShown') === 'true';

  useEffect(() => {
    if (hasSeenSplash) {
      navigate('/', { replace: true });
      return;
    }

    sessionStorage.setItem('splashShown', 'true');

    // Initial state
    anime.set('.splash-logo', { scale: 0, opacity: 0, rotate: -180 });
    anime.set('.splash-text span', { opacity: 0, translateY: 50 });
    anime.set('.splash-subtext', { opacity: 0 });
    anime.set('.splash-feature', { opacity: 0, translateX: -40 });
    anime.set('.splash-loader', { width: '0%' });

    const tl = anime.timeline({
      easing: 'easeOutExpo',
      complete: () => {
        // Exit animation
        anime({
          targets: '.splash-container',
          opacity: 0,
          scale: 1.50,
          duration: 800,
          easing: 'easeInOutQuad',
          complete: () => {
            navigate('/');
          }
        });
      }
    });

    tl.add({
      targets: '.splash-logo',
      scale: [0, 1],
      opacity: [0, 1],
      rotate: [-180, 0],
      duration: 1200,
      easing: 'easeOutElastic(1, .5)'
    })
      .add({
        targets: '.splash-text span',
        opacity: [0, 1],
        translateY: [50, 0],
        delay: anime.stagger(50),
        duration: 800,
      }, '-=600')
      .add({
        targets: '.splash-subtext',
        opacity: [0, 1],
        duration: 600,
      }, '-=400')
      .add({
        targets: '.splash-feature',
        opacity: [0, 1],
        translateX: [-40, 0],
        delay: anime.stagger(150),
        duration: 800,
      }, '-=200')
      .add({
        targets: '.splash-loader',
        width: ['0%', '100%'],
        duration: 2000,
        easing: 'easeInOutQuart'
      }, '-=800');

  }, [navigate, hasSeenSplash]);

  if (hasSeenSplash) {
    return null; // Will navigate away immediately via useEffect
  }

  return (
    <div className="splash-container min-h-screen bg-navy-950 flex flex-col items-center justify-center relative overflow-hidden z-50">
      {/* Cool background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[10%] w-[20rem] sm:w-[30rem] h-[20rem] sm:h-[30rem] bg-brand-orange/10 rounded-full blur-[80px] sm:blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[20rem] sm:w-[30rem] h-[20rem] sm:h-[30rem] bg-blue-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-4 sm:px-6 py-6 max-h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="splash-logo mb-6 shrink-0">
          <img src="/logo.png" alt="ShikshaSahayak Logo" className="h-48 w-auto sm:h-64 md:h-72 object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]" />
        </div>

        <h1 className="splash-text text-3xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-1 sm:mb-2 flex justify-center tracking-tight shrink-0">
          {'ShikshaSahayak'.split('').map((char, i) => (
            <span key={i} className={`inline-block ${i >= 7 ? 'text-brand-orange' : ''}`}>{char}</span>
          ))}
        </h1>

        <p className="splash-subtext text-xs sm:text-sm text-gray-400 font-medium tracking-widest uppercase mb-8 text-center shrink-0">
          The Smarter Way to Study
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg mb-8 shrink-0">
          <div className="splash-feature flex items-center gap-3 sm:gap-4 bg-navy-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-navy-800 backdrop-blur-sm">
            <div className="bg-blue-500/20 p-2 sm:p-2.5 rounded-lg sm:rounded-xl"><Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" /></div>
            <span className="font-bold text-gray-200 text-sm sm:text-lg">AI-Powered Tutor</span>
          </div>
          <div className="splash-feature flex items-center gap-3 sm:gap-4 bg-navy-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-navy-800 backdrop-blur-sm">
            <div className="bg-brand-orange/20 p-2 sm:p-2.5 rounded-lg sm:rounded-xl"><FileText className="h-5 w-5 sm:h-6 sm:w-6 text-brand-orange" /></div>
            <span className="font-bold text-gray-200 text-sm sm:text-lg">Largest PYQ Repository</span>
          </div>
          <div className="splash-feature flex items-center gap-3 sm:gap-4 bg-navy-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-navy-800 backdrop-blur-sm">
            <div className="bg-green-500/20 p-2 sm:p-2.5 rounded-lg sm:rounded-xl"><BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" /></div>
            <span className="font-bold text-gray-200 text-sm sm:text-lg">Organized Study Notes</span>
          </div>
          <div className="splash-feature flex items-center gap-3 sm:gap-4 bg-navy-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-navy-800 backdrop-blur-sm">
            <div className="bg-purple-500/20 p-2 sm:p-2.5 rounded-lg sm:rounded-xl"><Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" /></div>
            <span className="font-bold text-gray-200 text-sm sm:text-lg">Active Student Community</span>
          </div>
        </div>

        <div className="w-full max-w-[200px] sm:max-w-xs h-1.5 bg-navy-800 rounded-full overflow-hidden shrink-0">
          <div className="splash-loader h-full bg-gradient-to-r from-brand-orange to-red-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
