import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';

export const StudioHighlights: React.FC = () => {
  const { isLight } = useTheme();

  const highlights = [
    {
      num: '۰۱',
      title: 'خروجی استاندارد سینمایی (4K/8K)',
      desc: 'رندرینگ دقیق و اصلاح رنگ سینمایی (DaVinci)؛ یعنی خروجی تصویر و ویدیوی شما مثل فیلم‌های روز دنیا، شفاف، زنده و چشم‌نواز می‌شود تا در هر صفحه‌نمایشی بدرخشد.',
      detail: 'کیفیت بین‌المللی',
    },
    {
      num: '۰۲',
      title: 'تحویل سریع با کیفیت استاندارد و بالا',
      desc: 'فرآیند تولید بهینه و چابک؛ یعنی بدون اینکه کیفیت و ظرافت کار ذره‌ای افت کند، پروژه شما با سرعت بالا و رعایت تمام استانداردهای حرفه‌ای آماده می‌شود.',
      detail: 'سرعت و کیفیت برتر',
    },
    {
      num: '۰۳',
      title: 'ارائه کامل فایل‌های لایه‌باز و سورس',
      desc: 'تحویل تمامی فایل‌های اصلی (PSD, AI, AfterEffects, کدهای سایت)؛ یعنی شما مالک ۱۰۰٪ پروژه هستید و هر زمان بخواهید می‌توانید متن، عکس یا اجزای آن را تغییر دهید.',
      detail: 'مالکیت بی‌قیدوشرط',
    },
    {
      num: '۰۴',
      title: 'مشاوره و پشتیبانی مستقیم مدیریت',
      desc: 'جلسات بازخوانی و رفع اصلاحات مستمر؛ یعنی از لحظه ایده‌پردازی تا تحویل نهایی، مستقیم و بدون واسطه کنارتان هستیم تا دقیقاً همان چیزی که می‌خواهید اجرا شود.',
      detail: 'همراهی متعهدانه',
    },
  ];

  return (
    <section id="highlights" aria-label="شاخص‌های تمایز استودیو" className="my-16 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
      {/* سرتیتر بخش با ظهور نرم و پویا */}
      <ScrollReveal direction="down" distance={25}>
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b transition-colors ${
            isLight ? 'border-slate-200' : 'border-slate-800/80'
          }`}
        >
          <div>
            <span
              className={`text-xs font-bold tracking-wider block mb-1 ${
                isLight ? 'text-sky-600' : 'text-cyan-400'
              }`}
            >
              استانداردهای بنیادین تولید
            </span>
            <h2
              className={`text-xl sm:text-3xl font-black transition-colors ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              چرا برندهای پیشرو استودیو ما را برمی‌گزینند؟
            </h2>
          </div>
          <p
            className={`text-xs sm:text-sm max-w-md leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            ترکیب تخصص فنی پیشرفته با زبانی شفاف و همراهی قدم‌به‌قدم، تا خیالتان از سرعت اجرا و کیفیت نهایی کاملاً راحت باشد.
          </p>
        </div>
      </ScrollReveal>

      {/* شبکه ۴ ستونه شاخص‌ها با ظهور پله‌ای و نرم در هر بار اسکرول */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((h, i) => (
          <ScrollReveal
            key={i}
            delay={i * 0.12}
            direction="down"
            distance={28}
          >
            <div
              className={`h-full p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 group flex flex-col justify-between ${
                isLight
                  ? 'bg-white/90 border-slate-200/90 hover:border-sky-400 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_40px_rgba(2,132,199,0.12)]'
                  : 'bg-[#090F1D]/80 border-slate-800/80 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xl font-black ${
                      isLight ? 'text-sky-600' : 'text-cyan-400'
                    }`}
                  >
                    {h.num}
                  </span>
                  <span
                    className={`text-[11px] font-semibold transition-colors ${
                      isLight
                        ? 'text-slate-500 group-hover:text-sky-600'
                        : 'text-slate-400 group-hover:text-cyan-300'
                    }`}
                  >
                    {h.detail}
                  </span>
                </div>

                <h3
                  className={`text-base font-bold mb-2.5 transition-colors ${
                    isLight
                      ? 'text-slate-900 group-hover:text-sky-700'
                      : 'text-white group-hover:text-cyan-200'
                  }`}
                >
                  {h.title}
                </h3>

                <p
                  className={`text-xs leading-relaxed font-normal ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  {h.desc}
                </p>
              </div>

              <div
                className={`pt-4 mt-4 border-t flex items-center gap-1.5 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${
                  isLight
                    ? 'border-slate-100 text-sky-600'
                    : 'border-slate-800/60 text-cyan-400'
                }`}
              >
                <span>تضمین رسمی کیفیت</span>
                <span>✓</span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};
