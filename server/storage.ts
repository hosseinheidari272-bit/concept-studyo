import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { hashPassword } from './authUtils.ts';
import { studioServices } from '../src/data/services.ts';

export type CoinDesignId = 'royal_crest' | 'cyber_hex' | 'solar_nova' | 'imperial_shield';

export interface CoinPackageRecord {
  id: string;
  coins: number;
  coinAmount?: number;
  priceToman: number;
  title: string;
  subtitle?: string;
  badge?: string;
  designId: CoinDesignId;
  popular?: boolean;
  isActive?: boolean;
}

export interface CoinSystemSettingsRecord {
  enabled: boolean;
  coinName: string;
  coinSymbol?: string;
  activeDesign: CoinDesignId;
  unitPriceToman: number;
  packages: CoinPackageRecord[];
}

export interface PromoBannerSettingsRecord {
  enabled: boolean;
  text: string;
  badgeText?: string;
  stickyOnScroll: boolean;
  linkText?: string;
  linkUrl?: string;
  linkHash?: string;
}

export type PaymentGatewayProvider = 'zarinpal' | 'zibal' | 'custom_link';

export interface PaymentGatewaySettingsRecord {
  onlineEnabled: boolean;
  activeProvider: PaymentGatewayProvider;
  sandboxMode: boolean;
  zarinpalMerchantId: string;
  zibalMerchantId: string;
  customPaymentUrl: string;
  cardToCardEnabled: boolean;
  cardNumber: string;
  shebaNumber: string;
  cardHolderName: string;
  bankName: string;
  paymentInstruction: string;
}

export interface PaymentSessionRecord {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  coins: number;
  priceToman: number;
  provider: PaymentGatewayProvider | 'sandbox_local';
  authority?: string;
  refId?: string;
  status: 'pending' | 'verified' | 'failed';
  createdAt: string;
  verifiedAt?: string;
}

export interface CoinTransactionRecord {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  type: 'mint_grant' | 'admin_grant' | 'purchase_topup' | 'topup_request' | 'order_payment' | 'admin_deduct';
  amount: number;
  balanceAfter?: number;
  priceToman?: number;
  description: string;
  note: string;
  status: 'completed' | 'pending' | 'rejected';
  createdAt: string;
}

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'client';
  coins?: number;
  coinSignature?: string;
  coinEnabled?: boolean;
  notes?: string;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  detailedDescription?: string;
  category: string;
  tags: string[];
  startingPrice: number;
  deliveryTime: string;
  popular?: boolean;
  deliverables: string[];
  discountPercent?: number;
  isActive?: boolean;
  featuredTag?: string;
}

export interface OrderRecord {
  id: string;
  trackingCode: string;
  serviceId: string;
  serviceTitle: string;
  customerName: string;
  customerContact: string;
  urgency: 'normal' | 'express' | 'vip';
  calculatedPrice: number;
  paidWithCoins?: boolean;
  coinsSpent?: number;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  adminNote?: string;
  deliveryLink?: string;
  userId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'client';
  createdAt: string;
  expiresAt?: string;
}

export interface ChatAttachmentRecord {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size?: number;
}

export interface ChatMessageRecord {
  id: string;
  senderRole: 'admin' | 'user';
  senderName: string;
  text: string;
  attachments?: ChatAttachmentRecord[];
  timestamp: string;
  read: boolean;
}

export interface ChatThreadRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerContact: string;
  subject: string;
  orderId?: string;
  orderTitle?: string;
  status: 'open' | 'closed';
  unreadByAdmin: number;
  unreadByUser: number;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
}

export interface TestimonialRecord {
  id: string;
  category: '3d' | 'branding' | 'web';
  name: string;
  role: string;
  company: string;
  service: string;
  avatarColor?: string;
  initials?: string;
  outcome: string;
  rating: number;
  date: string;
  quote: string;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  userId?: string;
  orderId?: string;
  trackingCode?: string;
  createdAt: string;
}

export interface SiteSettingsRecord {
  showPrices: boolean;
  telegramUrl: string;
  baleUrl: string;
  coinSystem: CoinSystemSettingsRecord;
  promoBanner: PromoBannerSettingsRecord;
  paymentGateway: PaymentGatewaySettingsRecord;
}

export interface DatabaseSchema {
  users: UserRecord[];
  services: ServiceRecord[];
  orders: OrderRecord[];
  sessions: SessionRecord[];
  threads: ChatThreadRecord[];
  coinTransactions?: CoinTransactionRecord[];
  paymentSessions?: PaymentSessionRecord[];
  testimonials?: TestimonialRecord[];
  settings?: Partial<SiteSettingsRecord>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const COIN_SECRET_FILE = path.join(DATA_DIR, '.coin_secret');
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // ۳۶۵ روز (نشست پایدار دائمی تا زمان خروج دستی کاربر)

export const DEFAULT_COIN_PACKAGES: CoinPackageRecord[] = [
  {
    id: 'pkg_1',
    coins: 1,
    coinAmount: 1,
    priceToman: 500000,
    title: 'تک‌کوین پایه استودیو',
    subtitle: 'معادل پایه هر ۱ واحد سکه استودیو',
    badge: 'نرخ پایه ۱ کوین',
    designId: 'royal_crest',
    isActive: true,
  },
  {
    id: 'pkg_2',
    coins: 5,
    coinAmount: 5,
    priceToman: 2350000,
    title: 'بسته نقره‌ای سایبر (۵ کوین)',
    subtitle: 'طرح آماده ۱ — اقتصادی ویژه سفارش‌های گرافیک و تیزر',
    badge: 'طرح آماده ۱ — اقتصادی',
    designId: 'cyber_hex',
    isActive: true,
  },
  {
    id: 'pkg_3',
    coins: 10,
    coinAmount: 10,
    priceToman: 4500000,
    title: 'بسته طلایی سولار (۱۰ کوین)',
    subtitle: 'طرح آماده ۲ — ۱۰٪ ارزش بیشتر برای پروژه‌های سه‌بعدی و موشن',
    badge: 'طرح آماده ۲ — محبوب‌ترین',
    designId: 'solar_nova',
    popular: true,
    isActive: true,
  },
  {
    id: 'pkg_4',
    coins: 25,
    coinAmount: 25,
    priceToman: 10500000,
    title: 'بسته امپریال VIP (۲۵ کوین)',
    subtitle: 'طرح آماده ۳ — تخفیف سازمانی + اولویت بررسی VIP',
    badge: 'طرح آماده ۳ — سازمانی',
    designId: 'imperial_shield',
    isActive: true,
  },
];

export const DEFAULT_COIN_SYSTEM: CoinSystemSettingsRecord = {
  enabled: false,
  coinName: 'کوین استودیو',
  coinSymbol: 'CSC',
  activeDesign: 'royal_crest',
  unitPriceToman: 500000,
  packages: DEFAULT_COIN_PACKAGES,
};

export const DEFAULT_PROMO_BANNER: PromoBannerSettingsRecord = {
  enabled: false,
  text: 'حراج ویژه استودیو کانسپت: تا ۲۰٪ تخفیف روی پکیج‌های تیزر سینمایی و رندر سه‌بعدی!',
  badgeText: 'پیشنهاد ویژه',
  stickyOnScroll: true,
  linkText: 'مشاهده خدمات',
  linkUrl: '#services',
  linkHash: '#services',
};

export const DEFAULT_PAYMENT_GATEWAY: PaymentGatewaySettingsRecord = {
  onlineEnabled: true,
  activeProvider: 'zarinpal',
  sandboxMode: true,
  zarinpalMerchantId: '',
  zibalMerchantId: 'zibal',
  customPaymentUrl: '',
  cardToCardEnabled: true,
  cardNumber: '',
  shebaNumber: '',
  cardHolderName: 'مدیریت استودیو دیزاین کانسپت',
  bankName: 'بانک ملت / سامان',
  paymentInstruction: 'پس از واریز وجه، ۴ رقم آخر کارت یا کد پیگیری رسید را در کادر زیر وارد کنید تا کوین بلافاصله به حساب شما اضافه شود.',
};

export const DEFAULT_TESTIMONIALS: TestimonialRecord[] = [
  {
    id: 'testi-1',
    category: '3d',
    name: 'مهندس سامان کاظمی',
    role: 'مدیر ارشد مارکتینگ',
    company: 'برند تجهیزات صوتی و گجت‌های هوشمند آوانگار',
    service: 'تیزر سه بعدی سینمایی محصول 4K',
    avatarColor: 'from-amber-400 to-orange-500',
    initials: 'س.ک',
    outcome: 'رشد ۲۸۰٪ نرخ تبدیل با تحویل فوق‌سریع',
    rating: 5,
    date: 'آبان ۱۴۰۳',
    quote:
      'برای رونمایی هدفون‌های گیمینگ دنبال خروجی در استاندارد جهانی بودیم. استودیو کانسپت با سرعت فوق‌العاده بالا و رکورد زمانی استثنایی پروژه را تحویل داد، بدون اینکه ذره‌ای از استانداردهای سخت‌گیرانه، متریال سینمایی و جزییات فنی کاسته شود. تحویل سورس کامل بلندر هم امنیت فنی ما را تضمین کرد.',
    status: 'approved',
    verified: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
  },
  {
    id: 'testi-2',
    category: 'web',
    name: 'دکتر هومن شریفی',
    role: 'بنیان‌گذار و مدیرعامل',
    company: 'پلتفرم فناوری سلامت متالایف',
    service: 'توسعه پلتفرم دیجیتال فوق‌سریع و وب‌اپلیکیشن',
    avatarColor: 'from-cyan-400 to-blue-600',
    initials: 'ه.ش',
    outcome: 'سرعت لود زیر ۰.۷ ثانیه روی نت ایران',
    rating: 5,
    date: 'مهر ۱۴۰۳',
    quote:
      'نگرانی بزرگ ما اجرای سنگین المان‌های وب و قطعی‌های احتمالی شبکه بود. وب‌سایتی که کانسپت استودیو با سرعت فوق‌العاده بالا توسعه داد، روی اینترنت ملی و ضعیف‌ترین کانکشن‌ها مثل برق باز می‌شود و کدهای تمیز و سئو ساختاریافته ما را به صفحه اول گوگل رساند.',
    status: 'approved',
    verified: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 70).toISOString(),
  },
  {
    id: 'testi-3',
    category: 'branding',
    name: 'پریناز افشار',
    role: 'مدیر طراحی و برندینگ',
    company: 'خانه مد و اکسسوری الگانس',
    service: 'هویت بصری جامع، لوگوموشن و پکیجینگ',
    avatarColor: 'from-purple-400 to-pink-600',
    initials: 'پ.ا',
    outcome: 'پذیرش در ۲ بازار آنلاین بین‌المللی با خروجی پریمیوم',
    rating: 5,
    date: 'شهریور ۱۴۰۳',
    quote:
      'ما پیش از این با دو آژانس دیگر کار کرده بودیم اما خروجی‌ها کلیشه‌ای بود. تیم کانسپت استودیو با سرعت اجرایی بالا و درک عمیق دیزاین، هویت بصری لوکسی خلق کرد که اصالت و ارزش واقعی برند ما را تثبیت نمود. سرعت بالا در کنار کیفیت درجه یک ویژگی متمایز این تیم است.',
    status: 'approved',
    verified: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 100).toISOString(),
  },
  {
    id: 'testi-4',
    category: '3d',
    name: 'آرشام نیک‌زاد',
    role: 'تولیدکننده محتوا و مدیر استودیو',
    company: 'آکادمی رشد فناوری تک‌ورس',
    service: 'تدوین ریتمیک، موشن‌گرافیک و جلوه‌های ویژه',
    avatarColor: 'from-emerald-400 to-teal-600',
    initials: 'آ.ن',
    outcome: 'افزایش ۳.۵ برابری واچ‌تایم و بازدهی محتوا',
    rating: 5,
    date: 'مرداد ۱۴۰۳',
    quote:
      'سرعت تحویل در دنیای محتوا حیاتی است. استودیو کانسپت با سرعت فوق‌العاده بالا و تحویل سریع بدون کمترین افت کیفیت، ویدیوها را با ریتم میخکوب‌کننده و ساند دیزاین اختصاصی آماده کرد. دقت بالا باعث شد در همان اتود اول کار با تایید کامل نهایی شود.',
    status: 'approved',
    verified: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 120).toISOString(),
  },
  {
    id: 'testi-5',
    category: 'web',
    name: 'مهدی یزدانی',
    role: 'هم‌بنیان‌گذار',
    company: 'فروشگاه آنلاین عطر و کالای لوکس رایحه',
    service: 'ری‌دیزاین فروشگاه و تیزر بنرهای متحرک 3D',
    avatarColor: 'from-sky-400 to-indigo-600',
    initials: 'م.ی',
    outcome: 'کاهش نرخ بانس‌ریت به ۱۹٪ و فروش بی‌سابقه',
    rating: 5,
    date: 'تیر ۱۴۰۳',
    quote:
      'بزرگترین دغدغه ما لمس متریال و جزییات شیشه در خرید اینترنتی بود. کانسپت استودیو با سرعت بسیار بالا و کیفیتی خیره‌کننده، رندرهایی با بازتاب نور طبیعی و قطرات آب خلق کرد که نرخ تبدیل فروشگاه را متحول کرد.',
    status: 'approved',
    verified: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 150).toISOString(),
  },
  {
    id: 'testi-6',
    category: 'branding',
    name: 'کیوان اسدی',
    role: 'مدیر توسعه کسب‌وکار',
    company: 'هلدینگ سرمایه‌گذاری و تجارت پیشگامان',
    service: 'کاتالوگ تعاملی دیجیتال و موشن اینفوگرافیک',
    avatarColor: 'from-rose-400 to-red-600',
    initials: 'ک.ا',
    outcome: 'موفقیت در پیچ‌دک و جذب سرمایه ۲ میلیون دلاری',
    rating: 5,
    date: 'خرداد ۱۴۰۳',
    quote:
      'برای جذب سرمایه نیاز به ارائه‌ای سریع و بی‌نقص داشتیم. تیم کانسپت استودیو با سرعت عملی مثال‌زدنی و کیفیت ارائه در تراز جهانی، کاتالوگ و موشن اینفوگرافیک را تحویل داد و جلسه دفاع سرمایه‌گذاری ما با موفقیت کامل انجام شد.',
    status: 'approved',
    verified: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 180).toISOString(),
  },
];

class Storage {
  private data: DatabaseSchema;
  private coinSecret: string;

  constructor() {
    this.coinSecret = this.initCoinSecret();
    this.data = this.initDatabase();
  }

  private initCoinSecret(): string {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (process.env.COIN_HMAC_SECRET && process.env.COIN_HMAC_SECRET.length >= 32) {
      return process.env.COIN_HMAC_SECRET;
    }
    if (fs.existsSync(COIN_SECRET_FILE)) {
      try {
        const secret = fs.readFileSync(COIN_SECRET_FILE, 'utf-8').trim();
        if (secret.length >= 32) return secret;
      } catch {
        // ignore
      }
    }
    const generated = crypto.randomBytes(48).toString('hex');
    try {
      fs.writeFileSync(COIN_SECRET_FILE, generated, { encoding: 'utf-8', mode: 0o600 });
    } catch {
      // ignore
    }
    return generated;
  }

  public computeCoinSignature(userId: string, coins: number): string {
    const normalized = Math.max(0, Math.floor(Number(coins) || 0));
    return crypto
      .createHmac('sha256', this.coinSecret)
      .update(`coin_v1:${userId}:${normalized}`)
      .digest('hex');
  }

  public getVerifiedUserCoins(user: UserRecord): number {
    const rawCoins = Math.max(0, Math.floor(Number(user.coins) || 0));
    if (rawCoins === 0 && !user.coinSignature) return 0;
    const expectedSig = this.computeCoinSignature(user.id, rawCoins);
    if (user.coinSignature && crypto.timingSafeEqual(Buffer.from(user.coinSignature), Buffer.from(expectedSig))) {
      return rawCoins;
    }
    return 0;
  }

  private initDatabase(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // اطمینان از وجود ادمین
        if (!parsed.users || !parsed.users.some((u: UserRecord) => u.role === 'admin')) {
          const { hash, salt } = hashPassword('admin123');
          parsed.users = parsed.users || [];
          parsed.users.unshift({
            id: 'admin-root',
            username: 'admin',
            passwordHash: hash,
            salt,
            fullName: 'مدیر استودیو',
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
        }
        if (!parsed.services || parsed.services.length === 0) {
          parsed.services = studioServices.map((s) => ({ ...s, isActive: true, discountPercent: 0 }));
        } else {
          const existingMap = new Map<string, ServiceRecord>(
            parsed.services.map((s: ServiceRecord) => [s.id, s])
          );
          parsed.services = studioServices.map((defaultSvc) => {
            const saved = existingMap.get(defaultSvc.id);
            return {
              ...defaultSvc,
              startingPrice: saved?.startingPrice !== undefined ? saved.startingPrice : defaultSvc.startingPrice,
              isActive: saved?.isActive !== undefined ? saved.isActive : true,
              discountPercent: saved?.discountPercent !== undefined ? saved.discountPercent : 0,
              featuredTag: saved?.featuredTag || defaultSvc.featuredTag,
            };
          });
        }
        parsed.orders = parsed.orders || [];
        parsed.sessions = parsed.sessions || [];
        parsed.coinTransactions = parsed.coinTransactions || [];
        parsed.paymentSessions = parsed.paymentSessions || [];

        // امضای رمزنگاری اولیه برای کاربران موجود
        parsed.users.forEach((u: UserRecord) => {
          const c = Math.max(0, Math.floor(Number(u.coins) || 0));
          u.coins = c;
          if (!u.coinSignature) {
            u.coinSignature = this.computeCoinSignature(u.id, c);
          }
        });

        parsed.settings = {
          showPrices: parsed.settings?.showPrices !== undefined ? parsed.settings.showPrices : true,
          telegramUrl: parsed.settings?.telegramUrl !== undefined ? parsed.settings.telegramUrl : 'https://t.me/concept_studio',
          baleUrl: parsed.settings?.baleUrl !== undefined ? parsed.settings.baleUrl : '',
          coinSystem: {
            enabled: parsed.settings?.coinSystem?.enabled ?? DEFAULT_COIN_SYSTEM.enabled,
            coinName: parsed.settings?.coinSystem?.coinName || DEFAULT_COIN_SYSTEM.coinName,
            activeDesign: parsed.settings?.coinSystem?.activeDesign || DEFAULT_COIN_SYSTEM.activeDesign,
            unitPriceToman:
              typeof parsed.settings?.coinSystem?.unitPriceToman === 'number' && parsed.settings.coinSystem.unitPriceToman > 0
                ? parsed.settings.coinSystem.unitPriceToman
                : DEFAULT_COIN_SYSTEM.unitPriceToman,
            packages:
              Array.isArray(parsed.settings?.coinSystem?.packages) && parsed.settings.coinSystem.packages.length > 0
                ? parsed.settings.coinSystem.packages
                : DEFAULT_COIN_PACKAGES,
          },
          promoBanner: {
            enabled: parsed.settings?.promoBanner?.enabled ?? DEFAULT_PROMO_BANNER.enabled,
            text: parsed.settings?.promoBanner?.text ?? DEFAULT_PROMO_BANNER.text,
            badgeText: parsed.settings?.promoBanner?.badgeText ?? DEFAULT_PROMO_BANNER.badgeText,
            stickyOnScroll: parsed.settings?.promoBanner?.stickyOnScroll ?? DEFAULT_PROMO_BANNER.stickyOnScroll,
            linkText: parsed.settings?.promoBanner?.linkText ?? DEFAULT_PROMO_BANNER.linkText,
            linkUrl: parsed.settings?.promoBanner?.linkUrl ?? DEFAULT_PROMO_BANNER.linkUrl,
          },
          paymentGateway: {
            onlineEnabled: parsed.settings?.paymentGateway?.onlineEnabled ?? DEFAULT_PAYMENT_GATEWAY.onlineEnabled,
            activeProvider: parsed.settings?.paymentGateway?.activeProvider || DEFAULT_PAYMENT_GATEWAY.activeProvider,
            sandboxMode: parsed.settings?.paymentGateway?.sandboxMode ?? DEFAULT_PAYMENT_GATEWAY.sandboxMode,
            zarinpalMerchantId: parsed.settings?.paymentGateway?.zarinpalMerchantId ?? DEFAULT_PAYMENT_GATEWAY.zarinpalMerchantId,
            zibalMerchantId: parsed.settings?.paymentGateway?.zibalMerchantId ?? DEFAULT_PAYMENT_GATEWAY.zibalMerchantId,
            customPaymentUrl: parsed.settings?.paymentGateway?.customPaymentUrl ?? DEFAULT_PAYMENT_GATEWAY.customPaymentUrl,
            cardToCardEnabled: parsed.settings?.paymentGateway?.cardToCardEnabled ?? DEFAULT_PAYMENT_GATEWAY.cardToCardEnabled,
            cardNumber: parsed.settings?.paymentGateway?.cardNumber ?? DEFAULT_PAYMENT_GATEWAY.cardNumber,
            shebaNumber: parsed.settings?.paymentGateway?.shebaNumber ?? DEFAULT_PAYMENT_GATEWAY.shebaNumber,
            cardHolderName: parsed.settings?.paymentGateway?.cardHolderName ?? DEFAULT_PAYMENT_GATEWAY.cardHolderName,
            bankName: parsed.settings?.paymentGateway?.bankName ?? DEFAULT_PAYMENT_GATEWAY.bankName,
            paymentInstruction: parsed.settings?.paymentGateway?.paymentInstruction ?? DEFAULT_PAYMENT_GATEWAY.paymentInstruction,
          },
        };
        parsed.threads = parsed.threads || [];
        parsed.testimonials =
          Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
            ? parsed.testimonials
            : DEFAULT_TESTIMONIALS;
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        return parsed;
      } catch (err) {
        console.error('Error parsing db.json, reinitializing:', err);
      }
    }

    const { hash, salt } = hashPassword('admin123');
    const adminId = 'admin-root';
    const initialData: DatabaseSchema = {
      users: [
        {
          id: adminId,
          username: 'admin',
          passwordHash: hash,
          salt,
          fullName: 'مدیر ارشد استودیو',
          role: 'admin',
          coins: 100,
          coinSignature: this.computeCoinSignature(adminId, 100),
          createdAt: new Date().toISOString(),
        },
      ],
      services: studioServices.map((s) => ({ ...s, isActive: true, discountPercent: 0 })),
      orders: [
        {
          id: 'sample-order-1',
          trackingCode: '849201',
          serviceId: 'video-editing',
          serviceTitle: 'ساخت و ادیت ویدیوی سینمایی',
          customerName: 'محمدرضا کاظمی',
          customerContact: '09129876543',
          urgency: 'express',
          calculatedPrice: 9375000,
          description: 'تیزر معرفی محصول جدید برند پوشاک برای اینستاگرام',
          status: 'in_progress',
          adminNote: 'ادیت اولیه ۵۰٪ آماده شد و جهت بازبینی به تلگرام مشتری ارسال شد.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ],
      sessions: [],
      threads: [
        {
          id: 'thread_sample_1',
          customerName: 'محمدرضا کاظمی',
          customerContact: '09129876543',
          subject: 'هماهنگی تحویل ادیت ویدیوی سینمایی (کد: ۸۴۹۲۰۱)',
          orderId: 'sample-order-1',
          orderTitle: 'ساخت و ادیت ویدیوی سینمایی',
          status: 'open',
          unreadByAdmin: 0,
          unreadByUser: 1,
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          messages: [
            {
              id: 'msg_1',
              senderRole: 'admin',
              senderName: 'مدیر استودیو',
              text: 'سلام جناب کاظمی، نسخه اولیه تیزر شما تدوین شده و تایم‌لاین پروژه آماده بررسی است. لطفاً نظرتان را بفرمایید.',
              timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
              read: true,
            },
            {
              id: 'msg_2',
              senderRole: 'user',
              senderName: 'محمدرضا کاظمی',
              text: 'درود و خسته نباشید. تیزر فوق‌العاده شده! فقط در ثانیه ۱۵ افکت متن لوگو اگر یکم پرنورتر بشه عالیه.',
              timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
              read: true,
            },
            {
              id: 'msg_3',
              senderRole: 'admin',
              senderName: 'مدیر استودیو',
              text: 'حتماً، اصلاح نور لوگو اعمال شد و خروجی نهایی 4K با لینک مستقیم تا عصر برایتان ارسال خواهد شد.',
              timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
              read: false,
            },
          ],
        },
      ],
      coinTransactions: [],
      paymentSessions: [],
      testimonials: DEFAULT_TESTIMONIALS,
      settings: {
        showPrices: true,
        telegramUrl: 'https://t.me/concept_studio',
        baleUrl: '',
        coinSystem: DEFAULT_COIN_SYSTEM,
        promoBanner: DEFAULT_PROMO_BANNER,
        paymentGateway: DEFAULT_PAYMENT_GATEWAY,
      },
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to db.json:', err);
    }
  }

  // ۱. عملیات کاربران
  public getUserByUsername(username: string): UserRecord | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  }

  public getUserByPhone(phone: string): UserRecord | undefined {
    if (!phone) return undefined;
    const clean = phone.trim();
    return this.data.users.find((u) => u.phone && u.phone.trim() === clean);
  }

  public getUserByUsernameOrPhone(identifier: string): UserRecord | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.phone && u.phone.trim() === identifier.trim())
    );
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(user: Omit<UserRecord, 'id' | 'createdAt' | 'coins' | 'coinSignature'>): UserRecord {
    const id = 'usr_' + crypto.randomUUID().slice(0, 8);
    const initialCoins = 0;
    const newUser: UserRecord = {
      ...user,
      id,
      coins: initialCoins,
      coinSignature: this.computeCoinSignature(id, initialCoins),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public getAllUsers(): Omit<UserRecord, 'passwordHash' | 'salt' | 'coinSignature'>[] {
    return this.data.users.map((u) => {
      const verifiedCoins = this.getVerifiedUserCoins(u);
      const { passwordHash, salt, coinSignature, ...rest } = u;
      return {
        ...rest,
        coins: verifiedCoins,
        coinEnabled: Boolean(u.coinEnabled),
      };
    });
  }

  public setUserCoinAccess(
    userId: string,
    enabled: boolean
  ): {
    success: boolean;
    error?: string;
    user?: Omit<UserRecord, 'passwordHash' | 'salt' | 'coinSignature'>;
  } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: 'کاربر مورد نظر یافت نشد' };
    }
    user.coinEnabled = Boolean(enabled);
    this.save();
    const verifiedCoins = this.getVerifiedUserCoins(user);
    const { passwordHash, salt, coinSignature, ...rest } = user;
    return {
      success: true,
      user: {
        ...rest,
        coins: verifiedCoins,
        coinEnabled: Boolean(user.coinEnabled),
      },
    };
  }

  // عملیات امن کوین با امضای رمزنگاری HMAC-SHA256
  public adjustUserCoins(
    userId: string,
    delta: number,
    typeOrMeta:
      | CoinTransactionRecord['type']
      | {
          type: CoinTransactionRecord['type'];
          description: string;
          priceToman?: number;
        },
    noteArg?: string,
    priceTomanArg?: number
  ): {
    success: boolean;
    newBalance?: number;
    error?: string;
    tx?: CoinTransactionRecord;
    transaction?: CoinTransactionRecord;
  } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: 'کاربر یافت نشد' };
    }
    const cleanDelta = Math.trunc(Number(delta));
    if (!Number.isFinite(cleanDelta) || cleanDelta === 0) {
      return { success: false, error: 'مقدار کوین نامعتبر است' };
    }

    const currentCoins = this.getVerifiedUserCoins(user);
    const nextCoins = currentCoins + cleanDelta;
    if (nextCoins < 0) {
      return { success: false, error: 'موجودی کوین شما برای این عملیات کافی نیست' };
    }

    user.coins = nextCoins;
    user.coinSignature = this.computeCoinSignature(user.id, nextCoins);

    const txType: CoinTransactionRecord['type'] =
      typeof typeOrMeta === 'string' ? typeOrMeta : typeOrMeta.type;
    const txNote =
      typeof typeOrMeta === 'string'
        ? noteArg || 'تراکنش کوین'
        : typeOrMeta.description || 'تراکنش کوین';
    const txPrice =
      typeof typeOrMeta === 'string' ? priceTomanArg : typeOrMeta.priceToman;

    this.data.coinTransactions = this.data.coinTransactions || [];
    const tx: CoinTransactionRecord = {
      id: 'ctx_' + crypto.randomUUID().slice(0, 8),
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      type: txType,
      amount: cleanDelta,
      balanceAfter: nextCoins,
      priceToman: txPrice,
      description: txNote,
      note: txNote,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    this.data.coinTransactions.unshift(tx);
    this.save();
    return { success: true, newBalance: nextCoins, tx, transaction: tx };
  }

  public createCoinTopupRequest(params: {
    userId: string;
    coins?: number;
    coinAmount?: number;
    priceToman: number;
    note?: string;
    description?: string;
  }): CoinTransactionRecord | null {
    const user = this.getUserById(params.userId);
    if (!user) return null;
    this.data.coinTransactions = this.data.coinTransactions || [];
    const amountVal = Math.max(1, Math.floor(Number(params.coins ?? params.coinAmount ?? 1)));
    const textNote = params.note || params.description || `درخواست شارژ ${amountVal} کوین`;
    const tx: CoinTransactionRecord = {
      id: 'ctx_' + crypto.randomUUID().slice(0, 8),
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      type: 'topup_request',
      amount: amountVal,
      priceToman: Math.max(0, Math.floor(params.priceToman)),
      description: textNote,
      note: textNote,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.coinTransactions.unshift(tx);
    this.save();
    return tx;
  }

  public resolveCoinTopupRequest(
    txId: string,
    action: boolean | 'approve' | 'reject'
  ): {
    success: boolean;
    newBalance?: number;
    error?: string;
    tx?: CoinTransactionRecord;
    transaction?: CoinTransactionRecord;
  } {
    this.data.coinTransactions = this.data.coinTransactions || [];
    const tx = this.data.coinTransactions.find((t) => t.id === txId);
    if (!tx) return { success: false, error: 'درخواست یافت نشد' };
    if (tx.status !== 'pending') {
      return { success: false, error: 'این درخواست قبلاً تعیین وضعیت شده است' };
    }

    const isApprove = action === true || action === 'approve';
    if (!isApprove) {
      tx.status = 'rejected';
      this.save();
      return { success: true, tx, transaction: tx };
    }

    const user = this.getUserById(tx.userId);
    if (!user) return { success: false, error: 'کاربر مربوطه یافت نشد' };

    const currentCoins = this.getVerifiedUserCoins(user);
    const nextCoins = currentCoins + Math.max(1, Math.floor(tx.amount));
    user.coins = nextCoins;
    user.coinSignature = this.computeCoinSignature(user.id, nextCoins);
    tx.status = 'completed';
    tx.balanceAfter = nextCoins;
    this.save();
    return { success: true, newBalance: nextCoins, tx, transaction: tx };
  }

  public getCoinTransactions(userId?: string): CoinTransactionRecord[] {
    const list = this.data.coinTransactions || [];
    if (userId) {
      return list.filter((t) => t.userId === userId);
    }
    return list;
  }

  public updateUserCredentials(userId: string, updates: { newPassword?: string; newUsername?: string }): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    if (updates.newUsername && updates.newUsername.trim().length >= 3) {
      const cleanName = updates.newUsername.trim();
      const collision = this.data.users.find(
        (u) => u.id !== userId && u.username.toLowerCase() === cleanName.toLowerCase()
      );
      if (collision) return false;
      user.username = cleanName;
      // به‌روزرسانی نشست‌های فعال همین کاربر
      this.data.sessions.forEach((s) => {
        if (s.userId === userId) s.username = cleanName;
      });
    }
    if (updates.newPassword && updates.newPassword.length >= 5) {
      const { hash, salt } = hashPassword(updates.newPassword);
      user.passwordHash = hash;
      user.salt = salt;
    }
    this.save();
    return true;
  }

  // ۲. خدمات و قیمت‌ها
  public getServices(onlyActive = false): ServiceRecord[] {
    if (onlyActive) {
      return this.data.services.filter((s) => s.isActive !== false);
    }
    return this.data.services;
  }

  public updateServicePrice(id: string, newPrice: number): ServiceRecord | null {
    const service = this.data.services.find((s) => s.id === id);
    if (!service) return null;
    service.startingPrice = newPrice;
    this.save();
    return service;
  }

  public updateService(id: string, updates: Partial<ServiceRecord>): ServiceRecord | null {
    const service = this.data.services.find((s) => s.id === id);
    if (!service) return null;
    // فقط فیلدهای مجاز به‌روزرسانی شوند (جلوگیری از تزریق پراپرتی غیرمجاز)
    if (typeof updates.startingPrice === 'number' && updates.startingPrice >= 0) {
      service.startingPrice = updates.startingPrice;
    }
    if (typeof updates.discountPercent === 'number' && updates.discountPercent >= 0 && updates.discountPercent <= 95) {
      service.discountPercent = updates.discountPercent;
    }
    if (typeof updates.isActive === 'boolean') {
      service.isActive = updates.isActive;
    }
    if (typeof updates.featuredTag === 'string') {
      service.featuredTag = updates.featuredTag.trim().slice(0, 60);
    }
    this.save();
    return service;
  }

  public batchUpdatePrices(percentageChange: number): ServiceRecord[] {
    this.data.services.forEach((s) => {
      const delta = (s.startingPrice * percentageChange) / 100;
      s.startingPrice = Math.max(100000, Math.round((s.startingPrice + delta) / 100000) * 100000);
    });
    this.save();
    return this.data.services;
  }

  public getSettings(): SiteSettingsRecord {
    const cs = this.data.settings?.coinSystem;
    const pb = this.data.settings?.promoBanner;
    const pg = this.data.settings?.paymentGateway;
    const validProviders: PaymentGatewayProvider[] = ['zarinpal', 'zibal', 'custom_link'];
    return {
      showPrices: this.data.settings?.showPrices !== undefined ? this.data.settings.showPrices : true,
      telegramUrl:
        this.data.settings?.telegramUrl !== undefined
          ? this.data.settings.telegramUrl
          : 'https://t.me/concept_studio',
      baleUrl: this.data.settings?.baleUrl !== undefined ? this.data.settings.baleUrl : '',
      coinSystem: {
        enabled: typeof cs?.enabled === 'boolean' ? cs.enabled : DEFAULT_COIN_SYSTEM.enabled,
        coinName: cs?.coinName || DEFAULT_COIN_SYSTEM.coinName,
        coinSymbol: cs?.coinSymbol || DEFAULT_COIN_SYSTEM.coinSymbol || 'CSC',
        activeDesign: cs?.activeDesign || DEFAULT_COIN_SYSTEM.activeDesign,
        unitPriceToman:
          typeof cs?.unitPriceToman === 'number' && cs.unitPriceToman > 0
            ? cs.unitPriceToman
            : DEFAULT_COIN_SYSTEM.unitPriceToman,
        packages:
          Array.isArray(cs?.packages) && cs.packages.length > 0
            ? cs.packages.map((p) => ({
                ...p,
                coins: Math.max(1, Number(p.coins ?? p.coinAmount ?? 1)),
                coinAmount: Math.max(1, Number(p.coins ?? p.coinAmount ?? 1)),
                isActive: p.isActive !== false,
              }))
            : DEFAULT_COIN_PACKAGES,
      },
      promoBanner: {
        enabled: typeof pb?.enabled === 'boolean' ? pb.enabled : DEFAULT_PROMO_BANNER.enabled,
        text: typeof pb?.text === 'string' ? pb.text : DEFAULT_PROMO_BANNER.text,
        badgeText: typeof pb?.badgeText === 'string' ? pb.badgeText : DEFAULT_PROMO_BANNER.badgeText,
        stickyOnScroll:
          typeof pb?.stickyOnScroll === 'boolean' ? pb.stickyOnScroll : DEFAULT_PROMO_BANNER.stickyOnScroll,
        linkText: typeof pb?.linkText === 'string' ? pb.linkText : DEFAULT_PROMO_BANNER.linkText,
        linkUrl: typeof pb?.linkUrl === 'string' ? pb.linkUrl : DEFAULT_PROMO_BANNER.linkUrl,
        linkHash: typeof pb?.linkHash === 'string' ? pb.linkHash : DEFAULT_PROMO_BANNER.linkHash,
      },
      paymentGateway: {
        onlineEnabled:
          typeof pg?.onlineEnabled === 'boolean' ? pg.onlineEnabled : DEFAULT_PAYMENT_GATEWAY.onlineEnabled,
        activeProvider:
          pg?.activeProvider && validProviders.includes(pg.activeProvider)
            ? pg.activeProvider
            : DEFAULT_PAYMENT_GATEWAY.activeProvider,
        sandboxMode:
          typeof pg?.sandboxMode === 'boolean' ? pg.sandboxMode : DEFAULT_PAYMENT_GATEWAY.sandboxMode,
        zarinpalMerchantId:
          typeof pg?.zarinpalMerchantId === 'string'
            ? pg.zarinpalMerchantId.trim()
            : DEFAULT_PAYMENT_GATEWAY.zarinpalMerchantId,
        zibalMerchantId:
          typeof pg?.zibalMerchantId === 'string'
            ? pg.zibalMerchantId.trim()
            : DEFAULT_PAYMENT_GATEWAY.zibalMerchantId,
        customPaymentUrl:
          typeof pg?.customPaymentUrl === 'string'
            ? pg.customPaymentUrl.trim()
            : DEFAULT_PAYMENT_GATEWAY.customPaymentUrl,
        cardToCardEnabled:
          typeof pg?.cardToCardEnabled === 'boolean'
            ? pg.cardToCardEnabled
            : DEFAULT_PAYMENT_GATEWAY.cardToCardEnabled,
        cardNumber:
          typeof pg?.cardNumber === 'string' ? pg.cardNumber.trim() : DEFAULT_PAYMENT_GATEWAY.cardNumber,
        shebaNumber:
          typeof pg?.shebaNumber === 'string' ? pg.shebaNumber.trim() : DEFAULT_PAYMENT_GATEWAY.shebaNumber,
        cardHolderName:
          typeof pg?.cardHolderName === 'string'
            ? pg.cardHolderName.trim()
            : DEFAULT_PAYMENT_GATEWAY.cardHolderName,
        bankName:
          typeof pg?.bankName === 'string' ? pg.bankName.trim() : DEFAULT_PAYMENT_GATEWAY.bankName,
        paymentInstruction:
          typeof pg?.paymentInstruction === 'string'
            ? pg.paymentInstruction.trim()
            : DEFAULT_PAYMENT_GATEWAY.paymentInstruction,
      },
    };
  }

  public updateSettings(updates: Partial<SiteSettingsRecord>): SiteSettingsRecord {
    const current = this.getSettings();
    const validDesigns: CoinDesignId[] = ['royal_crest', 'cyber_hex', 'solar_nova', 'imperial_shield'];
    const validProviders: PaymentGatewayProvider[] = ['zarinpal', 'zibal', 'custom_link'];

    let nextCoinSystem = current.coinSystem;
    if (updates.coinSystem) {
      const inc = updates.coinSystem;
      nextCoinSystem = {
        enabled: typeof inc.enabled === 'boolean' ? inc.enabled : current.coinSystem.enabled,
        coinName:
          typeof inc.coinName === 'string' && inc.coinName.trim()
            ? inc.coinName.trim().slice(0, 40)
            : current.coinSystem.coinName,
        coinSymbol:
          typeof inc.coinSymbol === 'string' && inc.coinSymbol.trim()
            ? inc.coinSymbol.trim().toUpperCase().slice(0, 10)
            : current.coinSystem.coinSymbol || 'CSC',
        activeDesign:
          inc.activeDesign && validDesigns.includes(inc.activeDesign)
            ? inc.activeDesign
            : current.coinSystem.activeDesign,
        unitPriceToman:
          typeof inc.unitPriceToman === 'number' && inc.unitPriceToman >= 1000
            ? Math.round(inc.unitPriceToman)
            : current.coinSystem.unitPriceToman,
        packages: Array.isArray(inc.packages)
          ? inc.packages
              .filter((p) => p && Number(p.coins ?? p.coinAmount) >= 1 && Number(p.priceToman) >= 0)
              .slice(0, 12)
              .map((p, idx) => {
                const count = Math.max(1, Math.round(Number(p.coins ?? p.coinAmount ?? 1)));
                return {
                  id: String(p.id || `pkg_${idx + 1}`).slice(0, 40),
                  coins: count,
                  coinAmount: count,
                  priceToman: Math.max(0, Math.round(Number(p.priceToman))),
                  title: String(p.title || `بسته ${count} کوین`).slice(0, 60),
                  subtitle: p.subtitle ? String(p.subtitle).slice(0, 100) : undefined,
                  badge: p.badge ? String(p.badge).slice(0, 50) : undefined,
                  designId: validDesigns.includes(p.designId) ? p.designId : 'royal_crest',
                  popular: Boolean(p.popular),
                  isActive: p.isActive !== false,
                };
              })
          : current.coinSystem.packages,
      };
    }

    let nextPromoBanner = current.promoBanner;
    if (updates.promoBanner) {
      const pb = updates.promoBanner;
      nextPromoBanner = {
        enabled: typeof pb.enabled === 'boolean' ? pb.enabled : current.promoBanner.enabled,
        text: typeof pb.text === 'string' ? pb.text.trim().slice(0, 260) : current.promoBanner.text,
        badgeText:
          typeof pb.badgeText === 'string' ? pb.badgeText.trim().slice(0, 40) : current.promoBanner.badgeText,
        stickyOnScroll:
          typeof pb.stickyOnScroll === 'boolean' ? pb.stickyOnScroll : current.promoBanner.stickyOnScroll,
        linkText:
          typeof pb.linkText === 'string' ? pb.linkText.trim().slice(0, 40) : current.promoBanner.linkText,
        linkUrl:
          typeof pb.linkUrl === 'string' ? pb.linkUrl.trim().slice(0, 200) : current.promoBanner.linkUrl,
        linkHash:
          typeof pb.linkHash === 'string' ? pb.linkHash.trim().slice(0, 100) : current.promoBanner.linkHash,
      };
    }

    let nextPaymentGateway = current.paymentGateway;
    if (updates.paymentGateway) {
      const pg = updates.paymentGateway;
      nextPaymentGateway = {
        onlineEnabled:
          typeof pg.onlineEnabled === 'boolean' ? pg.onlineEnabled : current.paymentGateway.onlineEnabled,
        activeProvider:
          pg.activeProvider && validProviders.includes(pg.activeProvider)
            ? pg.activeProvider
            : current.paymentGateway.activeProvider,
        sandboxMode:
          typeof pg.sandboxMode === 'boolean' ? pg.sandboxMode : current.paymentGateway.sandboxMode,
        zarinpalMerchantId:
          typeof pg.zarinpalMerchantId === 'string'
            ? pg.zarinpalMerchantId.trim().slice(0, 80)
            : current.paymentGateway.zarinpalMerchantId,
        zibalMerchantId:
          typeof pg.zibalMerchantId === 'string'
            ? pg.zibalMerchantId.trim().slice(0, 80)
            : current.paymentGateway.zibalMerchantId,
        customPaymentUrl:
          typeof pg.customPaymentUrl === 'string'
            ? pg.customPaymentUrl.trim().slice(0, 250)
            : current.paymentGateway.customPaymentUrl,
        cardToCardEnabled:
          typeof pg.cardToCardEnabled === 'boolean'
            ? pg.cardToCardEnabled
            : current.paymentGateway.cardToCardEnabled,
        cardNumber:
          typeof pg.cardNumber === 'string'
            ? pg.cardNumber.trim().slice(0, 30)
            : current.paymentGateway.cardNumber,
        shebaNumber:
          typeof pg.shebaNumber === 'string'
            ? pg.shebaNumber.trim().toUpperCase().slice(0, 36)
            : current.paymentGateway.shebaNumber,
        cardHolderName:
          typeof pg.cardHolderName === 'string'
            ? pg.cardHolderName.trim().slice(0, 80)
            : current.paymentGateway.cardHolderName,
        bankName:
          typeof pg.bankName === 'string'
            ? pg.bankName.trim().slice(0, 60)
            : current.paymentGateway.bankName,
        paymentInstruction:
          typeof pg.paymentInstruction === 'string'
            ? pg.paymentInstruction.trim().slice(0, 300)
            : current.paymentGateway.paymentInstruction,
      };
    }

    this.data.settings = {
      showPrices: typeof updates.showPrices === 'boolean' ? updates.showPrices : current.showPrices,
      telegramUrl:
        typeof updates.telegramUrl === 'string' ? updates.telegramUrl.trim() : current.telegramUrl,
      baleUrl: typeof updates.baleUrl === 'string' ? updates.baleUrl.trim() : current.baleUrl,
      coinSystem: nextCoinSystem,
      promoBanner: nextPromoBanner,
      paymentGateway: nextPaymentGateway,
    };
    this.save();
    return this.getSettings();
  }

  // مدیریت نشست‌های درگاه پرداخت آنلاین (ضد تکرار و ضد دستکاری)
  public createPaymentSession(params: {
    userId: string;
    coins: number;
    priceToman: number;
    provider: PaymentSessionRecord['provider'];
    authority?: string;
  }): PaymentSessionRecord | null {
    const user = this.getUserById(params.userId);
    if (!user) return null;
    this.data.paymentSessions = this.data.paymentSessions || [];
    const session: PaymentSessionRecord = {
      id: 'pay_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14),
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      coins: Math.max(1, Math.floor(params.coins)),
      priceToman: Math.max(1000, Math.floor(params.priceToman)),
      provider: params.provider,
      authority: params.authority,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.paymentSessions.unshift(session);
    this.save();
    return session;
  }

  public getPaymentSession(idOrAuthority: string): PaymentSessionRecord | undefined {
    this.data.paymentSessions = this.data.paymentSessions || [];
    return this.data.paymentSessions.find(
      (s) => s.id === idOrAuthority || (s.authority && s.authority === idOrAuthority)
    );
  }

  public updatePaymentSessionAuthority(sessionId: string, authority: string): void {
    const s = this.getPaymentSession(sessionId);
    if (s) {
      s.authority = authority;
      this.save();
    }
  }

  public completePaymentSession(
    sessionId: string,
    refId: string
  ): { success: boolean; session?: PaymentSessionRecord; newBalance?: number; error?: string } {
    const session = this.getPaymentSession(sessionId);
    if (!session) return { success: false, error: 'نشست پرداخت یافت نشد' };
    if (session.status === 'verified') {
      const user = this.getUserById(session.userId);
      return {
        success: true,
        session,
        newBalance: user ? this.getVerifiedUserCoins(user) : undefined,
      };
    }
    if (session.status === 'failed') {
      return { success: false, error: 'این تراکنش قبلاً ناموفق ثبت شده است' };
    }

    const res = this.adjustUserCoins(
      session.userId,
      session.coins,
      {
        type: 'purchase_topup',
        description: `خرید آنلاین ${session.coins} کوین از درگاه (${refId})`,
        priceToman: session.priceToman,
      }
    );

    if (!res.success) {
      return { success: false, error: res.error || 'خطا در شارژ کوین' };
    }

    session.status = 'verified';
    session.refId = refId;
    session.verifiedAt = new Date().toISOString();
    this.save();
    return { success: true, session, newBalance: res.newBalance };
  }

  public failPaymentSession(sessionId: string): void {
    const session = this.getPaymentSession(sessionId);
    if (session && session.status === 'pending') {
      session.status = 'failed';
      this.save();
    }
  }

  // پشتیبان‌گیری و بازیابی کامل دیتابیس (مخصوص هاست‌های رایگان و جابه‌جایی سرور)
  public exportFullBackup(): {
    exportedAt: string;
    version: string;
    data: DatabaseSchema;
  } {
    return {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      data: {
        ...this.data,
        testimonials: this.data.testimonials || DEFAULT_TESTIMONIALS,
        // نشست‌های موقت را در بکاپ سبک‌تر نگه می‌داریم
        sessions: [],
      },
    };
  }

  public importFullBackup(backupData: any): { success: boolean; error?: string; stats?: any } {
    try {
      const payload: DatabaseSchema = backupData?.data ? backupData.data : backupData;
      if (!payload || !Array.isArray(payload.users) || !Array.isArray(payload.services)) {
        return { success: false, error: 'ساختار فایل بکاپ معتبر نیست' };
      }

      // اطمینان از حفظ حداقل یک حساب ادمین
      if (!payload.users.some((u) => u.role === 'admin')) {
        const currentAdmins = this.data.users.filter((u) => u.role === 'admin');
        payload.users.unshift(...currentAdmins);
      }

      // بازتولید امضای رمزنگاری HMAC برای موجودی کوین کاربران در سرور جدید
      payload.users.forEach((u) => {
        const cleanCoins = Math.max(0, Math.floor(Number(u.coins) || 0));
        u.coins = cleanCoins;
        u.coinSignature = this.computeCoinSignature(u.id, cleanCoins);
      });

      this.data = {
        users: payload.users,
        services: payload.services,
        orders: Array.isArray(payload.orders) ? payload.orders : [],
        sessions: this.data.sessions || [], // حفظ نشست فعلی ادمین تا از پنل خارج نشود
        threads: Array.isArray(payload.threads) ? payload.threads : [],
        coinTransactions: Array.isArray(payload.coinTransactions) ? payload.coinTransactions : [],
        paymentSessions: Array.isArray(payload.paymentSessions) ? payload.paymentSessions : [],
        testimonials: Array.isArray(payload.testimonials)
          ? payload.testimonials
          : this.data.testimonials || DEFAULT_TESTIMONIALS,
        settings: payload.settings || this.getSettings(),
      };
      this.save();
      return {
        success: true,
        stats: {
          users: this.data.users.length,
          orders: this.data.orders.length,
          threads: this.data.threads.length,
          testimonials: (this.data.testimonials || []).length,
        },
      };
    } catch (err) {
      console.error('Backup restore error:', err);
      return { success: false, error: 'خطا در پردازش فایل بکاپ' };
    }
  }

  // ۳. سفارشات
  public getOrders(statusFilter?: string): OrderRecord[] {
    let list = this.data.orders;
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): OrderRecord | undefined {
    return this.data.orders.find((o) => o.id === id || o.trackingCode === id);
  }

  public createOrder(order: Omit<OrderRecord, 'id' | 'createdAt'>): OrderRecord {
    const newOrder: OrderRecord = {
      ...order,
      id: 'ord_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public updateOrderStatus(id: string, status: OrderRecord['status']): OrderRecord | null {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    if (status === 'completed' && !order.completedAt) {
      order.completedAt = new Date().toISOString();
    }
    this.save();
    return order;
  }

  public updateOrderAdminNote(id: string, adminNote: string, deliveryLink?: string): OrderRecord | null {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) return null;
    order.adminNote = adminNote;
    if (deliveryLink !== undefined) {
      order.deliveryLink = deliveryLink;
    }
    this.save();
    return order;
  }

  public deleteOrder(id: string): boolean {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      this.data.orders.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // ۴. نشست‌ها (Sessions) با اعتبارسنجی انقضا
  public createSession(user: UserRecord): SessionRecord {
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: SessionRecord = {
      token,
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public getSession(token: string): SessionRecord | undefined {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    // تمدید خودکار مهلت نشست فعال برای ماندگاری دائمی ورود
    session.expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    return session;
  }

  public deleteSession(token: string): boolean {
    const idx = this.data.sessions.findIndex((s) => s.token === token);
    if (idx !== -1) {
      this.data.sessions.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // ۵. گفت‌وگوها و پیام‌های پشتیبانی (با پشتیبانی از تصویر و ویدیو)
  public getThreads(options?: { userId?: string; orderId?: string }): ChatThreadRecord[] {
    let list = this.data.threads || [];
    if (options?.userId) {
      list = list.filter((t) => t.userId === options.userId);
    }
    if (options?.orderId) {
      list = list.filter((t) => t.orderId === options.orderId);
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getThreadsForUser(userId: string, phone?: string): ChatThreadRecord[] {
    const cleanPhone = phone ? phone.trim().toLowerCase() : '';
    return (this.data.threads || [])
      .filter((t) => {
        if (t.userId && t.userId === userId) return true;
        if (cleanPhone && t.customerContact && t.customerContact.trim().toLowerCase() === cleanPhone) return true;
        return false;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getThreadsByContact(contact: string): ChatThreadRecord[] {
    const clean = contact.trim().toLowerCase();
    return (this.data.threads || [])
      .filter((t) => t.customerContact && t.customerContact.trim().toLowerCase() === clean)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getOrdersForUser(userId: string, phone?: string): OrderRecord[] {
    const cleanPhone = phone ? phone.trim().toLowerCase() : '';
    return this.getOrders().filter((o) => {
      if (o.userId && o.userId === userId) return true;
      if (cleanPhone && o.customerContact && o.customerContact.trim().toLowerCase() === cleanPhone) return true;
      return false;
    });
  }

  public getThreadById(id: string): ChatThreadRecord | undefined {
    return (this.data.threads || []).find((t) => t.id === id);
  }

  public createThread(params: {
    userId?: string;
    customerName: string;
    customerContact: string;
    subject: string;
    orderId?: string;
    orderTitle?: string;
    initialMessage: string;
    attachments?: ChatAttachmentRecord[];
    senderRole: 'admin' | 'user';
    senderName: string;
  }): ChatThreadRecord {
    this.data.threads = this.data.threads || [];
    const now = new Date().toISOString();
    const threadId = 'thr_' + crypto.randomUUID().slice(0, 8);
    const firstMsg: ChatMessageRecord = {
      id: 'msg_' + crypto.randomUUID().slice(0, 8),
      senderRole: params.senderRole,
      senderName: params.senderName,
      text: params.initialMessage.trim(),
      attachments: params.attachments && params.attachments.length > 0 ? params.attachments : undefined,
      timestamp: now,
      read: false,
    };

    const newThread: ChatThreadRecord = {
      id: threadId,
      userId: params.userId,
      customerName: params.customerName.trim(),
      customerContact: params.customerContact.trim(),
      subject: params.subject.trim(),
      orderId: params.orderId,
      orderTitle: params.orderTitle,
      status: 'open',
      unreadByAdmin: params.senderRole === 'user' ? 1 : 0,
      unreadByUser: params.senderRole === 'admin' ? 1 : 0,
      createdAt: now,
      updatedAt: now,
      messages: [firstMsg],
    };

    this.data.threads.unshift(newThread);
    this.save();
    return newThread;
  }

  public addMessageToThread(
    threadId: string,
    message: {
      senderRole: 'admin' | 'user';
      senderName: string;
      text: string;
      attachments?: ChatAttachmentRecord[];
    }
  ): ChatThreadRecord | null {
    const thread = this.getThreadById(threadId);
    if (!thread) return null;

    const now = new Date().toISOString();
    const newMsg: ChatMessageRecord = {
      id: 'msg_' + crypto.randomUUID().slice(0, 8),
      senderRole: message.senderRole,
      senderName: message.senderName,
      text: message.text.trim(),
      attachments: message.attachments && message.attachments.length > 0 ? message.attachments : undefined,
      timestamp: now,
      read: false,
    };

    thread.messages.push(newMsg);
    thread.updatedAt = now;
    if (message.senderRole === 'user') {
      thread.unreadByAdmin = (thread.unreadByAdmin || 0) + 1;
    } else {
      thread.unreadByUser = (thread.unreadByUser || 0) + 1;
    }

    this.save();
    return thread;
  }

  public markThreadRead(threadId: string, readerRole: 'admin' | 'user'): boolean {
    const thread = this.getThreadById(threadId);
    if (!thread) return false;

    if (readerRole === 'admin') {
      thread.unreadByAdmin = 0;
      thread.messages.forEach((m) => {
        if (m.senderRole === 'user') m.read = true;
      });
    } else {
      thread.unreadByUser = 0;
      thread.messages.forEach((m) => {
        if (m.senderRole === 'admin') m.read = true;
      });
    }

    this.save();
    return true;
  }

  public updateThreadStatus(threadId: string, status: 'open' | 'closed'): ChatThreadRecord | null {
    const thread = this.getThreadById(threadId);
    if (!thread) return null;
    thread.status = status;
    this.save();
    return thread;
  }

  public deleteThread(threadId: string): boolean {
    const idx = (this.data.threads || []).findIndex((t) => t.id === threadId);
    if (idx !== -1) {
      this.data.threads.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // ۶. پروژه‌ها و تجربیات ثبت‌شده کارفرمایان (Portfolio Showcase & Testimonials)
  public getTestimonials(filter?: 'all' | 'approved' | 'pending' | 'rejected'): TestimonialRecord[] {
    let list = this.data.testimonials || [];
    if (!list.length) {
      this.data.testimonials = [...DEFAULT_TESTIMONIALS];
      this.save();
      list = this.data.testimonials;
    }
    if (filter && filter !== 'all') {
      return list.filter((t) => t.status === filter);
    }
    return list;
  }

  public getTestimonialById(id: string): TestimonialRecord | undefined {
    return (this.data.testimonials || []).find((t) => t.id === id);
  }

  public addTestimonial(item: Omit<TestimonialRecord, 'id' | 'createdAt'>): TestimonialRecord {
    this.data.testimonials = this.data.testimonials || [];
    const newRecord: TestimonialRecord = {
      ...item,
      id: 'testi_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    this.data.testimonials.unshift(newRecord);
    this.save();
    return newRecord;
  }

  public updateTestimonialStatus(id: string, status: 'pending' | 'approved' | 'rejected'): TestimonialRecord | null {
    const item = this.getTestimonialById(id);
    if (!item) return null;
    item.status = status;
    this.save();
    return item;
  }

  public deleteTestimonial(id: string): boolean {
    this.data.testimonials = this.data.testimonials || [];
    const idx = this.data.testimonials.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.testimonials.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }
}

export const storage = new Storage();
