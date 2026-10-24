import React, { useState } from 'react';
import { ServiceCategory, ServiceItem } from '../types';
import { studioServices } from '../data/services';
import { ServiceCard } from './ServiceCard';
import { ScrollReveal } from './ScrollReveal';
import { PortalStoryScene } from './PortalStoryScene';
import { useTheme } from '../context/ThemeContext';
import { toPersianDigits } from '../utils/persianDate';

interface ServicesSectionProps {
  services?: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  onOpenChatForService?: (service: ServiceItem) => void;
  onOpenGeneralChat?: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services = studioServices,
  onSelectService,
  onOpenChatForService,
  onOpenGeneralChat,
}) => {
  const { isLight } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [isCustomDetailsOpen, setIsCustomDetailsOpen] = useState(false);

  const categories = [
    { id: 'all', label: `تمامی ${toPersianDigits(services.length)} خدمت`, count: services.length },
    { id: 'design', label: 'طراحی، رندر ۳D و گرافیک', count: services.filter(s => s.category === 'design').length },
    { id: 'video_audio', label: 'سینما، موشن، صدا و دوبله', count: services.filter(s => s.category === 'video_audio').length },
    { id: 'dev_automation', label: 'وب‌سایت، اپ و هوش مصنوعی', count: services.filter(s => s.category === 'dev_automation').length },
  ];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

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
    <section id="services" className="relative py-16 sm:py-20 scroll-mt-14">
      {/* هدر بخش خدمات با ورود نرم و پویا */}
      <ScrollReveal direction="down" distance={25} className="text-center max-w-2xl mx-auto mb-10 px-4">
        <span
          className={`text-xs font-bold tracking-wider block mb-2 uppercase ${
            isLight ? 'text-sky-600' : 'text-cyan-400'
          }`}
        >
          اکوسیستم خدمات تخصصی
        </span>
        <h2
          className={`text-2xl sm:text-4xl font-black mb-3 tracking-tight transition-colors ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          تعرفه‌های شفاف و خدمات استودیو
        </h2>
        <p
          className={`text-sm sm:text-base leading-relaxed font-normal transition-colors ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          هر خدمت با زبانی ساده و شفاف، کیفیت استاندارد سینمایی، تحویل فایل‌های اصلی (لایه‌باز) و بدون هزینه‌های پنهان اجرا می‌شود.
        </p>
      </ScrollReveal>

      {/* کنترل سگمنتد دسته‌بندی‌ها */}
      <ScrollReveal delay={0.15} direction="down" distance={20} className="flex items-center justify-center flex-wrap gap-2 mb-10 px-4">
        <div
          className={`p-1.5 rounded-2xl border flex items-center flex-wrap gap-1 transition-colors ${
            isLight
              ? 'bg-slate-200/75 border-slate-300/80 shadow-inner'
              : 'bg-slate-900/90 border-slate-800 shadow-inner'
          }`}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ServiceCategory)}
                className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? isLight
                      ? 'bg-sky-600 text-white shadow-[0_4px_15px_rgba(2,132,199,0.3)] font-black'
                      : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.35)] font-black'
                    : isLight
                    ? 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive
                      ? isLight
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-slate-950/20 text-slate-950 font-bold'
                      : isLight
                      ? 'bg-white/80 text-slate-600'
                      : 'bg-slate-800 text-slate-400'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 sm:px-6 items-stretch">
        {filteredServices.map((service, idx) => (
          <ScrollReveal
            key={service.id}
            delay={0.06 + (idx % 3) * 0.1}
            direction="down"
            distance={30}
            className="h-full"
          >
            <ServiceCard
              service={service}
              onSelect={onSelectService}
              onOpenChatWithService={onOpenChatForService}
            />
          </ScrollReveal>
        ))}

        {/* کارت یازدهم: کادر ۲ ستونی سفارش ترکیبی، ترجمه و دوبله و ایده دلخواه */}
        <ScrollReveal
          delay={0.2}
          direction="down"
          distance={30}
          className="md:col-span-2 lg:col-span-2 h-full"
        >
          <article
            className={`relative h-full rounded-3xl border p-5 sm:p-7 flex flex-col justify-between overflow-hidden transition-all duration-300 group ${
              isLight
                ? 'bg-white/95 border-slate-200/90 hover:border-sky-400 shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(2,132,199,0.14)]'
                : 'bg-[#090F1C]/90 border-slate-800/80 hover:border-cyan-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,180,255,0.14)]'
            }`}
          >
            <div>
              {/* صحنه ۳ مرحله‌ای سه‌بعدی بدون متن اضافه یا فلش */}
              <PortalStoryScene />

              {/* تیتر و متن صمیمی کارت یازدهم */}
              <div className="mb-3">
                <h3
                  className={`text-lg sm:text-2xl font-black transition-colors ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  خدمت مد نظرتان در موارد بالا نبود؟
                </h3>
              </div>

              <p
                className={`text-xs sm:text-sm leading-relaxed font-normal mb-4 ${
                  isLight ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                اگر چیزی که می‌خواستید را در موارد بالا پیدا نکردید، فقط کافیه روی دکمه{' '}
                <strong className={isLight ? 'text-sky-700 font-black' : 'text-cyan-300 font-black'}>
                  «مشاوره و گفت‌وگو»
                </strong>{' '}
                کلیک کنید تا چیزی که می‌خواهید رو توضیح بدید. شاید بخواهید{' '}
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                  ترکیبی از موارد بالا
                </strong>{' '}
                رو داشته باشید، یا{' '}
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                  ویدیوهایی که می‌بینید رو ترجمه کنید و حتی دوبله‌شون کنید!
                </strong>{' '}
                هر چیزی که هست فقط کافیه توضیحش بدید؛ قطعاً بهتون جواب می‌دیم و این باعث افتخار هست که به شما کمک کنیم.
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
                    {isCustomDetailsOpen ? 'بستن توضیحات بیشتر' : 'توضیحات بیشتر'}
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
                      • <strong>ترجمه، زیرنویس و دوبله فارسی ویدیوها:</strong> تبدیل ویدیوهای آموزشی، یوتیوبی یا تبلیغاتی زبان‌های دیگر به فارسی با گویندگی طبیعی و هماهنگی دقیق صدا و تصویر.
                    </p>
                    <p>
                      • <strong>پکیج‌های ترکیبی دلخواه:</strong> ترکیب چند خدمت از لیست بالا متناسب با نیاز و بودجه پروژه شما.
                    </p>
                    <p>
                      • <strong>ایده‌های خاص و سفارشی:</strong> هر نیازی در حوزه طراحی، ویدیو، صدا، هوش مصنوعی یا برنامه‌نویسی دارید، مستقیم با ما مطرح کنید.
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
                  ثبت سفارش اختصاصی و ترکیبی
                </span>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ارتباط مستقیم برای بررسی جزئیات خواسته شما
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenCustomChat}
                className={`px-7 py-3.5 min-h-[48px] rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 transform active:scale-95 shrink-0 ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_8px_22px_rgba(2,132,199,0.3)]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.35)]'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>مشاوره و گفت‌وگو</span>
              </button>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  );
};
