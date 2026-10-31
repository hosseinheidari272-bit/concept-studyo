import React, { useState, useEffect, useRef } from 'react';
import { ServiceCategory, ServiceItem } from '../types';
import { studioServices } from '../data/services';
import { ServiceCard } from './ServiceCard';
import { ScrollReveal } from './ScrollReveal';
import { PortalStoryScene } from './PortalStoryScene';
import { ServiceCardSkeleton } from './LoadingSkeleton';
import { useTheme } from '../context/ThemeContext';
import { toPersianDigits } from '../utils/persianDate';
import {
  AnomalyVariant,
  AnomalyVariantId,
  pickNonRepeatingAnomaly,
  computeIrregularDelayMs,
} from '../utils/patternInterruptEngine';

interface ServicesSectionProps {
  services?: ServiceItem[];
  showPrices?: boolean;
  isLoading?: boolean;
  onSelectService: (service: ServiceItem) => void;
  onOpenChatForService?: (service: ServiceItem) => void;
  onOpenGeneralChat?: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services = studioServices,
  showPrices = true,
  isLoading = false,
  onSelectService,
  onOpenChatForService,
  onOpenGeneralChat,
}) => {
  const { isLight } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [isCustomDetailsOpen, setIsCustomDetailsOpen] = useState(false);

  // موتور وقفه‌های الگو (Pattern Interrupts) غیرتکراری و تصادفی برای کارت‌های خدمات
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeAnomaly, setActiveAnomaly] = useState<AnomalyVariant | null>(null);
  const [anomalySeed, setAnomalySeed] = useState(0);
  const [customCardJolted, setCustomCardJolted] = useState(false);

  const lastCardIdRef = useRef<string | null>(null);
  const lastAnomalyIdRef = useRef<AnomalyVariantId | null>(null);

  const categories = [
    { id: 'all', label: `تمامی ${toPersianDigits(services.length)} خدمت`, count: services.length },
    { id: 'design', label: 'طراحی، رندر ۳D و گرافیک', count: services.filter(s => s.category === 'design').length },
    { id: 'video_audio', label: 'سینما، موشن، صدا و دوبله', count: services.filter(s => s.category === 'video_audio').length },
    { id: 'dev_automation', label: 'وب‌سایت، اپ و هوش مصنوعی', count: services.filter(s => s.category === 'dev_automation').length },
  ];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsSectionVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSectionVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isSectionVisible || filteredServices.length === 0) return;

    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let timerId: ReturnType<typeof setTimeout>;
    let clearTimerId: ReturnType<typeof setTimeout>;

    const scheduleServiceJolt = (isFirstRun = false) => {
      const waitMs = isFirstRun
        ? isMobileViewport
          ? 1400
          : 550
        : computeIrregularDelayMs(
            Date.now() + Math.floor(Math.random() * 50000),
            isMobileViewport ? 3600 : 1800,
            isMobileViewport ? 8500 : 4400
          );
      timerId = setTimeout(() => {
        if (document.hidden) {
          scheduleServiceJolt(false);
          return;
        }
        // به طور تصادفی یا یکی از کارت‌های خدمات یا گاهی کارت یازدهم را انتخاب می‌کند
        const triggerCustom = Math.random() < 0.16;
        if (triggerCustom) {
          setCustomCardJolted(true);
          clearTimerId = setTimeout(() => {
            setCustomCardJolted(false);
            scheduleServiceJolt(false);
          }, 2800);
          return;
        }

        const candidateServices = filteredServices.filter((s) => s.id !== lastCardIdRef.current);
        const pool = candidateServices.length > 0 ? candidateServices : filteredServices;
        const chosenService = pool[Math.floor(Math.random() * pool.length)];

        const anomaly = pickNonRepeatingAnomaly(lastAnomalyIdRef.current);
        lastCardIdRef.current = chosenService.id;
        lastAnomalyIdRef.current = anomaly.id;

        setActiveCardId(chosenService.id);
        setActiveAnomaly(anomaly);
        setAnomalySeed(Math.floor(Math.random() * 10000));

        clearTimerId = setTimeout(() => {
          setActiveCardId(null);
          setActiveAnomaly(null);
          scheduleServiceJolt(false);
        }, anomaly.durationMs + 700);
      }, waitMs);
    };

    scheduleServiceJolt(true);

    return () => {
      clearTimeout(timerId);
      clearTimeout(clearTimerId);
    };
  }, [isSectionVisible, selectedCategory, filteredServices.length]);

  const handleOpenCustomChat = () => {
    if (onOpenGeneralChat) {
      onOpenGeneralChat();
    } else if (onOpenChatForService && services[0]) {
      onOpenChatForService({
        ...services[0],
        title: 'پروژه اختصاصی / ترکیبی / ترجمه و دوبله',
      });
    }
  };

  return (
    <section ref={sectionRef} id="services" className="relative py-10 sm:py-14 scroll-mt-14">
      {/* هدر بخش خدمات با انرژی بالا */}
      <ScrollReveal direction="down" distance={20} className="text-center max-w-3xl mx-auto mb-8 px-4">
        <span
          className={`text-xs font-black tracking-wider block mb-2 ${
            isLight ? 'text-sky-600' : 'text-cyan-400'
          }`}
        >
          اکوسیستم خدمات تخصصی — اجرای تیز، دقیق و نتیجه‌محور
        </span>
        <h2
          className={`text-2xl sm:text-4xl font-black mb-2.5 tracking-tight transition-colors ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          تعرفه‌ها و خدمات تخصصی استودیو: تیزرسازی، رندر ۳D، هویت بصری و توسعه وب
        </h2>
        <p
          className={`text-sm sm:text-base leading-relaxed font-normal transition-colors ${
            isLight ? 'text-slate-700' : 'text-slate-200'
          }`}
        >
          ما با اشتیاق و وسواس مهندسی روی هر پیکسل و فریم پروژه شما کار می‌کنیم تا ارزش واقعی برندتان با قدرت تمام دیده شود و مخاطب در همان نگاه اول مجذوب کیفیت شما گردد.
        </p>
      </ScrollReveal>

      {/* کنترل سگمنتد دسته‌بندی‌ها با ابعاد بزرگ‌تر جهت لمس آسان در موبایل */}
      <ScrollReveal delay={0.1} direction="down" distance={18} className="flex items-center justify-center flex-wrap gap-2 mb-8 px-4">
        <div
          className={`p-1.5 rounded-2xl border flex items-center flex-wrap gap-1.5 transition-colors ${
            isLight
              ? 'bg-slate-200/80 border-slate-300/90 shadow-inner'
              : 'bg-slate-900/95 border-slate-800 shadow-inner'
          }`}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ServiceCategory)}
                className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? isLight
                      ? 'bg-sky-600 text-white shadow-[0_4px_15px_rgba(2,132,199,0.3)] font-black'
                      : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.35)] font-black'
                    : isLight
                    ? 'text-slate-800 hover:text-slate-950 hover:bg-white/70'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive
                      ? isLight
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-slate-950/20 text-slate-950 font-bold'
                      : isLight
                      ? 'bg-white/90 text-slate-700'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {toPersianDigits(cat.count)}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* گرید ۳ ستونه کارت‌های خدمات + کارت یازدهم (به اندازه ۲ ستون) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-7xl mx-auto px-4 sm:px-6 items-stretch">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </>
        ) : (
          filteredServices.map((service, idx) => (
            <ScrollReveal
              key={service.id}
              delay={0.06 + (idx % 3) * 0.1}
              direction="down"
              distance={30}
              className="h-full"
            >
              <ServiceCard
                service={service}
                showPrices={showPrices}
                onSelect={onSelectService}
                onOpenChatWithService={onOpenChatForService}
                activeAnomaly={activeCardId === service.id ? activeAnomaly : null}
                anomalySeed={anomalySeed}
              />
            </ScrollReveal>
          ))
        )}

        {/* کارت یازدهم: کادر ۲ ستونی سفارش ترکیبی، ترجمه و دوبله و ایده دلخواه */}
        <ScrollReveal
          delay={0.2}
          direction="down"
          distance={30}
          className="md:col-span-2 lg:col-span-2 h-full"
        >
          <article
            className={`relative h-full rounded-3xl border p-5 sm:p-7 flex flex-col justify-between overflow-hidden transition-all duration-300 group ${
              customCardJolted
                ? 'pi-crimson-surge pi-laser-sweep border-red-500/90'
                : isLight
                ? 'bg-white/95 border-slate-200/90 hover:border-sky-400 shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(2,132,199,0.14)]'
                : 'bg-[#090F1C]/90 border-slate-800/80 hover:border-cyan-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,180,255,0.14)]'
            }`}
          >
            <div>
              {/* صحنه ۳ مرحله‌ای سه‌بعدی */}
              <PortalStoryScene />

              {/* تیتر و متن پرانرژی کارت یازدهم */}
              <div className="mb-3">
                <h3
                  className={`text-lg sm:text-2xl font-black transition-all duration-300 ${
                    customCardJolted
                      ? 'text-red-500 scale-[1.03] origin-right'
                      : isLight
                      ? 'text-slate-900'
                      : 'text-white'
                  }`}
                >
                  پروژه خاص، ترکیبی یا ایده جاه‌طلبانه‌ای در ذهن دارید که در لیست بالا نبود؟
                </h3>
              </div>

              <p
                className={`text-xs sm:text-sm leading-relaxed font-normal mb-4 ${
                  isLight ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                ما عاشق چالش‌های بزرگ و پروژه‌های خاص هستیم! فقط کافیست روی دکمه{' '}
                <strong
                  className={
                    customCardJolted
                      ? 'text-red-500 font-black underline decoration-red-500 decoration-2'
                      : isLight
                      ? 'text-sky-700 font-black'
                      : 'text-cyan-300 font-black'
                  }
                >
                  «مشاوره و گفت‌وگو»
                </strong>{' '}
                بزنید و ایده خود را بگویید. چه بخواهید{' '}
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                  ترکیبی قدرتمند از چند خدمت بالا
                </strong>{' '}
                را یکجا داشته باشید، و چه بخواهید{' '}
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                  ویدیوهای بین‌المللی را با دوبله استودیویی و سینک دقیق بومی‌سازی کنید؛
                </strong>{' '}
                ما مشتاقیم تا ایده‌تان را به خروجی شگفت‌انگیزی تبدیل کنیم که خودتان از دیدنش به وجد بیایید.
              </p>

              {/* دکمه توضیحات بیشتر برای کارت یازدهم */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setIsCustomDetailsOpen(!isCustomDetailsOpen)}
                  aria-expanded={isCustomDetailsOpen}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                    isLight
                      ? isCustomDetailsOpen
                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                        : 'bg-slate-100/80 hover:bg-sky-50 border-slate-200 text-sky-700'
                      : isCustomDetailsOpen
                      ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-cyan-300'
                  }`}
                >
                  <span>
                    {isCustomDetailsOpen ? 'بستن جزئیات اجرایی' : 'مشاهده قابلیت‌های سفارشی‌سازی'}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isCustomDetailsOpen ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isCustomDetailsOpen && (
                  <div
                    style={{ animation: 'mistClearReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                    className={`mt-2.5 p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                      isLight
                        ? 'bg-sky-50/70 border-sky-200 text-slate-700'
                        : 'bg-slate-950/90 border-cyan-500/30 text-slate-300'
                    }`}
                  >
                    <p>
                      • <strong>ترجمه، زیرنویس و دوبله فارسی ویدیوها:</strong> تبدیل ویدیوهای آموزشی، یوتیوبی یا تبلیغاتی زبان‌های دیگر به فارسی با گویندگی کاریزماتیک و هماهنگی دقیق صدا و تصویر.
                    </p>
                    <p>
                      • <strong>پکیج‌های ترکیبی ۳۶۰ درجه:</strong> ترکیب طراحی سایت، تیزر سه‌بعدی و اتوماسیون هوشمند در یک فاز اجرایی هماهنگ.
                    </p>
                    <p>
                      • <strong>معماری پروژه‌های خاص:</strong> هر نیازی در حوزه طراحی، ویدیو، صدا، هوش مصنوعی یا برنامه‌نویسی دارید، مستقیماً با ما مطرح کنید.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* فوتر کارت یازدهم همراه با دکمه مستقیم مشاوره و گفت‌وگو */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t ${
                isLight ? 'border-slate-200/80' : 'border-slate-800/80'
              }`}
            >
              <div className="space-y-0.5">
                <span className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  طراحی و مهندسی اختصاصی متناسب با هدف شما
                </span>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  بررسی مستقیم توسط مدیریت فنی و ارائه نقشه راه فوری
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenCustomChat}
                data-cursor-text="مشاوره"
                className={`btn-shimmer px-7 py-3.5 min-h-[48px] rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 transform active:scale-95 shrink-0 ${
                  customCardJolted
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.75)] scale-105'
                    : isLight
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_8px_22px_rgba(2,132,199,0.3)]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.35)]'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{customCardJolted ? 'شروع گفت‌وگوی مستقیم ⚡' : 'مشاوره و گفت‌وگو'}</span>
              </button>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  );
};
