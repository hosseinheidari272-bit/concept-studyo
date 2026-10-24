import React, { useState } from 'react';

/**
 * کامپوننت بازطراحی‌شده خوش‌آمدگویی بر اساس رفرنس انیمیشن Sixfold
 * ویژگی‌ها:
 * ۱. تایپوگرافی درشت، شکیل و برجسته با سایه نوری نئونی (Sixfold Fluid Wordmark)
 * ۲. پرتوهای نوری سیال متحرک افقی و اعوجاج موجی آبی (Glowing Blue Wave Distortions)
 * ۳. کادر فنی سایبرنتیک با نشانگرهای SECTION_01 و تگ‌های مانیتورینگ
 * ۴. آیکون کانتوری چندضلعی متحرک هم‌مرکز با هسته تپنده
 */
export const SixfoldWelcome: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group cursor-default select-none my-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* هاله امواج نوری نئونی در پشت لوگو (Sixfold Wave Aura) */}
      <div
        className={`absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-blue-600/30 via-cyan-400/40 to-blue-500/25 rounded-3xl blur-2xl transition-all duration-700 pointer-events-none ${
          isHovered ? 'opacity-100 scale-105' : 'opacity-65 scale-100'
        }`}
      />

      {/* خطوط و پرتوهای موجی نوری سیال شبیه تصویر Sixfold */}
      <div className="absolute -inset-3 overflow-hidden rounded-2xl pointer-events-none opacity-50 group-hover:opacity-85 transition-opacity duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/30 via-blue-600/15 to-transparent animate-pulse" />
        <div className="w-[200%] h-full absolute -top-1/2 -left-1/2 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent rotate-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      </div>

      {/* کانتینر اصلی با لایه‌های HUD و استایل متالیک دارک */}
      <div className="relative flex items-center gap-3.5 sm:gap-5 px-4.5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(0,180,255,0.25)] group-hover:border-cyan-300/70 group-hover:shadow-[0_0_45px_rgba(0,229,255,0.45)] transition-all duration-500">
        
        {/* نشانگر فنی SECTION_01 مشابه تصویر Sixfold */}
        <div className="absolute -top-2.5 right-5 px-2 py-0.5 rounded bg-black border border-cyan-400/60 text-[9px] sm:text-[10px] font-mono tracking-widest text-cyan-300 uppercase flex items-center gap-1.5 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span>SECTION_01</span>
        </div>

        {/* کراس‌هیرهای گوشه فریم مهندسی */}
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-1.5 border-l-1.5 border-cyan-400/70" />
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-1.5 border-r-1.5 border-cyan-400/70" />

        {/* نماد هندسی کانتوری چندضلعی با امواج نئونی شبیه لوگوی Sixfold */}
        <div className="relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-blue-950/90 via-slate-900 to-black border border-cyan-400/50 shadow-[inset_0_0_16px_rgba(0,229,255,0.4)] overflow-hidden shrink-0 group-hover:border-cyan-300 transition-colors">
          <svg
            className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-400 transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-700 ease-out"
            viewBox="0 0 40 40"
            fill="none"
          >
            <defs>
              <linearGradient id="sixfoldEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FFFF" />
                <stop offset="50%" stopColor="#0099FF" />
                <stop offset="100%" stopColor="#0044CC" />
              </linearGradient>
              <filter id="emblemGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* حلقه بیرونی موج‌دار با چرخش آرام */}
            <path
              d="M 20 4 C 27 4, 35 8, 37 15 C 39 23, 34 33, 28 36 C 21 39, 11 36, 6 29 C 1 22, 4 10, 12 5 C 15 3, 17 4, 20 4 Z"
              stroke="url(#sixfoldEmblemGrad)"
              strokeWidth="2"
              fill="none"
              filter="url(#emblemGlow)"
              className="animate-spin-slow origin-center"
            />
            {/* لایه موجی دوم با خط‌چین */}
            <path
              d="M 20 9 C 25 9, 30 13, 31 18 C 32 23, 28 28, 23 30 C 17 32, 11 29, 9 23 C 7 18, 10 12, 15 10 Z"
              stroke="#00E5FF"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              fill="none"
              opacity="0.85"
            />
            {/* هسته نوری مرکزی */}
            <circle cx="20" cy="20" r="3.5" fill="#00FFFF" filter="url(#emblemGlow)" />
          </svg>
        </div>

        {/* متن درشت‌تر، پرابهت و نئونی "خوش آمدید" */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white transition-all duration-300 drop-shadow-[0_0_18px_rgba(0,229,255,0.75)] group-hover:drop-shadow-[0_0_28px_rgba(0,229,255,1)]"
              style={{
                fontFamily: "'Vazirmatn', sans-serif",
                textShadow: '0 0 16px rgba(0, 229, 255, 0.65), 0 0 32px rgba(0, 102, 255, 0.45)',
              }}
            >
              خوش آمدید
            </h1>

            {/* تگ نشانگر آنلاین */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE_STUDIO
            </span>
          </div>

          <span className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide flex items-center gap-2 mt-0.5">
            استودیو خلاقیت دیجیتال، رسانه و وب نسل ۴
            <span className="w-1 h-1 rounded-full bg-cyan-400/80 inline-block" />
            <span className="text-cyan-400 font-mono text-[11px]">v2.6</span>
          </span>
        </div>

      </div>
    </div>
  );
};
