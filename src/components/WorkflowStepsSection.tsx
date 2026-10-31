import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';

interface WorkflowStepsSectionProps {
  onOpenOrderModal: () => void;
  onOpenChat: () => void;
}

export const WorkflowStepsSection: React.FC<WorkflowStepsSectionProps> = ({
  onOpenOrderModal,
  onOpenChat,
}) => {
  const { isLight } = useTheme();

  const steps = [
    {
      step: '۰۱',
      title: 'ثبت استعلام یا سفارش (رایگان)',
      desc: 'انتخاب خدمت مدنظر، ارسال خلاصه بریف و دریافت کد رهگیری یکتا بدون هیچ اجباری برای پرداخت آنی در لحظه ثبت.',
      badge: 'کمتر از ۱ دقیقه',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      step: '۰۲',
      title: 'بررسی بریف و پیش‌فاکتور شفاف',
      desc: 'مدیریت استودیو در کمتر از ۱۵ دقیقه با شما هماهنگ شده، نیازمندی‌ها قطعی می‌شود و قرارداد مرحله‌ای (۵۰٪ شروع) صادر می‌گردد.',
      badge: 'پاسخگویی زیر ۱۵ دقیقه',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      step: '۰۳',
      title: 'تولید اتود و ۲ دور کالیبراسیون رایگان',
      desc: 'نسخه پیش‌نمایش اولیه آماده می‌شود؛ بازخورد شما اعمال شده و با شرایط پرداخت متغیر (۵۰٪ پیش‌پرداخت یا توافقی بسته به مقیاس پروژه)، تا ۲ دور پولیش دقیق انجام می‌شود.',
      badge: '۵۰٪ متغیر بسته به شرایط',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      step: '۰۴',
      title: 'تحویل فوق‌سریع سورس کامل با حفظ کیفیت سینمایی',
      desc: 'پس از تایید کامل، فایل‌های لایه‌باز اصلی، خروجی‌های سینمایی با بالاترین کیفیت و کدهای تمیز با سرعت فوق‌العاده بالا و پشتیبانی همه‌جانبه تحویل می‌گردد.',
      badge: 'تحویل فوق‌سریع + سورس لایه‌باز',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="workflow"
      aria-label="مسیر شفاف از سفارش تا تحویل نهایی"
      className="my-12 sm:my-14 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20"
    >
      <ScrollReveal direction="down" distance={20}>
        <div className="text-center max-w-2xl mx-auto mb-9">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2.5 border bg-sky-500/10 text-sky-400 border-sky-500/30">
            <span>فرآیند استاندارد، شفاف و بدون غافلگیری</span>
          </div>

          <h2
            className={`text-2xl sm:text-4xl font-black mb-2.5 transition-colors ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            مراحل ۴ گانه ثبت سفارش، تولید تیزر و تحویل سورس پروژه
          </h2>

          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-slate-200'
            }`}
          >
            هیچ ابهام یا هزینه‌ای پنهان نیست. از اولین کلیک تا زمان در دست داشتن فایل‌های خروجی، دقیقاً می‌دانید در چه مرحله‌ای قرار دارید.
          </p>
        </div>
      </ScrollReveal>

      {/* تایم‌لاین ۴ مرحله‌ای */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
        {/* خط اتصال نامرئی در دسکتاپ */}
        <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-cyan-500/10 via-cyan-500/30 to-blue-500/10 -translate-y-8 z-0 pointer-events-none" />

        {steps.map((item, idx) => (
          <ScrollReveal key={idx} delay={idx * 0.08} direction="up" distance={20}>
            <div
              data-cursor-interactive="true"
              className={`interactive-card-lift relative z-10 h-full p-5 sm:p-6 rounded-2xl border flex flex-col justify-between backdrop-blur-xl group ${
                isLight
                  ? 'bg-white border-slate-200/95 hover:border-sky-400 shadow-[0_8px_25px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_38px_rgba(2,132,199,0.14)]'
                  : 'bg-[#090F1E]/95 border-slate-800/90 hover:border-cyan-400/50 shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:shadow-[0_18px_42px_rgba(0,229,255,0.14)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border font-black text-sm transition-transform duration-300 group-hover:scale-110 ${
                      isLight
                        ? 'bg-sky-50 border-sky-200 text-sky-600'
                        : 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300'
                    }`}
                  >
                    {item.icon}
                  </div>

                  <span
                    className={`text-xl font-black transition-colors ${
                      isLight ? 'text-slate-400 group-hover:text-sky-600' : 'text-slate-600 group-hover:text-cyan-400'
                    }`}
                  >
                    {item.step}
                  </span>
                </div>

                <div className="mb-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border inline-block mb-2 ${
                      isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <h3
                    className={`text-base font-black transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-sky-700' : 'text-white group-hover:text-cyan-200'
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>

                <p
                  className={`text-xs sm:text-[13px] leading-relaxed ${
                    isLight ? 'text-slate-700' : 'text-slate-200'
                  }`}
                >
                  {item.desc}
                </p>
              </div>

              <div
                className={`pt-3.5 mt-4 border-t text-[11px] font-bold flex items-center justify-between ${
                  isLight ? 'border-slate-200/80 text-sky-700' : 'border-slate-800/80 text-cyan-300'
                }`}
              >
                <span>مرحله {item.step}</span>
                <span>←</span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* دکمه‌های اقدام زیر تایم‌لاین با ابعاد بزرگ‌تر جهت لمس آسان در موبایل */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onOpenOrderModal}
          data-cursor-text="شروع"
          className="btn-shimmer w-full sm:w-auto px-7 py-3.5 min-h-[48px] rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all transform hover:-translate-y-0.5 active:scale-95"
        >
          شروع پروژه با مرحله اول (ثبت رایگان)
        </button>
        <button
          onClick={onOpenChat}
          className={`w-full sm:w-auto px-6 py-3.5 min-h-[48px] rounded-xl border font-bold text-xs sm:text-sm transition-all hover:-translate-y-0.5 active:scale-95 ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-100'
          }`}
        >
          استعلام و گفت‌وگوی آنی با مدیریت
        </button>
      </div>
    </section>
  );
};
