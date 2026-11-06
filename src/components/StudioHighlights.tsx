import React, { useState, useEffect, useRef } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';
import {
  AnomalyVariant,
  AnomalyVariantId,
  pickNonRepeatingAnomaly,
  pickInterruptWordIndex,
  computeIrregularDelayMs,
  nextSeededRandom,
} from '../utils/patternInterruptEngine';

export const StudioHighlights: React.FC = () => {
  const { isLight } = useTheme();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [activeCardIdx, setActiveCardIdx] = useState<number | null>(null);
  const [activeAnomaly, setActiveAnomaly] = useState<AnomalyVariant | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const lastAnomalyIdRef = useRef<AnomalyVariantId | null>(null);

  const highlights = [
    {
      num: '۰۱',
      title: 'خروجی استاندارد سینمایی (تیزرسازی 4K و 8K)',
      desc: 'ما با وسواس میلی‌متری روی نورپردازی، بافت متریال و داینامیک تصویر کار می‌کنیم تا هر فریم، قدرت و اصالت واقعی برند شما را در ذهن مخاطب حک کند.',
      detail: 'وسواس در مهندسی تصویر',
      spark: 'ما عاشق خلق صحنه‌هایی هستیم که مخاطب را میخکوب می‌کند',
    },
    {
      num: '۰۲',
      title: 'تحویل سریع در ۲ تا ۳ روز با تعهد به حفظ کیفیت عالی',
      desc: 'زمان تحویل در حالت عادی معمولاً ۲ تا ۳ روز کاری است و متناسب با ابعاد پروژه ممکن است تغییر کند؛ اما ما سعی می‌کنیم که در زمان خیلی سریع پروژه رو با حفظ کیفیت عالی به شما تحویل بدیم.',
      detail: 'صداقت در زمان‌بندی + کیفیت عالی',
      spark: 'ما سعی می‌کنیم که در زمان خیلی سریع پروژه رو با حفظ کیفیت عالی به شما تحویل بدیم',
    },
    {
      num: '۰۳',
      title: 'تحویل کامل فایل‌های لایه‌باز و سورس مهندسی‌شده',
      desc: 'از فایل‌های سه‌بعدی و پروژه‌های افترضفکتس تا سورس کدهای تمیز وب؛ تمام دارایی‌های خلق‌شده با ساختار استاندارد و کاملاً باز در اختیار شماست.',
      detail: 'استقلال کامل فنی',
      spark: 'معماری تمیز و بدون هیچ وابستگی پنهان',
    },
    {
      num: '۰۴',
      title: 'همراهی مستقیم و پرانرژی از ایده تا اوج فروش',
      desc: 'شما با یک فرم سرد طرف نیستید؛ ما قدم‌به‌قدم کنار شماییم و با اشتیاق روی جزئیات کار می‌کنیم تا دقیقاً همان اثری خلق شود که از دیدنش هیجان‌زده شوید.',
      detail: 'ارتباط مستقیم و تیز',
      spark: 'انرژی ما تا لحظه شگفت‌زدگی شما متوقف نمی‌شود',
    },
  ];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let seed = (Date.now() ^ 0x9e3779b9) >>> 0;
    let triggerTimer: ReturnType<typeof setTimeout>;
    let resetTimer: ReturnType<typeof setTimeout>;

    const scheduleSurprise = () => {
      const step1 = nextSeededRandom(seed);
      seed = step1.nextSeed;
      const delay = computeIrregularDelayMs(
        seed,
        isMobileViewport ? 3200 : 1200,
        isMobileViewport ? 7500 : 4000
      );

      triggerTimer = setTimeout(() => {
        if (document.hidden) {
          scheduleSurprise();
          return;
        }
        const step2 = nextSeededRandom(seed);
        seed = step2.nextSeed;
        const chosenCard = Math.floor(step2.value * highlights.length);
        const variant = pickNonRepeatingAnomaly(lastAnomalyIdRef.current, seed);
        lastAnomalyIdRef.current = variant.id;

        const wordIdx = pickInterruptWordIndex(highlights[chosenCard].desc, seed + 17);

        setActiveCardIdx(chosenCard);
        setActiveAnomaly(variant);
        setActiveWordIdx(wordIdx);

        resetTimer = setTimeout(() => {
          setActiveCardIdx(null);
          setActiveAnomaly(null);
          setActiveWordIdx(-1);
          scheduleSurprise();
        }, variant.durationMs);
      }, delay);
    };

    scheduleSurprise();

    return () => {
      clearTimeout(triggerTimer);
      clearTimeout(resetTimer);
    };
  }, [isInView]);

  const renderDescriptionWithInterrupt = (desc: string, isTriggered: boolean, wordClass: string) => {
    if (!isTriggered || activeWordIdx < 0) {
      return desc;
    }
    const words = desc.trim().split(/\s+/);
    return words.map((word, idx) => (
      <React.Fragment key={idx}>
        <span className={idx === activeWordIdx ? `transition-all duration-200 ${wordClass}` : ''}>
          {word}
        </span>
        {idx < words.length - 1 ? ' ' : ''}
      </React.Fragment>
    ));
  };

  return (
    <section
      ref={sectionRef}
      id="highlights"
      aria-label="شاخص‌های تخصص و تمایز استودیو"
      className="my-10 sm:my-12 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20"
    >
      <ScrollReveal direction="down" distance={20}>
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 pb-3.5 border-b transition-colors ${
            isLight ? 'border-slate-200' : 'border-slate-800/80'
          }`}
        >
          <div>
            <span
              className={`text-xs font-black tracking-wider block mb-1 ${
                isLight ? 'text-sky-600' : 'text-cyan-400'
              }`}
            >
              تخصص تیز · اشتیاق واقعی · اجرای مهندسی
            </span>
            <h2
              className={`text-xl sm:text-3xl font-black transition-colors ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              مزایای رقابتی و استانداردهای کیفی استودیو دیزاین کانسپت
            </h2>
          </div>
          <p
            className={`text-xs sm:text-sm max-w-md leading-relaxed font-medium ${
              isLight ? 'text-slate-700' : 'text-slate-200'
            }`}
          >
            ما از ساختن کارهای شاخص لذت می‌بریم؛ وقتی برند شما با بالاترین استاندارد بصری و فنی وارد میدان می‌شود، مشتریان در کسری از ثانیه تفاوت را حس می‌کنند.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((h, i) => {
          const isTriggered = activeCardIdx === i && activeAnomaly !== null;
          return (
            <ScrollReveal key={i} delay={i * 0.08} direction="down" distance={22}>
              <div
                data-cursor-interactive="true"
                onMouseEnter={() => {
                  const variant = pickNonRepeatingAnomaly(lastAnomalyIdRef.current, Date.now() + i * 97);
                  lastAnomalyIdRef.current = variant.id;
                  setActiveCardIdx(i);
                  setActiveAnomaly(variant);
                  setActiveWordIdx(pickInterruptWordIndex(h.desc, Date.now() + i));
                }}
                onMouseLeave={() => {
                  setActiveCardIdx(null);
                  setActiveAnomaly(null);
                }}
                className={`interactive-card-lift relative h-full p-5 sm:p-6 rounded-2xl backdrop-blur-xl border group flex flex-col justify-between ${
                  isLight
                    ? 'bg-white border-slate-200/95 hover:border-emerald-500/60 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_40px_rgba(16,185,129,0.12)]'
                    : 'bg-[#080E18]/95 border-slate-800/90 hover:border-emerald-500/50 shadow-[0_12px_35px_rgba(0,0,0,0.45)] hover:shadow-[0_18px_45px_rgba(16,185,129,0.18)]'
                } ${isTriggered && activeAnomaly ? activeAnomaly.containerClass : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`text-xl font-black transition-all duration-200 ${
                        isTriggered && activeAnomaly
                          ? activeAnomaly.numberClass
                          : isLight
                          ? 'text-emerald-600'
                          : 'text-emerald-400'
                      }`}
                    >
                      {h.num}
                    </span>
                    <span
                      className={`text-[11px] font-bold transition-colors ${
                        isTriggered
                          ? 'text-red-500 font-black'
                          : isLight
                          ? 'text-slate-600 group-hover:text-emerald-600'
                          : 'text-slate-300 group-hover:text-emerald-300'
                      }`}
                    >
                      {h.detail}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold mb-2 transition-all duration-200 ${
                      isTriggered && activeAnomaly
                        ? activeAnomaly.titleClass
                        : isLight
                        ? 'text-slate-900 group-hover:text-emerald-700'
                        : 'text-white group-hover:text-emerald-200'
                    }`}
                  >
                    {h.title}
                  </h3>

                  <p
                    className={`text-xs sm:text-[13px] leading-relaxed font-normal ${
                      isLight ? 'text-slate-700' : 'text-slate-200'
                    }`}
                  >
                    {renderDescriptionWithInterrupt(
                      h.desc,
                      isTriggered,
                      activeAnomaly?.highlightWordClass || 'text-red-500 font-black'
                    )}
                  </p>
                </div>

                <div
                  className={`pt-3.5 mt-4 border-t flex items-center justify-between gap-1.5 text-[11px] font-bold transition-all ${
                    isTriggered
                      ? 'border-red-500/40 text-red-500 opacity-100'
                      : isLight
                      ? 'border-slate-200/80 text-emerald-700 opacity-90 group-hover:opacity-100'
                      : 'border-slate-800/80 text-emerald-400 opacity-90 group-hover:opacity-100'
                  }`}
                >
                  <span>{h.spark}</span>
                  <span>⚡</span>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
};
