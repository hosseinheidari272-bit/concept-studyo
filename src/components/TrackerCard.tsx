import React, { useState, useEffect } from 'react';
import { toPersianDigits } from '../utils/persianDate';

export const TrackerCard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [counter, setCounter] = useState<number>(0);
  const [activeDay, setActiveDay] = useState<number>(() => new Date().getDay());
  const [arcOffset, setArcOffset] = useState<number>(330);

  // روزهای هفته ایرانی (شنبه تا جمعه)
  const daysOfWeek = [
    { id: 6, name: 'ش', label: 'شنبه' },
    { id: 0, name: 'ی', label: 'یک‌شنبه' },
    { id: 1, name: 'د', label: 'دوشنبه' },
    { id: 2, name: 'س', label: 'سه‌شنبه' },
    { id: 3, name: 'چ', label: 'چهارشنبه' },
    { id: 4, name: 'پ', label: 'پنج‌شنبه' },
    { id: 5, name: 'ج', label: 'جمعه' },
  ];

  const targetNumber = 19538;
  const todayDay = new Date().getDay();
  const iranianOrder = [6, 0, 1, 2, 3, 4, 5];
  const todayPos = iranianOrder.indexOf(todayDay);

  // ۱. تنظیم تاریخ شمسی
  useEffect(() => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('fa-IR', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      setCurrentDate(formatter.format(now));
    } catch {
      setCurrentDate('امروز');
    }
  }, []);

  // ۲. انیمیشن پر شدن آرک و شمارنده تا ۱۹,۵۳۸
  useEffect(() => {
    const duration = 2200;
    const startTimestamp = performance.now();
    const totalArcLength = 330;
    const targetFillRatio = 0.86;

    let animId: number;

    const step = (now: number) => {
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease Out Quart
      const eased = 1 - Math.pow(1 - progress, 4);

      setCounter(Math.floor(eased * targetNumber));
      setArcOffset(totalArcLength * (1 - eased * targetFillRatio));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCounter(targetNumber);
      }
    };

    const timer = setTimeout(() => {
      animId = requestAnimationFrame(step);
    }, 200);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto relative group">
      {/* هاله ملایم پس‌زمینه کارت */}
      <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

      {/* پنل گلس کارت هدر */}
      <div className="relative rounded-[28px] bg-slate-950/75 backdrop-blur-2xl border border-slate-800/80 hover:border-slate-700/80 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-500">
        
        {/* خط نوری گرادیانت در لبه بالایی */}
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        {/* هدر داخلی کارت: استودیو آنلاین و تاریخ */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-400">استودیو آنلاین و فعال</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium">
            <svg
              className="w-3.5 h-3.5 text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{currentDate || 'بارگذاری...'}</span>
          </div>
        </div>

        {/* کپسول روزهای هفته (Daily Streak) */}
        <div className="flex items-center justify-between p-2 mb-6 rounded-2xl bg-black/45 border border-slate-800/60">
          {daysOfWeek.map((day) => {
            const dayPos = iranianOrder.indexOf(day.id);
            const isPassed = dayPos < todayPos;
            const isSelected = activeDay === day.id;

            return (
              <button
                key={day.id}
                onClick={() => setActiveDay(day.id)}
                title={day.label}
                aria-label={`روز ${day.label}`}
                className={`flex flex-col items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 scale-105 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="text-xs font-semibold">{day.name}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isSelected
                      ? 'bg-cyan-400 shadow-[0_0_8px_#00e5ff] scale-125'
                      : isPassed
                      ? 'bg-cyan-500/50'
                      : 'bg-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* نشانگر آرک آبی نئونی و شمارنده پروژه‌ها */}
        <div className="relative flex flex-col items-center justify-center my-3">
          <svg className="w-full max-w-[290px] h-auto overflow-visible" viewBox="0 0 260 155">
            <defs>
              <linearGradient id="arcGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0066FF" />
                <stop offset="50%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#00FFF0" />
              </linearGradient>
              <filter id="arcFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* مسیر خاکستری پس‌زمینه */}
            <path
              d="M 25 135 A 105 105 0 0 1 235 135"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* نشانگرهای خط‌کشی ظریف (Ticks) */}
            <path
              d="M 40 135 A 90 90 0 0 1 220 135"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
              strokeDasharray="2 10"
              strokeLinecap="round"
            />

            {/* مسیر فعال پرشونده نئونی */}
            <path
              d="M 25 135 A 105 105 0 0 1 235 135"
              fill="none"
              stroke="url(#arcGlowGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="330"
              strokeDashoffset={arcOffset}
              filter="url(#arcFilter)"
              className="transition-all duration-75"
            />
          </svg>

          {/* متن و مقدار عددی داخل آرک */}
          <div className="absolute bottom-2 flex flex-col items-center text-center">
            <span className="text-xs text-slate-400 font-medium mb-1">
              پروژه‌ها و رندرهای موفق استودیو
            </span>
            <div
              className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(0,229,255,0.5)] my-0.5"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {toPersianDigits(counter.toLocaleString('en-US'))}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-[11px] text-cyan-300 font-semibold mt-1">
              <svg className="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>+۹۸.۴٪ بازدهی و رضایت مشتریان</span>
            </div>
          </div>
        </div>

        {/* فوتر متریک‌های داخل کارت */}
        <div className="grid grid-cols-3 gap-2 pt-4 mt-3 border-t border-slate-800/80 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 mb-0.5">کیفیت خروجی</span>
            <span className="text-xs sm:text-sm font-bold text-slate-100">4K / Cinema</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800/80">
            <span className="text-[11px] text-slate-400 mb-0.5">پشتیبانی اختصاصی</span>
            <span className="text-xs sm:text-sm font-bold text-cyan-300">۲۴/۷ آنی</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 mb-0.5">زمان تحویل</span>
            <span className="text-xs sm:text-sm font-bold text-slate-100">فوق‌سریع</span>
          </div>
        </div>

      </div>
    </div>
  );
};
