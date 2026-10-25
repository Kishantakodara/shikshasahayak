import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  ListChecks,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

interface Tip {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const tips: Tip[] = [
  {
    id: 'active-recall',
    title: 'Use Active Recall, Not Passive Re-reading',
    content:
      'Instead of re-reading your notes, close the book and try to recall what you just studied. Write it down or say it out loud. This reveals weak spots quickly and turns revision into a test of understanding.',
    icon: <Brain className="h-6 w-6" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
  },
  {
    id: 'spaced-repetition',
    title: 'Master Spaced Repetition',
    content:
      'Do not cram everything into one sitting. Review material on Day 1, Day 3, Day 7, Day 14, and Day 30 where possible. Each planned review makes weak areas easier to notice.',
    icon: <Clock className="h-6 w-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
  },
  {
    id: 'pomodoro',
    title: 'Use Focus Blocks',
    content:
      'Study for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 20-30 minute break. During breaks, avoid your phone, stretch, drink water, or look away from the screen.',
    icon: <Coffee className="h-6 w-6" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
  },
  {
    id: 'past-papers',
    title: 'Solve PYQs Before Random Practice',
    content:
      'Previous Year Questions show the style and depth of questions your subject usually asks. Solve at least the last 5 years under timed conditions, then tag repeated topics for priority revision.',
    icon: <Target className="h-6 w-6" />,
    color: 'text-brand-orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/40',
  },
  {
    id: 'teach-it',
    title: 'Teach the Concept Simply',
    content:
      'Pick a topic and explain it in simple language. If you stumble, you have found a gap. Go back, understand it better, and explain again until the idea feels clear.',
    icon: <BookOpen className="h-6 w-6" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
  },
  {
    id: 'formula-sheet',
    title: 'Build Your Own Formula Sheet',
    content:
      'Do not depend only on pre-made formula sheets. Create your own with formulas, units, assumptions, and one example use case. The act of organizing it is itself a revision session.',
    icon: <ListChecks className="h-6 w-6" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
  },
  {
    id: 'morning-advantage',
    title: 'Use Your Highest-Energy Hours',
    content:
      'Many students focus better earlier in the day. Try scheduling tougher subjects such as mathematics, circuits, or thermodynamics for your highest-energy hours and save light revision for later.',
    icon: <Zap className="h-6 w-6" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
  },
  {
    id: 'exam-strategy',
    title: 'Use a Clear Exam Hall Strategy',
    content:
      'Scan the paper first. Attempt the questions you know best if the paper allows choice. For long answers, use headings, diagrams, formulas, and a final conclusion so your method is easy to follow.',
    icon: <Trophy className="h-6 w-6" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
  },
];

const mistakes = [
  'Highlighting everything and assuming the topic is learned',
  'Studying without a plan and reading random chapters',
  'Pulling all-nighters before the exam and losing recall quality',
  'Skipping numerical practice and only reading theory',
  'Comparing your preparation to others on the night before',
  'Ignoring the syllabus and preparing topics not relevant to your paper',
];

const habits = [
  'Keep a consistent sleep routine during the final week',
  'Move your body for 20-30 minutes when possible to reset attention',
  'Stay hydrated and keep meals simple before long study sessions',
  'Review the previous session for 5 minutes before starting new material',
  'Set a weekly goal and break it into daily outcomes',
  'Keep your phone away while studying so notifications do not break focus',
];

const faqs: FAQ[] = [
  {
    question: 'How many days before exams should I start studying?',
    answer:
      'Three to four weeks gives you enough time for learning, recall, PYQs, and mock tests. If you only have one week, focus on high-frequency PYQ topics, formulas, diagrams, and timed answer writing.',
  },
  {
    question: 'Should I study in a group or alone?',
    answer:
      'Use both. Study alone for first learning and recall. Then discuss selected topics with a group to test explanations, compare PYQ patterns, and find gaps you missed.',
  },
  {
    question: 'What should I do if I panic during the exam?',
    answer:
      'Pause, breathe slowly, and reread the question. Write the given data, relevant formula, diagram, or definition first. Small correct steps can restore momentum and may earn partial marks.',
  },
  {
    question: 'How do I handle a subject I dislike?',
    answer:
      'Break it into the smallest useful tasks: one formula set, one diagram, one solved example, and one PYQ pattern. Start with scoring topics so progress becomes visible.',
  },
  {
    question: 'Is it okay to skip a topic completely?',
    answer:
      'Strategic skipping is risky. If time is limited, rank topics by PYQ frequency, syllabus importance, difficulty, and your current confidence before deciding what gets reduced attention.',
  },
];

const ExamTips: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-navy-950 animate-slide-up pb-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 dark:from-yellow-600 dark:via-orange-700 dark:to-red-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            ShikshaSahayak Study Guide
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
            Exam Tips That Actually Help
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Practical revision methods, PYQ strategy, answer presentation, and exam-week habits for engineering students.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 rounded-full bg-brand-orange" />
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">Core Study Strategies</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip) => (
              <article
                key={tip.id}
                className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${tip.bgColor} ${tip.color} group-hover:scale-110 transition-transform`}>
                  {tip.icon}
                </div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-3">{tip.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{tip.content}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">Common Mistakes to Avoid</h2>
            </div>
            <ul className="space-y-3">
              {mistakes.map((mistake) => (
                <li key={mistake} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  {mistake}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">Habits That Make Revision Easier</h2>
            </div>
            <ul className="space-y-3">
              {habits.map((habit) => (
                <li key={habit} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {habit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-navy-800 dark:to-navy-900 rounded-3xl border border-indigo-100 dark:border-navy-700 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">Night Before the Exam Checklist</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Revise your handwritten formula sheet once',
              'Go through marked PYQ solutions and error-log notes',
              'Prepare your exam kit: pens, ID card, admit card, and calculator if allowed',
              'Set two alarms with enough travel buffer',
              'Eat a light but filling dinner',
              'Avoid starting large new topics late at night',
              'Use 10 minutes for breathing, prayer, meditation, or quiet reset',
              'Sleep early enough to reach the exam hall alert',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white dark:bg-navy-900/50 rounded-xl p-3 border border-white dark:border-navy-700">
                <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 rounded-full bg-brand-orange" />
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-bold text-navy-900 dark:text-white hover:text-brand-orange transition-colors"
                >
                  <span>{faq.question}</span>
                  {openFaq === index
                    ? <ChevronUp className="h-5 w-5 shrink-0 text-brand-orange" />
                    : <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-navy-800 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-navy-900 to-blue-900 dark:from-navy-800 dark:to-navy-950 rounded-3xl p-10 relative overflow-hidden">
          <div className="relative z-10">
            <Trophy className="h-12 w-12 text-brand-orange mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Start with one topic today</h2>
            <p className="text-blue-100 max-w-lg mx-auto mb-6 leading-relaxed">
              Consistent recall, PYQ practice, and clear answer presentation are more reliable than last-minute cramming.
            </p>
            <a
              href="https://chat.whatsapp.com/JKjcvjun6roIkbat7O59uJ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-orange text-white px-8 py-3.5 rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-orange-500/20"
            >
              <Sparkles className="h-5 w-5" />
              Join Study Community
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExamTips;
