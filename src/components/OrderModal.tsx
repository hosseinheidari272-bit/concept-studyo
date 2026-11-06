import React, { useState, useEffect } from 'react';
import { ServiceItem, CoinSystemSettings } from '../types';
import { formatPersianPrice, toPersianDigits } from '../utils/persianDate';
import { useAuth } from '../context/AuthContext';
import { CoinEmblem } from './CoinBadge';
import { apiFetch as fetch } from '../utils/offlineApiBridge';
import {
  normalizeIranianPhone,
  isValidIranianMobile,
  validateIranianMobileDetailed,
  PHONE_VERIFICATION_RULES,
} from '../utils/phoneUtils';

interface OrderModalProps {
  initialService: ServiceItem | null;
  services: ServiceItem[];
  showPrices?: boolean;
  coinSystem?: CoinSystemSettings;
  onOpenUserPanel?: () => void;
  onClose: () => void;
  onOpenChatForOrder?: (orderId: string, orderTitle: string) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  initialService,
  services,
  showPrices = true,
  coinSystem,
  onOpenUserPanel,
  onClose,
  onOpenChatForOrder,
}) => {
  const { user, token, refreshUser, openAuthModal } = useAuth();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialService?.id || (services.length > 0 ? services[0].id : '')
  );
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneInlineError, setPhoneInlineError] = useState('');
  const [phoneOperator, setPhoneOperator] = useState<string | null>(null);
  const [telegramOrBale, setTelegramOrBale] = useState('');
  const [phoneCheckResult, setPhoneCheckResult] = useState<{
    exists: boolean;
    registered?: boolean;
    source?: 'user' | 'history';
    user?: { id: string; fullName: string; username: string };
    lastCustomerName?: string;
    message?: string;
    operatorName?: string;
  } | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const [projectDescription, setProjectDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'express' | 'vip'>('normal');
  const [payWithCoins, setPayWithCoins] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const checkPhoneExistence = async (rawPhone: string) => {
    const val = validateIranianMobileDetailed(rawPhone);
    if (!val.isValid) {
      setPhoneCheckResult(null);
      setPhoneOperator(null);
      return;
    }
    setPhoneOperator(val.operatorName || null);
    setIsCheckingPhone(true);
    try {
      const res = await fetch(`/api/users/check-phone?phone=${encodeURIComponent(val.normalized)}`);
      if (res.ok) {
        const data = await res.json();
        setPhoneCheckResult(data);
        if (data.operatorName) {
          setPhoneOperator(data.operatorName);
        }
      } else {
        setPhoneCheckResult(null);
      }
    } catch {
      setPhoneCheckResult(null);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    const norm = normalizeIranianPhone(val);
    setPhone(norm);
    setErrorMessage('');
    setPhoneCheckResult(null);

    if (!norm) {
      setPhoneInlineError('');
      setPhoneOperator(null);
      return;
    }

    // بررسی فوری برای شماره‌هایی که با ۰۹ شروع نمی‌شوند (مانند ۱۲۳۴۵۶۷۸۹۰۱۱)
    if (!norm.startsWith('09') && norm.length >= 3) {
      setPhoneInlineError('شماره همراه باید با ۰۹ شروع شود (مانند ۰۹۱۲۳۴۵۶۷۸۹). شماره‌های نامعتبر مانند ۱۲۳۴۵۶۷۸۹۰۱۱ پذیرفته نمی‌شوند.');
      setPhoneOperator(null);
      return;
    }

    if (norm.length >= 11) {
      const detail = validateIranianMobileDetailed(norm);
      if (!detail.isValid) {
        setPhoneInlineError(detail.error || 'شماره موبایل وارد شده نامعتبر است.');
        setPhoneOperator(null);
      } else {
        setPhoneInlineError('');
        setPhoneOperator(detail.operatorName || null);
        checkPhoneExistence(norm);
      }
    } else {
      setPhoneInlineError('');
      setPhoneOperator(null);
    }
  };

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.fullName || '');
      const userPhone = user.phone || '';
      if (!phone && userPhone) {
        setPhone(userPhone);
        checkPhoneExistence(userPhone);
      }
    }
  }, [user]);

  const currentService = services.find((s) => s.id === selectedServiceId) || services[0] || initialService;

  const getMultiplier = () => {
    switch (urgency) {
      case 'express':
        return 1.25;
      case 'vip':
        return 1.5;
      default:
        return 1.0;
    }
  };

  const calculatedPrice = currentService ? Math.round(currentService.startingPrice * getMultiplier()) : 0;
  const unitCoinPrice = Math.max(1000, coinSystem?.unitPriceToman || 500000);
  const requiredCoins = Math.max(1, Math.ceil(calculatedPrice / unitCoinPrice));
  const userCoins = user?.coins || 0;
  const hasEnoughCoins = userCoins >= requiredCoins;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('لطفاً نام و نام خانوادگی خود را وارد فرمایید.');
      return;
    }

    const phoneValidation = validateIranianMobileDetailed(phone);
    if (!phoneValidation.isValid) {
      setPhoneInlineError(phoneValidation.error || 'شماره موبایل معتبر نیست');
      setErrorMessage(phoneValidation.error || 'شماره تلفن همراه الزامی است و باید یک شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) باشد.');
      return;
    }

    const cleanPhone = phoneValidation.normalized;

    if (payWithCoins && !user) {
      openAuthModal('login');
      return;
    }

    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fullContact = cleanPhone + (telegramOrBale.trim() ? ` | تلگرام/بله: ${telegramOrBale.trim()}` : '');

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          serviceId: currentService?.id,
          serviceTitle: currentService?.title,
          customerName: fullName.trim(),
          customerContact: fullContact,
          customerPhone: cleanPhone,
          telegramOrBale: telegramOrBale.trim(),
          urgency,
          calculatedPrice,
          description: projectDescription.trim(),
          payWithCoins: Boolean(coinSystem?.enabled && payWithCoins),
        }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setTrackingCode(data.order.trackingCode);
        setIsSubmitted(true);
        if (payWithCoins) {
          await refreshUser();
        }
      } else {
        setErrorMessage(data.error || 'خطا در ثبت سفارش');
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور، لطفاً مجدداً تلاش کنید');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md p-3 sm:p-5 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] rounded-3xl bg-slate-950 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-slate-100 m-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مدال: دکمه بستن و عنوان */}
        <div className="relative px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <div>
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block">
                ORDER_PORTAL // v2.6
              </span>
              <h3 id="order-modal-title" className="text-base sm:text-lg font-extrabold text-white">
                ثبت سفارش و استعلام فوری خدمت
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="بستن پنجره سفارش"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          /* وضعیت ثبت موفق با ذخیره در بک‌اند */
          <div className="p-6 sm:p-8 text-center overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mx-auto mb-3 text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              سفارش شما در پایگاه داده استودیو ثبت شد
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
              کارشناس فنی استودیو ظرف ۱۵ دقیقه آینده با شما تماس گرفته و هماهنگی‌های نهایی و پیش‌فاکتور را ارائه خواهد کرد.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 max-w-xs mx-auto mb-5">
              <span className="text-[11px] text-slate-400 block mb-1">کد پیگیری اختصاصی شما:</span>
              <span className="text-xl font-extrabold text-cyan-300 tracking-wider">
                STD-{toPersianDigits(trackingCode)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                بازگشت به سایت
              </button>

              {onOpenChatForOrder && (
                <button
                  onClick={() => onOpenChatForOrder(trackingCode, currentService?.title || 'سفارش ثبت‌شده')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center gap-2 transition-all transform active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>گفت‌وگو و پیام به مدیریت درباره این سفارش</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* فرم ثبت سفارش */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4">
              
              {/* انتخاب خدمت */}
              <div>
                <label htmlFor="service-select" className="block text-xs font-semibold text-slate-300 mb-1">
                  نوع خدمت انتخابی:
                </label>
                <select
                  id="service-select"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.number}. {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* ورودی نام و شماره تلفن همراه (الزامی) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label htmlFor="customer-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    نام و نام خانوادگی <span className="text-cyan-400">*</span>:
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    placeholder="مثال: علیرضا محمدی"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="customer-phone" className="block text-xs font-semibold text-slate-300">
                      شماره تلفن همراه <span className="text-rose-400">* (الزامی)</span>:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {isCheckingPhone && (
                        <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          بررسی...
                        </span>
                      )}
                      {phoneOperator && !phoneInlineError && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          ✓ {phoneOperator}
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    id="customer-phone"
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="09123456789"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => checkPhoneExistence(phone)}
                    maxLength={13}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-900 border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors font-mono text-right ${
                      phoneInlineError
                        ? 'border-rose-500 focus:border-rose-400'
                        : phoneOperator
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-slate-700 focus:border-cyan-400'
                    }`}
                  />
                  {phoneInlineError && (
                    <p className="mt-1 text-[11px] text-rose-300 leading-tight flex items-start gap-1">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{phoneInlineError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* یادآوری قانون صحت شماره تلفن همراه */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                <span>
                  <strong className="text-slate-300">قانون صحت شماره تماس:</strong> لطفاً شماره همراه فعال و واقعی خود را وارد نمایید. طبق قوانین استودیو، شماره‌های اشتباه یا ساختگی (مانند ۱۲۳۴۵۶۷۸۹۰۱۱) به‌صورت خودکار مردود شده و سفارش لغو می‌گردد.
                </span>
              </div>

              {/* نتیجه بررسی شماره تلفن در سامانه */}
              {phoneCheckResult && (
                <div>
                  {phoneCheckResult.registered && phoneCheckResult.user ? (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold">⚠️</span>
                          <span>
                            این شماره متعلق به حساب کاربری «<strong className="text-white">{phoneCheckResult.user.fullName}</strong>» است.
                          </span>
                        </div>
                        {!user && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              openAuthModal('login');
                            }}
                            className="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] transition-colors shrink-0 whitespace-nowrap"
                          >
                            ورود به حساب
                          </button>
                        )}
                      </div>
                      {!user && fullName.trim() && fullName.trim() !== phoneCheckResult.user.fullName && (
                        <div className="pt-1.5 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                          <span>نام واردشده با نام حساب متفاوت است.</span>
                          <button
                            type="button"
                            onClick={() => setFullName(phoneCheckResult.user!.fullName)}
                            className="text-cyan-300 hover:text-white underline font-bold"
                          >
                            تنظیم نام به «{phoneCheckResult.user.fullName}»
                          </button>
                        </div>
                      )}
                    </div>
                  ) : phoneCheckResult.source === 'history' ? (
                    <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 flex flex-wrap items-center justify-between gap-2">
                      <span>💡 این شماره قبلاً با نام «{phoneCheckResult.lastCustomerName}» در سیستم ثبت شده است.</span>
                      {!fullName.trim() && (
                        <button
                          type="button"
                          onClick={() => setFullName(phoneCheckResult.lastCustomerName || '')}
                          className="text-cyan-300 hover:text-white underline font-bold"
                        >
                          استفاده از این نام
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* ورودی آیدی تلگرام یا بله (دلبخواهی / اختیاری) */}
              <div>
                <label htmlFor="customer-social" className="block text-xs font-semibold text-slate-300 mb-1">
                  آیدی تلگرام یا بله <span className="text-slate-400 font-normal">(اختیاری / دلبخواهی)</span>:
                </label>
                <input
                  id="customer-social"
                  type="text"
                  dir="ltr"
                  placeholder="username@ یا شماره در بله"
                  value={telegramOrBale}
                  onChange={(e) => setTelegramOrBale(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors text-right"
                />
              </div>

              {/* اولویت زمان تحویل */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-1">
                  اولویت زمان‌بندی و تحویل:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setUrgency('normal')}
                    className={`py-2 px-1.5 rounded-xl border transition-all ${
                      urgency === 'normal'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold text-xs">عادی</span>
                    <span className="text-[10px] opacity-75">{currentService?.deliveryTime || '۲ تا ۳ روز'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('express')}
                    className={`py-2 px-1.5 rounded-xl border transition-all ${
                      urgency === 'express'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold text-amber-300 text-xs">اکسپرس (فوری)</span>
                    <span className="text-[10px] opacity-75">+۲۵٪ هزینه</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('vip')}
                    className={`py-2 px-1.5 rounded-xl border transition-all ${
                      urgency === 'vip'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold text-emerald-300 text-xs">VIP مدیریت</span>
                    <span className="text-[10px] opacity-75">+۵۰٪ هزینه</span>
                  </button>
                </div>

                {/* یادداشت شفافیت تحویل و تعهد کیفیت */}
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-200 leading-relaxed flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">⏱️</span>
                  <span>
                    زمان تحویل عادی در حالت نرمال معمولاً <strong>۲ تا ۳ روز کاری</strong> است و بسته به حجم پروژه ممکن است تغییر کند، اما <strong>ما سعی می‌کنیم که در زمان خیلی سریع پروژه رو با حفظ کیفیت عالی به شما تحویل بدیم.</strong>
                  </span>
                </div>
              </div>

              {/* توضیحات پروژه */}
              <div>
                <label htmlFor="project-desc" className="block text-xs font-semibold text-slate-300 mb-1">
                  توضیحات و نیازمندی‌های پروژه (اختیاری):
                </label>
                <textarea
                  id="project-desc"
                  rows={2}
                  placeholder="لطفاً اهداف یا سبک بصری مدنظر را اینجا بنویسید..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                />
              </div>

              {/* گزینه پرداخت با کوین استودیو (زمانی که ضرب سکه توسط ادمین فعال شده باشد) */}
              {coinSystem?.enabled && (
                <div className="p-3.5 rounded-2xl bg-[#07090E] border-2 border-amber-400/50 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CoinEmblem design={coinSystem.activeDesign || 'royal_crest'} size="md" withDarkFrame={false} />
                      <div>
                        <span className="text-xs font-black text-amber-300 block">
                          پرداخت و ثبت سفارش با {coinSystem.coinName || 'کوین استودیو'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          معادل این سفارش: <strong className="text-white">{toPersianDigits(requiredCoins)} کوین</strong>{' '}
                          | موجودی شما: <strong className="text-amber-300">{toPersianDigits(userCoins)} کوین</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPayWithCoins(!payWithCoins)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all shrink-0 ${
                        payWithCoins
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                          : 'bg-slate-900 text-amber-300 border-amber-400/40 hover:border-amber-400'
                      }`}
                    >
                      {payWithCoins ? '✓ انتخاب‌شده با کوین' : 'پرداخت با کوین'}
                    </button>
                  </div>

                  {payWithCoins && !hasEnoughCoins && (
                    <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between gap-2 text-[11px] text-rose-200">
                      <span>موجودی کوین شما برای این سفارش کافی نیست.</span>
                      {onOpenUserPanel && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenUserPanel();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black whitespace-nowrap"
                        >
                          + افزودن کوین در پنل کاربری
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* پروتکل اجرایی استودیو برای این سفارش */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-cyan-400 font-black text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>پروتکل اجرای تیز پروژه شما — ما آماده خلق اثری فراتر از انتظارتان هستیم ⚡</span>
                  </span>
                  <span className="text-[10px] text-slate-400">بررسی فوری</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">⚡</span>
                    <span>فرمول پرداخت مرحله‌ای (۵۰٪ شروع / ۵۰٪ تایید نهایی)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>۲ دور کالیبراسیون و بازبینی تخصصی رایگان</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>انتقال ۱۰۰٪ مالکیت فایل لایه‌باز و سورس کامل</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>حفظ کامل اسرار تجاری و ایده شما (NDA)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2 pt-1 border-t border-slate-800 text-amber-300">
                    <span className="font-bold">⚠️</span>
                    <span>قانون احراز تماس: الزام ثبت شماره همراه واقعی (شماره‌های فیک مانند ۱۲۳۴۵۶۷۸۹۰۱۱ موجب لغو خودکار است)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* فوتر ثابت */}
            <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-800/90 bg-slate-950/95 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block">برآورد اولیه سرمایه‌گذاری:</span>
                <span className="text-sm sm:text-base font-black text-white">
                  {payWithCoins && coinSystem?.enabled
                    ? `${toPersianDigits(requiredCoins)} ${coinSystem.coinName || 'کوین'} (${formatPersianPrice(calculatedPrice)})`
                    : showPrices
                    ? formatPersianPrice(calculatedPrice)
                    : 'توافقی و پس از بررسی نیازمندی‌ها'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (payWithCoins && !hasEnoughCoins)}
                className={`px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all transform active:scale-95 disabled:opacity-50 ${
                  payWithCoins && coinSystem?.enabled
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(250,204,21,0.45)]'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,210,255,0.4)]'
                }`}
              >
                {isSubmitting
                  ? 'در حال ثبت...'
                  : payWithCoins && coinSystem?.enabled
                  ? `پرداخت ${toPersianDigits(requiredCoins)} کوین و ثبت سفارش`
                  : 'تایید و ارسال درخواست'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
