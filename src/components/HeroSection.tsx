import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';

interface HeroSectionProps {
  onOpenOrderModal: () => void;
  onOpenChat: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenOrderModal, onOpenChat }) => {
  const { isLight } = useTheme();

  const scrollToServices = () => {
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const metrics = [
    { value: '+۱۴۰', label: 'پروژه موفق سازمانی و استارتاپی' },
    { value: '۹۹.۴٪', label: 'رضایت کارفرمایان و کیفیت تضمینی' },
    { value: '4K / 8K', label: 'رزولوشن و استانداردهای سینمایی' },
    { value: '۱۰۰٪', label: 'تحویل سورس و فایل‌های لایه‌باز' },
  ];

  return (
    <section aria-label="معرفی استودیو دیزاین و خدمات دیجیتال" className="relative pt-4 sm:pt-8 pb-12 sm:pb-16">
      {/* نشانگر بالای تیتر با ورود نرم */}
      <ScrollReveal delay={0.1} direction="down" distance={20} className="flex justify-center mb-5">
        <div
          className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md transition-colors ${
            isLight
              ? 'bg-white/90 border-slate-200/90 text-slate-700 shadow-[0_4px_20px_rgba(15,23,42,0.06)]'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 shadow-sm'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-sky-500' : 'bg-cyan-400'}`} />
          <span>استودیو تخصصی دیزاین، تیزرسازی و مهندسی دیجیتال</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>·</span>
          <span className={`font-mono text-[11px] font-bold ${isLight ? 'text-sky-600' : 'text-cyan-300'}`}>
            VERSION 2026
          </span>
        </div>
      </ScrollReveal>

      {/* تیتر اصلی با ابهت با ورود نرم */}
      <ScrollReveal delay={0.25} direction="down" distance={30} className="text-center max-w-4xl mx-auto px-4 mb-6">
        <h1
          className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.25] sm:leading-[1.2] transition-colors ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
          style={{ textWrap: 'balance' }}
        >
          خلق استانداردهای بصری و{' '}
          <span
            className={
              isLight
                ? 'bg-gradient-to-l from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent'
                : 'bg-gradient-to-l from-cyan-400 via-sky-300 to-cyan-200 bg-clip-text text-transparent'
            }
          >
            پلتفرم‌های دیجیتال
          </span>{' '}
          نسل بعد
        </h1>
      </ScrollReveal>

      {/* پاراگراف توضیحات ارزشی */}
      <ScrollReveal delay={0.4} direction="down" distance={25} className="text-center max-w-2xl mx-auto px-4 mb-9">
        <p
          className={`text-base sm:text-lg leading-relaxed font-normal transition-colors ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          تلفیق رندرینگ سه‌بعدی، تولید تیزرهای سینمایی، هویت بصری ممتاز و مهندسی نرم‌افزارهای مدرن تحت وب برای کسب‌وکارهایی که می‌خواهند فراتر از استانداردهای معمول بدرخشند.
        </p>
      </ScrollReveal>

      {/* دکمه‌های اقدام کلیدی */}
      <ScrollReveal delay={0.55} direction="down" distance={20} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 px-4 mb-14">
        <button
          onClick={scrollToServices}
          className={`w-full sm:w-auto px-7 py-3.5 min-h-[48px] rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95 ${
            isLight
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_10px_28px_rgba(2,132,199,0.32)] hover:shadow-[0_14px_34px_rgba(2,132,199,0.42)]'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5)]'
          }`}
        >
          <span>مشاهده خدمات و ثبت سفارش</span>
          <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        <button
          onClick={onOpenChat}
          className={`w-full sm:w-auto px-6 py-3.5 min-h-[48px] rounded-2xl border font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 ${
            isLight
              ? 'bg-white/90 hover:bg-sky-50/70 text-slate-800 hover:text-sky-700 border-slate-200/90 hover:border-sky-300 shadow-[0_6px_20px_rgba(15,23,42,0.05)]'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 hover:border-cyan-500/40'
          }`}
        >
          <svg className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>مشاوره و استعلام مستقیم با مدیریت</span>
        </button>
      </ScrollReveal>

      {/* نوار اثبات آماری و شاخص‌های عددی استودیو */}
      <ScrollReveal delay={0.7} direction="down" distance={25} className="max-w-5xl mx-auto px-4">
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl border backdrop-blur-xl transition-colors ${
            isLight
              ? 'bg-white/90 border-slate-200/90 shadow-[0_18px_45px_rgba(15,23,42,0.07)]'
              : 'bg-[#080D19]/80 border-slate-800/80 shadow-[0_15px_40px_rgba(0,0,0,0.4)]'
          }`}
        >
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 text-center flex flex-col justify-center items-center ${
                idx !== metrics.length - 1
                  ? isLight
                    ? 'md:border-l md:border-slate-200/80'
                    : 'md:border-l md:border-slate-800/80'
                  : ''
              }`}
            >
              <span
                className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mb-1 dir-ltr inline-block tabular-nums ${
                  isLight ? 'text-sky-600' : 'text-cyan-300'
                }`}
              >
                {m.value}
              </span>
              <span
                className={`text-xs leading-snug ${
                  isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
                }`}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};
