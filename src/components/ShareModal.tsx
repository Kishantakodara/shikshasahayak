
import React, { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  url?: string; // Optional, defaults to current window location
}


const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`Check out this resource on UniStack: ${title}`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      url: `https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`,
      color: 'bg-[#25D366]',
      hover: 'hover:bg-[#1ebe57]',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      )
    },
    {
      name: 'Telegram',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-[#0088cc]',
      hover: 'hover:bg-[#0077b5]',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      )
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'bg-black dark:bg-white',
      hover: 'hover:opacity-80',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white dark:text-black">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'bg-[#0077b5]',
      hover: 'hover:bg-[#006396]',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in-up">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 border border-gray-100 dark:border-navy-700">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-1">Share Resource</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 truncate">{title}</p>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform transform group-hover:scale-110 ${link.color} ${link.hover}`}>
                {link.icon}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{link.name}</span>
            </a>
          ))}
        </div>

        {/* Copy Link Section */}
        <div className="relative">
          <div className="flex items-center bg-gray-100 dark:bg-navy-950 border border-gray-200 dark:border-navy-700 rounded-xl p-1 pr-2">
            <div className="p-2 text-gray-400">
               <LinkIcon className="h-4 w-4" />
            </div>
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="flex-1 bg-transparent border-none text-sm text-gray-600 dark:text-gray-300 focus:ring-0 truncate"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-navy-700'
              }`}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
