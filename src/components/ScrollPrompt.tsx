import React from 'react';

interface ScrollPromptProps {
  targetId?: string;
}

/**
 * کامپوننت بازطراحی‌شده دعوت به اسکرول
 * ویژگی‌ها:
 * ۱. سایز بزرگتر، خوانایی بالا و تایپوگرافی درشت و شکیل (بر اساس خواسته کاربر)
 * ۲. آیکون مدرن و تعاملی اسکرول موس با نشانگر متحرک غلتک + فلش‌های نئونی تپنده
 * ۳. امکان کلیک مستقیم برای هدایت روان به بخش خدمات (#services)
 */
export const ScrollPrompt: React.FC<ScrollPromptProps> = ({ targetId = 'services' }) => {
  const handleScroll = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleScroll}
      aria-label="اسکرول به بخش خدمات استودیو"
      className="group relative flex items-center gap-3.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-900/70 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-400/50 backdrop-blur-md transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.25)] focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
    >
      {/* هاله نوری پنهان پشت دکمه */}
      <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/15 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />

      {/* ۱. متن درشت‌تر و جذاب */}
      <span className="relative text-sm sm:text-base font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors tracking-tight">
        اسکرول کن تا از خدمات ما شگفت‌زده بشی
      </span>

      {/* ۲. آیکون پیشرفته و بسیار جذاب اسکرول موس و فلش‌های نئونی */}
      <div className="relative flex items-center gap-1.5 shrink-0">
        
        {/* کپسول موس تعاملی با ویل متحرک */}
        <div className="w-5 h-7.5 sm:w-5.5 sm:h-8 rounded-full border-1.5 border-cyan-400/70 group-hover:border-cyan-300 flex justify-center p-1 bg-black/40 shadow-[0_0_10px_rgba(0,229,255,0.25)] transition-colors">
          {/* غلتک متحرک موس */}
          <div className="w-1 h-2 rounded-full bg-cyan-400 group-hover:bg-cyan-200 animate-bounce shadow-[0_0_8px_#00e5ff]" />
        </div>

        {/* دو فلش جهت‌نمای آبشاری متحرک */}
        <div className="flex flex-col -space-y-1 text-cyan-400 group-hover:text-cyan-300">
          <svg
            className="w-3.5 h-3.5 transform group-hover:translate-y-0.5 transition-transform duration-200 animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <svg
            className="w-3.5 h-3.5 opacity-60 transform group-hover:translate-y-1 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

      </div>
    </button>
  );
};
