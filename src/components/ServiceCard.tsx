import React, { useState, useRef } from 'react';
import { ServiceItem } from '../types';
import { formatPersianPrice, calculateDiscount } from '../utils/persianDate';
import { useTheme } from '../context/ThemeContext';
import { AnomalyVariant, pickInterruptWordIndex } from '../utils/patternInterruptEngine';

interface ServiceCardProps {
  service: ServiceItem;
  showPrices?: boolean;
  activeAnomaly?: AnomalyVariant | null;
  anomalySeed?: number;
  onSelect: (service: ServiceItem) => void;
  onOpenChatWithService?: (service: ServiceItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  showPrices = true,
  activeAnomaly = null,
  anomalySeed = 1,
  onSelect,
  onOpenChatWithService,
}) => {
  const { isLight } = useTheme();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const [spotlightPos, setSpotlightPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const hasDiscount = (service.discountPercent || 0) > 0;
  const discountedPrice = hasDiscount
    ? calculateDiscount(service.startingPrice, service.discountPercent!)
    : service.startingPrice;

  const isInterrupted = activeAnomaly !== null && activeAnomaly !== undefined;
  const descWords = service.description.trim().split(/\s+/);
  const interruptedWordIdx = isInterrupted
    ? pickInterruptWordIndex(service.description, anomalySeed)
    : -1;

  // رندر گرافیک اختصاصی و غنی برای هر یک از ۱۰ خدمت (اصل ۵: محتوای بصری باکیفیت)
  const renderArtBanner = () => {
    const bannerBase = isLight
      ? 'relative h-32 w-full rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50/70 to-slate-100 border border-sky-200/80 p-3.5 overflow-hidden flex items-center justify-between'
      : 'relative h-32 w-full rounded-2xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-[#050811] border border-cyan-500/25 p-3.5 overflow-hidden flex items-center justify-between';

    const labelClass = isLight
      ? 'text-[10px] font-mono text-sky-600 font-bold tracking-wider block'
      : 'text-[10px] font-mono text-cyan-400 font-bold tracking-wider block';

    const titleClass = isLight
      ? 'text-xs font-bold text-slate-900 block mt-0.5'
      : 'text-xs font-bold text-white block mt-0.5';

    const subTextClass = isLight
      ? 'text-[10px] text-slate-500 block mt-1'
      : 'text-[10px] text-slate-400 block mt-1';

    const iconBoxClass = isLight
      ? 'relative w-18 h-18 rounded-2xl bg-white/95 border border-sky-200 shadow-[0_8px_20px_rgba(2,132,199,0.12)] flex items-center justify-center text-sky-600 shrink-0'
      : 'relative w-18 h-18 rounded-2xl bg-cyan-500/10 border border-cyan-400/35 shadow-[0_0_25px_rgba(0,229,255,0.15)] flex items-center justify-center text-cyan-300 shrink-0';

    switch (service.id) {
      case 'photo-design':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>8K PHOTO COMPOSITE</span>
              <span className={titleClass}>فتومونتاژ و روتوش سینمایی</span>
              <span className={subTextClass}>ترکیب لایه‌های نوری و اصلاح جزئیات</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.8" />
                <path d="M21 15l-5-5L5 21" />
                <path d="M14 4h6v6" strokeOpacity="0.5" />
              </svg>
            </div>
          </div>
        );
      case 'video-editing':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>CINEMATIC 4K & VFX</span>
              <span className={titleClass}>تدوین، اصلاح رنگ و موشن</span>
              <span className={subTextClass}>خروجی سینمایی DaVinci + صداگذاری</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2.5" />
                <circle cx="8.5" cy="12" r="3" strokeDasharray="2 2" />
              </svg>
            </div>
          </div>
        );
      case 'post-banner-design':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>HIGH-CTR AD KITS</span>
              <span className={titleClass}>بنرها و کاورهای جذب کلیک</span>
              <span className={subTextClass}>طراحی اختصاصی پست، استوری و اسلاید</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="2.5" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
                <circle cx="15" cy="15" r="2.5" />
              </svg>
            </div>
          </div>
        );
      case 'product-3d-commercial':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>3D PHOTOREAL RENDER</span>
              <span className={titleClass}>رندر سه‌بعدی و واقعی محصولات</span>
              <span className={subTextClass}>جایگزین مدرن عکاسی صنعتی و استودیویی</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
          </div>
        );
      case 'social-media-growth':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>VIRAL REELS & STRATEGY</span>
              <span className={titleClass}>سناریونویسی و تولید محتوای پیج</span>
              <span className={subTextClass}>قلاب ۳ ثانیه اول + تقویم ۳۰ روزه</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
          </div>
        );
      case 'voice-synthesis-audio':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>STUDIO AUDIO & DUBBING</span>
              <span className={titleClass}>نریشن، دوبله و مهندسی صدا</span>
              <span className={subTextClass}>گویندگی طبیعی، حذف نویز و پادکست</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
          </div>
        );
      case 'luxury-web-development':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>NEXT-GEN WEB & UI/UX</span>
              <span className={titleClass}>توسعه وب‌سایت و لندینگ لوکس</span>
              <span className={subTextClass}>طراحی اختصاصی، فوق‌سریع و بهینه برای گوگل</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
                <line x1="14" y1="4" x2="10" y2="20" strokeOpacity="0.6" />
              </svg>
            </div>
          </div>
        );
      case 'business-automation':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>SMART AI WORKFLOW</span>
              <span className={titleClass}>ربات هوشمند و خودکارسازی کارها</span>
              <span className={subTextClass}>پاسخگویی ۲۴ ساعته و اتصال سیستم‌های فروش</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="4" width="16" height="16" rx="2.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" />
                <line x1="20" y1="14" x2="23" y2="14" />
                <line x1="1" y1="9" x2="4" y2="9" />
                <line x1="1" y1="14" x2="4" y2="14" />
              </svg>
            </div>
          </div>
        );
      case 'custom-app-development':
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>CUSTOM APP CREATION</span>
              <span className={titleClass}>ساخت اپلیکیشن و برنامه اختصاصی</span>
              <span className={subTextClass}>ساخت، انتشار و رشد فروش محصولات شما</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="5" y="2" width="14" height="20" rx="3" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                <path d="M9 7h6M9 11h4" />
              </svg>
            </div>
          </div>
        );
      default:
        return (
          <div className={bannerBase}>
            <div className="space-y-0.5 z-10">
              <span className={labelClass}>DIGITAL ASSETS & UI KITS</span>
              <span className={titleClass}>محصولات دانلودی و قالب‌های آماده</span>
              <span className={subTextClass}>دارایی دیجیتال با قابلیت فروش نامحدود</span>
            </div>
            <div className={iconBoxClass}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
        );
    }
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-cursor-interactive="true"
      data-anomaly-active={isInterrupted ? activeAnomaly?.id : undefined}
      className={`interactive-card-lift relative h-full rounded-3xl border p-5 sm:p-6 flex flex-col justify-between overflow-hidden group ${
        isLight
          ? 'bg-white border-slate-200/95 hover:border-sky-400 shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-[0_22px_50px_rgba(2,132,199,0.16)]'
          : 'bg-[#080E1B]/95 border-slate-800/90 hover:border-cyan-400/50 shadow-[0_15px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_22px_55px_rgba(0,229,255,0.16)]'
      } ${isInterrupted ? activeAnomaly?.containerClass || '' : ''}`}
    >
      {/* افکت اسپات‌لایت داینامیک الهام‌گرفته از Aceternity UI که نشانگر موس را دنبال می‌کند */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300 z-0 hidden md:block"
        style={{
          opacity: isHovered ? 1 : 0,
          background: isLight
            ? `radial-gradient(420px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(14, 165, 233, 0.11), transparent 70%)`
            : `radial-gradient(450px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(0, 229, 255, 0.13), transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* ۱. بنر بصری اختصاصی خدمت */}
        <div className="mb-4">
          {renderArtBanner()}
        </div>

        {/* ۲. هدر متنی و شماره خدمت */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span
              className={`text-[11px] font-mono font-bold tracking-wider block mb-0.5 transition-all duration-300 ${
                isInterrupted
                  ? activeAnomaly?.numberClass || ''
                  : isLight
                  ? 'text-sky-600'
                  : 'text-cyan-400'
              }`}
            >
              SERVICE #{service.number}
            </span>
            <h3
              className={`text-base sm:text-lg font-black transition-all duration-300 ${
                isInterrupted
                  ? activeAnomaly?.titleClass || ''
                  : isLight
                  ? 'text-slate-900 group-hover:text-sky-700'
                  : 'text-white group-hover:text-cyan-200'
              }`}
            >
              {service.title}
            </h3>
          </div>

          {service.popular && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 transition-all duration-300 ${
                isInterrupted
                  ? 'bg-red-600 text-white border-red-400 font-black scale-110 shadow-[0_0_16px_rgba(239,68,68,0.75)]'
                  : isLight
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isInterrupted ? '⚡ پرقدرت و پرتقاضا' : 'ویژه و پرطرفدار'}
            </span>
          )}
        </div>

        {/* ۳. متن توضیحات با کنتراست تنظیم‌شده و قابلیت جلب توجه ناگهانی روی کلمات کلیدی */}
        <p
          className={`text-xs sm:text-[13px] leading-relaxed font-normal mb-3 min-h-[48px] ${
            isLight ? 'text-slate-700' : 'text-slate-200'
          }`}
        >
          {descWords.map((word, wIdx) => {
            const isWordShocked = isInterrupted && wIdx === interruptedWordIdx;
            return (
              <React.Fragment key={wIdx}>
                <span className={isWordShocked ? activeAnomaly?.highlightWordClass || '' : 'transition-all duration-200'}>
                  {word}
                </span>{' '}
              </React.Fragment>
            );
          })}
        </p>

        {/* دکمه و بخش بازشونده «توضیحات بیشتر» با ابعاد بزرگ‌تر جهت لمس آسان در موبایل */}
        {service.detailedDescription && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              aria-expanded={isDetailsOpen}
              className={`inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3 min-h-[40px] rounded-xl border transition-all active:scale-95 ${
                isLight
                  ? isDetailsOpen
                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                    : 'bg-slate-100/90 hover:bg-sky-50/80 border-slate-200 text-sky-700'
                  : isDetailsOpen
                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-cyan-300'
              }`}
            >
              <span>{isDetailsOpen ? 'بستن جزئیات' : 'نتیجه و مزیت تجاری برای شما'}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isDetailsOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isDetailsOpen && (
              <div
                style={{ animation: 'mistClearReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                className={`mt-2.5 p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  isLight
                    ? 'bg-sky-50/70 border-sky-200/90 text-slate-700'
                    : 'bg-slate-950/90 border-cyan-500/25 text-slate-300'
                }`}
              >
                <span
                  className={`font-bold block mb-1 ${
                    isLight ? 'text-sky-700' : 'text-cyan-300'
                  }`}
                >
                  این خدمت چطور ارزش واقعی محصول و برند شما را به نمایش می‌گذارد؟
                </span>
                <p>{service.detailedDescription}</p>
              </div>
            )}
          </div>
        )}

        {/* ۴. برچسب‌ها با شیوه تمیز متنی */}
        <div
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] mb-4 pb-3 border-b ${
            isLight ? 'text-slate-500 border-slate-100' : 'text-slate-400 border-slate-800/60'
          }`}
        >
          {service.tags.map((tag, idx) => (
            <React.Fragment key={idx}>
              <span
                className={
                  isInterrupted && idx === 0
                    ? 'text-red-500 font-black scale-105 inline-block transition-all'
                    : isLight
                    ? 'text-slate-700 font-medium'
                    : 'text-slate-300'
                }
              >
                #{tag}
              </span>
              {idx < service.tags.length - 1 && (
                <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>·</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ۵. چک‌لیست اقلام تحویلی */}
        <div className="space-y-1.5 mb-5">
          <span
            className={`text-[11px] font-bold block mb-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            پکیج اجرایی و سورس‌های تحویلی شما:
          </span>
          {service.deliverables.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 text-xs ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <span
                className={`text-xs font-bold ${
                  isInterrupted && idx === 0
                    ? 'text-red-500 scale-125 inline-block'
                    : isLight
                    ? 'text-sky-600'
                    : 'text-cyan-400'
                }`}
              >
                ✓
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* بخش پایین کارت: قیمت‌گذاری و دکمه‌های اقدام بزرگ‌شده جهت لمس راحت با انگشت */}
      <div
        className={`relative z-10 pt-4 border-t ${
          isLight ? 'border-slate-200/90' : 'border-slate-800/90'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            {showPrices ? (
              <>
                <span className={`text-[11px] font-medium block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  محدوده تعرفه پروژه:
                </span>
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className={`text-[11px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>شروع از</span>
                    <span
                      className={`text-base sm:text-lg font-black tabular-nums transition-all duration-300 ${
                        isInterrupted
                          ? 'text-red-500 scale-105 inline-block drop-shadow-[0_0_10px_rgba(239,68,68,0.45)]'
                          : isLight
                          ? 'text-slate-900'
                          : 'text-white'
                      }`}
                    >
                      {formatPersianPrice(discountedPrice)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className={`text-[11px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>تا</span>
                    <span
                      className={`text-base sm:text-lg font-black tabular-nums ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {formatPersianPrice(discountedPrice * 10)}
                    </span>
                  </div>
                </div>
                {hasDiscount && (
                  <span className="text-[10px] text-slate-400 line-through tabular-nums block mt-0.5">
                    تعرفه پایه بدون تخفیف: {formatPersianPrice(service.startingPrice)}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className={`text-[11px] font-medium block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  تعرفه و برآورد پروژه:
                </span>
                <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-sky-700' : 'text-cyan-300'}`}>
                  استعلام و مشاوره توافقی
                </span>
              </>
            )}
          </div>

          <div className="text-left shrink-0">
            <span className={`text-[11px] font-medium block ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              زمان تحویل:
            </span>
            <span className={`text-xs font-bold ${isLight ? 'text-sky-600' : 'text-cyan-300'}`}>
              {service.deliveryTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSelect(service)}
            data-cursor-text="سفارش"
            className={`btn-shimmer flex-1 py-3.5 px-4 min-h-[48px] rounded-xl font-black text-xs sm:text-[13px] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 ${
              isInterrupted && activeAnomaly?.ctaClass
                ? activeAnomaly.ctaClass
                : isLight
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_6px_18px_rgba(2,132,199,0.28)] hover:shadow-[0_12px_28px_rgba(2,132,199,0.4)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(0,229,255,0.28)] hover:shadow-[0_0_26px_rgba(0,229,255,0.48)]'
            }`}
          >
            <span>
              {isInterrupted
                ? 'شروع پرقدرت این پروژه ⚡'
                : showPrices
                ? 'ثبت سفارش / استعلام فوری'
                : 'استعلام فوری و ثبت سفارش'}
            </span>
            <svg className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          {onOpenChatWithService && (
            <button
              onClick={() => onOpenChatWithService(service)}
              title="گفت‌وگو درباره این خدمت"
              aria-label={`گفت‌وگو درباره ${service.title}`}
              className={`p-3.5 min-h-[48px] min-w-[48px] rounded-xl border transition-all duration-200 flex items-center justify-center active:scale-95 ${
                isLight
                  ? 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border-slate-200 hover:border-sky-300'
                  : 'bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border-slate-700/80 hover:border-cyan-500/50'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
