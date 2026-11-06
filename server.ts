import express, { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { storage, ChatAttachmentRecord } from './server/storage.ts';
import { hashPassword, verifyPassword, validateRegistration, generateTrackingCode } from './server/authUtils.ts';
import { classifyAttachmentMime } from './src/utils/chatMediaUtils.ts';
import { validateIranianMobileDetailed, normalizeIranianPhone } from './src/utils/phoneUtils.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// مسیر بررسی سلامت سرور برای هاست‌های رایگان (جلوگیری از به خواب رفتن سرور)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// پوشه ذخیره امن تصاویر و ویدیوهای چت
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// افزایش محدودیت حجم JSON برای آپلود روان تصاویر و ویدیوها در چت
app.use(express.json({ limit: '35mb' }));

// هدرهای امنیتی استاندارد وب (HTTP Security Headers)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// سرو فایل‌های رسانه و پیوست چت با هدرهای امنیتی سخت‌گیرانه (جلوگیری از اجرای اسکریپت در فایل‌های آپلودی)
app.use(
  '/uploads',
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // اگر فایل سند یا آرشیو است با هدر دانلود امن سرو شود
    const lowerPath = req.path.toLowerCase();
    if (
      !lowerPath.endsWith('.jpg') &&
      !lowerPath.endsWith('.jpeg') &&
      !lowerPath.endsWith('.png') &&
      !lowerPath.endsWith('.webp') &&
      !lowerPath.endsWith('.gif') &&
      !lowerPath.endsWith('.mp4') &&
      !lowerPath.endsWith('.webm') &&
      !lowerPath.endsWith('.mov') &&
      !lowerPath.endsWith('.mp3') &&
      !lowerPath.endsWith('.ogg') &&
      !lowerPath.endsWith('.wav') &&
      !lowerPath.endsWith('.m4a') &&
      !lowerPath.endsWith('.aac')
    ) {
      res.setHeader('Content-Disposition', 'attachment');
    }
    next();
  },
  express.static(UPLOADS_DIR, { maxAge: '7d' })
);

// سیستم محافظت در برابر حملات Brute-Force (Rate Limiter)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    return { allowed: true };
  }
  if (entry.count >= 7) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // ۱۰ دقیقه
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
  }
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

// پاکسازی متن ورودی از کاراکترهای کنترلی خطرناک
function sanitizeText(input: unknown, maxLen = 4000): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

// میان‌افزار احراز هویت با Bearer Token
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'احراز هویت الزامی است' });
  }
  const token = authHeader.split(' ')[1];
  const session = storage.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'نشست شما منقضی شده است' });
  }
  (req as any).user = session;
  next();
}

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی فقط برای مدیر سیستم مجاز است' });
    }
    next();
  });
}

// -----------------------------------------------------------------------------
// مسیرهای API احراز هویت (Auth API)
// -----------------------------------------------------------------------------

// ۱. ثبت نام کاربر جدید با شماره موبایل و مشخصات کامل
app.post('/api/auth/register', (req: Request, res: Response) => {
  const username = sanitizeText(req.body.username, 60);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const fullName = sanitizeText(req.body.fullName, 100);
  const rawPhone = sanitizeText(req.body.phone, 30);
  const phone = normalizeIranianPhone(rawPhone);

  const validation = validateRegistration(username, password, fullName, phone);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const existingUsername = storage.getUserByUsername(username);
  if (existingUsername) {
    return res.status(409).json({ error: 'این نام کاربری قبلاً ثبت شده است' });
  }

  if (phone) {
    const existingPhone = storage.getUserByPhone(phone);
    if (existingPhone) {
      return res.status(409).json({ error: 'این شماره موبایل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.' });
    }
  }

  const { hash, salt } = hashPassword(password);
  const newUser = storage.createUser({
    username,
    passwordHash: hash,
    salt,
    fullName,
    phone: phone || undefined,
    role: 'client',
  });

  const session = storage.createSession(newUser);
  const verifiedCoins = storage.getVerifiedUserCoins(newUser);
  return res.status(201).json({
    message: 'ثبت نام با موفقیت انجام شد',
    token: session.token,
    user: {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      phone: newUser.phone,
      role: newUser.role,
      coins: verifiedCoins,
      coinEnabled: Boolean(newUser.coinEnabled),
    },
  });
});

// ۲. ورود کاربر یا ادمین با محافظت در برابر Brute-Force
app.post('/api/auth/login', (req: Request, res: Response) => {
  const username = sanitizeText(req.body.username, 80);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    return res.status(400).json({ error: 'نام کاربری/شماره موبایل و رمز عبور الزامی است' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'local';
  const rateKey = `${clientIp}:${username.toLowerCase()}`;
  const rateStatus = checkLoginRateLimit(rateKey);
  if (!rateStatus.allowed) {
    return res.status(429).json({
      error: `تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ${rateStatus.retryAfterSec || 60} ثانیه دیگر تلاش کنید.`,
    });
  }

  const user = storage.getUserByUsernameOrPhone(username);
  if (!user) {
    recordFailedLogin(rateKey);
    return res.status(404).json({
      notFound: true,
      error: 'کاربری با این مشخصات یافت نشد. لطفاً ابتدا ثبت نام کنید.',
    });
  }

  const isMatch = verifyPassword(password, user.passwordHash, user.salt);
  if (!isMatch) {
    recordFailedLogin(rateKey);
    return res.status(401).json({ error: 'رمز عبور وارد شده نادرست است' });
  }

  clearLoginAttempts(rateKey);
  const session = storage.createSession(user);
  const verifiedCoins = storage.getVerifiedUserCoins(user);
  return res.json({
    message: 'ورود با موفقیت انجام شد',
    token: session.token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      coins: verifiedCoins,
      coinEnabled: Boolean(user.coinEnabled),
    },
  });
});

// ۳. بررسی هویت کاربر جاری
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ user: null, error: 'توکن ارائه نشده است' });
  }
  const token = authHeader.split(' ')[1];
  const session = storage.getSession(token);
  if (!session) {
    return res.status(401).json({ user: null, error: 'نشست نامعتبر یا منقضی شده است' });
  }

  const userRec = storage.getUserById(session.userId);
  const verifiedCoins = userRec ? storage.getVerifiedUserCoins(userRec) : 0;
  return res.json({
    user: {
      id: session.userId,
      username: userRec?.username || session.username,
      fullName: userRec?.fullName || session.fullName,
      phone: userRec?.phone || session.phone,
      role: session.role,
      coins: verifiedCoins,
      coinEnabled: Boolean(userRec?.coinEnabled),
    },
  });
});

// ۴. خروج
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    storage.deleteSession(token);
  }
  return res.json({ success: true });
});

// ۵. بررسی وجود و اعتبارسنجی شماره تلفن در سامانه (جلوگیری از ثبت تکراری یا اشتباه مانند ۱۲۳۴۵۶۷۸۹۰۱۱)
app.all('/api/users/check-phone', (req: Request, res: Response) => {
  const rawPhone = (req.method === 'GET' ? req.query.phone : req.body.phone) as string;
  if (!rawPhone) {
    return res.status(400).json({ error: 'شماره تلفن ارسال نشده است' });
  }

  // اعتبارسنجی ساختار با رجکس شماره همراه ایران و رد شماره‌های فیک
  const validation = validateIranianMobileDetailed(rawPhone);
  if (!validation.isValid) {
    return res.json({
      exists: false,
      registered: false,
      isValid: false,
      error: validation.error,
      normalized: validation.normalized,
    });
  }

  const clean = validation.normalized;

  // ۱. جستجو در کاربران ثبت‌نام‌شده سیستم
  const allUsers = storage.getAllUsers();
  const existingUser = allUsers.find((u: { phone?: string; fullName?: string; username?: string; id?: string; role?: string }) => {
    if (!u.phone) return false;
    let uClean = normalizeIranianPhone(u.phone);
    return uClean === clean;
  });

  if (existingUser) {
    return res.json({
      exists: true,
      registered: true,
      isValid: true,
      operatorName: validation.operatorName,
      source: 'user',
      user: {
        id: existingUser.id,
        fullName: existingUser.fullName,
        username: existingUser.username,
        role: existingUser.role,
      },
      message: `این شماره متعلق به کاربر ثبت‌شده «${existingUser.fullName}» در سامانه است.`,
    });
  }

  // ۲. جستجو در تاریخچه سفارش‌ها
  const orders = storage.getOrders();
  const existingOrder = orders.find((o) => o.customerContact && o.customerContact.includes(clean));

  // ۳. جستجو در تاریخچه گفت‌وگوها
  const threads = storage.getThreads();
  const existingThread = threads.find((t) => t.customerContact && t.customerContact.includes(clean));

  if (existingOrder || existingThread) {
    const lastCustomerName = existingOrder?.customerName || existingThread?.customerName || 'مشتری استودیو';
    return res.json({
      exists: true,
      registered: false,
      isValid: true,
      operatorName: validation.operatorName,
      source: 'history',
      lastCustomerName,
      message: `این شماره قبلاً با نام «${lastCustomerName}» برای سفارش یا گفت‌وگو در سیستم استفاده شده است.`,
    });
  }

  return res.json({
    exists: false,
    registered: false,
    isValid: true,
    operatorName: validation.operatorName,
  });
});

// ۶. بروزرسانی اطلاعات پروفایل و شماره تماس کاربر با اعتبارسنجی فرمت و عدم تکراری بودن
app.put('/api/users/profile', authMiddleware, (req: Request, res: Response) => {
  const sessionUser = (req as any).user;
  const fullName = req.body.fullName ? sanitizeText(req.body.fullName, 100) : undefined;
  const rawPhone = req.body.phone ? sanitizeText(req.body.phone, 30) : undefined;

  let cleanPhone: string | undefined = undefined;
  if (rawPhone !== undefined) {
    const phoneVal = validateIranianMobileDetailed(rawPhone);
    if (!phoneVal.isValid) {
      return res.status(400).json({ error: phoneVal.error || 'شماره موبایل وارد شده نامعتبر است' });
    }
    cleanPhone = phoneVal.normalized;
  }

  const result = storage.updateUserProfile(sessionUser.userId, {
    fullName,
    phone: cleanPhone,
  });

  if (!result.success || !result.user) {
    return res.status(400).json({ error: result.error || 'خطا در بروزرسانی اطلاعات حساب' });
  }

  return res.json({
    message: 'اطلاعات حساب کاربری با موفقیت بروزرسانی شد',
    user: {
      id: result.user.id,
      username: result.user.username,
      fullName: result.user.fullName,
      phone: result.user.phone,
      role: result.user.role,
      coins: storage.getVerifiedUserCoins(result.user),
      coinEnabled: Boolean(result.user.coinEnabled),
    },
  });
});

// -----------------------------------------------------------------------------
// مسیرهای خدمات، قیمت‌ها، ضرب سکه و تیتر تبلیغاتی (Services & Settings API)
// -----------------------------------------------------------------------------

app.get('/api/services', (req: Request, res: Response) => {
  let isAdminReq = false;
  if (req.query.admin === 'true') {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const session = storage.getSession(authHeader.split(' ')[1]);
      if (session && session.role === 'admin') {
        isAdminReq = true;
      }
    }
  }
  const services = storage.getServices(!isAdminReq);
  const settings = storage.getSettings();
  return res.json({
    services,
    showPrices: settings.showPrices,
    telegramUrl: settings.telegramUrl,
    baleUrl: settings.baleUrl,
    coinSystem: settings.coinSystem,
    promoBanner: settings.promoBanner,
    paymentGateway: settings.paymentGateway,
    settings,
  });
});

app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = storage.getSettings();
  return res.json({ settings });
});

app.put('/api/settings', adminMiddleware, (req: Request, res: Response) => {
  const { showPrices, telegramUrl, baleUrl, coinSystem, promoBanner, paymentGateway } = req.body;
  const updated = storage.updateSettings({
    showPrices: typeof showPrices === 'boolean' ? showPrices : undefined,
    telegramUrl: typeof telegramUrl === 'string' ? sanitizeText(telegramUrl, 300) : undefined,
    baleUrl: typeof baleUrl === 'string' ? sanitizeText(baleUrl, 300) : undefined,
    coinSystem: coinSystem && typeof coinSystem === 'object' ? coinSystem : undefined,
    promoBanner: promoBanner && typeof promoBanner === 'object' ? promoBanner : undefined,
    paymentGateway: paymentGateway && typeof paymentGateway === 'object' ? paymentGateway : undefined,
  });
  return res.json({
    message: 'تنظیمات با موفقیت ذخیره شد',
    settings: updated,
  });
});

// -----------------------------------------------------------------------------
// مسیرهای سیستم امن ضرب سکه و کیف پول کوین (Anti-Hack Coin System API)
// -----------------------------------------------------------------------------

// ۱. دریافت تاریخچه تراکنش‌ها و درخواست‌های کوین
app.get('/api/coins/transactions', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role === 'admin' && req.query.all === 'true') {
    const txs = storage.getCoinTransactions();
    return res.json({ transactions: txs });
  }
  const txs = storage.getCoinTransactions(user.userId);
  return res.json({ transactions: txs });
});

// ۲. ثبت درخواست افزودن کوین توسط کاربر (با محاسبه قیمت سمت سرور برای جلوگیری از دستکاری)
app.post('/api/coins/topup-request', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const settings = storage.getSettings();
  const coinSys = settings.coinSystem;

  const packageId = typeof req.body.packageId === 'string' ? sanitizeText(req.body.packageId, 60) : '';
  const rawCoins = Math.floor(Number(req.body.coins) || 0);
  const userNote = sanitizeText(req.body.note, 400);

  let finalCoins = 0;
  let finalPriceToman = 0;
  let packageTitle = '';

  if (packageId) {
    const foundPkg = coinSys.packages.find((p) => p.id === packageId && p.isActive !== false);
    if (!foundPkg) {
      return res.status(400).json({ error: 'بسته کوین انتخاب‌شده معتبر نیست' });
    }
    finalCoins = foundPkg.coins;
    finalPriceToman = foundPkg.priceToman;
    packageTitle = foundPkg.title;
  } else {
    if (rawCoins < 1 || rawCoins > 1000000) {
      return res.status(400).json({ error: 'تعداد کوین واردشده معتبر نیست (حداقل ۱ کوین)' });
    }
    finalCoins = rawCoins;
    // بررسی اینکه آیا تعداد دقیقاً منطبق بر یکی از بسته‌های تخفیف‌دار است یا خیر
    const matchingTier = coinSys.packages.find((p) => p.isActive !== false && p.coins === rawCoins);
    if (matchingTier) {
      finalPriceToman = matchingTier.priceToman;
      packageTitle = matchingTier.title;
    } else {
      finalPriceToman = rawCoins * Math.max(1000, coinSys.unitPriceToman);
      packageTitle = `شارژ دلخواه (${rawCoins} کوین)`;
    }
  }

  const tx = storage.createCoinTopupRequest({
    userId: user.userId,
    coins: finalCoins,
    priceToman: finalPriceToman,
    note: `${packageTitle}${userNote ? ` — ${userNote}` : ''}`,
  });

  if (!tx) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  return res.status(201).json({
    message: 'درخواست افزودن کوین ثبت شد و پس از تایید مدیریت به کیف پول شما اضافه می‌گردد',
    transaction: tx,
  });
});

// ۳. ضرب سکه و تخصیص یا کسر مستقیم کوین برای کاربر توسط ادمین
app.post('/api/admin/coins/grant', adminMiddleware, (req: Request, res: Response) => {
  const targetUserId = sanitizeText(req.body.userId, 80);
  const deltaCoins = Math.floor(Number(req.body.amount) || 0);
  const note = sanitizeText(req.body.note, 400);

  if (!targetUserId || deltaCoins === 0 || Math.abs(deltaCoins) > 10000000) {
    return res.status(400).json({ error: 'کاربر و تعداد سکه معتبر الزامی است' });
  }

  const result = storage.adjustUserCoins(
    targetUserId,
    deltaCoins,
    deltaCoins > 0 ? 'admin_grant' : 'admin_deduct',
    note || (deltaCoins > 0 ? 'ضرب و اعطای سکه توسط مدیریت' : 'کسر سکه توسط مدیریت')
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error || 'خطا در تغییر موجودی کوین' });
  }

  return res.json({
    message:
      deltaCoins > 0
        ? `${deltaCoins} کوین با امضای رمزنگاری‌شده به حساب کاربر اضافه شد`
        : `${Math.abs(deltaCoins)} کوین از حساب کاربر کسر شد`,
    newBalance: result.newBalance,
    transaction: result.tx,
  });
});

// ۴. تایید یا رد درخواست شارژ کوین کاربران توسط ادمین
app.post('/api/admin/coins/requests/:id/resolve', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const approve = Boolean(req.body.approve);

  const result = storage.resolveCoinTopupRequest(id, approve);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'خطا در بررسی درخواست کوین' });
  }

  return res.json({
    message: approve
      ? 'درخواست تایید شد و سکه با امضای امنیتی به کیف پول کاربر واریز گردید'
      : 'درخواست شارژ کوین رد شد',
    transaction: result.tx,
    newBalance: result.newBalance,
  });
});

// ۵. شروع پرداخت آنلاین از طریق درگاه‌های ایرانی (زرین‌پال، زیبال، لینک پرداخت شخصی یا شبیه‌ساز شاپرک داخلی)
app.post('/api/payment/initiate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = storage.getSettings();
    const coinSys = settings.coinSystem;
    const pg = settings.paymentGateway;

    if (!pg.onlineEnabled) {
      return res.status(400).json({ error: 'درگاه پرداخت آنلاین در حال حاضر غیرفعال است؛ لطفاً از روش کارت به کارت استفاده کنید' });
    }

    const packageId = typeof req.body.packageId === 'string' ? sanitizeText(req.body.packageId, 60) : '';
    const rawCoins = Math.floor(Number(req.body.coins) || 0);

    let finalCoins = 0;
    let finalPriceToman = 0;
    let packageTitle = '';

    if (packageId) {
      const foundPkg = coinSys.packages.find((p) => p.id === packageId && p.isActive !== false);
      if (!foundPkg) {
        return res.status(400).json({ error: 'بسته کوین انتخاب‌شده معتبر نیست' });
      }
      finalCoins = foundPkg.coins;
      finalPriceToman = foundPkg.priceToman;
      packageTitle = foundPkg.title;
    } else {
      if (rawCoins < 1 || rawCoins > 1000000) {
        return res.status(400).json({ error: 'تعداد کوین واردشده معتبر نیست (حداقل ۱ کوین)' });
      }
      finalCoins = rawCoins;
      const matchingTier = coinSys.packages.find((p) => p.isActive !== false && p.coins === rawCoins);
      if (matchingTier) {
        finalPriceToman = matchingTier.priceToman;
        packageTitle = matchingTier.title;
      } else {
        finalPriceToman = rawCoins * Math.max(1000, coinSys.unitPriceToman);
        packageTitle = `شارژ آنلاین ${rawCoins} کوین`;
      }
    }

    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
    const baseUrl = `${proto}://${host}`;

    // الف) اگر ادمین حالت «لینک پرداخت شخصی» (زرین‌لینک / پی‌پینگ / زیبال‌لینک) را انتخاب کرده باشد
    if (pg.activeProvider === 'custom_link' && pg.customPaymentUrl) {
      storage.createCoinTopupRequest({
        userId: user.userId,
        coins: finalCoins,
        priceToman: finalPriceToman,
        note: `${packageTitle} (هدایت به لینک پرداخت شخصی)`,
      });
      return res.json({
        redirectUrl: pg.customPaymentUrl,
        provider: 'custom_link',
      });
    }

    // ب) اگر حالت تست (Sandbox) فعال است یا هنوز کد مرچنت شاپرک وارد نشده، به شبیه‌ساز داخلی شاپرک هدایت شود تا بدون نیاز به اینماد و اینترنت خارجی هم کامل کار کند
    const hasLiveZarinpal = pg.activeProvider === 'zarinpal' && !pg.sandboxMode && pg.zarinpalMerchantId.length >= 30;
    const hasLiveZibal = pg.activeProvider === 'zibal' && !pg.sandboxMode && pg.zibalMerchantId.length >= 4;

    if (!hasLiveZarinpal && !hasLiveZibal) {
      const session = storage.createPaymentSession({
        userId: user.userId,
        coins: finalCoins,
        priceToman: finalPriceToman,
        provider: 'sandbox_local',
      });
      if (!session) {
        return res.status(404).json({ error: 'کاربر یافت نشد' });
      }
      return res.json({
        redirectUrl: `/api/payment/sandbox-gateway?sessionId=${encodeURIComponent(session.id)}`,
        provider: 'sandbox_local',
      });
    }

    // ج) اتصال زنده به درگاه زرین‌پال (ZarinPal v4 REST API)
    if (hasLiveZarinpal) {
      const session = storage.createPaymentSession({
        userId: user.userId,
        coins: finalCoins,
        priceToman: finalPriceToman,
        provider: 'zarinpal',
      });
      if (!session) {
        return res.status(404).json({ error: 'کاربر یافت نشد' });
      }

      const callbackUrl = `${baseUrl}/api/payment/callback?sessionId=${encodeURIComponent(session.id)}`;
      const zarinRes = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          merchant_id: pg.zarinpalMerchantId,
          amount: finalPriceToman * 10, // تبدیل تومان به ریال برای شاپرک
          callback_url: callbackUrl,
          description: `${packageTitle} - کاربر ${user.username}`,
        }),
      });
      const zarinData: any = await zarinRes.json();
      if (zarinData?.data?.code === 100 && zarinData?.data?.authority) {
        const authority = String(zarinData.data.authority);
        storage.updatePaymentSessionAuthority(session.id, authority);
        return res.json({
          redirectUrl: `https://www.zarinpal.com/pg/StartPay/${authority}`,
          provider: 'zarinpal',
        });
      }
      storage.failPaymentSession(session.id);
      return res.status(400).json({
        error: 'خطا در اتصال به زرین‌پال: کد مرچنت را در پنل مدیریت بررسی کنید یا حالت تست (Sandbox) را روشن نمایید.',
      });
    }

    // د) اتصال زنده به درگاه زیبال (Zibal REST API)
    if (hasLiveZibal) {
      const session = storage.createPaymentSession({
        userId: user.userId,
        coins: finalCoins,
        priceToman: finalPriceToman,
        provider: 'zibal',
      });
      if (!session) {
        return res.status(404).json({ error: 'کاربر یافت نشد' });
      }

      const callbackUrl = `${baseUrl}/api/payment/callback?sessionId=${encodeURIComponent(session.id)}`;
      const zibalRes = await fetch('https://gateway.zibal.ir/v1/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: pg.zibalMerchantId,
          amount: finalPriceToman * 10, // تبدیل تومان به ریال
          callbackUrl,
          description: `${packageTitle} - کاربر ${user.username}`,
        }),
      });
      const zibalData: any = await zibalRes.json();
      if (zibalData?.result === 100 && zibalData?.trackId) {
        const trackId = String(zibalData.trackId);
        storage.updatePaymentSessionAuthority(session.id, trackId);
        return res.json({
          redirectUrl: `https://gateway.zibal.ir/start/${trackId}`,
          provider: 'zibal',
        });
      }
      storage.failPaymentSession(session.id);
      return res.status(400).json({
        error: 'خطا در اتصال به درگاه زیبال: مرچنت کد را بررسی کنید یا حالت تست را فعال نمایید.',
      });
    }

    return res.status(400).json({ error: 'تنظیمات درگاه پرداخت ناقص است' });
  } catch (err) {
    console.error('Payment initiate error:', err);
    return res.status(500).json({ error: 'خطا در برقراری ارتباط با درگاه پرداخت' });
  }
});

// ۶. صفحه شبیه‌ساز داخلی درگاه شاپرک (برای تست آنی و آفلاین بدون نیاز به اینماد)
app.get('/api/payment/sandbox-gateway', (req: Request, res: Response) => {
  const sessionId = String(req.query.sessionId || '');
  const session = storage.getPaymentSession(sessionId);
  if (!session || session.status !== 'pending') {
    return res.redirect('/?page=panel&payment=failed');
  }
  const settings = storage.getSettings();
  const coinName = settings.coinSystem.coinName || 'کوین استودیو';
  const rials = (session.priceToman * 10).toLocaleString('fa-IR');
  const tomans = session.priceToman.toLocaleString('fa-IR');
  const coinsFa = session.coins.toLocaleString('fa-IR');

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>درگاه پرداخت اینترنتی شاپرک (حالت تست آزمایشی)</title>
  <style>
    @font-face {
      font-family: 'Vazirmatn';
      src: url('/fonts/Vazirmatn-Regular.woff2') format('woff2');
      font-weight: 400;
    }
    @font-face {
      font-family: 'Vazirmatn';
      src: url('/fonts/Vazirmatn-Bold.woff2') format('woff2');
      font-weight: 700;
    }
    * { box-sizing: border-box; font-family: 'Vazirmatn', system-ui, sans-serif; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
      color: #f8fafc; padding: 20px;
    }
    .card {
      width: 100%; max-width: 460px; background: #0b1120;
      border: 1px solid rgba(250, 204, 21, 0.35); border-radius: 22px;
      padding: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.65);
    }
    .badge {
      display: inline-block; background: rgba(250, 204, 21, 0.14);
      color: #facc15; border: 1px solid rgba(250, 204, 21, 0.35);
      font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px;
      margin-bottom: 14px;
    }
    h1 { font-size: 19px; margin: 0 0 6px 0; color: #ffffff; }
    p.sub { font-size: 12.5px; color: #94a3b8; margin: 0 0 20px 0; line-height: 1.7; }
    .info-box {
      background: #111827; border: 1px solid #1e293b; border-radius: 14px;
      padding: 16px; margin-bottom: 20px;
    }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 13.5px; }
    .row + .row { border-top: 1px dashed #1e293b; }
    .label { color: #94a3b8; }
    .val { font-weight: 700; color: #f8fafc; }
    .val.gold { color: #facc15; font-size: 15px; }
    .btn {
      display: block; width: 100%; text-align: center; text-decoration: none;
      padding: 14px 18px; border-radius: 12px; font-weight: 700; font-size: 14px;
      cursor: pointer; border: none; transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .btn:active { transform: scale(0.98); }
    .btn-success {
      background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
      color: #090d16; margin-bottom: 10px;
      box-shadow: 0 8px 25px rgba(250, 204, 21, 0.28);
    }
    .btn-cancel {
      background: rgba(239, 68, 68, 0.12); color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .note {
      margin-top: 16px; font-size: 11.5px; color: #64748b; text-align: center; line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">⚡ درگاه آزمایشی شاپرک (Sandbox فعال)</span>
    <h1>پرداخت امن و شارژ آنی ${coinName}</h1>
    <p class="sub">این صفحه شبیه‌ساز داخلی درگاه بانکی است تا پیش از دریافت اینماد یا در حالت آفلاین، فرآیند شارژ خودکار سکه را تست کنید.</p>
    <div class="info-box">
      <div class="row">
        <span class="label">پذیرنده:</span>
        <span class="val">استودیو دیزاین کانسپت</span>
      </div>
      <div class="row">
        <span class="label">مقدار شارژ کیف پول:</span>
        <span class="val gold">${coinsFa} ${coinName}</span>
      </div>
      <div class="row">
        <span class="label">مبلغ قابل پرداخت:</span>
        <span class="val">${tomans} تومان (${rials} ریال)</span>
      </div>
      <div class="row">
        <span class="label">شناسه یکتای تراکنش:</span>
        <span class="val" style="font-family: monospace;">${session.id}</span>
      </div>
    </div>
    <a class="btn btn-success" href="/api/payment/callback?sessionId=${encodeURIComponent(session.id)}&status=OK">
      ✓ شبیه‌سازی پرداخت موفق و واریز آنی کوین
    </a>
    <a class="btn btn-cancel" href="/api/payment/callback?sessionId=${encodeURIComponent(session.id)}&status=NOK">
      ✕ انصراف از پرداخت و بازگشت به پنل
    </a>
    <div class="note">
      پس از دریافت کد مرچنت از زرین‌پال یا زیبال، کافیست آن را در «پنل مدیریت ← تنظیمات درگاه پرداخت» وارد کرده و تیک حالت تست را بردارید.
    </div>
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// ۷. بازگشت از درگاه بانک (Callback) و تایید خودکار تراکنش (زرین‌پال / زیبال / شبیه‌ساز)
app.get('/api/payment/callback', async (req: Request, res: Response) => {
  try {
    const sessionId = String(req.query.sessionId || '');
    const session = storage.getPaymentSession(sessionId);
    if (!session) {
      return res.redirect('/?page=panel&payment=failed');
    }

    if (session.status === 'verified') {
      return res.redirect(`/?page=panel&payment=success&coins=${session.coins}&ref=${encodeURIComponent(session.refId || session.id)}`);
    }

    const settings = storage.getSettings();
    const pg = settings.paymentGateway;

    // الف) تایید شبیه‌ساز داخلی (Sandbox)
    if (session.provider === 'sandbox_local') {
      const status = String(req.query.status || '');
      if (status !== 'OK') {
        storage.failPaymentSession(session.id);
        return res.redirect('/?page=panel&payment=failed');
      }
      const refId = 'SBX-' + Math.floor(10000000 + Math.random() * 90000000);
      const done = storage.completePaymentSession(session.id, refId);
      if (done.success) {
        return res.redirect(`/?page=panel&payment=success&coins=${session.coins}&ref=${refId}`);
      }
      return res.redirect('/?page=panel&payment=failed');
    }

    // ب) تایید خودکار زرین‌پال (ZarinPal Verify API)
    if (session.provider === 'zarinpal') {
      const status = String(req.query.Status || req.query.status || '');
      const authority = String(req.query.Authority || session.authority || '');
      if (status !== 'OK' || !authority) {
        storage.failPaymentSession(session.id);
        return res.redirect('/?page=panel&payment=failed');
      }

      const verifyRes = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          merchant_id: pg.zarinpalMerchantId,
          amount: session.priceToman * 10,
          authority,
        }),
      });
      const verifyData: any = await verifyRes.json();
      if (verifyData?.data?.code === 100 || verifyData?.data?.code === 101) {
        const refId = String(verifyData.data.ref_id || authority.slice(-8));
        const done = storage.completePaymentSession(session.id, refId);
        if (done.success) {
          return res.redirect(`/?page=panel&payment=success&coins=${session.coins}&ref=${encodeURIComponent(refId)}`);
        }
      }
      storage.failPaymentSession(session.id);
      return res.redirect('/?page=panel&payment=failed');
    }

    // ج) تایید خودکار زیبال (Zibal Verify API)
    if (session.provider === 'zibal') {
      const successParam = String(req.query.success || '');
      const trackId = String(req.query.trackId || session.authority || '');
      if (successParam !== '1' || !trackId) {
        storage.failPaymentSession(session.id);
        return res.redirect('/?page=panel&payment=failed');
      }

      const verifyRes = await fetch('https://gateway.zibal.ir/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: pg.zibalMerchantId,
          trackId: Number(trackId),
        }),
      });
      const verifyData: any = await verifyRes.json();
      if (verifyData?.result === 100 || verifyData?.result === 201) {
        const refNumber = String(verifyData.refNumber || trackId);
        const done = storage.completePaymentSession(session.id, refNumber);
        if (done.success) {
          return res.redirect(`/?page=panel&payment=success&coins=${session.coins}&ref=${encodeURIComponent(refNumber)}`);
        }
      }
      storage.failPaymentSession(session.id);
      return res.redirect('/?page=panel&payment=failed');
    }

    return res.redirect('/?page=panel&payment=failed');
  } catch (err) {
    console.error('Payment callback error:', err);
    return res.redirect('/?page=panel&payment=failed');
  }
});

app.put('/api/services/:id/price', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPrice } = req.body;

  const priceNum = Number(newPrice);
  if (isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ error: 'مبلغ معتبر نیست' });
  }

  const updated = storage.updateServicePrice(id, priceNum);
  if (!updated) {
    return res.status(404).json({ error: 'خدمت مورد نظر یافت نشد' });
  }

  return res.json({
    message: 'قیمت خدمت با موفقیت بروزرسانی شد',
    service: updated,
  });
});

app.put('/api/services/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = storage.updateService(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'خدمت مورد نظر یافت نشد' });
  }

  return res.json({
    message: 'مشخصات خدمت با موفقیت بروزرسانی شد',
    service: updated,
  });
});

app.post('/api/services/batch-price', adminMiddleware, (req: Request, res: Response) => {
  const { percentChange } = req.body;
  const percent = Number(percentChange);
  if (isNaN(percent) || percent < -90 || percent > 500) {
    return res.status(400).json({ error: 'درصد معتبر نیست' });
  }

  const updatedServices = storage.batchUpdatePrices(percent);
  return res.json({
    message: `قیمت تمامی خدمات با تغییر ${percent > 0 ? '+' : ''}${percent}٪ بروزرسانی شد`,
    services: updatedServices,
  });
});

// -----------------------------------------------------------------------------
// مسیرهای سفارشات (Orders API)
// -----------------------------------------------------------------------------

app.get('/api/orders', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const statusFilter = req.query.status as string | undefined;

  if (user.role === 'admin') {
    const allOrders = storage.getOrders(statusFilter);
    return res.json({ orders: allOrders });
  }

  const userRec = storage.getUserById(user.userId);
  const userOrders = storage.getOrdersForUser(user.userId, userRec?.phone || user.phone);
  const filtered = statusFilter && statusFilter !== 'all'
    ? userOrders.filter((o) => o.status === statusFilter)
    : userOrders;
  return res.json({ orders: filtered });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const serviceId = sanitizeText(req.body.serviceId, 80);
  const serviceTitle = sanitizeText(req.body.serviceTitle, 150);
  const customerName = sanitizeText(req.body.customerName, 100);
  const customerContact = sanitizeText(req.body.customerContact, 100);
  const urgency = ['normal', 'express', 'vip'].includes(req.body.urgency) ? req.body.urgency : 'normal';
  const clientCalculatedPrice = Math.max(0, Number(req.body.calculatedPrice) || 0);
  const description = sanitizeText(req.body.description, 2000);
  const payWithCoins = Boolean(req.body.payWithCoins);

  if (!serviceId || !customerName || !customerContact) {
    return res.status(400).json({ error: 'اطلاعات ضروری سفارش ناقص است' });
  }

  let userId: string | undefined = undefined;
  let finalCustomerName = customerName;
  let finalCustomerContact = customerContact;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) {
      userId = session.userId;
      finalCustomerName = session.fullName;
      if (session.phone) {
        finalCustomerContact = session.phone;
      }
    }
  }

  // محاسبه امن قیمت در سمت سرور بر اساس تعرفه واقعی خدمت و ضریب اولویت
  const allServices = storage.getServices(false);
  const matchedService = allServices.find((s) => s.id === serviceId);
  const urgencyMultiplier = urgency === 'vip' ? 1.5 : urgency === 'express' ? 1.25 : 1.0;
  const serverCalculatedPrice = matchedService
    ? Math.round(matchedService.startingPrice * urgencyMultiplier)
    : clientCalculatedPrice;

  let paidWithCoins = false;
  let coinsSpent = 0;

  if (payWithCoins) {
    const settings = storage.getSettings();
    if (!settings.coinSystem.enabled) {
      return res.status(400).json({ error: 'سیستم پرداخت با کوین در حال حاضر غیرفعال است' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'برای پرداخت با کوین لطفاً ابتدا وارد حساب کاربری خود شوید' });
    }
    const unitPrice = Math.max(1000, settings.coinSystem.unitPriceToman || 500000);
    coinsSpent = Math.max(1, Math.ceil(serverCalculatedPrice / unitPrice));

    const deductResult = storage.adjustUserCoins(
      userId,
      -coinsSpent,
      'order_payment',
      `پرداخت سفارش «${matchedService?.title || serviceTitle}» با کوین`,
      serverCalculatedPrice
    );

    if (!deductResult.success) {
      return res.status(400).json({
        error: deductResult.error || 'موجودی کوین شما برای ثبت این سفارش کافی نیست',
      });
    }
    paidWithCoins = true;
  }

  const trackingCode = generateTrackingCode();
  const order = storage.createOrder({
    trackingCode,
    serviceId,
    serviceTitle: matchedService?.title || serviceTitle || 'خدمت استودیو',
    customerName: finalCustomerName,
    customerContact: finalCustomerContact,
    urgency,
    calculatedPrice: serverCalculatedPrice,
    description: paidWithCoins
      ? `[پرداخت‌شده با ${coinsSpent} کوین استودیو] ${description}`
      : description,
    status: 'pending',
    userId,
    paidWithCoins,
    coinsSpent: paidWithCoins ? coinsSpent : undefined,
  });

  return res.status(201).json({
    message: paidWithCoins
      ? `سفارش شما با کسر ${coinsSpent} کوین با موفقیت ثبت و تسویه شد`
      : 'سفارش با موفقیت ثبت و در پایگاه داده ذخیره شد',
    order,
  });
});

// ثبت سفارش دستی توسط ادمین
app.post('/api/admin/orders', adminMiddleware, (req: Request, res: Response) => {
  const serviceId = sanitizeText(req.body.serviceId, 80);
  const serviceTitle = sanitizeText(req.body.serviceTitle, 150);
  const customerName = sanitizeText(req.body.customerName, 100);
  const customerContact = sanitizeText(req.body.customerContact, 100);
  const urgency = ['normal', 'express', 'vip'].includes(req.body.urgency) ? req.body.urgency : 'normal';
  const calculatedPrice = Math.max(0, Number(req.body.calculatedPrice) || 0);
  const description = sanitizeText(req.body.description, 2000);
  const status = ['pending', 'in_progress', 'completed', 'cancelled'].includes(req.body.status)
    ? req.body.status
    : 'pending';
  const adminNote = sanitizeText(req.body.adminNote, 1000);
  const deliveryLink = sanitizeText(req.body.deliveryLink, 500);

  if (!serviceId || !customerName || !customerContact) {
    return res.status(400).json({ error: 'اطلاعات ضروری سفارش ناقص است' });
  }

  const trackingCode = generateTrackingCode();
  const order = storage.createOrder({
    trackingCode,
    serviceId,
    serviceTitle: serviceTitle || 'خدمت اختصاصی',
    customerName,
    customerContact,
    urgency,
    calculatedPrice,
    description,
    status,
    adminNote,
    deliveryLink,
  });

  return res.status(201).json({
    message: 'سفارش دستی جدید توسط ادمین ثبت شد',
    order,
  });
});

app.patch('/api/orders/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است' });
  }

  const updated = storage.updateOrderStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'سفارش یافت نشد' });
  }

  return res.json({
    message: 'وضعیت سفارش بروزرسانی شد',
    order: updated,
  });
});

app.patch('/api/orders/:id/note', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const adminNote = sanitizeText(req.body.adminNote, 1500);
  const deliveryLink = req.body.deliveryLink !== undefined ? sanitizeText(req.body.deliveryLink, 500) : undefined;

  const updated = storage.updateOrderAdminNote(id, adminNote, deliveryLink);
  if (!updated) {
    return res.status(404).json({ error: 'سفارش یافت نشد' });
  }

  return res.json({
    message: 'یادداشت و لینک تحویل سفارش ذخیره شد',
    order: updated,
  });
});

app.delete('/api/orders/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = storage.deleteOrder(id);
  if (!deleted) {
    return res.status(404).json({ error: 'سفارش یافت نشد' });
  }
  return res.json({ message: 'سفارش با موفقیت حذف گردید' });
});

// -----------------------------------------------------------------------------
// مسیرهای پنل ادمین (Admin API)
// -----------------------------------------------------------------------------

app.get('/api/admin/users', adminMiddleware, (_req: Request, res: Response) => {
  const users = storage.getAllUsers();
  const orders = storage.getOrders();

  const usersWithStats = users.map((u) => {
    const userOrders = orders.filter((o) => o.userId === u.id || o.customerName === u.fullName);
    const totalSpent = userOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.calculatedPrice || 0), 0);
    return {
      ...u,
      ordersCount: userOrders.length,
      totalSpent,
    };
  });

  return res.json({ users: usersWithStats });
});

// تغییر وضعیت دسترسی کوین برای یک کاربر انتخابی توسط ادمین (تکی)
app.patch('/api/admin/users/:id/coin-access', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const enabled = Boolean(req.body.enabled);
  const result = storage.setUserCoinAccess(id, enabled);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'کاربر مورد نظر یافت نشد' });
  }
  return res.json({
    message: enabled
      ? 'سامانه کوین برای این کاربر با موفقیت فعال شد'
      : 'سامانه کوین برای این کاربر غیرفعال شد',
    user: result.user,
  });
});

app.get('/api/admin/stats', adminMiddleware, (_req: Request, res: Response) => {
  const orders = storage.getOrders();
  const users = storage.getAllUsers();

  const totalRevenue = orders
    .filter((o) => o.status === 'completed' || o.status === 'in_progress')
    .reduce((sum, o) => sum + (o.calculatedPrice || 0), 0);

  const completedRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.calculatedPrice || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  return res.json({
    totalOrders: orders.length,
    totalRevenue,
    completedRevenue,
    totalUsers: users.length,
    pendingOrders,
    inProgressOrders,
    completedOrders,
    cancelledOrders,
  });
});

// تغییر مشخصات امنیتی ادمین (نام کاربری و رمز عبور)
app.put('/api/admin/change-password', adminMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  const newUsername = typeof req.body.newUsername === 'string' ? sanitizeText(req.body.newUsername, 60) : '';

  if (!newPassword && !newUsername) {
    return res.status(400).json({ error: 'لطفاً رمز عبور جدید یا نام کاربری جدید را وارد کنید' });
  }

  if (newPassword && newPassword.length < 5) {
    return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۵ کاراکتر باشد' });
  }

  if (newUsername && newUsername.length < 3) {
    return res.status(400).json({ error: 'نام کاربری جدید باید حداقل ۳ کاراکتر باشد' });
  }

  const success = storage.updateUserCredentials(user.userId, {
    newPassword: newPassword || undefined,
    newUsername: newUsername || undefined,
  });

  if (!success) {
    return res.status(400).json({ error: 'خطا در بروزرسانی مشخصات امنیتی (احتمال تکراری بودن نام کاربری)' });
  }

  return res.json({ message: 'مشخصات امنیتی ادمین با موفقیت بروزرسانی شد' });
});

// پشتیبان‌گیری ۱-کلیکی دیتابیس (دانلود فایل JSON کامل برای هاست رایگان و انتقال سرور)
app.get('/api/admin/backup', adminMiddleware, (_req: Request, res: Response) => {
  const backup = storage.exportFullBackup();
  const dateStr = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="concept-studio-backup-${dateStr}.json"`);
  return res.send(JSON.stringify(backup, null, 2));
});

// بازگردانی ۱-کلیکی دیتابیس از فایل بکاپ
app.post('/api/admin/backup/restore', adminMiddleware, (req: Request, res: Response) => {
  const result = storage.importFullBackup(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'خطا در بازیابی فایل بکاپ' });
  }
  return res.json({
    message: `پشتیبان با موفقیت بازیابی شد (${result.stats?.users || 0} کاربر و ${result.stats?.orders || 0} سفارش)`,
    stats: result.stats,
  });
});

// -----------------------------------------------------------------------------
// آپلود امن تصویر، ویدیو، ویس (پیام صوتی) و فایل در چت (Chat Media & File Upload API)
// -----------------------------------------------------------------------------

app.post('/api/chat/upload', (req: Request, res: Response) => {
  try {
    const { fileName, mimeType, dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string' || !mimeType || typeof mimeType !== 'string') {
      return res.status(400).json({ error: 'فایل ارسالی معتبر نیست' });
    }

    const classification = classifyAttachmentMime(mimeType, typeof fileName === 'string' ? fileName : '');
    if (!classification.allowed) {
      return res.status(400).json({
        error:
          'فرمت فایل مجاز نیست. فرمت‌های مجاز: تصویر، ویدیو، ویس/صوت (MP3, WAV, OGG, WebM) و فایل‌های پروژه (PDF, ZIP, RAR, PSD, Word, Excel)',
      });
    }

    const base64Match = dataUrl.match(/^data:([^;]+)(?:;[^,]+)*;base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({ error: 'فرمت داده فایل نامعتبر است' });
    }

    const buffer = Buffer.from(base64Match[2], 'base64');
    const maxBytes = 25 * 1024 * 1024; // حداکثر ۲۵ مگابایت
    if (buffer.length === 0 || buffer.length > maxBytes) {
      return res.status(400).json({ error: 'حجم فایل نباید بیشتر از ۲۵ مگابایت باشد' });
    }

    const fileId = 'med_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const diskFileName = `${fileId}.${classification.ext}`;
    const fullPath = path.join(UPLOADS_DIR, diskFileName);

    fs.writeFileSync(fullPath, buffer);

    const fallbackName =
      classification.type === 'audio'
        ? `voice-message.${classification.ext}`
        : `attachment.${classification.ext}`;
    const safeOriginalName = sanitizeText(fileName || fallbackName, 120) || fallbackName;

    const attachment: ChatAttachmentRecord = {
      id: fileId,
      url: `/uploads/${diskFileName}`,
      type: classification.type,
      name: safeOriginalName,
      size: buffer.length,
    };

    return res.status(201).json({
      message: 'فایل با موفقیت بارگذاری شد',
      attachment,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'خطا در بارگذاری فایل پیوست' });
  }
});

// اعتبارسنجی آرایه پیوست‌ها (تصویر، ویدیو، ویس صوتی و فایل)
function sanitizeAttachments(raw: unknown): ChatAttachmentRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ChatAttachmentRecord =>
        item &&
        typeof item === 'object' &&
        typeof item.url === 'string' &&
        item.url.startsWith('/uploads/') &&
        !item.url.includes('..') &&
        (item.type === 'image' || item.type === 'video' || item.type === 'audio' || item.type === 'file')
    )
    .slice(0, 8)
    .map((item) => ({
      id: sanitizeText(item.id, 40) || 'att_' + crypto.randomUUID().slice(0, 8),
      url: item.url.trim(),
      type: item.type,
      name:
        sanitizeText(item.name, 120) ||
        (item.type === 'audio'
          ? 'پیام صوتی (ویس)'
          : item.type === 'video'
          ? 'ویدیو'
          : item.type === 'file'
          ? 'فایل پیوست'
          : 'تصویر'),
      size: typeof item.size === 'number' ? item.size : undefined,
    }));
}

function getDefaultAttachmentMessageText(attachments: ChatAttachmentRecord[]): string {
  if (attachments.some((a) => a.type === 'audio')) return '🎙️ پیام صوتی (ویس)';
  if (attachments.some((a) => a.type === 'file')) return '📎 فایل پیوست‌شده';
  if (attachments.some((a) => a.type === 'video')) return '🎬 ویدیوی پیوست‌شده';
  return '📷 تصویر پیوست‌شده';
}

// -----------------------------------------------------------------------------
// مسیرهای گفت‌وگو، پیام‌ها و پشتیبانی (Chat & Support API)
// -----------------------------------------------------------------------------

// ۱. دریافت لیست گفت‌وگوها با ایزولاسیون کامل برای هر کاربر
app.get('/api/chat/threads', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let user: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) user = session;
  }

  // ۱. ادمین به تمام گفت‌وگوها دسترسی دارد
  if (user && user.role === 'admin') {
    const threads = storage.getThreads();
    return res.json({ threads });
  }

  // ۲. هر کاربر فقط و فقط پیام‌های خودش را می‌بیند
  if (user && user.role === 'client') {
    const userRec = storage.getUserById(user.userId);
    const threads = storage.getThreadsForUser(user.userId, userRec?.phone || user.phone);
    return res.json({ threads });
  }

  // ۳. کاربر مهمان صرفاً در صورت وارد کردن شماره تماس یا شناسه گفت‌وگوهای خودش
  const contact = req.query.contact as string | undefined;
  if (contact && contact.trim().length >= 8) {
    const threads = storage.getThreadsByContact(contact.trim());
    return res.json({ threads });
  }

  return res.json({ threads: [] });
});

// ۲. دریافت جزئیات یک گفت‌وگو با اعتبارسنجی سطح دسترسی
app.get('/api/chat/threads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const thread = storage.getThreadById(id);
  if (!thread) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }

  const authHeader = req.headers.authorization;
  let sessionUser: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionUser = storage.getSession(authHeader.split(' ')[1]);
  }

  if (sessionUser && sessionUser.role === 'admin') {
    // ادمین مجاز است
  } else if (sessionUser && sessionUser.role === 'client') {
    const userRec = storage.getUserById(sessionUser.userId);
    const owns =
      thread.userId === sessionUser.userId ||
      (userRec?.phone && thread.customerContact.trim().toLowerCase() === userRec.phone.trim().toLowerCase()) ||
      (sessionUser.phone && thread.customerContact.trim().toLowerCase() === sessionUser.phone.trim().toLowerCase());
    if (!owns) {
      return res.status(403).json({ error: 'شما دسترسی به این گفت‌وگو را ندارید' });
    }
  } else {
    const contact = req.query.contact as string | undefined;
    if (!contact || thread.customerContact.trim().toLowerCase() !== contact.trim().toLowerCase()) {
      return res.status(403).json({ error: 'شما دسترسی به این گفت‌وگو را ندارید' });
    }
  }

  const role = sessionUser && sessionUser.role === 'admin' ? 'admin' : 'user';
  storage.markThreadRead(id, role);
  return res.json({ thread: storage.getThreadById(id) });
});

// ۳. ایجاد گفت‌وگوی جدید (همراه با پشتیبانی از تصویر و ویدیو)
app.post('/api/chat/threads', (req: Request, res: Response) => {
  const customerName = sanitizeText(req.body.customerName, 100);
  const customerContact = sanitizeText(req.body.customerContact, 100);
  const subject = sanitizeText(req.body.subject, 180);
  const orderId = req.body.orderId ? sanitizeText(req.body.orderId, 80) : undefined;
  const orderTitle = req.body.orderTitle ? sanitizeText(req.body.orderTitle, 150) : undefined;
  const initialMessage = sanitizeText(req.body.initialMessage, 4000);
  const userId = req.body.userId ? sanitizeText(req.body.userId, 80) : undefined;
  const attachments = sanitizeAttachments(req.body.attachments);

  if (!initialMessage && attachments.length === 0) {
    return res.status(400).json({ error: 'لطفاً متن پیام یا فایل تصویر/ویدیو را وارد کنید' });
  }

  const authHeader = req.headers.authorization;
  let senderRole: 'admin' | 'user' = 'user';
  let senderName = customerName;
  let boundUserId = userId;
  let finalCustomerName = customerName;
  let finalCustomerContact = customerContact;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) {
      if (session.role === 'admin') {
        senderRole = 'admin';
        senderName = 'مدیریت استودیو';
      } else {
        boundUserId = session.userId;
        senderName = session.fullName;
        finalCustomerName = session.fullName;
        if (session.phone) {
          finalCustomerContact = session.phone;
        }
      }
    }
  }

  if (!finalCustomerName || !finalCustomerContact) {
    return res.status(400).json({ error: 'نام و شماره تماس برای ثبت گفت‌وگو الزامی است' });
  }

  const defaultText = initialMessage || getDefaultAttachmentMessageText(attachments);

  const thread = storage.createThread({
    userId: boundUserId,
    customerName: finalCustomerName,
    customerContact: finalCustomerContact,
    subject: subject || (orderId ? `پیگیری سفارش کد ${orderId}` : 'درخواست جدید مشاوره و خدمات'),
    orderId,
    orderTitle,
    initialMessage: defaultText,
    attachments,
    senderRole,
    senderName,
  });

  return res.status(201).json({
    message: 'گفت‌وگو با موفقیت ایجاد شد',
    thread,
  });
});

// ۴. ارسال پیام جدید (متن، تصویر یا ویدیو) در گفت‌وگوی جاری
app.post('/api/chat/threads/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;
  const text = sanitizeText(req.body.text, 4000);
  const attachments = sanitizeAttachments(req.body.attachments);

  if (!text && attachments.length === 0) {
    return res.status(400).json({ error: 'متن پیام یا فایل پیوست الزامی است' });
  }

  const thread = storage.getThreadById(id);
  if (!thread) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }

  const authHeader = req.headers.authorization;
  let senderRole: 'admin' | 'user' = 'user';
  let senderName = thread.customerName;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) {
      if (session.role === 'admin') {
        senderRole = 'admin';
        senderName = 'مدیریت استودیو';
      } else {
        const userRec = storage.getUserById(session.userId);
        const owns =
          thread.userId === session.userId ||
          (userRec?.phone && thread.customerContact.trim().toLowerCase() === userRec.phone.trim().toLowerCase()) ||
          (sessionUserPhoneMatch(session.phone, thread.customerContact));
        if (!owns) {
          return res.status(403).json({ error: 'شما مجاز به ارسال پیام در این گفت‌وگو نیستید' });
        }
        senderName = session.fullName;
      }
    }
  } else {
    const contact = req.body.contact || req.query.contact;
    if (!contact || thread.customerContact.trim().toLowerCase() !== String(contact).trim().toLowerCase()) {
      return res.status(403).json({ error: 'شما مجاز به ارسال پیام در این گفت‌وگو نیستید' });
    }
  }

  const finalText = text || getDefaultAttachmentMessageText(attachments);

  const updatedThread = storage.addMessageToThread(id, {
    senderRole,
    senderName,
    text: finalText,
    attachments,
  });

  return res.json({
    message: 'پیام ارسال شد',
    thread: updatedThread,
  });
});

function sessionUserPhoneMatch(sessionPhone?: string, threadContact?: string): boolean {
  if (!sessionPhone || !threadContact) return false;
  return sessionPhone.trim().toLowerCase() === threadContact.trim().toLowerCase();
}

// ۵. تغییر وضعیت گفت‌وگو (بستن یا بازگشایی) توسط ادمین
app.patch('/api/chat/threads/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'open' && status !== 'closed') {
    return res.status(400).json({ error: 'وضعیت نامعتبر است' });
  }

  const updated = storage.updateThreadStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }

  return res.json({ message: 'وضعیت گفت‌وگو تغییر یافت', thread: updated });
});

// ۶. حذف گفت‌وگو توسط ادمین
app.delete('/api/chat/threads/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = storage.deleteThread(id);
  if (!deleted) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }
  return res.json({ message: 'گفت‌وگو حذف شد' });
});

// -----------------------------------------------------------------------------
// مسیرهای پروژه‌ها و نظرات کارفرمایان (Testimonials & Showcase API)
// -----------------------------------------------------------------------------

// ۱. دریافت لیست نظرات و پروژه‌های تاییدشده برای نمایش عمومی در سایت
app.get('/api/testimonials', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  let list = storage.getTestimonials('approved');

  if (category && ['3d', 'branding', 'web'].includes(category)) {
    list = list.filter((t) => t.category === category);
  }

  return res.json({ testimonials: list });
});

// ۲. ثبت تجربه و نظر جدید توسط خریداران و مراجعین سایت (ارسال جهت بررسی مدیریت)
app.post('/api/testimonials', (req: Request, res: Response) => {
  const name = sanitizeText(req.body.name, 80);
  const role = sanitizeText(req.body.role, 80);
  const company = sanitizeText(req.body.company, 100);
  const service = sanitizeText(req.body.service, 120);
  const quote = sanitizeText(req.body.quote, 1500);
  const outcome = sanitizeText(req.body.outcome, 150);
  const category = ['3d', 'branding', 'web'].includes(req.body.category)
    ? req.body.category
    : '3d';
  const rating = Math.min(5, Math.max(1, Number(req.body.rating) || 5));
  const trackingCode = sanitizeText(req.body.trackingCode, 30);
  const orderId = sanitizeText(req.body.orderId, 60);

  if (!name || !quote || !service) {
    return res.status(400).json({ error: 'نام، عنوان خدمت و متن نظر الزامی است' });
  }

  // استخراج هویت کاربر در صورت لاگین بودن
  let userId: string | undefined = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) {
      userId = session.userId;
    }
  }

  // ساخت حروف اختصاری آواتار
  const parts = name.split(' ').filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}.${parts[1][0]}`
      : name.slice(0, 2);

  const colors = [
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-600',
    'from-purple-400 to-pink-600',
    'from-emerald-400 to-teal-600',
    'from-sky-400 to-indigo-600',
    'from-rose-400 to-red-600',
  ];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  // تاریخ شمسی تقریبی
  const faDate = new Intl.DateTimeFormat('fa-IR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const created = storage.addTestimonial({
    category,
    name,
    role: role || 'کارفرما',
    company: company || 'برند اختصاصی',
    service,
    avatarColor,
    initials,
    outcome: outcome || 'همکاری رضایت‌بخش با سرعت بالا',
    rating,
    date: faDate,
    quote,
    status: 'pending', // ارسال برای بررسی و تایید مدیریت
    verified: Boolean(orderId || trackingCode),
    userId,
    orderId: orderId || undefined,
    trackingCode: trackingCode || undefined,
  });

  return res.status(201).json({
    message: 'تجربه و نظر ارزشمند شما با موفقیت ثبت شد و پس از بررسی تیم مدیریت، در سایت منتشر خواهد شد.',
    testimonial: created,
  });
});

// ۳. پنل ادمین: دریافت تمام پروژه‌ها و نظرات به تفکیک وضعیت (در انتظار، تاییدشده، ردشده)
app.get('/api/admin/testimonials', adminMiddleware, (req: Request, res: Response) => {
  const all = storage.getTestimonials('all');
  const stats = {
    total: all.length,
    approved: all.filter((t) => t.status === 'approved').length,
    pending: all.filter((t) => t.status === 'pending').length,
    rejected: all.filter((t) => t.status === 'rejected').length,
  };
  return res.json({ testimonials: all, stats });
});

// ۴. پنل ادمین: ایجاد مستقیم پروژه یا نظر با تایید آنی
app.post('/api/admin/testimonials', adminMiddleware, (req: Request, res: Response) => {
  const name = sanitizeText(req.body.name, 80);
  const role = sanitizeText(req.body.role, 80);
  const company = sanitizeText(req.body.company, 100);
  const service = sanitizeText(req.body.service, 120);
  const quote = sanitizeText(req.body.quote, 1500);
  const outcome = sanitizeText(req.body.outcome, 150);
  const category = ['3d', 'branding', 'web'].includes(req.body.category)
    ? req.body.category
    : '3d';
  const rating = Math.min(5, Math.max(1, Number(req.body.rating) || 5));

  if (!name || !quote || !service) {
    return res.status(400).json({ error: 'نام، عنوان خدمت و متن نظر الزامی است' });
  }

  const parts = name.split(' ').filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}.${parts[1][0]}`
      : name.slice(0, 2);

  const colors = [
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-600',
    'from-purple-400 to-pink-600',
    'from-emerald-400 to-teal-600',
    'from-sky-400 to-indigo-600',
    'from-rose-400 to-red-600',
  ];
  const avatarColor = req.body.avatarColor || colors[Math.floor(Math.random() * colors.length)];

  const faDate =
    req.body.date ||
    new Intl.DateTimeFormat('fa-IR', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());

  const created = storage.addTestimonial({
    category,
    name,
    role: role || 'مدیر کسب‌وکار',
    company: company || 'برند تجاری',
    service,
    avatarColor,
    initials,
    outcome: outcome || 'تحویل فوق‌سریع و حفظ کیفیت سینمایی',
    rating,
    date: faDate,
    quote,
    status: 'approved',
    verified: true,
  });

  return res.status(201).json({
    message: 'پروژه و نظر با موفقیت در سایت منتشر شد',
    testimonial: created,
  });
});

// ۵. پنل ادمین: تغییر وضعیت نظر (تایید یا رد)
app.patch('/api/admin/testimonials/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const status = req.body.status;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است' });
  }

  const updated = storage.updateTestimonialStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'مورد یافت نشد' });
  }

  return res.json({
    message: status === 'approved' ? 'نظر با موفقیت تایید و در سایت منتشر شد' : 'وضعیت نظر بروزرسانی شد',
    testimonial: updated,
  });
});

// ۶. پنل ادمین: حذف پروژه یا نظر
app.delete('/api/admin/testimonials/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = storage.deleteTestimonial(id);
  if (!deleted) {
    return res.status(404).json({ error: 'مورد یافت نشد' });
  }
  return res.json({ message: 'پروژه / نظر با موفقیت حذف شد' });
});

// -----------------------------------------------------------------------------
// اجرای بهینه در هر دو محیط Production (هاست رایگان / سرور واقعی) و Development
// -----------------------------------------------------------------------------
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distPath, 'index.html');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distIndex);

  if (isProd) {
    // سرو فوق‌سریع فایل‌های استاتیک بیلدشده با کش طولانی‌مدت برای فونت‌ها و باندل‌ها در هاست‌های رایگان
    app.use(
      express.static(distPath, {
        maxAge: '30d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (filePath.includes('/assets/') || filePath.includes('/fonts/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return next();
      }
      return res.sendFile(distIndex);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Full-stack server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
