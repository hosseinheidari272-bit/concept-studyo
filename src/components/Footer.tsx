import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  onOpenChat?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenChat }) => {
  const { isLight } = useTheme();

  return (
    <footer
      id="about"
      className={`relative z-10 mt-24 pt-14 pb-16 border-t backdrop-blur-xl transition-colors ${
        isLight
          ? 'border-slate-200/90 bg-white/80 text-slate-700'
          : 'border-slate-900 bg-[#060A14] text-slate-300'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal direction="down" distance={25}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-12">
            {/* ستون ۱ و ۲: معرفی استودیو */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    isLight
                      ? 'bg-sky-50 border-sky-300 text-sky-600'
                      : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-400'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  CONCEPT STUDIO
                </span>
              </div>

              <p className={`text-sm leading-relaxed max-w-lg font-normal ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                استودیو تخصصی طراحی گرافیک، تیزرسازی تبلیغاتی، مدل‌سازی سه‌بعدی و توسعه راهکارهای هوش مصنوعی و وب مدرن. ما هویت بصری کسب‌وکارها را با بالاترین استانداردهای کیفی جهانی بازآفرینی می‌کنیم.
              </p>

              <div className={`flex items-center gap-3 pt-1 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}>
                  تهران و پروژه‌های بین‌المللی
                </span>
                <span>·</span>
                <span className={`font-bold ${isLight ? 'text-sky-600' : 'text-cyan-400'}`}>
                  پشتیبانی متعهدانه و شفاف
                </span>
              </div>
            </div>

            {/* ستون ۳: دسته‌بندی خدمات */}
            <div className="space-y-3 text-sm">
              <span
                className={`font-bold block mb-3 text-xs tracking-wider uppercase ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                حوزه‌های فعالیت
              </span>
              <ul className={`space-y-2.5 text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <li>
                  <a href="#services" className={`transition-colors ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    طراحی عکس و کامپوزیت 8K
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    ساخت و اصلاح رنگ تیزر سینمایی
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    رندرهای سه‌بعدی محصولات
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    توسعه وب‌سایت‌های لوکس و سریع
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    اتوماسیون کسب‌وکار و سیستم‌های هوشمند
                  </a>
                </li>
              </ul>
            </div>

            {/* ستون ۴: ارتباط مستقیم */}
            <div className="space-y-3 text-sm">
              <span
                className={`font-bold block mb-3 text-xs tracking-wider uppercase ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                ارتباط مستقیم با مدیریت
              </span>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                جهت دریافت مشاوره اولیه، هماهنگی جلسات فنی و ارسال بریف پروژه می‌توانید مستقیماً با ما در ارتباط باشید.
              </p>

              <div className="pt-2 flex flex-col gap-2.5">
                {onOpenChat && (
                  <button
                    onClick={onOpenChat}
                    className={`px-4 py-2.5 min-h-[44px] rounded-xl border text-xs font-bold transition-colors flex items-center justify-between ${
                      isLight
                        ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700'
                        : 'bg-slate-900 hover:bg-slate-800 border-cyan-500/30 text-cyan-300 hover:text-cyan-200'
                    }`}
                  >
                    <span>شروع گفت‌وگوی آنلاین</span>
                    <span className="text-xs">←</span>
                  </button>
                )}
                <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ایمیل: info@sixfold-studio.ir
                </span>
              </div>
            </div>
          </div>

          {/* کپی‌رایت تمیز و حرفه‌ای */}
          <div
            className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-slate-900 text-slate-500'
            }`}
          >
            <span>
              © ۲۰۲۶ استودیو کانسپت (Concept Studio). تمامی حقوق مادی و معنوی محفوظ است.
            </span>
            <div className={`flex items-center gap-4 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>طراحی با استانداردهای مدرن فرانت‌اند</span>
              <span>·</span>
              <span className={`font-bold ${isLight ? 'text-sky-600' : 'text-cyan-400'}`}>نسخه پایدار</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
};
