import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ShimmerPulse: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isLight } = useTheme();
  return (
    <div
      className={`animate-pulse rounded-xl ${
        isLight
          ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200'
          : 'bg-gradient-to-r from-slate-800/80 via-slate-700/60 to-slate-800/80'
      } ${className}`}
    />
  );
};

export const ServiceCardSkeleton: React.FC = () => {
  const { isLight } = useTheme();
  return (
    <div
      className={`rounded-3xl border p-6 flex flex-col justify-between h-[430px] transition-all duration-300 relative overflow-hidden ${
        isLight
          ? 'bg-white/80 border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'
          : 'bg-[#090F1C]/80 border-slate-800/70 shadow-[0_12px_35px_rgba(0,0,0,0.5)]'
      }`}
    >
      <div className="space-y-4">
        {/* هدر کارت: شماره و برچسب */}
        <div className="flex items-center justify-between gap-3">
          <ShimmerPulse className="w-12 h-6 rounded-lg" />
          <ShimmerPulse className="w-20 h-5 rounded-full" />
        </div>

        {/* عنوان و توضیحات */}
        <div className="space-y-2 pt-1">
          <ShimmerPulse className="w-4/5 h-6 rounded-lg" />
          <ShimmerPulse className="w-3/5 h-4 rounded-md" />
          <ShimmerPulse className="w-full h-12 rounded-xl mt-2" />
        </div>

        {/* جعبه قیمت */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <ShimmerPulse className="w-24 h-3 rounded" />
          <ShimmerPulse className="w-36 h-6 rounded-lg" />
        </div>

        {/* اقلام تحویلی */}
        <div className="space-y-2 pt-1">
          <ShimmerPulse className="w-full h-3.5 rounded" />
          <ShimmerPulse className="w-5/6 h-3.5 rounded" />
        </div>
      </div>

      {/* دکمه‌های پایین کارت */}
      <div className="grid grid-cols-2 gap-2 pt-4">
        <ShimmerPulse className="h-10 rounded-xl" />
        <ShimmerPulse className="h-10 rounded-xl" />
      </div>
    </div>
  );
};

export const CoinPackageSkeleton: React.FC = () => {
  const { isLight } = useTheme();
  return (
    <div
      className={`rounded-3xl border-2 p-5 flex flex-col justify-between h-[360px] relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white/90 border-amber-300/40 shadow-md'
          : 'bg-[#080B12] border-amber-400/25 shadow-[0_14px_35px_rgba(0,0,0,0.5)]'
      }`}
    >
      <div className="space-y-4">
        {/* بج بالای پکیج */}
        <div className="flex items-center justify-between">
          <ShimmerPulse className="w-16 h-4 rounded" />
          <ShimmerPulse className="w-24 h-5 rounded-full bg-amber-400/20" />
        </div>

        {/* لوگو و عنوان کوین */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-14 h-14 rounded-2xl p-1 bg-[#04060A] border border-amber-400/40 flex items-center justify-center">
            <ShimmerPulse className="w-10 h-10 rounded-full bg-amber-400/30" />
          </div>
          <div className="space-y-2 flex-1">
            <ShimmerPulse className="w-28 h-4 rounded" />
            <ShimmerPulse className="w-20 h-7 rounded-lg bg-amber-400/25" />
          </div>
        </div>

        {/* جعبه قیمت پکیج */}
        <div
          className={`p-3 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D121D] border-slate-800'
          }`}
        >
          <ShimmerPulse className="w-24 h-3 rounded" />
          <ShimmerPulse className="w-32 h-6 rounded-lg bg-amber-400/30" />
        </div>
      </div>

      {/* دکمه‌های خرید */}
      <div className="space-y-2 pt-3">
        <ShimmerPulse className="w-full h-10 rounded-xl bg-amber-400/30" />
        <ShimmerPulse className="w-full h-8 rounded-xl" />
      </div>
    </div>
  );
};

export const WalletBannerSkeleton: React.FC = () => {
  const { isLight } = useTheme();
  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden ${
        isLight
          ? 'bg-white border-amber-400/50 shadow-md'
          : 'bg-[#080B12] border-amber-400/40 shadow-[0_15px_40px_rgba(0,0,0,0.6)]'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
        <div className="w-20 h-20 rounded-3xl bg-[#04060A] border-2 border-amber-400/50 flex items-center justify-center p-2">
          <ShimmerPulse className="w-14 h-14 rounded-full bg-amber-400/40" />
        </div>
        <div className="space-y-2.5 text-center sm:text-right">
          <ShimmerPulse className="w-40 h-5 rounded-lg" />
          <div className="flex items-center gap-2">
            <ShimmerPulse className="w-24 h-8 rounded-xl bg-amber-400/35" />
            <ShimmerPulse className="w-16 h-4 rounded" />
          </div>
          <ShimmerPulse className="w-48 h-3 rounded" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ShimmerPulse className="w-36 h-10 rounded-2xl" />
        <ShimmerPulse className="w-28 h-10 rounded-2xl" />
      </div>
    </div>
  );
};
