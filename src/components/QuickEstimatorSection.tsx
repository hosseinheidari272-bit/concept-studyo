import React, { useState } from 'react';
import { ServiceItem, CoinSystemSettings } from '../types';
import { formatPersianPrice, toPersianDigits } from '../utils/persianDate';
import { useTheme } from '../context/ThemeContext';
import { ScrollReveal } from './ScrollReveal';

interface QuickEstimatorSectionProps {
  services: ServiceItem[];
  coinSystem?: CoinSystemSettings;
  onSelectServiceAndOrder: (service: ServiceItem) => void;
  onOpenChat: (orderId?: string, topic?: string) => void;
}

export const QuickEstimatorSection: React.FC<QuickEstimatorSectionProps> = ({
  services,
  coinSystem,
  onSelectServiceAndOrder,
  onOpenChat,
}) => {
  const { isLight } = useTheme();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || ''
  );
  const [urgency, setUrgency] = useState<'normal' | 'express' | 'vip'>('normal');
  const [includeVoiceover, setIncludeVoiceover] = useState<boolean>(false);
  const [includeCopywriting, setIncludeCopywriting] = useState<boolean>(false);

  const currentService = services.find((s) => s.id === selectedServiceId) || services[0];

  const getUrgencyMultiplier = () => {
    switch (urgency) {
      case 'express':
        return 1.25;
      case 'vip':
        return 1.5;
      default:
        return 1.0;
    }
  };

  const basePrice = currentService ? currentService.startingPrice : 0;
  const urgencyAdded = Math.round(basePrice * (getUrgencyMultiplier() - 1));
  const voiceoverCost = includeVoiceover ? 1200000 : 0;
  const copywritingCost = includeCopywriting ? 950000 : 0;

  const totalEstimate = basePrice + urgencyAdded + voiceoverCost + copywritingCost;
  const unitCoinPrice = Math.max(1000, coinSystem?.unitPriceToman || 500000);
  const coinsNeeded = Math.ceil(totalEstimate / unitCoinPrice);

  const handleStartOrder = () => {
    if (currentService) {
      onSelectServiceAndOrder(currentService);
    }
  };

  return (
    <section
      id="estimator"
      aria-label="محاسبه‌گر پیش‌فاکتور و تخمین سرمایه‌گذاری"
      className="my-12 sm:my-14 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20"
    >
      <ScrollReveal direction="down" distance={20}>
        <div className="text-center max-w-2xl mx-auto mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2.5 border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            <span>⚡ پیش‌فاکتور شفاف و محاسبه‌گر برخط</span>
          </div>

          <h2
            className={`text-2xl sm:text-4xl font-black mb-2.5 transition-colors ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            محاسبه‌گر آنلاین پیش‌فاکتور: برآورد هزینه ساخت تیزر، رندر ۳D و طراحی سایت
          </h2>

          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-slate-200'
            }`}
          >
            بدون هیچ‌گونه انتظار یا تماس تلفنی، مشخصات مدنظر خود را مشخص کنید و برآورد دقیق قیمت و زمان تحویل را به صورت آنی دریافت نمایید.
          </p>
        </div>
      </ScrollReveal>

      {/* باکس دو ستونه محاسبه‌گر */}
      <ScrollReveal direction="up" distance={20}>
        <div
          className={`p-5 sm:p-8 rounded-3xl border backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-7 ${
            isLight
              ? 'bg-white border-slate-200/95 shadow-[0_15px_40px_rgba(15,23,42,0.06)]'
              : 'bg-[#080E1C]/95 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.55)]'
          }`}
        >
          {/* ستون راست: انتخاب پارامترها */}
          <div className="lg:col-span-7 space-y-5">
            {/* ۱. انتخاب خدمت اصلی */}
            <div>
              <label className={`block text-xs font-black mb-2.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                ۱. انتخاب نوع خدمت تخصصی:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {services.map((srv) => {
                  const isSelected = srv.id === (currentService?.id || selectedServiceId);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`text-right p-3.5 min-h-[46px] rounded-xl border transition-all text-xs flex items-center justify-between active:scale-[0.99] ${
                        isSelected
                          ? isLight
                            ? 'bg-sky-50 border-sky-500 text-sky-950 font-black shadow-sm ring-1 ring-sky-400'
                            : 'bg-cyan-950/50 border-cyan-400 text-white font-black shadow-[0_0_15px_rgba(0,229,255,0.2)] ring-1 ring-cyan-400'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                          : 'bg-slate-900/75 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate">{srv.title}</span>
                      {isSelected && <span className="text-cyan-400 text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ۲. اولویت زمان‌بندی و تحویل */}
            <div>
              <label className={`block text-xs font-black mb-2.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                ۲. اولویت زمانی و سرعت تحویل:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'normal', title: 'عادی و استاندارد', badge: currentService?.deliveryTime || '۲-۳ روز', extra: 'پایه' },
                  { id: 'express', title: 'اکسپرس (فوری)', badge: 'تحویل نصف زمان', extra: '+۲۵٪' },
                  { id: 'vip', title: 'VIP مدیریت', badge: 'تحویل ۲۴ ساعته', extra: '+۵۰٪' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUrgency(item.id as any)}
                    className={`p-3 min-h-[54px] rounded-xl border text-center transition-all active:scale-95 ${
                      urgency === item.id
                        ? isLight
                          ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold ring-1 ring-sky-400'
                          : 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black mb-1">{item.title}</div>
                    <div className={`text-[10px] font-bold ${isLight ? 'text-sky-600' : 'text-cyan-400'}`}>{item.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ۳. گزینه‌های تکمیلی اختیاری */}
            <div>
              <label className="block text-xs font-black mb-2.5 text-slate-400">
                ۳. خدمات تکمیلی اختیاری:
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    includeCopywriting
                      ? isLight
                        ? 'bg-sky-50/70 border-sky-400'
                        : 'bg-cyan-950/30 border-cyan-400/60'
                      : isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={includeCopywriting}
                      onChange={(e) => setIncludeCopywriting(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                    />
                    <span className="text-xs font-bold">سناریونویسی و کپی‌رایتینگ تخصصی پیام برند</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">+ ۹۵۰,۰۰۰ تومان</span>
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    includeVoiceover
                      ? isLight
                        ? 'bg-sky-50/70 border-sky-400'
                        : 'bg-cyan-950/30 border-cyan-400/60'
                      : isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={includeVoiceover}
                      onChange={(e) => setIncludeVoiceover(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                    />
                    <span className="text-xs font-bold">گویندگی و نریشن اختصاصی استودیویی (صدای گوینده آقا/خانم)</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">+ ۱,۲۰۰,۰۰۰ تومان</span>
                </label>

                {/* فایل لایه‌باز رایگان هدیه */}
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="text-xs font-bold">ارائه ۱۰۰٪ فایل لایه‌باز و سورس کامل</span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    رایگان هدیه استودیو
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ستون چپ: کارت خلاصه پیش‌فاکتور و اقدام */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div
              className={`p-6 rounded-2xl border ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
                <span className="text-xs font-black text-slate-400">پیش‌فاکتور آنلاین</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                  بدون تعهد مالی آنی
                </span>
              </div>

              {/* ریزاقلام فاکتور */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">خدمت پایه:</span>
                  <span className="font-bold">{currentService?.title || '—'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">نرخ پایه:</span>
                  <span className="font-bold">{formatPersianPrice(basePrice)}</span>
                </div>

                {urgencyAdded > 0 && (
                  <div className="flex items-center justify-between text-amber-400">
                    <span>اضافه اولویت زمانی ({urgency === 'express' ? 'اکسپرس' : 'VIP'}):</span>
                    <span>+{formatPersianPrice(urgencyAdded)}</span>
                  </div>
                )}

                {includeCopywriting && (
                  <div className="flex items-center justify-between text-cyan-400">
                    <span>کپی‌رایتینگ و سناریو:</span>
                    <span>+{formatPersianPrice(copywritingCost)}</span>
                  </div>
                )}

                {includeVoiceover && (
                  <div className="flex items-center justify-between text-cyan-400">
                    <span>نریشن استودیویی:</span>
                    <span>+{formatPersianPrice(voiceoverCost)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-emerald-400">
                  <span>سورس و فایل‌های لایه‌باز:</span>
                  <span>رایگان (ارزش ۱.۵ م ت)</span>
                </div>

                <div className="flex items-center justify-between text-emerald-400">
                  <span>۲ دور ادیت و اصلاح اختصاصی:</span>
                  <span>رایگان (تضمین‌شده)</span>
                </div>
              </div>

              {/* خط جمع کل */}
              <div className="pt-4 mt-4 border-t border-slate-700/60">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-bold text-slate-400">کل سرمایه‌گذاری برآوردی:</span>
                  <span
                    className={`text-xl sm:text-2xl font-black ${
                      isLight ? 'text-sky-700' : 'text-cyan-400'
                    }`}
                  >
                    {formatPersianPrice(totalEstimate)}
                  </span>
                </div>

                {coinSystem?.enabled && (
                  <div className="text-[11px] text-amber-300 font-bold text-left mb-3">
                    معادل: {toPersianDigits(coinsNeeded)} {coinSystem.coinName || 'کوین استودیو'}
                  </div>
                )}

                <div
                  className={`p-2.5 rounded-xl text-[11px] font-medium leading-relaxed mt-2 ${
                    isLight ? 'bg-white border border-slate-200 text-slate-700' : 'bg-slate-950/60 text-slate-300'
                  }`}
                >
                  🛡️ <strong>شرایط پرداخت مرحله‌ای:</strong> امکان پرداخت ۵۰٪ در شروع ({formatPersianPrice(Math.round(totalEstimate / 2))}) و ۵۰٪ مابقی پس از تایید نهایی خروجی.
                </div>
              </div>
            </div>

            {/* دکمه‌های ثبت سفارش و گفت‌وگو با ارتفاع حداقل ۴۸ پیکسل برای لمس آسان */}
            <div className="space-y-2.5 mt-5">
              <button
                type="button"
                onClick={handleStartOrder}
                data-cursor-text="پیش‌فاکتور"
                className="btn-shimmer w-full py-3.5 px-5 min-h-[48px] rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(0,210,255,0.4)] transition-all transform hover:-translate-y-0.5 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>ثبت سفارش بر مبنای این پیش‌فاکتور</span>
                <span>←</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenChat(undefined, `استعلام محاسبه‌گر: ${currentService?.title}`)}
                className={`w-full py-3 px-4 min-h-[46px] rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 active:scale-95 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>گفت‌وگو و مذاکره مستقیم با مدیریت درباره این خدمت</span>
                <span>💬</span>
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};
