import React, { useState, useEffect } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';
import {
  ENTHUSIASM_HOOKS,
  computeIrregularDelayMs,
  nextSeededRandom,
} from '../utils/patternInterruptEngine';

interface HeroSectionProps {
  onOpenOrderModal: () => void;
  onOpenChat: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenChat }) => {
  const { isLight } = useTheme();
  const [activeHookIdx, setActiveHookIdx] = useState<number>(() =>
    Math.floor(Math.random() * ENTHUSIASM_HOOKS.length)
  );
  const [joltedMetricIdx, setJoltedMetricIdx] = useState<number | null>(null);
  const [joltWordActive, setJoltWordActive] = useState<boolean>(false);

  useEffect(() => {
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    let seed = (Date.now() ^ 0x5f3759df) >>> 0;
    let timer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    const scheduleNextHeroJolt = () => {
      const step = nextSeededRandom(seed);
      seed = step.nextSeed;
      // در موبایل فاصله زمانی دو برابر می‌شود تا باتری و پردازنده مصرف نشود
      const delay = computeIrregularDelayMs(
        seed,
        isMobileViewport ? 4800 : 2200,
        isMobileViewport ? 11000 : 6400
      );

      timer = setTimeout(() => {
        if (document.hidden) {
          scheduleNextHeroJolt();
          return;
        }
        const pick = nextSeededRandom(seed);
        seed = pick.nextSeed;

        if (pick.value < 0.58) {
          const mIdx = Math.floor((pick.value / 0.58) * 4);
          setJoltedMetricIdx(mIdx);
          setJoltWordActive(false);
        } else {
          setJoltedMetricIdx(null);
          setJoltWordActive(true);
        }

        clearTimer = setTimeout(() => {
          setJoltedMetricIdx(null);
          setJoltWordActive(false);
          scheduleNextHeroJolt();
        }, 2100);
      }, delay);
    };

    scheduleNextHeroJolt();

    const hookInterval = setInterval(() => {
      if (!document.hidden) {
        setActiveHookIdx((prev) => (prev + 1) % ENTHUSIASM_HOOKS.length);
      }
    }, isMobileViewport ? 12000 : 8500);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
      clearInterval(hookInterval);
    };
  }, []);

  const scrollToServices = () => {
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const metrics = [
    { value: '+۱۴۰', label: 'پروژه تجاری اجراشده در تراز اول' },
    { value: '0.7s', label: 'میانگین سرعت لود و واکنش‌پذیری' },
    { value: '4K / 8K', label: 'خروجی رندر و تدوین با جزئیات دقیق' },
    { value: '۱۰۰٪', label: 'تحویل کامل سورس و فایل لایه‌باز' },
  ];

  return (
    <section aria-label="معرفی استودیو دیزاین و خدمات دیجیتال" className="relative pt-3 sm:pt-6 pb-8 sm:pb-11">
      {/* نشانگر بالای تیتر با نمایش آنی در بدو ورود */}
      <ScrollReveal initialVisible delay={0} direction="down" distance={15} className="flex justify-center mb-4">
        <div
          className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-bold backdrop-blur-md transition-colors ${
            isLight
              ? 'bg-white/95 border-emerald-200/80 text-slate-800 shadow-[0_4px_20px_rgba(16,185,129,0.08)]'
              : 'bg-slate-900/90 border-emerald-500/35 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] animate-ping" />
          <span>مهندسی تصویر، رندرهای سه‌بعدی و توسعه وب با استاندارد جهانی</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>·</span>
          <span className={`font-mono text-[11px] font-black ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
            CONCEPT 2026
          </span>
        </div>
      </ScrollReveal>

      {/* تیتر اصلی با نمایش قطعی و آنی در بدو ورود */}
      <ScrollReveal initialVisible delay={0.05} direction="down" distance={20} className="text-center max-w-4xl mx-auto px-4 mb-5">
        <h1
          className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.32] sm:leading-[1.25] transition-colors ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
          style={{ textWrap: 'balance' }}
        >
          استودیو تخصصی{' '}
          <span
            className={
              isLight
                ? 'bg-gradient-to-l from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent'
                : 'bg-gradient-to-l from-emerald-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent'
            }
          >
            تیزرسازی تبلیغاتی، رندرهای سه‌بعدی
          </span>{' '}
          و طراحی پلتفرم‌های دیجیتال
        </h1>
      </ScrollReveal>

      {/* پاراگراف پرانرژی، تیز و اشتیاق‌محور با کنتراست بالا */}
      <ScrollReveal initialVisible delay={0.1} direction="down" distance={15} className="text-center max-w-2xl mx-auto px-4 mb-7">
        <p
          className={`text-sm sm:text-lg leading-relaxed font-medium transition-colors mb-2.5 ${
            isLight ? 'text-slate-700' : 'text-slate-100'
          }`}
        >
          ما لذت می‌بریم و مشتاقیم تا پروژه شما را به اثری تبدیل کنیم که خودتان از{' '}
          <span
            className={`transition-all duration-300 ease-out inline-block align-baseline ${
              joltWordActive
                ? 'text-red-500 font-black mx-2 sm:mx-3 px-1.5 underline decoration-red-500 decoration-2 underline-offset-4'
                : isLight
                ? 'text-emerald-700 font-extrabold mx-0.5 px-0'
                : 'text-emerald-300 font-extrabold mx-0.5 px-0'
            }`}
          >
            شگفتی و قدرتش هیجان‌زده شوید!
          </span>{' '}
          در بازاری که مخاطب در ۲ ثانیه اول تصمیم می‌گیرد، کیفیت بصری و سرعت اجرای شما مستقیماً نرخ فروش را تعیین می‌کند.
        </p>

        <p
          className={`text-xs sm:text-sm font-semibold transition-all duration-300 ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          ⚡ {ENTHUSIASM_HOOKS[activeHookIdx]}
        </p>
      </ScrollReveal>

      {/* دکمه‌های اقدام کلیدی با ابعاد بزرگ برای لمس راحت انگشت و افکت درخشش Aceternity */}
      <ScrollReveal initialVisible delay={0.15} direction="down" distance={15} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 px-4 mb-10">
        <button
          onClick={scrollToServices}
          data-cursor-text="خدمات"
          className={`btn-shimmer w-full sm:w-auto px-8 py-4 min-h-[52px] rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 ${
            isLight
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_10px_28px_rgba(5,150,105,0.32)] hover:shadow-[0_16px_36px_rgba(5,150,105,0.45)]'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(16,185,129,0.4)] hover:shadow-[0_0_42px_rgba(16,185,129,0.6)]'
          }`}
        >
          <span>مشاهده تعرفه‌ها و شروع پروژه</span>
          <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        <button
          onClick={onOpenChat}
          data-cursor-text="مشاوره"
          className={`w-full sm:w-auto px-7 py-4 min-h-[52px] rounded-2xl border font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 backdrop-blur-md hover:-translate-y-0.5 active:scale-95 ${
            isLight
              ? 'bg-white/95 hover:bg-emerald-50/70 text-slate-800 hover:text-emerald-700 border-slate-300/90 hover:border-emerald-400 shadow-[0_6px_20px_rgba(15,23,42,0.06)]'
              : 'bg-slate-900/95 hover:bg-slate-800 text-slate-100 hover:text-white border-slate-700/90 hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.18)]'
          }`}
        >
          <svg className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>گفت‌وگوی مستقیم با مدیریت</span>
        </button>
      </ScrollReveal>

      {/* نوار شاخص‌های اجرایی استودیو همراه با کنتراست واضح */}
      <ScrollReveal initialVisible delay={0.2} direction="down" distance={15} className="max-w-5xl mx-auto px-4">
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl border backdrop-blur-xl transition-colors ${
            isLight
              ? 'bg-white/95 border-emerald-100 shadow-[0_18px_45px_rgba(15,23,42,0.07)]'
              : 'bg-[#060D14]/90 border-slate-800/90 shadow-[0_15px_40px_rgba(0,0,0,0.45)]'
          }`}
        >
          {metrics.map((m, idx) => {
            const isJolted = joltedMetricIdx === idx;
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-center flex flex-col justify-center items-center transition-all duration-300 ${
                  isJolted
                    ? 'bg-red-500/15 border border-red-500 scale-105 shadow-[0_0_25px_rgba(239,68,68,0.35)] z-10'
                    : idx !== metrics.length - 1
                    ? isLight
                      ? 'md:border-l md:border-slate-200/90'
                      : 'md:border-l md:border-slate-800/90'
                    : ''
                }`}
              >
                <span
                  className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mb-1 dir-ltr inline-block tabular-nums transition-transform duration-200 ${
                    isJolted
                      ? 'text-red-500 scale-120'
                      : isLight
                      ? 'text-emerald-600'
                      : 'text-emerald-400'
                  }`}
                >
                  {m.value}
                </span>
                <span
                  className={`text-xs leading-snug transition-colors ${
                    isJolted
                      ? 'text-red-400 font-black'
                      : isLight
                      ? 'text-slate-700 font-semibold'
                      : 'text-slate-200 font-medium'
                  }`}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
};
