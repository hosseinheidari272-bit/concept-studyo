import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // همگام‌سازی تب اولیه با حالت باز شدن مدال
  React.useEffect(() => {
    setActiveTab(authModalMode);
    setErrorMsg('');
    setInfoMsg('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);

    const res = await login(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      if (res.notFound) {
        // انتقال هوشمند به تب ثبت نام طبق نیازمندی کاربر
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

    if (!phone || phone.trim().length < 10) {
      setErrorMsg('شماره موبایل معتبر (مثال: ۰۹۱۲۳۴۵۶۷۸۹) الزامی است');
      return;
    }

    setIsSubmitting(true);
    const res = await register(username, password, fullName, phone);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'ثبت نام انجام نشد');
    }
  };

  // پر کردن سریع برای تست مشخصات ادمین
  const fillAdminCredentials = () => {
    setActiveTab('login');
    setUsername('admin');
    setPassword('admin123');
    setErrorMsg('');
    setInfoMsg('مشخصات ادمین بارگذاری شد. روی دکمه ورود کلیک کنید.');
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
                  برای دسترسی به سوابق سفارشات یا پنل مدیریت، مشخصات خود را وارد کنید.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام کاربری یا شماره موبایل:
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin، 0912... یا نام کاربری شما"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* تراشه ورود تست ادمین */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    ورود سریع ادمین (admin / admin123)
                  </span>
                  <span className="text-[10px] text-slate-400">کلیک برای درج خودکار ↵</span>
                </button>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  شماره موبایل (جهت پیگیری اختصاصی و ورود) <span className="text-cyan-400">*</span>:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
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
