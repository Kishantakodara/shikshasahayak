import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Star, Send } from 'lucide-react';

const Feedback: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);
    formData.append('access_key', '510341b5-dde2-41cf-9465-a2f7f6fee02c');
    formData.append('rating', rating.toString());
    formData.append('subject', 'New Feedback from ShikshaSahayak');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data: any = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        (e.target as HTMLFormElement).reset();
        setRating(0);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-navy-900 dark:text-white mb-4">We Value Your Feedback</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Help us make ShikshaSahayak better. Let us know how the website is performing and what features you'd love to see next!
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-navy-800">
          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {submitStatus === 'success' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl flex items-center gap-3">
                <CheckCircle className="h-6 w-6 shrink-0" />
                <span>Thank you for your feedback! We truly appreciate your input.</span>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <span>Something went wrong. Please try submitting again later.</span>
              </div>
            )}

            {/* Rating Section */}
            <div>
              <label className="block text-lg font-bold text-navy-900 dark:text-white mb-3">
                1. How would you rate your overall experience? *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-brand-orange text-brand-orange'
                          : 'text-gray-300 dark:text-navy-700'
                      } transition-colors duration-200`}
                    />
                  </button>
                ))}
              </div>
              <input type="hidden" name="overall_rating" value={rating} required />
            </div>

            {/* Most Used Feature */}
            <div>
              <label className="block text-lg font-bold text-navy-900 dark:text-white mb-3">
                2. Which feature do you use the most? *
              </label>
              <select 
                name="most_used_feature" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
                required
              >
                <option value="" disabled selected>Select a feature...</option>
                <option value="Study Notes">Study Notes</option>
                <option value="PYQs">Previous Year Questions (PYQs)</option>
                <option value="AI Chat">AI Chat Assistant</option>
                <option value="Planner">Study Planner</option>
                <option value="Whiteboard">Digital Whiteboard</option>
                <option value="Exam Tips">Exam Tips</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Ease of Use */}
            <div>
              <label className="block text-lg font-bold text-navy-900 dark:text-white mb-3">
                3. Are you able to find notes/PYQs easily?
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                {['Yes, very easily', 'Somewhat', 'No, it is difficult'].map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="ease_of_finding_resources" 
                      value={option}
                      className="w-5 h-5 text-brand-orange focus:ring-brand-orange border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Assistant Performance */}
            <div>
              <label className="block text-lg font-bold text-navy-900 dark:text-white mb-3">
                4. How is the performance of the AI Chat Assistant?
              </label>
              <select 
                name="ai_performance" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
              >
                <option value="" disabled selected>Select performance...</option>
                <option value="Excellent">Excellent - Very Helpful</option>
                <option value="Good">Good - Sometimes helpful</option>
                <option value="Average">Average - Needs improvement</option>
                <option value="Poor">Poor - Rarely accurate</option>
                <option value="Haven't Used">I haven't used it</option>
              </select>
            </div>

            {/* Bugs or Issues */}
            <div>
              <label className="block text-lg font-bold text-navy-900 dark:text-white mb-3">
                5. Did you encounter any bugs, broken links, or issues on mobile?
              </label>
              <textarea 
                name="issues_encountered" 
                rows={3} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all resize-none" 
                placeholder="Please describe any issues you faced..."
              ></textarea>
            </div>

            {/* Future Features */}
            <div>
              <label className="block text-lg font-bold text-navy-900 dark:text-white mb-3">
                6. What new feature would you like us to add next?
              </label>
              <textarea 
                name="feature_requests" 
                rows={3} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all resize-none" 
                placeholder="Share your ideas..."
              ></textarea>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-lg font-bold text-navy-900 dark:text-white mb-3">
                7. Email Address (Optional - if you'd like us to reply)
              </label>
              <input 
                type="email" 
                name="email" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all" 
                placeholder="you@example.com" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || rating === 0}
              className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Submitting Feedback...</>
              ) : (
                <><Send className="h-5 w-5" /> Submit Feedback</>
              )}
            </button>
            {rating === 0 && (
              <p className="text-center text-red-500 text-sm mt-2">Please provide an overall rating to submit.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
