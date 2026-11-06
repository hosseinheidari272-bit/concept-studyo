import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  normalizeIranianPhone,
  validateIranianMobileDetailed,
  PHONE_VERIFICATION_RULES,
} from '../utils/phoneUtils';
import { apiFetch as fetch } from '../utils/offlineApiBridge';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneOperator, setPhoneOperator] = useState<string | null>(null);
  const [phoneCheckResult, setPhoneCheckResult] = useState<{
    exists: boolean;
    registered?: boolean;
    user?: { fullName: string; username: string };
    message?: string;
  } | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // همگام‌سازی تب اولیه با حالت باز شدن مدال
  React.useEffect(() => {
    setActiveTab(authModalMode);
    setErrorMsg('');
    setInfoMsg('');
    setPhoneError('');
    setPhoneCheckResult(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handlePhoneCheck = async (cleanPhone: string) => {
    if (!cleanPhone || cleanPhone.length < 11) return;
    setIsCheckingPhone(true);
    try {
      const res = await fetch(`/api/users/check-phone?phone=${encodeURIComponent(cleanPhone)}`);
      if (res.ok) {
        const data = await res.json();
        setPhoneCheckResult(data);
      }
    } catch {
      // ignore network errors
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handlePhoneInputChange = (raw: string) => {
    const norm = normalizeIranianPhone(raw);
    setPhone(norm);
    setErrorMsg('');
    setPhoneCheckResult(null);

    if (!norm) {
      setPhoneError('');
      setPhoneOperator(null);
      return;
    }

    // اگر شماره با ۰۹ شروع نشده باشد (مانند نمونه ۱۲۳۴۵۶۷۸۹۰۱۱)
    if (!norm.startsWith('09') && norm.length >= 3) {
      setPhoneError('شماره همراه باید حتماً با ۰۹ شروع شود (مانند ۰۹۱۲۳۴۵۶۷۸۹). شماره‌های نامعتبر مانند ۱۲۳۴۵۶۷۸۹۰۱۱ پذیرفته نمی‌شوند.');
      setPhoneOperator(null);
      return;
    }

    if (norm.length >= 11) {
      const val = validateIranianMobileDetailed(norm);
      if (!val.isValid) {
        setPhoneError(val.error || 'شماره موبایل وارد شده نامعتبر است.');
        setPhoneOperator(null);
      } else {
        setPhoneError('');
        setPhoneOperator(val.operatorName || null);
        handlePhoneCheck(norm);
      }
    } else {
      setPhoneError('');
      setPhoneOperator(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);

    const res = await login(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      if (res.notFound) {
        setInfoMsg('اطلاعات شما در سیستم وجود ندارد. لطفاً فرم ثبت نام زیر را تکمیل کنید.');
        setActiveTab('register');
      } else {
        setErrorMsg(res.error || 'ورود ناموفق بود');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    // اعتبارسنجی جامع شماره تلفن همراه با regex
    const phoneVal = validateIranianMobileDetailed(phone);
    if (!phoneVal.isValid) {
      setPhoneError(phoneVal.error || 'شماره موبایل وارد شده نامعتبر است');
      setErrorMsg(phoneVal.error || 'شماره موبایل معتبر (مثال: ۰۹۱۲۳۴۵۶۷۸۹) الزامی است');
      return;
    }

    // بررسی موجود بودن در پایگاه داده جهت جلوگیری از ثبت تکراری
    setIsSubmitting(true);
    try {
      const checkRes = await fetch(`/api/users/check-phone?phone=${encodeURIComponent(phoneVal.normalized)}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.registered && checkData.user) {
          setIsSubmitting(false);
          setPhoneCheckResult(checkData);
          setErrorMsg(`این شماره موبایل قبلاً برای حساب «${checkData.user.fullName}» ثبت شده است. لطفاً وارد حساب شوید.`);
          return;
        }
      }
    } catch {
      // در صورت خطای شبکه ادامه می‌دهیم تا ثبت انجام شود
    }

    const res = await register(username, password, fullName, phoneVal.normalized);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'ثبت نام انجام نشد');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md p-3 sm:p-5 flex justify-center items-center"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-md max-h-[calc(100vh-2rem)] rounded-3xl bg-slate-950 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-slate-100 m-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مدال: تب‌های ورود و ثبت نام */}
        <div className="relative p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ورود به حساب
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ثبت نام جدید
            </button>
          </div>

          <button
            onClick={closeAuthModal}
            aria-label="بستن پنجره ورود"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
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

        {/* پیام‌های وضعیت یا خطا */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* بدنه فرم */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {activeTab === 'login' ? (
            /* فرم ورود */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h3 id="auth-modal-title" className="text-lg font-bold text-white mb-1">
                  خوش‌آمدید! لطفاً وارد شوید
                </h3>
                <p className="text-xs text-slate-400">
                  برای دسترسی به سوابق سفارشات یا حساب کاربری خود، مشخصات را وارد کنید.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام کاربری یا شماره موبایل:
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="0912... یا نام کاربری شما"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رمز عبور:
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* یادآوری ماندگاری خودکار نشست در مرورگر */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
                <span>حساب شما در این مرورگر به خاطر سپرده می‌شود و در مراجعات بعدی نیازی به ورود مجدد نخواهد بود.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'در حال بررسی...' : 'ورود به حساب کاربری'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  هنوز حسابی ندارید؟ <span className="text-cyan-400 font-bold underline">ثبت نام کنید</span>
                </button>
              </div>
            </form>
          ) : (
            /* فرم ثبت نام جدید */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <h3 id="auth-modal-title" className="text-lg font-bold text-white mb-1">
                  ایجاد حساب کاربری جدید
                </h3>
                <p className="text-xs text-slate-400">
                  اطلاعات و رمز عبور شما در سرور ذخیره می‌شود تا در دفعات بعد به‌راحتی وارد شوید.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام و نام خانوادگی <span className="text-cyan-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد محمدی"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    شماره موبایل (جهت پیگیری اختصاصی و ورود) <span className="text-cyan-400">*</span>:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isCheckingPhone && (
                      <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                        <span className="w-2 h-2 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        استعلام...
                      </span>
                    )}
                    {phoneOperator && !phoneError && !phoneCheckResult?.registered && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ✓ {phoneOperator}
                      </span>
                    )}
                  </div>
                </div>

                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  onBlur={() => phone.length >= 11 && handlePhoneCheck(phone)}
                  maxLength={13}
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none transition-colors ${
                    phoneError || (phoneCheckResult?.registered)
                      ? 'border-rose-500 focus:border-rose-400'
                      : phoneOperator
                      ? 'border-emerald-500/60 focus:border-emerald-400'
                      : 'border-slate-700 focus:border-cyan-400'
                  }`}
                />

                {phoneError && (
                  <p className="mt-1 text-[11px] text-rose-300 leading-tight flex items-start gap-1">
                    <span className="text-rose-400 font-bold shrink-0">✕</span>
                    <span>{phoneError}</span>
                  </p>
                )}

                {/* اخطار در صورت تکراری بودن شماره در دیتابیس */}
                {phoneCheckResult?.registered && phoneCheckResult.user && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">⚠️ این شماره قبلاً در سیستم ثبت شده است!</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUsername(phone);
                          setActiveTab('login');
                          setErrorMsg('');
                          setInfoMsg(`شماره ${phone} قبلاً ثبت شده است. لطفاً رمز عبور خود را وارد کنید.`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] transition-all whitespace-nowrap"
                      >
                        ورود با این شماره ←
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      این شماره متعلق به حساب «<strong className="text-white">{phoneCheckResult.user.fullName}</strong>» است. جهت جلوگیری از تکراری شدن، لطفاً وارد حساب خود شوید.
                    </p>
                  </div>
                )}

                {/* یادآوری قانون صحت شماره تلفن */}
                <div className="mt-1.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold shrink-0">ℹ️</span>
                  <span>
                    <strong>قانون صحت اطلاعات:</strong> ثبت شماره‌های ساختگی یا تست مانند ۱۲۳۴۵۶۷۸۹۰۱۱ ممنوع است. تمام هماهنگی‌ها و ارسال فایل‌ها تنها از طریق پیامک به شماره معتبر انجام می‌شود.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام کاربری دلخواه <span className="text-cyan-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: mohammadi2026"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رمز عبور دلخواه <span className="text-cyan-400">*</span>:
                </label>
                <input
                  type="password"
                  required
                  minLength={5}
                  placeholder="حداقل ۵ کاراکتر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* یادآوری ماندگاری خودکار نشست در مرورگر */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
                <span>حساب شما بلافاصله فعال شده و ورود در این مرورگر پایدار می‌ماند.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'در حال ایجاد حساب...' : 'تکمیل ثبت نام و ورود'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  قبلاً ثبت نام کرده‌اید؟ <span className="text-cyan-400 font-bold underline">وارد شوید</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
