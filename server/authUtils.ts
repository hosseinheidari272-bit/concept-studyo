import crypto from 'node:crypto';

export interface HashResult {
  hash: string;
  salt: string;
}

/**
 * ایجاد هش امن برای رمز عبور
 */
export function hashPassword(password: string, providedSalt?: string): HashResult {
  const salt = providedSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * بررسی صحت رمز عبور
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * اعتبارسنجی مقادیر فرم ثبت نام
 */
export function validateRegistration(
  username: string,
  password: string,
  fullName: string,
  phone?: string
): { valid: boolean; error?: string } {
  if (!username || username.trim().length < 3) {
    return { valid: false, error: 'نام کاربری باید حداقل ۳ کاراکتر باشد' };
  }
  if (!password || password.length < 5) {
    return { valid: false, error: 'رمز عبور باید حداقل ۵ کاراکتر باشد' };
  }
  if (!fullName || fullName.trim().length < 2) {
    return { valid: false, error: 'نام و نام خانوادگی را به‌درستی وارد کنید' };
  }
  if (!phone || phone.trim().length < 10) {
    return { valid: false, error: 'شماره موبایل معتبر (مثال: ۰۹۱۲۳۴۵۶۷۸۹) الزامی است' };
  }
  return { valid: true };
}

/**
 * تولید کد پیگیری رندوم برای سفارش
 */
export function generateTrackingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
