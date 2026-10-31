import React from 'react';
import { CoinDesignId } from '../types';
import { toPersianDigits } from '../utils/persianDate';

export const COIN_DESIGN_CATALOG: Array<{
  id: CoinDesignId;
  name: string;
  title: string;
  subtitle: string;
  tag: string;
}> = [
  {
    id: 'royal_crest',
    name: 'سکه سلطنتی کانسپت (طرح اصلی)',
    title: 'سکه سلطنتی کانسپت (طرح اصلی)',
    subtitle: 'تاج هندسی طلایی روی هسته مشکی کربنی با رینگ سکه‌ای کلاسیک',
    tag: 'طرح پیش‌فرض',
  },
  {
    id: 'cyber_hex',
    name: 'کوین سایبر هگز (طرح ۲)',
    title: 'کوین سایبر هگز (طرح ۲)',
    subtitle: 'شش‌ضلعی کوانتومی زرد و مشکی با مدارهای نوری نئون طلایی',
    tag: 'مدرن و دیجیتال',
  },
  {
    id: 'solar_nova',
    name: 'سکه خورشیدی نوا (طرح ۳)',
    title: 'سکه خورشیدی نوا (طرح ۳)',
    subtitle: 'ستاره هشت‌پر طلایی در قاب مشکی عمیق با کنتراست بالا',
    tag: 'درخشان و لوکس',
  },
  {
    id: 'imperial_shield',
    name: 'نشان امپریال (طرح ۴)',
    title: 'نشان امپریال (طرح ۴)',
    subtitle: 'سپر گرافیکی زرد و مشکی با حکاکی اختصاصی استودیو',
    tag: 'پریمیوم و رسمی',
  },
];

interface CoinEmblemProps {
  design?: CoinDesignId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withDarkFrame?: boolean;
}

/**
 * لوگوی گرافیکی کوین اختصاصی با ترکیب رنگ زرد طلایی و مشکی عمیق
 * در تم روشن نیز همواره دارای پس‌زمینه و قاب مشکی است تا چشم را اذیت نکند.
 */
export const CoinEmblem: React.FC<CoinEmblemProps> = ({
  design = 'royal_crest',
  size = 'md',
  className = '',
  withDarkFrame = true,
}) => {
  const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const uid = React.useId().replace(/:/g, '');

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        withDarkFrame
          ? 'bg-[#07090E] p-0.5 border border-amber-400/70 shadow-[0_2px_12px_rgba(0,0,0,0.65),0_0_10px_rgba(250,204,21,0.28)]'
          : ''
      } ${sizeMap[size]} ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible" fill="none">
        <defs>
          <linearGradient id={`goldGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FACC15" />
            <stop offset="75%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id={`darkCore-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181B" />
            <stop offset="50%" stopColor="#09090B" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <radialGradient id={`goldGlow-${uid}`} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#FACC15" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* پس‌زمینه دایره‌ای مشکی مطلق برای کنتراست عالی در هر دو تم روشن و تاریک */}
        <circle cx="32" cy="32" r="30" fill={`url(#darkCore-${uid})`} />

        {/* رینگ بیرونی طلایی */}
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke={`url(#goldGrad-${uid})`}
          strokeWidth="3.2"
        />

        {/* طرح ۱: سکه سلطنتی کانسپت (Royal Crest - طرح اصلی زرد و مشکی) */}
        {design === 'royal_crest' && (
          <>
            <circle
              cx="32"
              cy="32"
              r="24"
              stroke="#FACC15"
              strokeWidth="1.2"
              strokeDasharray="3 2.5"
              opacity="0.85"
            />
            <polygon
              points="32,11 49,21 49,43 32,53 15,43 15,21"
              fill="#09090B"
              stroke={`url(#goldGrad-${uid})`}
              strokeWidth="2.4"
            />
            {/* تاج و الماس مرکزی زرد طلایی */}
            <path
              d="M21 37L24 23L32 29L40 23L43 37H21Z"
              fill={`url(#goldGrad-${uid})`}
            />
            <rect x="22" y="39" width="20" height="3.2" rx="1.5" fill="#FACC15" />
            <circle cx="32" cy="18" r="2.3" fill="#FEF08A" />
            <circle cx="22" cy="20.5" r="1.7" fill="#FACC15" />
            <circle cx="42" cy="20.5" r="1.7" fill="#FACC15" />
          </>
        )}

        {/* طرح ۲: کوین سایبر هگز (Cyber Hex) */}
        {design === 'cyber_hex' && (
          <>
            <polygon
              points="32,8 53,20 53,44 32,56 11,44 11,20"
              fill="#050507"
              stroke={`url(#goldGrad-${uid})`}
              strokeWidth="2.6"
            />
            <polygon
              points="32,15 46,23.5 46,40.5 32,49 18,40.5 18,23.5"
              fill={`url(#goldGrad-${uid})`}
            />
            <polygon
              points="32,20 41,25.5 41,38.5 32,44 23,38.5 23,25.5"
              fill="#09090B"
            />
            <path
              d="M35.5 27.5C34.5 26.5 33.2 26 31.8 26C28.8 26 26.5 28.6 26.5 32C26.5 35.4 28.8 38 31.8 38C33.3 38 34.6 37.4 35.6 36.3"
              stroke="#FEF08A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="32" cy="11.5" r="1.8" fill="#FEF08A" />
            <circle cx="32" cy="52.5" r="1.8" fill="#FEF08A" />
          </>
        )}

        {/* طرح ۳: سکه خورشیدی نوا (Solar Nova) */}
        {design === 'solar_nova' && (
          <>
            <circle cx="32" cy="32" r="24" stroke="#EAB308" strokeWidth="1" opacity="0.6" />
            {/* ستاره ۸ پر زرد روی زمینه مشکی */}
            <polygon
              points="32,10 36.5,24 50,18 40,29.5 54,32 40,34.5 50,46 36.5,40 32,54 27.5,40 14,46 24,34.5 10,32 24,29.5 14,18 27.5,24"
              fill={`url(#goldGrad-${uid})`}
            />
            <circle
              cx="32"
              cy="32"
              r="9.5"
              fill="#09090B"
              stroke="#FEF08A"
              strokeWidth="2.2"
            />
            <circle cx="32" cy="32" r="4.2" fill="#FACC15" />
          </>
        )}

        {/* طرح ۴: نشان امپریال (Imperial Shield) */}
        {design === 'imperial_shield' && (
          <>
            <circle
              cx="32"
              cy="32"
              r="24.5"
              stroke="#FACC15"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <path
              d="M32 12L48 18V31C48 41.5 41 49.2 32 53C23 49.2 16 41.5 16 31V18L32 12Z"
              fill={`url(#goldGrad-${uid})`}
            />
            <path
              d="M32 16.5L43.5 21V30.8C43.5 38.8 38.4 44.8 32 48C25.6 44.8 20.5 38.8 20.5 30.8V21L32 16.5Z"
              fill="#09090B"
            />
            <path
              d="M32 22L35.2 28.6L42.5 29.6L37.2 34.7L38.5 42L32 38.5L25.5 42L26.8 34.7L21.5 29.6L28.8 28.6L32 22Z"
              fill={`url(#goldGrad-${uid})`}
            />
          </>
        )}

        {/* هایلایت براق روی سکه */}
        <circle cx="32" cy="32" r="28" fill={`url(#goldGlow-${uid})`} />
      </svg>
    </span>
  );
};

interface CoinBalancePillProps {
  coins: number;
  coinName?: string;
  design?: CoinDesignId;
  onClick?: () => void;
  href?: string;
  size?: 'sm' | 'md';
}

/**
 * نشانگر موجودی کوین کاربر با پس‌زمینه مشکی ثابت (مناسب برای هر دو تم روشن و تاریک بدون اذیت شدن چشم)
 */
export const CoinBalancePill: React.FC<CoinBalancePillProps> = ({
  coins,
  coinName = 'کوین',
  design = 'royal_crest',
  onClick,
  href,
  size = 'md',
}) => {
  const content = (
    <>
      <CoinEmblem design={design} size={size === 'sm' ? 'xs' : 'sm'} withDarkFrame={false} />
      <div className="flex items-center gap-1.5 text-right">
        <span className="font-black text-amber-300 tabular-nums tracking-tight text-xs sm:text-sm">
          {toPersianDigits(coins.toLocaleString('en-US'))}
        </span>
        <span className="text-[11px] font-bold text-amber-400/90 hidden sm:inline">
          {coinName}
        </span>
      </div>
      <span className="w-4 h-4 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-[0_0_8px_rgba(250,204,21,0.6)]">
        +
      </span>
    </>
  );

  // استایل مشکی-طلایی یکدست که در تم روشن هم یک کادر مشکی شیک دور زرد ایجاد می‌کند
  const baseClass =
    'inline-flex items-center gap-2 px-3 py-1.5 min-h-[38px] rounded-xl bg-[#090B10] hover:bg-[#111520] text-amber-300 border-2 border-amber-400/80 hover:border-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.45),0_0_15px_rgba(250,204,21,0.2)] transition-all active:scale-95 cursor-pointer';

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        title="مشاهده کیف پول و افزودن کوین در صفحه جدید"
        className={baseClass}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="مشاهده کیف پول و افزودن کوین"
      className={baseClass}
    >
      {content}
    </button>
  );
};
