export type AnomalyVariantId =
  | 'crimson_surge'
  | 'scarlet_word_snap'
  | 'kinetic_tilt_jolt'
  | 'laser_crimson_sweep'
  | 'heartbeat_adrenaline'
  | 'inverted_red_badge'
  | 'ember_spotlight_zoom'
  | 'diagonal_crimson_slash'
  | 'glitch_precision_lock'
  | 'typographic_red_shock'
  | 'corner_ignite_pulse'
  | 'cta_crimson_magnet'
  | 'underline_razor_strike'
  | 'high_voltage_frame';

export interface AnomalyVariant {
  id: AnomalyVariantId;
  label: string;
  containerClass: string;
  titleClass: string;
  numberClass: string;
  ctaClass: string;
  highlightWordClass: string;
  badgeOverlay?: string;
  durationMs: number;
}

export const ANOMALY_VARIANTS: readonly AnomalyVariant[] = [
  {
    id: 'crimson_surge',
    label: 'فوران سرخ و درشت‌نمایی ناگهانی',
    containerClass: 'pi-crimson-surge !border-red-500 !shadow-[0_0_45px_rgba(239,68,68,0.45)] z-30',
    titleClass: '!text-red-500 !font-black scale-[1.06] origin-right inline-block transition-transform duration-200',
    numberClass: '!text-red-500 scale-125 font-black',
    ctaClass: '!bg-red-600 !text-white !shadow-[0_0_25px_rgba(220,38,38,0.65)] scale-[1.03]',
    highlightWordClass: 'text-red-500 font-black text-[1.15em] underline decoration-red-500 decoration-2 underline-offset-4',
    durationMs: 2600,
  },
  {
    id: 'scarlet_word_snap',
    label: 'ضربه واژه سرخ ناگهانی',
    containerClass: '!border-rose-500/80 !shadow-[0_12px_35px_rgba(244,63,94,0.28)] z-20',
    titleClass: '!text-rose-500 !font-black tracking-tight',
    numberClass: '!text-rose-500 font-black',
    ctaClass: '',
    highlightWordClass: 'bg-red-600 text-white font-black px-1.5 py-0.5 rounded-md inline-block scale-110 shadow-[0_0_15px_rgba(220,38,38,0.6)] mx-0.5',
    durationMs: 2900,
  },
  {
    id: 'kinetic_tilt_jolt',
    label: 'تکان زاویه‌ای تیز',
    containerClass: 'pi-kinetic-tilt !border-red-500 !shadow-[0_18px_45px_rgba(239,68,68,0.35)] z-30',
    titleClass: '!text-red-400 !font-black scale-[1.04] origin-right inline-block',
    numberClass: 'bg-red-600 !text-white px-2 py-0.5 rounded font-black scale-110 inline-block',
    ctaClass: '!bg-gradient-to-r !from-red-600 !to-rose-500 !text-white',
    highlightWordClass: 'text-red-400 font-black text-[1.12em]',
    durationMs: 2400,
  },
  {
    id: 'laser_crimson_sweep',
    label: 'پرتو اسکن لیزر قرمز',
    containerClass: 'pi-laser-sweep !border-red-500/90 !shadow-[0_0_38px_rgba(239,68,68,0.38)] z-20',
    titleClass: '!text-red-500 !font-black scale-[1.05] origin-right inline-block',
    numberClass: '!text-red-500 font-black',
    ctaClass: '!border-red-500 !shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    highlightWordClass: 'text-red-500 font-extrabold text-[1.14em]',
    durationMs: 2500,
  },
  {
    id: 'heartbeat_adrenaline',
    label: 'تپش دوضربه‌ای آدرنالین',
    containerClass: 'pi-heartbeat-jolt !border-red-600 !shadow-[0_0_50px_rgba(220,38,38,0.5)] z-30',
    titleClass: '!text-red-500 !font-black scale-[1.07] origin-right inline-block',
    numberClass: '!text-red-500 scale-125 font-black',
    ctaClass: '!bg-red-600 !text-white !font-black scale-105 !shadow-[0_0_30px_rgba(239,68,68,0.75)]',
    highlightWordClass: 'text-red-500 font-black text-[1.18em]',
    durationMs: 2300,
  },
  {
    id: 'inverted_red_badge',
    label: 'کنتراست معکوس سرخ',
    containerClass: '!border-red-500/85 !shadow-[0_14px_40px_rgba(220,38,38,0.3)] z-20',
    titleClass: 'bg-red-600 !text-white px-2.5 py-1 rounded-lg !font-black inline-block scale-[1.04] shadow-[0_0_20px_rgba(220,38,38,0.5)]',
    numberClass: '!text-red-500 font-black',
    ctaClass: '',
    highlightWordClass: 'text-red-500 font-black underline decoration-red-500',
    durationMs: 2700,
  },
  {
    id: 'ember_spotlight_zoom',
    label: 'فوکوس نقطه‌ای آتشین',
    containerClass: 'pi-spotlight-zoom !border-red-500 !shadow-[0_25px_60px_rgba(220,38,38,0.48)] z-30',
    titleClass: '!text-red-500 !font-black scale-[1.06] origin-right inline-block',
    numberClass: '!text-red-400 font-black scale-110',
    ctaClass: '!bg-red-600 !text-white !shadow-[0_0_24px_rgba(239,68,68,0.6)]',
    highlightWordClass: 'text-red-400 font-black text-[1.16em]',
    durationMs: 2800,
  },
  {
    id: 'diagonal_crimson_slash',
    label: 'برش مورب سرخ',
    containerClass: 'pi-diagonal-slash !border-rose-500 !shadow-[0_15px_40px_rgba(244,63,94,0.35)] z-20',
    titleClass: '!text-rose-500 !font-black scale-[1.04] origin-right inline-block',
    numberClass: '!text-rose-500 font-black scale-125',
    ctaClass: '!bg-rose-600 !text-white',
    highlightWordClass: 'text-rose-500 font-black text-[1.15em]',
    durationMs: 2500,
  },
  {
    id: 'glitch_precision_lock',
    label: 'قفل شارپ میلی‌متری',
    containerClass: 'pi-glitch-snap !border-red-500 !shadow-[0_0_40px_rgba(239,68,68,0.42)] z-30',
    titleClass: '!text-red-500 !font-black',
    numberClass: 'bg-red-600 !text-white px-1.5 rounded font-black',
    ctaClass: '!bg-red-600 !text-white',
    highlightWordClass: 'bg-red-500/20 text-red-400 border border-red-500/50 px-1 rounded font-black',
    durationMs: 2200,
  },
  {
    id: 'typographic_red_shock',
    label: 'موج ضربه تایپوگرافی سرخ',
    containerClass: '!border-red-500/90 !shadow-[0_15px_45px_rgba(239,68,68,0.36)] z-30',
    titleClass: '!text-red-500 !font-black scale-[1.09] origin-right inline-block',
    numberClass: '!text-red-600 !text-2xl font-black scale-125 inline-block',
    ctaClass: '',
    highlightWordClass: 'text-red-500 font-black text-[1.22em]',
    durationMs: 2600,
  },
  {
    id: 'corner_ignite_pulse',
    label: 'جرقه کانونی گوشه',
    containerClass: 'pi-corner-ignite !border-red-500 !shadow-[0_12px_38px_rgba(239,68,68,0.34)] z-20',
    titleClass: '!text-red-500 !font-black scale-[1.04] origin-right inline-block',
    numberClass: '!text-red-500 font-black',
    ctaClass: '!bg-red-600 !text-white',
    highlightWordClass: 'text-red-500 font-black underline decoration-wavy decoration-red-500',
    durationMs: 2700,
  },
  {
    id: 'cta_crimson_magnet',
    label: 'آهنربای سرخ اقدام',
    containerClass: 'pi-crimson-surge !border-red-500/80 z-30',
    titleClass: '!text-red-400 !font-black',
    numberClass: '!text-red-500 font-black',
    ctaClass: '!bg-gradient-to-r !from-red-600 !via-rose-500 !to-red-600 !text-white scale-[1.06] !shadow-[0_0_32px_rgba(239,68,68,0.75)]',
    highlightWordClass: 'text-red-500 font-black text-[1.12em]',
    durationMs: 2800,
  },
  {
    id: 'underline_razor_strike',
    label: 'خط برش تیغ سرخ',
    containerClass: '!border-red-500/85 !shadow-[0_10px_32px_rgba(239,68,68,0.3)] z-20',
    titleClass: '!text-red-500 !font-black underline decoration-red-500 decoration-4 underline-offset-8 scale-[1.04] origin-right inline-block',
    numberClass: '!text-red-500 font-black',
    ctaClass: '',
    highlightWordClass: 'text-red-500 font-black text-[1.15em]',
    durationMs: 2600,
  },
  {
    id: 'high_voltage_frame',
    label: 'ولتاژ بالای کادر سرخ',
    containerClass: 'pi-voltage-frame !border-red-600 !ring-2 !ring-red-500/50 !shadow-[0_0_48px_rgba(220,38,38,0.5)] z-30',
    titleClass: '!text-red-500 !font-black scale-[1.06] origin-right inline-block',
    numberClass: 'bg-red-600 !text-white px-2 py-0.5 rounded-md font-black',
    ctaClass: '!bg-red-600 !text-white !shadow-[0_0_22px_rgba(220,38,38,0.65)]',
    highlightWordClass: 'text-red-500 font-black text-[1.16em]',
    durationMs: 2500,
  },
];

export const ENTHUSIASM_HOOKS: readonly string[] = [
  'ما از خلق آثار خیره‌کننده لذت می‌بریم و مشتاقیم پروژه شما را طوری بسازیم که از شگفتی هیجان‌زده شوید!',
  'هر پروژه برای ما یک میدان هنرنمایی است؛ لحظه‌شماری می‌کنیم تا برند شما را به رخ تمام بازار بکشیم.',
  'وقتی تخصص تیز با اشتیاق واقعی ترکیب می‌شود، خروجی نهایی چیزی فراتر از تصور شما خواهد بود.',
  'ما عاشق لحظه‌ای هستیم که شما فایل نهایی را باز می‌کنید و از دقت، سرعت و شکوهش شگفت‌زده می‌شوید.',
  'تیم ما با انرژی صددرصدی آماده است تا ایده شما را در کوتاه‌ترین زمان به یک استاندارد طلایی تبدیل کند.',
  'کارهای معمولی برای ما خسته‌کننده است؛ ما اینجاییم تا اثری بسازیم که رقبایتان را میخکوب کند.',
];

export const PAIN_OF_INACTION_HOOKS: readonly {
  id: string;
  painTitle: string;
  painMetric: string;
  painDesc: string;
  masteryTitle: string;
  masteryDesc: string;
}[] = [
  {
    id: 'attention_loss',
    painTitle: '۱.۷ ثانیه تا از دست دادن مشتری',
    painMetric: '۷۸٪ خروج آنی',
    painDesc:
      'مخاطب امروزی به یک تصویر یا ویدیوی معمولی حتی ۲ ثانیه هم فرصت نمی‌دهد. هر روز که با ویترین معمولی در بازار هستید، مشتریان آماده خریدتان مستقیماً وارد سبد خرید رقیب می‌شوند.',
    masteryTitle: 'قفل کردن نگاه در ثانیه اول',
    masteryDesc:
      'با نورپردازی سینمایی 8K، ریتم تیز و مهندسی بصری دقیق، مخاطب در همان لحظه اول متوجه می‌شود با برندی تراز اول طرف است.',
  },
  {
    id: 'ad_burn',
    painTitle: 'سوختن بودجه کمپین و تبلیغات',
    painMetric: '۴ برابر هزینه بیشتر',
    painDesc:
      'انتشار محتوای ضعیف یا لندینگ‌پیج کند، هزینه جذب هر مشتری را تا ۴ برابر گران‌تر می‌کند؛ یعنی پرداخت پول برای ترافیکی که بدون خرید خارج می‌شود.',
    masteryTitle: 'تبدیل بازدیدکننده به خریدار مشتاق',
    masteryDesc:
      'ما دارایی‌های بصری و پلتفرم‌هایی می‌سازیم که ارزش واقعی محصول شما را فریاد می‌زنند و نرخ تبدیل را از روز اول متحول می‌کنند.',
  },
  {
    id: 'brand_perception',
    painTitle: 'ارزان دیده شدن محصول باکیفیت شما',
    painMetric: 'افت ۶۰٪ درک ارزش',
    painDesc:
      'حتی بهترین محصول بازار هم اگر با گرافیک، تیزر یا سایت سطح پایین عرضه شود، در ذهن مشتری «معمولی و کم‌ارزش» قضاوت می‌شود.',
    masteryTitle: 'جایگاه‌سازی در سطح اول بازار',
    masteryDesc:
      'ما با وسواس میلی‌متری روی جزییات متریال، حرکت دوربین و سرعت کدها کار می‌کنیم تا پرستیژ واقعی کار شما در بالاترین سطح بدرخشد.',
  },
];

/**
 * Generates a deterministic or entropy-seeded pseudo-random number in [0, 1).
 */
export function nextSeededRandom(seed: number): { value: number; nextSeed: number } {
  const nextSeed = (seed * 1664525 + 1013904223) >>> 0;
  return {
    value: nextSeed / 4294967296,
    nextSeed,
  };
}

/**
 * Creates a shuffled deck of AnomalyVariants without repeating adjacent IDs.
 */
export function createShuffledAnomalyDeck(seed: number = Date.now()): AnomalyVariant[] {
  const deck = [...ANOMALY_VARIANTS];
  let currentSeed = seed >>> 0 || 123456789;

  for (let i = deck.length - 1; i > 0; i--) {
    const step = nextSeededRandom(currentSeed);
    currentSeed = step.nextSeed;
    const j = Math.floor(step.value * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  return deck;
}

/**
 * Picks a random anomaly variant guaranteed to differ from `previousId`.
 */
export function pickNonRepeatingAnomaly(
  previousId: AnomalyVariantId | null,
  seed: number = Date.now() + Math.floor(Math.random() * 100000)
): AnomalyVariant {
  const candidates = previousId
    ? ANOMALY_VARIANTS.filter((a) => a.id !== previousId)
    : ANOMALY_VARIANTS;

  const { value } = nextSeededRandom(seed);
  const index = Math.floor(value * candidates.length);
  return candidates[index] || ANOMALY_VARIANTS[0];
}

/**
 * Selects which word index in a sentence/description should receive a sudden red-bold pattern interrupt.
 * Filters out short prepositions (<= 2 chars) so a meaningful word gets struck.
 */
export function pickInterruptWordIndex(text: string, seed: number): number {
  const words = text.trim().split(/\s+/);
  const eligibleIndices: number[] = [];

  words.forEach((w, idx) => {
    const clean = w.replace(/[،.؛:!؟«»()]/g, '');
    if (clean.length >= 3) {
      eligibleIndices.push(idx);
    }
  });

  if (eligibleIndices.length === 0) return 0;
  const { value } = nextSeededRandom(seed);
  return eligibleIndices[Math.floor(value * eligibleIndices.length)];
}

/**
 * Computes an irregular, non-habitual delay (in ms) so the human brain cannot predict when the next jolt happens.
 */
export function computeIrregularDelayMs(seed: number, minMs = 700, maxMs = 4400): number {
  const { value } = nextSeededRandom(seed);
  // Nonlinear distribution so some happen snappily and others after a pause
  const skewed = Math.pow(value, 1.35);
  return Math.round(minMs + skewed * (maxMs - minMs));
}
