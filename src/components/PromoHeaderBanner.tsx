import React from 'react';
import { PromoBannerSettings } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PromoHeaderBannerProps {
  promo?: PromoBannerSettings;
  promoBanner?: PromoBannerSettings;
  onActionClick?: () => void;
}

export const PromoHeaderBanner: React.FC<PromoHeaderBannerProps> = ({
  promo,
  promoBanner,
  onActionClick,
}) => {
  const { isLight } = useTheme();
  const activePromo = promo || promoBanner;

  if (!activePromo || !activePromo.enabled || !activePromo.text.trim()) {
    return null;
  }

  return (
    <div
      className={`${
        activePromo.stickyOnScroll
          ? 'sticky top-3 z-40'
          : 'relative z-20'
      } mb-6 sm:mb-8 transition-all duration-300`}
    >
      <div
        className={`mx-auto max-w-5xl rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 border flex flex-wrap items-center justify-between gap-3 transition-all ${
          isLight
            ? 'bg-[#0B0F19] text-amber-300 border-amber-400/70 shadow-[0_10px_28px_rgba(15,23,42,0.18),0_0_18px_rgba(250,204,21,0.18)]'
            : 'bg-gradient-to-r from-[#0B0F19] via-[#131926] to-[#0B0F19] text-amber-300 border-amber-400/60 shadow-[0_10px_30px_rgba(0,0,0,0.75),0_0_20px_rgba(250,204,21,0.18)]'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>

          {activePromo.badgeText && activePromo.badgeText.trim() && (
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-black font-black text-[11px] shrink-0 shadow-[0_0_10px_rgba(250,204,21,0.4)]">
              {activePromo.badgeText.trim()}
            </span>
          )}

          <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed">
            {activePromo.text}
          </p>
        </div>

        {(activePromo.linkText || onActionClick) && (
          <div className="flex items-center gap-2 shrink-0">
            {activePromo.linkUrl && activePromo.linkUrl.trim() ? (
              <a
                href={activePromo.linkUrl.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all active:scale-95 flex items-center gap-1"
              >
                <span>{activePromo.linkText || 'مشاهده پیشنهاد'}</span>
                <span>←</span>
              </a>
            ) : (
              onActionClick && (
                <button
                  type="button"
                  onClick={onActionClick}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>{activePromo.linkText || 'ثبت سفارش ویژه'}</span>
                  <span>←</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
