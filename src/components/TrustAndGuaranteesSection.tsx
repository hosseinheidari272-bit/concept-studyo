import React, { useState, useEffect, useRef } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';
import {
  PAIN_OF_INACTION_HOOKS,
  AnomalyVariant,
  AnomalyVariantId,
  pickNonRepeatingAnomaly,
  pickInterruptWordIndex,
  computeIrregularDelayMs,
} from '../utils/patternInterruptEngine';

interface TrustAndGuaranteesSectionProps {
  onOpenOrderModal: () => void;
  onOpenChat: () => void;
}

export const TrustAndGuaranteesSection: React.FC<TrustAndGuaranteesSectionProps> = ({
  onOpenOrderModal,
  onOpenChat,
}) => {
  const { isLight } = useTheme();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // مدیریت وقفه‌های شناختی تصادفی (Pattern Interrupts) روی کارت‌های قدرت اجرایی و هزینه تعلل
  const [joltedPainIdx, setJoltedPainIdx] = useState<number | null>(null);
  const [joltedPillarIdx, setJoltedPillarIdx] = useState<number | null>(null);
  const [activeAnomaly, setActiveAnomaly] = useState<AnomalyVariant | null>(null);
  const [wordSeed, setWordSeed] = useState(0);
  const lastAnomalyRef = useRef<AnomalyVariantId | null>(null);

  const masteryPillars = [
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      badge: 'فرمول اجرای ۵۰ / ۵۰',
      title: 'پیشروی مرحله‌ای بر اساس مشاهده خروجی واقعی',
      desc: 'ما به قدرت خروجی خودمان ایمان داریم؛ پروژه با ۵۰٪ پیش‌پرداخت استارت می‌خورد و تسویه نهایی تنها زمانی انجام می‌شود که خروجی درخشان پروژه را با چشمان خودتان دیده و تایید کرده باشید.',
      color: 'from-sky-500/20 to-indigo-500/10 text-sky-400 border-sky-500/30',
      footerTag: 'استاندارد مالی شفاف استودیو',
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ),
      badge: 'دقت میلی‌متری',
      title: '۲ نوبت پولیش و کالیبراسیون تخصصی رایگان',
      desc: 'پس از رونمایی از نسخه اولیه، دو دور بازبینی دقیق روی ریتم، رنگ، زاویه نور یا رابط کاربری انجام می‌دهیم تا خروجی نهایی دقیقاً همان اثری شود که به آن افتخار کنید.',
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
      footerTag: 'همراهی تا رسیدن به کمال بصری',
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      badge: 'مالکیت مطلق دارایی',
      title: 'تحویل ۱۰۰٪ سورس‌های مهندسی‌شده و لایه‌باز',
      desc: 'هیچ قفلی روی کار ما نیست؛ تمامی فایل‌های مادر (پروژه‌های سه‌بعدی، افترافکت، فیگما و سورس‌کدهای تمیز) به صورت کامل به تیم شما منتقل می‌شوند تا کنترل کامل دارایی خود را داشته باشید.',
      color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
      footerTag: 'استقلال کامل فنی برای برند شما',
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      badge: 'پروتکل امنیتی NDA',
      title: 'محرمانگی کامل استراتژی و محصولات معرفی‌نشده',
      desc: 'کمپین‌های تبلیغاتی، فرمول‌های تجاری و محصولات جدید شما پیش از رونمایی رسمی در قرنطینه کامل اطلاعاتی استودیو قرار دارند تا برگ برنده شما در بازار حفظ شود.',
      color: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/30',
      footerTag: 'حفاظت از مزیت رقابتی شما',
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      badge: 'سرعت خارق‌العاده بدون افت کیفیت',
      title: 'سرعت فوق‌العاده بالا و تحویل سریع با حفظ و تعالی کیفیت',
      desc: 'در بازار پرشتاب امروز سرعت رمز برتری است؛ پایپ‌لاین تولید اختصاصی ما پروژه را با سرعتی استثنایی و رکوردشکن تحویل می‌دهد، بدون اینکه ذره‌ای از استانداردهای سخت‌گیرانه، جزییات سینمایی و کمال خروجی کاسته شود.',
      color: 'from-rose-500/20 to-orange-500/10 text-rose-400 border-rose-500/30',
      footerTag: 'سرعت برق‌آسا + حفظ کمال کیفیت',
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      badge: 'خط مستقیم با مغز متفکر',
      title: 'ارتباط بی‌واسطه با کارگردان فنی و هنری',
      desc: 'پیام شما در بروکراسی شرکت‌های سنتی گم نمی‌شود؛ شما مستقیماً با متخصصی صحبت می‌کنید که با اشتیاق و تسلط کامل، صفر تا صد خلق اثر شما را رهبری می‌کند.',
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      footerTag: 'پاسخگویی سریع و تخصصی',
    },
  ];

  const authorityMetrics = [
    { label: 'پروژه تجاری به ثمر رسیده', value: '+۱۴۰', sub: 'اجرای تیز برای برندهای پیشرو' },
    { label: 'ماندگاری و رضایت کارفرمایان', value: '۹۹.۴٪', sub: 'تمدید همکاری در پروژه‌های بعدی' },
    { label: 'سرعت تحویل فاز اجرایی', value: '۲۴-۷۲', sub: 'ساعت کاری برای پروژه‌های استاندارد' },
    { label: 'پاسخگویی مستقیم مدیریت', value: '< ۱۵', sub: 'دقیقه تا بررسی تخصصی پروژه' },
  ];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsVisible(entry.isIntersecting));
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let timerId: ReturnType<typeof setTimeout>;
    let clearTimerId: ReturnType<typeof setTimeout>;

    const triggerRandomAuthorityJolt = (isFirst = false) => {
      const waitMs = isFirst
        ? isMobileViewport
          ? 1500
          : 500
        : computeIrregularDelayMs(
            Date.now() + Math.floor(Math.random() * 50000),
            isMobileViewport ? 3500 : 1600,
            isMobileViewport ? 8000 : 4200
          );
      timerId = setTimeout(() => {
        if (document.hidden) {
          triggerRandomAuthorityJolt(false);
          return;
        }
        const anomaly = pickNonRepeatingAnomaly(lastAnomalyRef.current);
        lastAnomalyRef.current = anomaly.id;
        setActiveAnomaly(anomaly);
        setWordSeed(Math.floor(Math.random() * 5000));

        // به صورت غیرقابل پیش‌بینی یا یکی از کارت‌های هزینه تعلل یا یکی از ۶ ستون قدرت اجرایی را قرمز و برجسته می‌کند
        if (Math.random() < 0.45) {
          const painIdx = Math.floor(Math.random() * PAIN_OF_INACTION_HOOKS.length);
          setJoltedPainIdx(painIdx);
          setJoltedPillarIdx(null);
        } else {
          const pillarIdx = Math.floor(Math.random() * masteryPillars.length);
          setJoltedPillarIdx(pillarIdx);
          setJoltedPainIdx(null);
        }

        clearTimerId = setTimeout(() => {
          setJoltedPainIdx(null);
          setJoltedPillarIdx(null);
          setActiveAnomaly(null);
          triggerRandomAuthorityJolt(false);
        }, anomaly.durationMs + 700);
      }, waitMs);
    };

    triggerRandomAuthorityJolt(true);

    return () => {
      clearTimeout(timerId);
      clearTimeout(clearTimerId);
    };
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      id="guarantees"
      aria-label="استانداردهای قدرت اجرایی و هزینه تعلل در بازار"
      className="my-12 sm:my-14 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20"
    >
      {/* بخش ۱: دردِ نخریدن و هزینه سنگین تعلل (Pain of Inaction) */}
      <ScrollReveal direction="down" distance={25}>
        <div
          className={`p-6 sm:p-8 rounded-3xl border mb-14 relative overflow-hidden transition-all duration-500 ${
            isLight
              ? 'bg-gradient-to-br from-rose-50/90 via-white to-slate-50 border-rose-200/90 shadow-[0_18px_45px_rgba(225,29,72,0.08)]'
              : 'bg-gradient-to-br from-[#16070C]/95 via-[#090D18] to-[#060A12] border-red-500/35 shadow-[0_20px_55px_rgba(239,68,68,0.12)]'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black mb-3 bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>واقعیت بی‌رحم بازار امروز — هزینه پنهانِ تعلل</span>
              </div>
              <h2
                className={`text-xl sm:text-3xl font-black leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                وقتی ویترین دیجیتال شما معمولی است، هر روز چه چیزی را از دست می‌دهید؟
              </h2>
            </div>
            <p
              className={`text-xs sm:text-sm leading-relaxed max-w-md font-medium ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              مشتریان امروز منتظر نمی‌مانند تا کیفیت واقعی شما را کشف کنند؛ آن‌ها در کسری از ثانیه بر اساس «تصویر، سرعت و حس قدرت برند شما» تصمیم می‌گیرند که بمانند یا سراغ رقیب بروند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PAIN_OF_INACTION_HOOKS.map((hook, idx) => {
              const isJolted = joltedPainIdx === idx && activeAnomaly !== null;
              return (
                <div
                  key={hook.id}
                  data-pain-anomaly={isJolted ? activeAnomaly?.id : undefined}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isJolted
                      ? activeAnomaly?.containerClass || ''
                      : isLight
                      ? 'bg-white/95 border-rose-200/80 hover:border-red-400 shadow-sm'
                      : 'bg-slate-950/85 border-red-500/25 hover:border-red-500/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-lg sm:text-2xl font-black font-mono tracking-tight transition-all duration-300 ${
                          isJolted
                            ? 'text-red-500 scale-115 inline-block drop-shadow-[0_0_14px_rgba(239,68,68,0.75)]'
                            : 'text-red-500'
                        }`}
                      >
                        {hook.painMetric}
                      </span>
                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${
                          isJolted
                            ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                            : isLight
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-red-500/15 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {hook.masteryTitle}
                      </span>
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-black mb-2 transition-all duration-300 ${
                        isJolted
                          ? activeAnomaly?.titleClass || ''
                          : isLight
                          ? 'text-slate-900'
                          : 'text-white'
                      }`}
                    >
                      {hook.painTitle}
                    </h3>

                    <p
                      className={`text-xs leading-relaxed mb-4 ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      {hook.painDesc}
                    </p>
                  </div>

                  <div
                    className={`pt-3 border-t text-[11px] font-extrabold flex items-center gap-1.5 ${
                      isLight ? 'border-slate-100 text-sky-700' : 'border-slate-800/80 text-cyan-300'
                    }`}
                  >
                    <span className="text-red-500 text-sm">⚡</span>
                    <span>{hook.masteryDesc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* بخش ۲: سرتیتر استانداردهای قدرت و قواعد حرفه‌ای کار ما */}
      <ScrollReveal direction="down" distance={20}>
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black mb-2.5 border backdrop-blur-md bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>تیز، متخصص و متمرکز بر نتیجه واقعی</span>
          </div>

          <h2
            className={`text-2xl sm:text-4xl font-black mb-3 transition-colors ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            قواعد اجرای پرقدرت در استودیو کانسپت: تحویل سورس کامل، پرداخت مرحله‌ای و مالکیت مطلق
          </h2>

          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-slate-200'
            }`}
          >
            ما به جای شعارهای تبلیغاتی، سیستم کارمان را روی شفافیت عملیاتی، استاندارد فنی تیز و اشتیاق واقعی برای خلق بهترین اثر بازار بنا کرده‌ایم.
          </p>
        </div>
      </ScrollReveal>

      {/* نوار آمار و شاخص‌های اعتبار عملیاتی */}
      <ScrollReveal direction="up" distance={20}>
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:p-5 rounded-2xl border mb-9 backdrop-blur-xl ${
            isLight
              ? 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.04)]'
              : 'bg-[#080E1C]/90 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.45)]'
          }`}
        >
          {authorityMetrics.map((metric, idx) => (
            <div
              key={idx}
              className={`text-center p-3 sm:p-4 rounded-xl ${
                idx < authorityMetrics.length - 1
                  ? isLight
                    ? 'border-b md:border-b-0 md:border-l border-slate-200'
                    : 'border-b md:border-b-0 md:border-l border-slate-800/80'
                  : ''
              }`}
            >
              <div
                className={`text-2xl sm:text-4xl font-black mb-1 tracking-tight ${
                  isLight ? 'text-sky-600' : 'text-cyan-400'
                }`}
              >
                {metric.value}
              </div>
              <div
                className={`text-xs sm:text-sm font-bold mb-0.5 ${
                  isLight ? 'text-slate-800' : 'text-slate-100'
                }`}
              >
                {metric.label}
              </div>
              <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{metric.sub}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* شبکه ۶ ستون استانداردهای اجرایی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {masteryPillars.map((item, i) => {
          const isPillarJolted = joltedPillarIdx === i && activeAnomaly !== null;
          const descWords = item.desc.trim().split(/\s+/);
          const targetWordIdx = isPillarJolted
            ? pickInterruptWordIndex(item.desc, i + wordSeed)
            : -1;

          return (
            <ScrollReveal key={i} delay={i * 0.08} direction="up" distance={22}>
              <div
                data-cursor-interactive="true"
                data-pillar-anomaly={isPillarJolted ? activeAnomaly.id : undefined}
                className={`interactive-card-lift h-full p-5 sm:p-6 rounded-2xl border group flex flex-col justify-between backdrop-blur-xl ${
                  isPillarJolted
                    ? activeAnomaly.containerClass
                    : isLight
                    ? 'bg-white border-slate-200/95 hover:border-sky-400 shadow-[0_8px_25px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_38px_rgba(2,132,199,0.14)]'
                    : 'bg-[#090F1E]/95 border-slate-800/90 hover:border-cyan-400/50 hover:shadow-[0_14px_35px_rgba(0,229,255,0.12)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-gradient-to-br transition-transform duration-300 ${
                        isPillarJolted
                          ? 'from-red-600 to-rose-700 text-white border-red-400 scale-115 shadow-[0_0_20px_rgba(239,68,68,0.65)]'
                          : `group-hover:scale-110 ${item.color}`
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ${
                        isPillarJolted
                          ? activeAnomaly.numberClass
                          : isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h3
                    className={`text-base sm:text-lg font-black mb-2 transition-all duration-300 ${
                      isPillarJolted
                        ? activeAnomaly.titleClass
                        : isLight
                        ? 'text-slate-900 group-hover:text-sky-700'
                        : 'text-white group-hover:text-cyan-300'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {descWords.map((word, wIdx) => (
                      <React.Fragment key={wIdx}>
                        <span
                          className={
                            isPillarJolted && wIdx === targetWordIdx
                              ? activeAnomaly.highlightWordClass
                              : 'transition-all duration-200'
                          }
                        >
                          {word}
                        </span>{' '}
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                <div
                  className={`pt-4 mt-5 border-t flex items-center justify-between text-xs font-bold ${
                    isPillarJolted
                      ? 'border-red-500/40 text-red-500'
                      : isLight
                      ? 'border-slate-100 text-sky-700'
                      : 'border-slate-800/80 text-cyan-400'
                  }`}
                >
                  <span>{item.footerTag}</span>
                  <span>{isPillarJolted ? '⚡ استاندارد فعال' : 'استاندارد استودیو ✓'}</span>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* بنر اقدام سریع با حس اشتیاق و تسلط فنی */}
      <ScrollReveal direction="up" distance={20}>
        <div
          className={`mt-10 p-6 sm:p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
            isLight
              ? 'bg-gradient-to-r from-sky-50 via-white to-blue-50 border-sky-200 shadow-xl'
              : 'bg-gradient-to-r from-slate-950 via-[#071329] to-slate-950 border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.6)]'
          }`}
        >
          <div className="text-right max-w-xl">
            <span
              className={`text-xs font-black tracking-wider block mb-1 ${
                isLight ? 'text-red-600' : 'text-red-400'
              }`}
            >
              ⚡ آماده جهش بصری و فروش برندتان هستید؟
            </span>
            <h3
              className={`text-lg sm:text-2xl font-black mb-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              ما مشتاقیم پروژه شما را به اثری تبدیل کنیم که رقبا فقط تماشاگرش باشند!
            </h3>
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              همین الان جزئیات یا ایده اولیه‌تان را بفرستید؛ در کمتر از ۱۵ دقیقه نقشه راه دقیق، زمان‌بندی و برآورد مهندسی پروژه را در اختیارتان می‌گذاریم.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenOrderModal}
              data-cursor-text="سفارش"
              className="btn-shimmer px-7 py-3.5 min-h-[48px] rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              شروع پرقدرت سفارش ⚡
            </button>
            <button
              onClick={onOpenChat}
              className={`px-6 py-3.5 min-h-[48px] rounded-xl border font-bold text-xs sm:text-sm transition-all hover:-translate-y-0.5 active:scale-95 ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-100'
              }`}
            >
              گفت‌وگوی مستقیم با مدیریت 💬
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};
