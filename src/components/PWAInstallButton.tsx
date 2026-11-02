import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isLight } = useTheme();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // اگر کاربر قبلاً در حالت PWA نصب‌شده باشد، دکمه نیازی نیست
  if (isInstalled) {
    return null;
  }

  // جریان نصب استاندارد برای اندروید، کروم، اج و دسکتاپ
  if (isInstallable) {
    if (variant === 'full') {
      return (
        <button
          type="button"
          onClick={install}
          className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 ${
            isLight
              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500 shadow-sky-600/20'
              : 'bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]'
          } ${className}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <path d="M12 18h.01" strokeWidth="3" />
            <path d="M9 11l3 3 3-3" />
            <path d="M12 4v10" />
          </svg>
          <span>نصب اپلیکیشن روی گوشی (PWA)</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        title="نصب اپلیکیشن کانسپت روی گوشی یا دسکتاپ"
        className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center gap-1.5 active:scale-95 shrink-0 ${
          isLight
            ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700 shadow-xs'
            : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/40 text-cyan-300 shadow-sm'
        } ${className}`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>نصب اپلیکیشن</span>
      </button>
    );
  }

  // جریان نصب اختصاصی برای کاربران آیفون و آیپد (iOS Safari)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="نصب روی آیفون / آیپد"
          className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center gap-1.5 active:scale-95 shrink-0 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
          } ${className}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-2h2zm0-4h-2V7h2z" />
          </svg>
          <span>نصب روی آیفون</span>
        </button>

        {showIOSGuide && typeof document !== 'undefined' && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 duration-200 ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B101E] border-slate-800 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  <h3 className="text-base font-black">نصب کانسپت استودیو روی آیفون</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                برای اجرای برنامه با تجربه تمام‌صفحه و سرعت اپلیکیشن‌های بومی بدون نمایش نوار مرورگر:
              </p>

              <ol className="space-y-3 text-xs leading-relaxed font-medium">
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                    ۱
                  </span>
                  <span>
                    در نوار پایین یا بالای مرورگر Safari، آیکون <strong>اشتراک‌گذاری (Share ⎋)</strong> را لمس کنید.
                  </span>
                </li>

                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                    ۲
                  </span>
                  <span>
                    کمی به پایین اسکرول کنید و گزینه <strong>Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.
                  </span>
                </li>

                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                    ۳
                  </span>
                  <span>
                    در بالا گوشه، روی <strong>Add</strong> بزنید. آیکون استودیو به صفحه گوشی شما اضافه خواهد شد!
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // در حالت دسکتاپی یا حالتی که مرورگر هنوز پرامپت را برنگردانده، یک دکمه نصب با راهنمای دوستانه ارائه می‌شود
  return (
    <>
      <button
        type="button"
        onClick={() => setShowDesktopGuide(true)}
        title="راهنمای نصب وب‌اپلیکیشن"
        className={`hidden sm:inline-flex px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all items-center gap-1.5 active:scale-95 shrink-0 ${
          isLight
            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
        } ${className}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <path d="M12 18h.01" strokeWidth="3" />
        </svg>
        <span>نصب اپلیکیشن</span>
      </button>

      {showDesktopGuide && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={() => setShowDesktopGuide(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B101E] border-slate-800 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">💻</span>
                <h3 className="text-base font-black">نصب کانسپت استودیو</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              این وب‌اپلیکیشن مجهز به فناوری Progressive Web App (PWA) است و می‌توانید آن را بدون نیاز به دانلود از مارکت‌ها نصب کنید:
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">۱.</span>
                <span>در نوار آدرس مرورگر Chrome یا Edge روی آیکون نصب (Install) بزنید.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">۲.</span>
                <span>یا در منوی سه نقطه مرورگر گزینه «Install app» را انتخاب نمایید.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>اجرای مستقل و پرسرعت مانند برنامه‌های دسکتاپ ویندوز و مک.</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors"
            >
              بستن راهنما
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
