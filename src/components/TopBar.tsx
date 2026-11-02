import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CoinSystemSettings } from '../types';
import { CoinBalancePill } from './CoinBadge';
import { toPersianDigits } from '../utils/persianDate';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  onOpenChat: () => void;
  onOpenOrderModal?: () => void;
  onOpenUserPanel?: () => void;
  coinSystem?: CoinSystemSettings;
  telegramUrl?: string;
  baleUrl?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenChat,
  onOpenOrderModal,
  onOpenUserPanel,
  coinSystem,
  telegramUrl = 'https://t.me/concept_studio',
  baleUrl = '',
}) => {
  const { user, isAdmin, openAuthModal, openAdminPanel, logout } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // انیمیشن کش‌آمدن و باز شدن نویگیشن بار از مرکز
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsExpanded(true);
    }, 180);

    const timer2 = setTimeout(() => {
      setShowContent(true);
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // بستن خودکار منوی همبرگری با کلیک بیرون یا فشردن دکمه Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'خدمات تخصصی', href: '#services' },
    { label: 'محاسبه‌گر آنلاین', href: '#estimator' },
    { label: 'مسیر همکاری', href: '#workflow' },
    { label: 'استانداردهای قدرت', href: '#guarantees' },
    { label: 'نظرات کارفرمایان', href: '#testimonials' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header ref={headerRef} className="relative z-30 mb-5 sm:mb-8 flex justify-center w-full">
      {/* کانتینر کشسان نویگیشن */}
      <nav
        aria-label="ناوبری اصلی استودیو"
        style={{
          width: isExpanded ? '100%' : '60px',
          height: isExpanded ? 'auto' : '56px',
          minHeight: '56px',
          borderRadius: isExpanded ? '24px' : '28px',
          transition:
            'width 0.9s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.9s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.9s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease, border-color 0.4s ease',
        }}
        className={`relative flex items-center justify-between gap-1.5 sm:gap-4 px-2.5 sm:px-5 py-2 sm:py-2.5 backdrop-blur-2xl transition-all duration-300 mx-auto ${
          isLight
            ? isExpanded
              ? 'bg-white/90 border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.08),0_0_20px_rgba(2,132,199,0.08)] hover:border-sky-300'
              : 'bg-white border border-sky-300 shadow-[0_0_35px_rgba(2,132,199,0.35)]'
            : isExpanded
            ? 'bg-[#080D19]/90 border border-slate-800/90 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(0,229,255,0.12)] hover:border-slate-700/80'
            : 'bg-[#080D19] border border-cyan-500/50 shadow-[0_0_40px_rgba(0,229,255,0.6),inset_0_0_20px_rgba(0,229,255,0.3)]'
        }`}
      >
        {/* ۱. خط نوری و روبان کروماتیک متحرک با کانتینر کلیپینگ داخلی مجزا */}
        <div className="absolute inset-0 rounded-[24px] sm:rounded-[28px] overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            style={{
              transform: isExpanded ? 'translateX(250%)' : 'translateX(-120%)',
              transition: 'transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, opacity 0.8s ease 0.6s',
              opacity: showContent ? 0 : 0.85,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/35 to-blue-500/25 mix-blend-screen -skew-x-12"
          />

          {/* حالت گوی مرکزی قبل از باز شدن کامل */}
          {!isExpanded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-200 to-blue-600 animate-spin-slow opacity-90 blur-[1px]" />
              <div className="w-4 h-4 rounded-full bg-white absolute shadow-[0_0_12px_#00e5ff]" />
            </div>
          )}
        </div>

        {/* ۱. زون ۱: نشان و نام برند */}
        <div
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateX(0)' : 'translateX(18px)',
            filter: showContent ? 'blur(0px)' : 'blur(4px)',
            transition: 'opacity 0.6s ease 0.2s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, filter 0.6s ease 0.2s',
          }}
          className="flex items-center gap-1.5 sm:gap-3 shrink-0"
        >
          <a
            href="./"
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div
              className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                isLight
                  ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.3)] border border-sky-400/40'
                  : 'bg-gradient-to-br from-cyan-500/25 via-blue-600/20 to-slate-900 border border-cyan-400/40 text-cyan-300 shadow-[0_0_16px_rgba(0,229,255,0.3)]'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span
                className={`text-xs sm:text-base md:text-lg font-black tracking-tight transition-colors whitespace-nowrap ${
                  isLight
                    ? 'text-slate-900 group-hover:text-sky-600'
                    : 'text-white group-hover:text-cyan-300'
                }`}
              >
                CONCEPT STUDIO
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-medium hidden sm:block ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                استودیو دیزاین و مهندسی دیجیتال
              </span>
            </div>
          </a>
        </div>

        {/* ۲. زون ۲: پیوندهای ناوبری در دسکتاپ */}
        <div
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(-12px)',
            filter: showContent ? 'blur(0px)' : 'blur(4px)',
            transition: 'opacity 0.6s ease 0.3s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, filter 0.6s ease 0.3s',
          }}
          className={`hidden xl:flex items-center gap-4 2xl:gap-6 text-xs font-semibold shrink min-w-0 ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`transition-colors py-1 whitespace-nowrap shrink-0 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:scale-x-0 hover:after:scale-x-100 after:transition-transform ${
                isLight
                  ? 'hover:text-sky-600 after:bg-sky-600'
                  : 'hover:text-cyan-300 after:bg-cyan-400'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* ۳. زون ۳: عملیات ورود، تغییر تم، مشاوره و دکمه سه خط منو */}
        <div
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateX(0)' : 'translateX(-18px)',
            filter: showContent ? 'blur(0px)' : 'blur(4px)',
            transition: 'opacity 0.6s ease 0.25s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s, filter 0.6s ease 0.25s',
          }}
          className="flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          {/* دکمه تغییر تم (روشن / تیره) - فقط آیکون فشرده جهت جلوگیری از سرریز */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isLight ? 'تغییر به تم تیره' : 'تغییر به تم روشن'}
            title={isLight ? 'تغییر به تم تیره' : 'تغییر به تم روشن'}
            className={`hidden sm:inline-flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border text-xs font-bold transition-all active:scale-95 shrink-0 ${
              isLight
                ? 'bg-slate-100 hover:bg-sky-50 text-slate-800 hover:text-sky-700 border-slate-200/90 hover:border-sky-300 shadow-xs'
                : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border-slate-700/80 hover:border-amber-400/50'
            }`}
          >
            {isLight ? (
              <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
 
          {/* دکمه نصب اپلیکیشن پیشرونده PWA فقط در صفحات خیلی بزرگ؛ در صفحات دیگر داخل منوی کشویی است */}
          <div className="hidden 2xl:block shrink-0">
            <PWAInstallButton variant="compact" />
          </div>

          {/* دکمه گفت‌وگو و ارتباط سریع در دسکتاپ بزرگ */}
          <button
            onClick={onOpenChat}
            title="ارسال پیام و استعلام مستقیم با مدیریت"
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-xs shrink-0 ${
              isLight
                ? 'bg-slate-100/90 hover:bg-sky-50 text-slate-800 hover:text-sky-700 border-slate-200/90 hover:border-sky-300'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 hover:border-cyan-500/50'
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>مشاوره سریع</span>
          </button>

          {/* نمایش موجودی سکه در دسکتاپ بسیار عریض زمانی که سیستم کوین فعال است */}
          {coinSystem?.enabled && (
            <div className="hidden 2xl:flex shrink-0">
              <CoinBalancePill
                coins={user?.coins || 0}
                coinName={coinSystem.coinName}
                design={coinSystem.activeDesign}
                onClick={() => {
                  if (onOpenUserPanel) {
                    onOpenUserPanel();
                  }
                }}
              />
            </div>
          )}

          {user ? (
            /* کاربر احراز هویت شده (هم برای دسکتاپ و هم برای موبایل با دسترسی کامل به پنل مدیریت و خروج) */
            <>
              {/* در موبایل و تبلت (< md): دکمه‌های مجزا، ضد سرریز و در دسترس مدیریت، پنل و خروج */}
              <div className="flex items-center gap-1 md:hidden shrink-0">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openAdminPanel}
                    title="ورود به پنل مدیریت استودیو"
                    className="px-2 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] shadow-[0_0_12px_rgba(0,229,255,0.4)] transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>🛠️</span>
                    <span className="hidden xs:inline">مدیریت</span>
                  </button>
                )}

                <a
                  href="?page=panel"
                  onClick={(e) => {
                    if (onOpenUserPanel) {
                      e.preventDefault();
                      onOpenUserPanel();
                    }
                  }}
                  title="باز کردن پنل کاربری و کیف پول کوین"
                  className="px-2 py-1.5 rounded-xl bg-[#07090E] hover:bg-slate-900 text-amber-300 border border-amber-400/50 font-black text-[11px] shadow-xs transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>پنل کاربری</span>
                  <span className="text-[9px] text-amber-400 font-bold">↗</span>
                </a>

                <button
                  type="button"
                  onClick={logout}
                  title="خروج از حساب کاربری"
                  className="px-1.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 font-bold text-[10px] transition-all active:scale-95 flex items-center gap-0.5 whitespace-nowrap shrink-0"
                >
                  <span>خروج</span>
                </button>
              </div>

              {/* در دسکتاپ (>= md): جعبه کامل شامل نشان کاربری، پنل کاربری، پنل مدیریت و دکمه خروج */}
              <div
                className={`hidden md:flex items-center gap-1.5 lg:gap-2 border px-2.5 py-1.5 rounded-xl shrink-0 ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-slate-900/95 border-slate-800 text-slate-200 shadow-inner'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold hidden 2xl:inline">{user.fullName || user.username}</span>
                </div>

                <a
                  href="?page=panel"
                  onClick={(e) => {
                    if (onOpenUserPanel) {
                      e.preventDefault();
                      onOpenUserPanel();
                    }
                  }}
                  title="باز کردن پنل کاربری و کیف پول کوین"
                  className="px-2.5 py-1 rounded-lg bg-[#07090E] hover:bg-slate-900 text-amber-300 border border-amber-400/50 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
                >
                  <span>پنل کاربری</span>
                  <span className="text-[10px]">↗</span>
                </a>

                {isAdmin && (
                  <button
                    onClick={openAdminPanel}
                    title="باز کردن داشبورد مدیریت استودیو"
                    className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(0,229,255,0.3)] transition-all active:scale-95 whitespace-nowrap flex items-center gap-1"
                  >
                    <span>🛠️</span>
                    <span>پنل مدیریت</span>
                  </button>
                )}

                <button
                  onClick={logout}
                  title="خروج از حساب کاربری"
                  className={`px-2 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                    isLight ? 'text-slate-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  خروج
                </button>
              </div>
            </>
          ) : (
            /* دسکتاپ و موبایل مهمان: دکمه‌های ورود و ثبت‌نام */
            <div
              className={`flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl border shrink-0 ${
                isLight ? 'bg-slate-100/90 border-slate-200/90' : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <button
                onClick={() => openAuthModal('login')}
                className={`px-2.5 sm:px-3.5 py-1.5 min-h-[34px] sm:min-h-[36px] rounded-lg border text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-2xs'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/60'
                }`}
              >
                ورود
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className={`hidden xs:inline-block px-2.5 sm:px-3.5 py-1.5 min-h-[34px] sm:min-h-[36px] rounded-lg text-xs font-black transition-all active:scale-95 whitespace-nowrap ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                }`}
              >
                ثبت‌نام
              </button>
            </div>
          )}

          {/* دکمه سه خط منوی همبرگری با ابعاد استاندارد لمس انگشت (حداقل ۴۰ در ۴۰ پیکسل) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'بستن منوی استودیو' : 'باز کردن منوی استودیو'}
            aria-expanded={isMobileMenuOpen}
            className={`xl:hidden w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 focus:outline-none shrink-0 ${
              isLight
                ? isMobileMenuOpen
                  ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-[0_0_18px_rgba(2,132,199,0.2)]'
                  : 'bg-slate-100/90 border-slate-300/90 hover:border-sky-400 text-slate-800'
                : isMobileMenuOpen
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                : 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-400/50 text-slate-200'
            }`}
          >
            <span
              className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0 scale-x-0' : ''
              }`}
            />
            <span
              className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* کادر منوی کشویی همبرگری با باز شدن نرم و سریع در موبایل */}
      <div
        aria-hidden={!isMobileMenuOpen}
        style={{
          transformOrigin: '50% 0%',
          opacity: isMobileMenuOpen ? 1 : 0,
          transform: isMobileMenuOpen
            ? 'scale(1) translateY(0px)'
            : 'scale(0.96) translateY(-10px)',
          transition: isMobileMenuOpen
            ? 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'opacity 0.2s ease-in, transform 0.2s ease-in',
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
        }}
        className={`absolute top-full left-0 right-0 mt-2.5 p-4 sm:p-5 rounded-3xl border backdrop-blur-2xl overflow-hidden space-y-3.5 ${
          isLight
            ? 'bg-white/98 border-sky-200/90 shadow-[0_22px_60px_rgba(15,23,42,0.16)] text-slate-900'
            : 'bg-[#080D19]/98 border-cyan-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.88)] text-slate-100'
        }`}
      >
        {/* لایه مه نوری مرکزی که هنگام باز شدن کادر از وسط کنار می‌رود */}
        <div
          aria-hidden="true"
          style={{
            opacity: isMobileMenuOpen ? 0 : 0.9,
            transform: isMobileMenuOpen ? 'scale(1.65)' : 'scale(0.55)',
            filter: isMobileMenuOpen ? 'blur(40px)' : 'blur(18px)',
            transition:
              'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), filter 0.85s ease-out',
          }}
          className={`absolute inset-0 pointer-events-none rounded-full m-auto w-64 h-64 ${
            isLight
              ? 'bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,rgba(255,255,255,0.9)_50%,transparent_75%)]'
              : 'bg-[radial-gradient(circle,rgba(0,229,255,0.45)_0%,rgba(14,165,233,0.25)_45%,transparent_75%)]'
          }`}
        />

        {!user ? (
          <div
            style={{
              opacity: isMobileMenuOpen ? 1 : 0,
              filter: isMobileMenuOpen ? 'blur(0px)' : 'blur(14px)',
              transform: isMobileMenuOpen ? 'scale(1)' : 'scale(0.95)',
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s',
            }}
            className={`relative z-10 grid grid-cols-2 gap-2.5 pb-3.5 border-b ${
              isLight ? 'border-slate-200/80' : 'border-slate-800'
            }`}
          >
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                openAuthModal('login');
              }}
              className={`py-3 min-h-[46px] rounded-xl text-xs font-bold border text-center transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200/70 text-slate-800 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              ورود به حساب
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                openAuthModal('register');
              }}
              className={`py-3 min-h-[46px] rounded-xl text-xs font-black text-center transition-colors ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_4px_15px_rgba(2,132,199,0.3)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              }`}
            >
              ثبت‌نام جدید
            </button>
          </div>
        ) : (
          <div
            style={{
              opacity: isMobileMenuOpen ? 1 : 0,
              filter: isMobileMenuOpen ? 'blur(0px)' : 'blur(14px)',
              transform: isMobileMenuOpen ? 'scale(1)' : 'scale(0.95)',
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s',
            }}
            className={`relative z-10 p-4 rounded-2xl border space-y-3 pb-3.5 mb-2 ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#060911] border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  {user.fullName ? user.fullName.charAt(0) : 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">{user.fullName || user.username}</span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">@{user.username}</span>
                </div>
              </div>

              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                  مدیر ارشد
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-amber-400/30 flex items-center justify-between text-xs">
              <span className="text-slate-400">موجودی کیف پول:</span>
              <strong className="text-amber-300 font-black flex items-center gap-1">
                <span>🪙</span>
                <span>{toPersianDigits(user.coins || 0)} کوین استودیو</span>
              </strong>
            </div>

            <div className="flex flex-col gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAdminPanel();
                  }}
                  className="w-full py-2.5 px-3 min-h-[42px] rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-sm">🛠️</span>
                  <span>ورود مستقیم به پنل مدیریت استودیو</span>
                </button>
              )}

              <a
                href="?page=panel"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (onOpenUserPanel) {
                    e.preventDefault();
                    onOpenUserPanel();
                  }
                }}
                className="w-full py-2.5 px-3 min-h-[42px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="text-sm">🪙</span>
                <span>ورود به پنل کاربری و مدیریت سفارش‌ها</span>
                <span className="text-xs">↗</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2 px-3 min-h-[38px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-col gap-2">
          {navLinks.map((link, idx) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              style={{
                opacity: isMobileMenuOpen ? 1 : 0,
                filter: isMobileMenuOpen ? 'blur(0px)' : 'blur(16px)',
                transform: isMobileMenuOpen ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(-4px)',
                transition: `all 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${0.12 + idx * 0.06}s`,
              }}
              className={`px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                isLight
                  ? 'bg-slate-100/80 hover:bg-sky-50 text-slate-800 hover:text-sky-700'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-cyan-300'
              }`}
            >
              <span>{link.label}</span>
              <span className={`text-xs font-mono ${isLight ? 'text-sky-600' : 'text-slate-500'}`}>←</span>
            </a>
          ))}
        </div>

        {/* دکمه اختصاصی نصب وب‌اپلیکیشن (PWA) در موبایل */}
        <div className="relative z-10">
          <PWAInstallButton variant="full" />
        </div>

        <div
          style={{
            opacity: isMobileMenuOpen ? 1 : 0,
            filter: isMobileMenuOpen ? 'blur(0px)' : 'blur(14px)',
            transform: isMobileMenuOpen ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.28s',
          }}
          className={`relative z-10 pt-2.5 border-t flex flex-col sm:flex-row gap-2.5 ${
            isLight ? 'border-slate-200/80' : 'border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              toggleTheme();
            }}
            className={`flex-1 py-3 min-h-[46px] rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-800'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <span>{isLight ? 'تغییر به تم تیره استودیو' : 'تغییر به تم روشن استودیو'}</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenChat();
            }}
            className={`flex-1 py-3.5 min-h-[46px] rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              isLight
                ? 'bg-sky-50 hover:bg-sky-100/80 border-sky-300 text-sky-700'
                : 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>گفت‌وگو و ارتباط با مدیریت استودیو</span>
          </button>
        </div>

        {/* لینک‌های تلگرام و گروه بله در منوی کشویی */}
        <div
          className={`relative z-10 grid grid-cols-2 gap-2.5 pt-1`}
        >
          {telegramUrl && telegramUrl.trim() ? (
            <a
              href={telegramUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                isLight
                  ? 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-700 hover:text-sky-700'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-sky-300'
              }`}
            >
              <svg className="w-4 h-4 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>تلگرام استودیو</span>
            </a>
          ) : (
            <span
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 opacity-60 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <span>تلگرام (به‌زودی)</span>
            </span>
          )}

          {baleUrl && baleUrl.trim() ? (
            <a
              href={baleUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span>گروه بله (Bale)</span>
            </a>
          ) : (
            <span
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 opacity-75 ${
                isLight
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                  : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
              }`}
            >
              <span>گروه بله (به‌زودی)</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
