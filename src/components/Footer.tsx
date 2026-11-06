import React, { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  onOpenChat?: () => void;
  telegramUrl?: string;
  baleUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenChat,
  telegramUrl = 'https://t.me/concept_studio',
  baleUrl = '',
}) => {
  const { isLight } = useTheme();
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const handleEmptyLinkClick = (platformName: string) => {
    setSocialNotice(`لینک ${platformName} هنوز در پنل مدیریت ثبت نشده است.`);
    setTimeout(() => setSocialNotice(null), 3500);
  };

  return (
    <footer
      id="about"
      className={`relative z-10 mt-12 sm:mt-16 pt-10 sm:pt-12 pb-14 border-t transition-colors ${
        isLight
          ? 'border-slate-200/90 bg-white/95 text-slate-700'
          : 'border-slate-800/90 bg-[#060A14]/95 text-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal direction="down" distance={20} once>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-10">
            {/* ستون ۱ و ۲: معرفی استودیو */}
            <div className="md:col-span-2 space-y-3.5">
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

              <p className={`text-sm leading-relaxed max-w-lg font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                استودیو مهندسی تصویر، تیزرسازی سینمایی، رندرهای سه‌بعدی محصول و معماری پلتفرم‌های وب اختصاصی. تمرکز ما خلق خروجی‌های دقیق، پرسرعت و اثرگذار برای رشد ملموس جایگاه و فروش برند شماست.
              </p>

              <div className={`flex items-center gap-3 pt-1 text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                <span className={isLight ? 'text-slate-800 font-bold' : 'text-slate-200 font-semibold'}>
                  تهران و پروژه‌های بین‌المللی
                </span>
                <span>·</span>
                <span className={`font-black ${isLight ? 'text-sky-700' : 'text-cyan-300'}`}>
                  تحویل سریع با سورس کامل لایه‌باز
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
              <ul className={`space-y-2.5 text-xs sm:text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <li>
                  <a href="#services" className={`transition-colors py-1 inline-block ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    طراحی عکس و کامپوزیت 8K
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors py-1 inline-block ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    ساخت و اصلاح رنگ تیزر سینمایی
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors py-1 inline-block ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    رندرهای سه‌بعدی محصولات
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors py-1 inline-block ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    توسعه وب‌سایت‌های لوکس و سریع
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-colors py-1 inline-block ${isLight ? 'hover:text-sky-600' : 'hover:text-cyan-300'}`}>
                    اتوماسیون کسب‌وکار و سیستم‌های هوشمند
                  </a>
                </li>
              </ul>
            </div>

            {/* ستون ۴: ارتباط مستقیم و شبکه‌های اجتماعی (تلگرام و گروه بله) */}
            <div className="space-y-3 text-sm">
              <span
                className={`font-bold block mb-3 text-xs tracking-wider uppercase ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                ارتباط مستقیم و شبکه‌های ما
              </span>
              <p className={`text-xs leading-relaxed font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                جهت دریافت مشاوره، ارسال نمونه تصویر و ویدیو یا عضویت در کانال تلگرام و گروه بله با ما همراه باشید:
              </p>

              <div className="pt-1 flex flex-col gap-2.5">
                {onOpenChat && (
                  <button
                    onClick={onOpenChat}
                    className={`px-4 py-3 min-h-[46px] rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-between ${
                      isLight
                        ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                        : 'bg-slate-900 hover:bg-slate-800 border-cyan-500/40 text-cyan-300 hover:text-cyan-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>شروع گفت‌وگوی آنلاین</span>
                    </span>
                    <span className="text-xs">←</span>
                  </button>
                )}

                {/* دکمه ارتباط در تلگرام (قابل مدیریت از پنل ادمین) */}
                {telegramUrl && telegramUrl.trim() ? (
                  <a
                    href={telegramUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-3 min-h-[46px] rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-between ${
                      isLight
                        ? 'bg-white hover:bg-sky-50 border-slate-200 hover:border-sky-300 text-slate-800 hover:text-sky-700'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-sky-400/40 text-slate-200 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>کانال و ارتباط در تلگرام</span>
                    </span>
                    <span className="text-[11px] font-mono opacity-75">↗</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEmptyLinkClick('تلگرام')}
                    className={`px-4 py-3 min-h-[46px] rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-between ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>کانال و ارتباط در تلگرام</span>
                    </span>
                    <span className="text-[10px] opacity-75">به‌زودی</span>
                  </button>
                )}

                {/* دکمه گروه بله (قابل مدیریت از پنل ادمین) */}
                {baleUrl && baleUrl.trim() ? (
                  <a
                    href={baleUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-3 min-h-[46px] rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-between ${
                      isLight
                        ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800'
                        : 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-500/35 text-emerald-300 hover:text-emerald-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>عضویت در گروه بله (Bale)</span>
                    </span>
                    <span className="text-[11px] font-mono opacity-75">↗</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEmptyLinkClick('گروه بله')}
                    className={`px-4 py-3 min-h-[46px] rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-between ${
                      isLight
                        ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-emerald-950/20 hover:bg-emerald-950/35 border-emerald-500/25 text-emerald-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>گروه بله (Bale)</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                      به‌زودی
                    </span>
                  </button>
                )}

                {socialNotice && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-medium border ${
                      isLight
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    {socialNotice}
                  </div>
                )}

                {/* نصب وب‌اپلیکیشن پیشرونده PWA */}
                <div className="pt-1">
                  <PWAInstallButton variant="compact" />
                </div>

                <span className={`text-xs font-mono pt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ایمیل: info@concept-studio.ir
                </span>
              </div>
            </div>
          </div>

          {/* نوار استانداردهای قدرت اجرایی استودیو در فوتر */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border mb-8 flex flex-wrap items-center justify-around gap-4 text-xs font-bold ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚡</span>
              <span>اجرای تیز با خروجی سینمایی 4K/8K</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">🎯</span>
              <span>۲ دور کالیبراسیون و پولیش تخصصی</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">📦</span>
              <span>تحویل ۱۰۰٪ سورس کامل و لایه‌باز</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🔒</span>
              <span>پروتکل محرمانگی کامل (NDA)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-400">💳</span>
              <span>تسویه مرحله‌ای ۵۰٪ / ۵۰٪</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">📱</span>
              <span>قانون احراز شماره: الزام شماره معتبر و رد شماره‌های ساختگی (مانند ۱۲۳۴۵۶۷۸۹۰۱۱)</span>
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
