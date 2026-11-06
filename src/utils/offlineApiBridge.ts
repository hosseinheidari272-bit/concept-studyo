import { studioServices } from '../data/services';
import {
  ServiceItem,
  OrderItem,
  UserItem,
  CoinTransaction,
  ChatThread,
  ChatMessage,
  CoinSystemSettings,
  PromoBannerSettings,
  PaymentGatewaySettings,
  TestimonialItem,
} from '../types';
import { validateIranianMobileDetailed, normalizeIranianPhone } from './phoneUtils';

const STORAGE_KEY = 'concept_studio_local_db_v1';

export interface LocalDatabaseSchema {
  services: ServiceItem[];
  orders: OrderItem[];
  users: Array<UserItem & { passwordHash: string }>;
  coinTransactions: CoinTransaction[];
  chatThreads: ChatThread[];
  testimonials: TestimonialItem[];
  settings: {
    showPrices: boolean;
    telegramUrl: string;
    baleUrl: string;
    coinSystem: CoinSystemSettings;
    promoBanner: PromoBannerSettings;
    paymentGateway: PaymentGatewaySettings;
  };
}

const DEFAULT_COIN_SYSTEM: CoinSystemSettings = {
  enabled: false,
  coinName: 'کوین استودیو',
  coinSymbol: 'CSC',
  activeDesign: 'royal_crest',
  unitPriceToman: 500000,
  packages: [
    {
      id: 'pkg_1',
      title: 'تک‌کوین پایه استودیو',
      coins: 1,
      priceToman: 500000,
      designId: 'royal_crest',
      badge: 'نرخ پایه ۱ کوین',
      isActive: true,
    },
    {
      id: 'pkg_2',
      title: 'بسته نقره‌ای سایبر (۵ کوین)',
      coins: 5,
      priceToman: 2350000,
      designId: 'cyber_hex',
      badge: 'طرح آماده ۱ — اقتصادی',
      isActive: true,
    },
    {
      id: 'pkg_3',
      title: 'بسته طلایی سولار (۱۰ کوین)',
      coins: 10,
      priceToman: 4500000,
      designId: 'solar_nova',
      badge: 'طرح آماده ۲ — محبوب‌ترین',
      isActive: true,
    },
    {
      id: 'pkg_4',
      title: 'بسته امپریال VIP (۲۵ کوین)',
      coins: 25,
      priceToman: 10500000,
      designId: 'imperial_shield',
      badge: 'طرح آماده ۳ — سازمانی',
      isActive: true,
    },
  ],
};

const DEFAULT_PROMO_BANNER: PromoBannerSettings = {
  enabled: false,
  text: 'حراج ویژه فصل: تا ۲۰٪ تخفیف روی پکیج‌های طراحی هویت بصری و پلتفرم‌های دیجیتال نسل بعدی!',
  badgeText: 'پیشنهاد ویژه',
  stickyOnScroll: true,
  linkHash: '#services',
};

const DEFAULT_PAYMENT_GATEWAY: PaymentGatewaySettings = {
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
  paymentInstruction:
    'پس از واریز وجه، ۴ رقم آخر کارت یا کد پیگیری رسید را در کادر زیر وارد کنید تا کوین بلافاصله به حساب شما اضافه شود.',
};

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    name: 'مهندس آرش کاظمی',
    role: 'مدیرعامل',
    company: 'هلدینگ ساختمانی آتیه‌سازان',
    service: 'رندرینگ سه‌بعدی معماری و تیزر پرزنتیشن',
    category: '3d',
    rating: 5,
    outcome: 'افزایش ۳ برابری پیش‌فروش واحدهای لوکس در ماه اول کمپین',
    quote:
      'کیفیت نورپردازی و جزئیات متریال‌ها در رندرهای سه‌بعدی کانسپت استودیو در سطحی بود که سرمایه‌گذاران ما تصور می‌کردند فیلم‌برداری واقعی از پروژه تکمیل‌شده است. تحویل دقیقاً طبق زمان‌بندی انجام شد.',
    verifiedCode: 'STD-894120',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 't2',
    name: 'دکتر سارا احمدی',
    role: 'موسس و مدیر برند',
    company: 'کلینیک تخصصی زیبایی اورانوس',
    service: 'طراحی وب‌سایت اختصاصی و هویت بصری',
    category: 'web',
    rating: 5,
    outcome: 'رشد ۲۱۰٪ رزرو نوبت آنلاین و سرعت لود زیر ۱ ثانیه',
    quote:
      'قبل از همکاری با استودیو کانسپت، سایت قبلی ما کند بود و هیچ حسی از یک برند لوکس منتقل نمی‌کرد. طراحی جدید نه‌تنها از نظر بصری خیره‌کننده است، بلکه فرآیند نوبت‌دهی و جذب مراجعین را کاملاً خودکار کرده است.',
    verifiedCode: 'STD-753914',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: 't3',
    name: 'امیرحسین رضایی',
    role: 'مدیر مارکتینگ',
    company: 'برند ساعت و جواهرات رویال کرون',
    service: 'تیزر تبلیغاتی سینمایی و موشن گرافیک VFX',
    category: '3d',
    rating: 5,
    outcome: 'بیش از ۱.۴ میلیون بازدید ارگانیک و نرخ تعامل بی‌سابقه در اینستاگرام',
    quote:
      'جلوه‌های ویژه بصری و صداگذاری سینمایی که تیم کانسپت روی تیزر محصول جدیدمان پیاده کرد، دقیقاً همان حس قدرت و پرستیژی بود که سال‌ها به دنبالش بودیم. قطعاً در تمام کمپین‌های بعدی کنارشان خواهیم بود.',
    verifiedCode: 'STD-612048',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

function simpleHash(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'h_' + (h >>> 0).toString(16);
}

export function createInitialLocalDb(): LocalDatabaseSchema {
  return {
    services: JSON.parse(JSON.stringify(studioServices)),
    orders: [],
    users: [
      {
        id: 'admin-1',
        username: 'admin',
        fullName: 'مدیر ارشد استودیو',
        phone: '09120000000',
        role: 'admin',
        coins: 500,
        coinEnabled: true,
        passwordHash: simpleHash('admin123'),
        createdAt: new Date().toISOString(),
      },
    ],
    coinTransactions: [],
    chatThreads: [],
    testimonials: JSON.parse(JSON.stringify(DEFAULT_TESTIMONIALS)),
    settings: {
      showPrices: true,
      telegramUrl: 'https://t.me/concept_studio',
      baleUrl: '',
      coinSystem: JSON.parse(JSON.stringify(DEFAULT_COIN_SYSTEM)),
      promoBanner: JSON.parse(JSON.stringify(DEFAULT_PROMO_BANNER)),
      paymentGateway: JSON.parse(JSON.stringify(DEFAULT_PAYMENT_GATEWAY)),
    },
  };
}

export function loadLocalDb(storage?: Storage): LocalDatabaseSchema {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return createInitialLocalDb();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialLocalDb();
      store.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<LocalDatabaseSchema>;
    const fallback = createInitialLocalDb();
    return {
      services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : fallback.services,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : fallback.users,
      coinTransactions: Array.isArray(parsed.coinTransactions) ? parsed.coinTransactions : [],
      chatThreads: Array.isArray(parsed.chatThreads) ? parsed.chatThreads : [],
      testimonials:
        Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
          ? parsed.testimonials
          : fallback.testimonials,
      settings: {
        ...fallback.settings,
        ...(parsed.settings || {}),
        coinSystem: {
          ...fallback.settings.coinSystem,
          ...(parsed.settings?.coinSystem || {}),
        },
        promoBanner: {
          ...fallback.settings.promoBanner,
          ...(parsed.settings?.promoBanner || {}),
        },
        paymentGateway: {
          ...fallback.settings.paymentGateway,
          ...(parsed.settings?.paymentGateway || {}),
        },
      },
    };
  } catch {
    return createInitialLocalDb();
  }
}

export function saveLocalDb(db: LocalDatabaseSchema, storage?: Storage): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore quota errors
  }
}

function sanitizeUser(u: UserItem & { passwordHash?: string }): UserItem {
  const { passwordHash: _omitted, ...rest } = u;
  return rest;
}

function getUserByToken(db: LocalDatabaseSchema, authHeader?: string | null): (UserItem & { passwordHash: string }) | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token.startsWith('local_tok_')) return null;
  const userId = token.replace('local_tok_', '');
  return db.users.find((u) => u.id === userId) || null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Offline-Bridge': 'true',
    },
  });
}

export async function handleLocalApiRequest(
  urlStr: string,
  init?: RequestInit,
  storage?: Storage
): Promise<Response> {
  const db = loadLocalDb(storage);
  const method = (init?.method || 'GET').toUpperCase();
  const parsedUrl = new URL(urlStr, 'http://localhost');
  const pathname = parsedUrl.pathname.replace(/^.*\/api\//, '/api/');

  let headersObj: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => {
        headersObj[k.toLowerCase()] = v;
      });
    } else if (Array.isArray(init.headers)) {
      for (const [k, v] of init.headers) {
        headersObj[k.toLowerCase()] = v;
      }
    } else {
      for (const [k, v] of Object.entries(init.headers)) {
        headersObj[k.toLowerCase()] = String(v);
      }
    }
  }

  let bodyData: any = {};
  if (init?.body && typeof init.body === 'string') {
    try {
      bodyData = JSON.parse(init.body);
    } catch {
      bodyData = {};
    }
  }

  const currentUser = getUserByToken(db, headersObj['authorization']);

  // 1. GET /api/services
  if (pathname === '/api/services' && method === 'GET') {
    return jsonResponse({
      services: db.services,
      showPrices: db.settings.showPrices,
      telegramUrl: db.settings.telegramUrl,
      baleUrl: db.settings.baleUrl,
      coinSystem: db.settings.coinSystem,
      promoBanner: db.settings.promoBanner,
      settings: db.settings,
    });
  }

  // 2. PUT /api/services/:id
  const serviceMatch = pathname.match(/^\/api\/services\/([^/]+)$/);
  if (serviceMatch && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const srvId = serviceMatch[1];
    const idx = db.services.findIndex((s) => s.id === srvId);
    if (idx === -1) return jsonResponse({ error: 'خدمت یافت نشد' }, 404);
    db.services[idx] = { ...db.services[idx], ...bodyData };
    saveLocalDb(db, storage);
    return jsonResponse({ service: db.services[idx], services: db.services });
  }

  // 3. POST /api/services/batch-price
  if (pathname === '/api/services/batch-price' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const percent = Number(bodyData.percentChange || 0);
    if (!Number.isNaN(percent) && percent !== 0) {
      const factor = 1 + percent / 100;
      db.services = db.services.map((s) => {
        const currentPrice = s.startingPrice || s.basePriceToman || 1000000;
        const newPrice = Math.max(50000, Math.round((currentPrice * factor) / 10000) * 10000);
        return {
          ...s,
          startingPrice: newPrice,
          basePriceToman: newPrice,
        };
      });
      saveLocalDb(db, storage);
    }
    return jsonResponse({ services: db.services });
  }

  // 4. GET & PUT /api/settings
  if (pathname === '/api/settings' && method === 'GET') {
    return jsonResponse({ settings: db.settings });
  }
  if (pathname === '/api/settings' && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    db.settings = {
      ...db.settings,
      ...bodyData,
      coinSystem: bodyData.coinSystem ? { ...db.settings.coinSystem, ...bodyData.coinSystem } : db.settings.coinSystem,
      promoBanner: bodyData.promoBanner
        ? { ...db.settings.promoBanner, ...bodyData.promoBanner }
        : db.settings.promoBanner,
      paymentGateway: bodyData.paymentGateway
        ? { ...db.settings.paymentGateway, ...bodyData.paymentGateway }
        : db.settings.paymentGateway,
    };
    saveLocalDb(db, storage);
    return jsonResponse({ settings: db.settings });
  }

  // 5. Auth Routes
  if (pathname === '/api/auth/login' && method === 'POST') {
    const username = String(bodyData.username || '').trim().toLowerCase();
    const password = String(bodyData.password || '');
    const found = db.users.find((u) => u.username.toLowerCase() === username);
    if (!found || found.passwordHash !== simpleHash(password)) {
      return jsonResponse({ error: 'نام کاربری یا رمز عبور اشتباه است' }, 401);
    }
    const token = `local_tok_${found.id}`;
    return jsonResponse({ token, user: sanitizeUser(found) });
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const username = String(bodyData.username || '').trim();
    const password = String(bodyData.password || '');
    const fullName = String(bodyData.fullName || username).trim();
    const rawPhone = String(bodyData.phone || '').trim();

    if (!username || password.length < 4) {
      return jsonResponse({ error: 'نام کاربری و رمز عبور معتبر الزامی است' }, 400);
    }
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return jsonResponse({ error: 'این نام کاربری قبلاً ثبت شده است' }, 400);
    }

    if (!rawPhone) {
      return jsonResponse({ error: 'شماره تلفن همراه الزامی است' }, 400);
    }

    const phoneValidation = validateIranianMobileDetailed(rawPhone);
    if (!phoneValidation.isValid) {
      return jsonResponse({ error: phoneValidation.error || 'شماره تلفن همراه نامعتبر است' }, 400);
    }

    const cleanPhone = phoneValidation.normalized;
    const duplicatePhoneUser = db.users.find((u) => {
      if (!u.phone) return false;
      return normalizeIranianPhone(u.phone) === cleanPhone;
    });

    if (duplicatePhoneUser) {
      return jsonResponse({ error: 'این شماره موبایل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.' }, 409);
    }

    const newUser: UserItem & { passwordHash: string } = {
      id: `usr_${Date.now()}`,
      username,
      fullName,
      phone: cleanPhone,
      role: 'client',
      coins: 0,
      coinEnabled: false,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveLocalDb(db, storage);
    const token = `local_tok_${newUser.id}`;
    return jsonResponse({ token, user: sanitizeUser(newUser) });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!currentUser) return jsonResponse({ error: 'نشست معتبر نیست' }, 401);
    return jsonResponse({ user: sanitizeUser(currentUser) });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    return jsonResponse({ ok: true });
  }

  // بررسی شماره تلفن در دیتابیس با اعتبارسنجی رجکس ایرانی (آفلاین و آنلاین)
  if (pathname === '/api/users/check-phone' && (method === 'GET' || method === 'POST')) {
    const rawPhone = (method === 'GET' ? parsedUrl.searchParams.get('phone') : bodyData.phone) || '';
    if (!rawPhone) {
      return jsonResponse({ error: 'شماره تلفن ارسال نشده است' }, 400);
    }

    const phoneValidation = validateIranianMobileDetailed(String(rawPhone));
    if (!phoneValidation.isValid) {
      return jsonResponse({
        exists: false,
        registered: false,
        isValid: false,
        error: phoneValidation.error,
        normalized: phoneValidation.normalized,
      });
    }

    const clean = phoneValidation.normalized;

    const existingUser = db.users.find((u) => {
      if (!u.phone) return false;
      return normalizeIranianPhone(u.phone) === clean;
    });

    if (existingUser) {
      return jsonResponse({
        exists: true,
        registered: true,
        isValid: true,
        operatorName: phoneValidation.operatorName,
        source: 'user',
        user: {
          id: existingUser.id,
          fullName: existingUser.fullName,
          username: existingUser.username,
          role: existingUser.role,
        },
        message: `این شماره متعلق به کاربر ثبت‌شده «${existingUser.fullName}» در سیستم است.`,
      });
    }

    const existingOrder = db.orders.find((o) => o.customerContact && o.customerContact.includes(clean));
    const existingThread = db.chatThreads.find((t) => t.customerContact && t.customerContact.includes(clean));

    if (existingOrder || existingThread) {
      const lastCustomerName = existingOrder?.customerName || existingThread?.customerName || 'مشتری استودیو';
      return jsonResponse({
        exists: true,
        registered: false,
        isValid: true,
        operatorName: phoneValidation.operatorName,
        source: 'history',
        lastCustomerName,
        message: `این شماره قبلاً با نام «${lastCustomerName}» برای سفارش یا گفت‌وگو در سیستم استفاده شده است.`,
      });
    }

    return jsonResponse({
      exists: false,
      registered: false,
      isValid: true,
      operatorName: phoneValidation.operatorName,
    });
  }

  // بروزرسانی پروفایل کاربری در حالت لوکال / هاست استاتیک
  if (pathname === '/api/users/profile' && method === 'PUT') {
    if (!currentUser) return jsonResponse({ error: 'احراز هویت الزامی است' }, 401);
    const fullName = bodyData.fullName ? String(bodyData.fullName).trim() : undefined;
    const rawPhone = bodyData.phone ? String(bodyData.phone).trim() : undefined;

    let cleanPhone: string | undefined = undefined;
    if (rawPhone !== undefined) {
      const pVal = validateIranianMobileDetailed(rawPhone);
      if (!pVal.isValid) {
        return jsonResponse({ error: pVal.error || 'شماره موبایل نامعتبر است' }, 400);
      }
      cleanPhone = pVal.normalized;
      const collision = db.users.find(
        (u) => u.id !== currentUser.id && u.phone && normalizeIranianPhone(u.phone) === cleanPhone
      );
      if (collision) {
        return jsonResponse({ error: 'این شماره موبایل قبلاً برای حساب کاربری دیگری ثبت شده است' }, 409);
      }
    }

    const userIdx = db.users.findIndex((u) => u.id === currentUser.id);
    if (userIdx === -1) return jsonResponse({ error: 'کاربر یافت نشد' }, 404);

    if (fullName) db.users[userIdx].fullName = fullName;
    if (cleanPhone) db.users[userIdx].phone = cleanPhone;

    saveLocalDb(db, storage);
    return jsonResponse({
      message: 'اطلاعات حساب با موفقیت بروزرسانی شد',
      user: sanitizeUser(db.users[userIdx]),
    });
  }

  // 6. Testimonials
  if (pathname === '/api/testimonials' && method === 'GET') {
    const approved = db.testimonials.filter((t) => t.status === 'approved');
    return jsonResponse({ testimonials: approved });
  }

  if (pathname === '/api/testimonials' && method === 'POST') {
    const newTestimonial: TestimonialItem = {
      id: `tst_${Date.now()}`,
      name: String(bodyData.name || currentUser?.fullName || 'کاربر استودیو'),
      role: String(bodyData.role || 'کارفرمای محترم'),
      company: String(bodyData.company || 'پروژه اختصاصی'),
      service: String(bodyData.service || 'خدمات تخصصی دیزاین'),
      category: bodyData.category || '3d',
      rating: Number(bodyData.rating) || 5,
      outcome: String(bodyData.outcome || 'تحویل دقیق و باکیفیت'),
      quote: String(bodyData.quote || ''),
      verifiedCode: String(bodyData.trackingCode || `STD-${Math.floor(100000 + Math.random() * 900000)}`),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.testimonials.unshift(newTestimonial);
    saveLocalDb(db, storage);
    return jsonResponse({
      testimonial: newTestimonial,
      message: 'دیدگاه شما با موفقیت ثبت شد و پس از تایید مدیریت در سایت نمایش داده می‌شود.',
    });
  }

  if (pathname === '/api/admin/testimonials' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    return jsonResponse({ testimonials: db.testimonials });
  }

  if (pathname === '/api/admin/testimonials' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const item: TestimonialItem = {
      id: `tst_${Date.now()}`,
      name: String(bodyData.name || 'کارفرما'),
      role: String(bodyData.role || 'مدیر پروژه'),
      company: String(bodyData.company || 'برند همکار'),
      service: String(bodyData.service || 'خدمات تخصصی'),
      category: bodyData.category || '3d',
      rating: Number(bodyData.rating) || 5,
      outcome: String(bodyData.outcome || ''),
      quote: String(bodyData.quote || ''),
      verifiedCode: String(bodyData.verifiedCode || `STD-${Math.floor(100000 + Math.random() * 900000)}`),
      status: bodyData.status || 'approved',
      createdAt: new Date().toISOString(),
    };
    db.testimonials.unshift(item);
    saveLocalDb(db, storage);
    return jsonResponse({ testimonial: item, testimonials: db.testimonials });
  }

  const adminTestStatusMatch = pathname.match(/^\/api\/admin\/testimonials\/([^/]+)\/status$/);
  if (adminTestStatusMatch && method === 'PATCH') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const tId = adminTestStatusMatch[1];
    const t = db.testimonials.find((x) => x.id === tId);
    if (!t) return jsonResponse({ error: 'یافت نشد' }, 404);
    t.status = bodyData.status;
    saveLocalDb(db, storage);
    return jsonResponse({ testimonial: t, testimonials: db.testimonials });
  }

  const adminTestDelMatch = pathname.match(/^\/api\/admin\/testimonials\/([^/]+)$/);
  if (adminTestDelMatch && method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const tId = adminTestDelMatch[1];
    db.testimonials = db.testimonials.filter((x) => x.id !== tId);
    saveLocalDb(db, storage);
    return jsonResponse({ ok: true, testimonials: db.testimonials });
  }

  // 7. Orders
  if (pathname === '/api/orders' && method === 'GET') {
    const trackingCode = parsedUrl.searchParams.get('trackingCode');
    if (trackingCode) {
      const clean = trackingCode.trim().toUpperCase();
      const found = db.orders.find(
        (o) => o.trackingCode.toUpperCase() === clean || o.trackingCode.replace('STD-', '') === clean
      );
      if (!found) return jsonResponse({ error: 'سفارشی با این کد پیگیری یافت نشد' }, 404);
      return jsonResponse({ order: found });
    }
    if (!currentUser) return jsonResponse({ orders: [] });
    if (currentUser.role === 'admin') {
      return jsonResponse({ orders: db.orders });
    }
    return jsonResponse({
      orders: db.orders.filter((o) => o.userId === currentUser.id),
    });
  }

  if ((pathname === '/api/orders' || pathname === '/api/admin/orders') && method === 'POST') {
    const srv = db.services.find((s) => s.id === bodyData.serviceId) || db.services[0];
    const quantity = Math.max(1, Number(bodyData.quantity) || 1);
    const priority = (bodyData.priority || 'normal') as 'normal' | 'express' | 'vip';
    const mult = priority === 'vip' ? 1.75 : priority === 'express' ? 1.35 : 1;
    const totalPriceToman = Math.round(((srv?.basePriceToman || 1000000) * quantity * mult) / 10000) * 10000;
    const paymentMethod = bodyData.paymentMethod === 'coin' ? 'coin' : 'toman';
    const unitCoinPrice = db.settings.coinSystem.unitPriceToman || 500000;
    const coinsSpent = paymentMethod === 'coin' ? Math.max(1, Math.ceil(totalPriceToman / unitCoinPrice)) : 0;

    if (paymentMethod === 'coin') {
      if (!currentUser) {
        return jsonResponse({ error: 'برای پرداخت با کوین ابتدا وارد حساب کاربری شوید' }, 401);
      }
      if ((currentUser.coins || 0) < coinsSpent) {
        return jsonResponse({ error: 'موجودی کوین شما برای ثبت این سفارش کافی نیست' }, 400);
      }
      currentUser.coins = (currentUser.coins || 0) - coinsSpent;
      db.coinTransactions.unshift({
        id: `ctx_${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        type: 'spend',
        amount: coinsSpent,
        coins: coinsSpent,
        amountToman: totalPriceToman,
        status: 'approved',
        note: `پرداخت سفارش ${srv?.title || ''}`,
        signature: simpleHash(`${currentUser.id}_${coinsSpent}_${Date.now()}`),
        createdAt: new Date().toISOString(),
      });
    }

    const trackingCode = `STD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: OrderItem = {
      id: `ord_${Date.now()}`,
      trackingCode,
      userId: currentUser?.id,
      serviceId: srv?.id || 'srv-1',
      serviceTitle: bodyData.serviceTitle || srv?.title || 'سفارش اختصاصی',
      customerName: String(bodyData.customerName || currentUser?.fullName || 'کارفرما'),
      customerContact: String(bodyData.customerContact || currentUser?.phone || ''),
      quantity,
      priority,
      urgency: priority,
      calculatedPrice: totalPriceToman,
      description: String(bodyData.description || ''),
      estimatedTotalToman: totalPriceToman,
      paymentMethod,
      coinsSpent,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(newOrder);
    saveLocalDb(db, storage);
    return jsonResponse({ order: newOrder, trackingCode });
  }

  const orderStatusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (orderStatusMatch && method === 'PATCH') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const ord = db.orders.find((o) => o.id === orderStatusMatch[1]);
    if (!ord) return jsonResponse({ error: 'سفارش یافت نشد' }, 404);
    ord.status = bodyData.status;
    saveLocalDb(db, storage);
    return jsonResponse({ order: ord });
  }

  const orderNoteMatch = pathname.match(/^\/api\/orders\/([^/]+)\/note$/);
  if (orderNoteMatch && method === 'PATCH') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const ord = db.orders.find((o) => o.id === orderNoteMatch[1]);
    if (!ord) return jsonResponse({ error: 'سفارش یافت نشد' }, 404);
    if (typeof bodyData.adminNote === 'string') ord.adminNote = bodyData.adminNote;
    if (typeof bodyData.deliveryFileUrl === 'string') ord.deliveryFileUrl = bodyData.deliveryFileUrl;
    saveLocalDb(db, storage);
    return jsonResponse({ order: ord });
  }

  const orderDelMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (orderDelMatch && method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    db.orders = db.orders.filter((o) => o.id !== orderDelMatch[1]);
    saveLocalDb(db, storage);
    return jsonResponse({ ok: true });
  }

  // 8. Coins & Payment
  if (pathname === '/api/coins/transactions' && method === 'GET') {
    if (!currentUser) return jsonResponse({ transactions: [] });
    const list =
      currentUser.role === 'admin'
        ? db.coinTransactions
        : db.coinTransactions.filter((t) => t.userId === currentUser.id);
    return jsonResponse({ transactions: list });
  }

  if (pathname === '/api/coins/topup-request' && method === 'POST') {
    if (!currentUser) return jsonResponse({ error: 'ابتدا وارد شوید' }, 401);
    let coins = Number(bodyData.coins) || 1;
    let amountToman = coins * (db.settings.coinSystem.unitPriceToman || 500000);
    if (bodyData.packageId) {
      const pkg = db.settings.coinSystem.packages.find((p) => p.id === bodyData.packageId);
      if (pkg) {
        coins = pkg.coins;
        amountToman = pkg.priceToman;
      }
    }
    const tx: CoinTransaction = {
      id: `ctx_${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.fullName,
      userFullName: currentUser.fullName,
      type: 'topup_request',
      packageId: bodyData.packageId,
      amount: coins,
      coins,
      amountToman,
      status: 'pending',
      note: String(bodyData.note || 'درخواست شارژ کیف پول'),
      signature: simpleHash(`${currentUser.id}_${coins}_${Date.now()}`),
      createdAt: new Date().toISOString(),
    };
    db.coinTransactions.unshift(tx);
    saveLocalDb(db, storage);
    return jsonResponse({ transaction: tx });
  }

  if (pathname === '/api/payment/initiate' && method === 'POST') {
    if (!currentUser) return jsonResponse({ error: 'ابتدا وارد شوید' }, 401);
    let coins = Number(bodyData.coins) || 1;
    let amountToman = coins * (db.settings.coinSystem.unitPriceToman || 500000);
    if (bodyData.packageId) {
      const pkg = db.settings.coinSystem.packages.find((p) => p.id === bodyData.packageId);
      if (pkg) {
        coins = pkg.coins;
        amountToman = pkg.priceToman;
      }
    }
    currentUser.coins = (currentUser.coins || 0) + coins;
    const refCode = `STD-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    db.coinTransactions.unshift({
      id: `ctx_${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.fullName,
      userFullName: currentUser.fullName,
      type: 'admin_grant',
      packageId: bodyData.packageId,
      amount: coins,
      coins,
      amountToman,
      status: 'approved',
      note: `شارژ آنی درگاه آنلاین (${refCode})`,
      signature: simpleHash(`${currentUser.id}_${coins}_${refCode}`),
      createdAt: new Date().toISOString(),
    });
    saveLocalDb(db, storage);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : './';
    return jsonResponse({
      redirectUrl: `${currentPath}?page=panel&payment=success&coins=${coins}&ref=${refCode}`,
    });
  }

  if (pathname === '/api/admin/coins/grant' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const targetUser = db.users.find((u) => u.id === bodyData.userId);
    if (!targetUser) return jsonResponse({ error: 'کاربر یافت نشد' }, 404);
    const delta = Number(bodyData.coins) || 0;
    targetUser.coins = Math.max(0, (targetUser.coins || 0) + delta);
    const tx: CoinTransaction = {
      id: `ctx_${Date.now()}`,
      userId: targetUser.id,
      username: targetUser.username,
      fullName: targetUser.fullName,
      userFullName: targetUser.fullName,
      type: 'admin_grant',
      amount: delta,
      coins: delta,
      amountToman: Math.abs(delta) * (db.settings.coinSystem.unitPriceToman || 500000),
      status: 'approved',
      note: String(bodyData.note || 'تخصیص توسط مدیریت'),
      signature: simpleHash(`${targetUser.id}_${delta}_${Date.now()}`),
      createdAt: new Date().toISOString(),
    };
    db.coinTransactions.unshift(tx);
    saveLocalDb(db, storage);
    return jsonResponse({ user: sanitizeUser(targetUser), transaction: tx });
  }

  const resolveCoinMatch = pathname.match(/^\/api\/admin\/coins\/requests\/([^/]+)\/resolve$/);
  if (resolveCoinMatch && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const tx = db.coinTransactions.find((t) => t.id === resolveCoinMatch[1]);
    if (!tx) return jsonResponse({ error: 'تراکنش یافت نشد' }, 404);
    const action = bodyData.action === 'approve' ? 'approved' : 'rejected';
    tx.status = action;
    if (action === 'approved') {
      const targetUser = db.users.find((u) => u.id === tx.userId);
      if (targetUser) {
        const granted = tx.amount || tx.coins || 0;
        targetUser.coins = (targetUser.coins || 0) + granted;
      }
    }
    saveLocalDb(db, storage);
    return jsonResponse({ transaction: tx });
  }

  const userCoinAccessMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/coin-access$/);
  if (userCoinAccessMatch && method === 'PATCH') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const targetUser = db.users.find((u) => u.id === userCoinAccessMatch[1]);
    if (!targetUser) return jsonResponse({ error: 'کاربر یافت نشد' }, 404);
    targetUser.coinEnabled = Boolean(bodyData.coinEnabled);
    saveLocalDb(db, storage);
    return jsonResponse({ user: sanitizeUser(targetUser) });
  }

  // 9. Chat System
  if (pathname === '/api/chat/upload' && method === 'POST') {
    const fileData = String(bodyData.fileData || '');
    const fileName = String(bodyData.fileName || 'attachment');
    const mimeType = String(bodyData.mimeType || 'application/octet-stream');
    let type: 'image' | 'video' | 'audio' | 'file' = 'file';
    if (mimeType.startsWith('image/')) type = 'image';
    else if (mimeType.startsWith('video/')) type = 'video';
    else if (mimeType.startsWith('audio/')) type = 'audio';
    return jsonResponse({
      attachment: {
        url: fileData,
        name: fileName,
        mimeType,
        size: Math.round((fileData.length * 3) / 4),
        type,
      },
    });
  }

  if (pathname === '/api/chat/threads' && method === 'GET') {
    if (currentUser?.role === 'admin') {
      return jsonResponse({ threads: db.chatThreads });
    }
    if (currentUser) {
      return jsonResponse({
        threads: db.chatThreads.filter((t) => t.userId === currentUser.id),
      });
    }
    return jsonResponse({ threads: [] });
  }

  if (pathname === '/api/chat/threads' && method === 'POST') {
    const now = new Date().toISOString();
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: currentUser?.role === 'admin' ? 'admin' : 'user',
      senderRole: currentUser?.role === 'admin' ? 'admin' : 'user',
      senderName: String(bodyData.customerName || currentUser?.fullName || 'کاربر'),
      text: String(bodyData.message || ''),
      attachment: bodyData.attachment,
      timestamp: now,
      createdAt: now,
      read: true,
    };
    const thread: ChatThread = {
      id: `thd_${Date.now()}`,
      userId: currentUser?.id,
      customerName: String(bodyData.customerName || currentUser?.fullName || 'کاربر مهمان'),
      customerContact: String(bodyData.customerContact || currentUser?.phone || ''),
      subject: String(bodyData.subject || 'گفت‌وگو و مشاوره پروژه'),
      relatedOrderId: bodyData.relatedOrderId,
      status: 'open',
      unreadByAdmin: 1,
      unreadByUser: 0,
      messages: [msg],
      updatedAt: now,
      createdAt: now,
    };
    db.chatThreads.unshift(thread);
    saveLocalDb(db, storage);
    return jsonResponse({ thread });
  }

  const threadGetMatch = pathname.match(/^\/api\/chat\/threads\/([^/]+)$/);
  if (threadGetMatch && method === 'GET') {
    const thread = db.chatThreads.find((t) => t.id === threadGetMatch[1]);
    if (!thread) return jsonResponse({ error: 'گفت‌وگو یافت نشد' }, 404);
    if (currentUser?.role === 'admin') thread.unreadByAdmin = 0;
    else thread.unreadByUser = 0;
    saveLocalDb(db, storage);
    return jsonResponse({ thread });
  }

  const threadMsgMatch = pathname.match(/^\/api\/chat\/threads\/([^/]+)\/messages$/);
  if (threadMsgMatch && method === 'POST') {
    const thread = db.chatThreads.find((t) => t.id === threadMsgMatch[1]);
    if (!thread) return jsonResponse({ error: 'گفت‌وگو یافت نشد' }, 404);
    const isSenderAdmin = currentUser?.role === 'admin';
    const now = new Date().toISOString();
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: isSenderAdmin ? 'admin' : 'user',
      senderRole: isSenderAdmin ? 'admin' : 'user',
      senderName: isSenderAdmin ? 'مدیریت استودیو' : thread.customerName,
      text: String(bodyData.text || ''),
      attachment: bodyData.attachment,
      timestamp: now,
      createdAt: now,
      read: false,
    };
    thread.messages.push(msg);
    thread.updatedAt = now;
    thread.unreadByAdmin = isSenderAdmin ? 0 : 1;
    thread.unreadByUser = isSenderAdmin ? 1 : 0;
    saveLocalDb(db, storage);
    return jsonResponse({ thread, message: msg });
  }

  const threadStatusMatch = pathname.match(/^\/api\/chat\/threads\/([^/]+)\/status$/);
  if (threadStatusMatch && method === 'PATCH') {
    const thread = db.chatThreads.find((t) => t.id === threadStatusMatch[1]);
    if (!thread) return jsonResponse({ error: 'گفت‌وگو یافت نشد' }, 404);
    thread.status = bodyData.status === 'closed' ? 'closed' : 'open';
    saveLocalDb(db, storage);
    return jsonResponse({ thread });
  }

  // 10. Admin Users, Stats, Backup & Password
  if (pathname === '/api/admin/users' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    return jsonResponse({ users: db.users.map(sanitizeUser) });
  }

  if (pathname === '/api/admin/stats' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const totalRevenue = db.orders
      .filter((o) => o.status === 'completed' || o.status === 'in_progress')
      .reduce((acc, o) => acc + (o.estimatedTotalToman || 0), 0);
    return jsonResponse({
      stats: {
        totalOrders: db.orders.length,
        pendingOrders: db.orders.filter((o) => o.status === 'pending').length,
        inProgressOrders: db.orders.filter((o) => o.status === 'in_progress').length,
        completedOrders: db.orders.filter((o) => o.status === 'completed').length,
        totalUsers: db.users.length,
        openChats: db.chatThreads.filter((t) => t.status === 'open').length,
        unreadChats: db.chatThreads.filter((t) => t.unreadByAdmin).length,
        totalRevenueToman: totalRevenue,
        pendingCoinRequests: db.coinTransactions.filter((t) => t.status === 'pending').length,
      },
    });
  }

  if (pathname === '/api/admin/backup' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    return jsonResponse({ backup: db, exportedAt: new Date().toISOString() });
  }

  if (pathname === '/api/admin/backup/restore' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const incoming = bodyData.backup || bodyData;
    if (incoming && Array.isArray(incoming.services)) {
      saveLocalDb(incoming as LocalDatabaseSchema, storage);
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ error: 'فایل پشتیبان معتبر نیست' }, 400);
  }

  if (pathname === '/api/admin/change-password' && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
    }
    const newPass = String(bodyData.newPassword || '');
    if (newPass.length < 4) {
      return jsonResponse({ error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد' }, 400);
    }
    currentUser.passwordHash = simpleHash(newPass);
    saveLocalDb(db, storage);
    return jsonResponse({ ok: true, message: 'رمز عبور مدیریت با موفقیت تغییر یافت' });
  }

  return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
}

let bridgeInstalled = false;
let capturedNativeFetch: typeof window.fetch | null = null;

function getNativeFetch(): typeof window.fetch {
  if (capturedNativeFetch) return capturedNativeFetch;
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    capturedNativeFetch = window.fetch.bind(window);
    return capturedNativeFetch;
  }
  return globalThis.fetch.bind(globalThis);
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const nativeFetch = getNativeFetch();
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  const isApiCall =
    urlStr.startsWith('/api/') ||
    urlStr.startsWith('./api/') ||
    urlStr.includes('/api/');

  if (!isApiCall) {
    return nativeFetch(input, init);
  }

  // On known static hosts (*.github.io, *.netlify.app, etc.) or file://, skip network call to /api/* to avoid 404 console noise
  const hostname = typeof window !== 'undefined' ? window.location.hostname || '' : '';
  const protocol = typeof window !== 'undefined' ? window.location.protocol || '' : '';
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const isKnownStaticHost =
    isOffline ||
    hostname.endsWith('.github.io') ||
    hostname.endsWith('.netlify.app') ||
    hostname.endsWith('.pages.dev') ||
    hostname.endsWith('.vercel.app') ||
    protocol === 'file:';

  if (!isKnownStaticHost) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const res = await nativeFetch(input, {
        ...init,
        signal: init?.signal || controller.signal,
      });
      clearTimeout(timer);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.status !== 502 && res.status !== 503 && res.status !== 504) {
        return res;
      }
    } catch {
      // Fallback to local engine below
    }
  }

  return handleLocalApiRequest(urlStr, init);
}

export function installOfflineApiBridge(): void {
  if (typeof window === 'undefined' || bridgeInstalled) return;
  bridgeInstalled = true;
  try {
    const native = window.fetch.bind(window);
    capturedNativeFetch = native;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      return apiFetch(input, init);
    };
  } catch {
    // Continue gracefully if environment prevents fetch override
  }
}

