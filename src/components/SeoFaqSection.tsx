import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SeoFaqSectionProps {
  onOpenChat: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
  keywords: string[];
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'خدمات تخصصی «استودیو دیزاین کانسپت (Concept Studio)» شامل چه بخش‌هایی است؟',
    answer:
      'استودیو دیزاین کانسپت ارائه‌دهنده خدمات جامع تولید محتوای دیجیتال و مهندسی نرم‌افزار شامل تدوین سینمایی ویدیو و ریلز، طراحی موشن گرافیک و جلوه‌های ویژه بصری (VFX)، طراحی لوگو و هویت بصری برند، ساخت تیزرهای تبلیغاتی، طراحی و برنامه‌نویسی وب‌سایت‌های اختصاصی، توسعه ربات تلگرام و بله، ساخت بازی و اپلیکیشن، و خدمات ترجمه، زیرنویس و دوبله تخصصی است.',
    keywords: ['تدوین ویدیو', 'موشن گرافیک', 'طراحی سایت', 'ربات تلگرام'],
  },
  {
    question: 'آیا در بخش گفت‌وگوی آنلاین امکان ارسال ویس (پیام صوتی) و فایل پروژه وجود دارد؟',
    answer:
      'بله؛ در سامانه گفت‌وگوی زنده استودیو دیزاین کانسپت، علاوه بر پیام متنی، می‌توانید مستقیماً با میکروفون مرورگر خود پیام صوتی (ویس) ضبط و ارسال کنید یا انواع فایل‌های پروژه، اسناد PDF، فایل‌های فشرده ZIP/RAR، فایل‌های لایه‌باز PSD/AI، تصاویر و ویدیوهای رفرنس را برای مدیریت ارسال نمایید.',
    keywords: ['ارسال ویس در چت', 'ارسال فایل پروژه', 'پشتیبانی مستقیم'],
  },
  {
    question: 'نحوه ثبت سفارش، استعلام قیمت و پرداخت با کوین اختصاصی استودیو چگونه است؟',
    answer:
      'شما می‌توانید از بخش خدمات، سرویس مورد نظر خود را انتخاب کرده و سفارش خود را ثبت کنید تا کد پیگیری اختصاصی برایتان صادر شود. همچنین در صورت فعال بودن سامانه کوین استودیو، می‌توانید از طریق پنل کاربری موجودی کوین خود را از طریق درگاه بانکی یا کارت‌به‌کارت شارژ کرده و سفارش‌ها را به صورت آنی ثبت فرمایید.',
    keywords: ['ثبت سفارش آنلاین', 'کوین استودیو', 'استعلام قیمت'],
  },
  {
    question: 'زمان تحویل پروژه‌ها و نحوه پیگیری وضعیت سفارش به چه صورت است؟',
    answer:
      'زمان تحویل هر خدمت بر اساس اولویت انتخابی شما (عادی، اکسپرس فوری، یا VIP با نظارت مستقیم مدیریت) تعیین می‌شود. در تمام مراحل انجام پروژه، از طریق پنل کاربری و کد پیگیری اختصاصی (STD) و همچنین گفت‌وگوی آنلاین می‌توانید وضعیت دقیق و لینک تحویل فایل‌های نهایی را مشاهده کنید.',
    keywords: ['تحویل فوری پروژه', 'کد پیگیری سفارش', 'پشتیبانی VIP'],
  },
];

export const SeoFaqSection: React.FC<SeoFaqSectionProps> = ({ onOpenChat }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mt-12 sm:mt-14 mb-6"
    >
      <div
        className={`rounded-3xl p-5 sm:p-8 border transition-colors ${
          isLight
            ? 'bg-white border-slate-200/95 shadow-[0_12px_40px_rgba(15,23,42,0.06)]'
            : 'bg-[#080D18]/95 border-slate-800/95 shadow-[0_15px_50px_rgba(0,0,0,0.5)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-800/40">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold mb-2 ${
                isLight
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/25'
              }`}
            >
              <span>✦ راهنمای جامع و سوالات متداول</span>
            </span>
            <h2
              id="faq-heading"
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              پاسخ به پرسش‌های پرتکرار: ثبت سفارش، ساخت تیزر، رندر سه‌بعدی و کوین استودیو
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenChat}
            className={`self-start md:self-auto px-5 py-3 min-h-[46px] rounded-xl text-xs font-black transition-all flex items-center gap-2 active:scale-95 ${
              isLight
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 shadow-sm'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <span>ارسال پیام، ویس یا فایل در چت مستقیم</span>
          </button>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <article
                key={idx}
                className={`rounded-2xl border transition-all ${
                  isLight
                    ? isOpen
                      ? 'bg-sky-50/60 border-sky-300'
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300'
                    : isOpen
                    ? 'bg-[#0D1627] border-cyan-500/40'
                    : 'bg-[#0B111E]/85 border-slate-800 hover:border-slate-700'
                }`}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:px-5 min-h-[54px] text-right flex items-center justify-between gap-3"
                  >
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {item.question}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      } ${
                        isLight
                          ? 'bg-slate-200/90 text-slate-800'
                          : 'bg-slate-800 text-cyan-300'
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 space-y-2.5">
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isLight ? 'text-slate-700' : 'text-slate-200'
                      }`}
                    >
                      {item.answer}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.keywords.map((kw, kIdx) => (
                        <span
                          key={kIdx}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            isLight
                              ? 'bg-white border border-slate-200 text-slate-600'
                              : 'bg-slate-900 border border-slate-800 text-slate-400'
                          }`}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
