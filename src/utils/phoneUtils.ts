/**
 * ابزارهای جامع اعتبارسنجی و نرمال‌سازی شماره تلفن همراه ایران (Regex)
 * و استخراج اپراتور و بررسی شماره‌های فیک/ساختگی (مانند ۱۲۳۴۵۶۷۸۹۰۱۱)
 */

export const PHONE_VERIFICATION_RULES = {
  title: 'قوانین صحت اطلاعات تماس و شماره تلفن همراه',
  short: 'ثبت شماره‌های غیرواقعی یا ساختگی (مانند ۱۲۳۴۵۶۷۸۹۰۱۱) خلاف قوانین بوده و منجر به لغو خودکار سفارش می‌شود.',
  full: 'طبق قوانین رسمی استودیو دیزاین کانسپت، ثبت هرگونه شماره تماس ساختگی، رندم، اشتباه یا تستی (مانند ۱۲۳۴۵۶۷۸۹۰۱۱ یا ارقام تکراری) اکیداً ممنوع است. تمام هماهنگی‌ها، ارسال فاکتور رسمی، لینک دانلود فایل‌های نهایی، کد پیگیری و تماس مدیریت تنها از طریق شماره موبایل واقعی و فعال انجام می‌پذیرد. در صورت ثبت شماره نادرست، سفارش به صورت خودکار لغو گردیده و حساب مسدود خواهد شد.',
};

/**
 * تبدیل تمام ارقام فارسی، عربی و کاراکترهای اضافی به فرمت استاندارد انگلیسی 09xxxxxxxxx
 */
export function normalizeIranianPhone(raw: string): string {
  if (!raw) return '';
  let clean = String(raw)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[\s\-_()]/g, '');

  if (clean.startsWith('+98')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('0098')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('98') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  } else if (clean.length === 10 && clean.startsWith('9')) {
    clean = '0' + clean;
  }
  return clean;
}

/**
 * رجکس استاندارد پیش‌شماره‌های معتبر تلفن همراه ایران:
 * همراه اول: 0910-0919, 0990-0994, 0996
 * ایرانسل: 0930, 0933, 0935-0939, 0901-0905, 0941
 * رایتل: 0920-0923
 * شاتل موبایل: 0998
 * تالیا و کیش: 0932, 0934
 * سایر اپراتورهای مجازی: 0999
 */
export const IRANIAN_MOBILE_REGEX = /^09(0[1-5]|1[0-9]|2[0-3]|3[0-9]|41|9[0-6,8,9])[0-9]{7}$/;

/**
 * تشخیص نام اپراتور بر اساس پیش‌شماره
 */
export function getIranianMobileOperator(normalizedPhone: string): string | null {
  if (!normalizedPhone || normalizedPhone.length < 4 || !normalizedPhone.startsWith('09')) {
    return null;
  }
  const prefix3 = normalizedPhone.slice(0, 3);
  const prefix4 = normalizedPhone.slice(0, 4);

  if (prefix3 === '091' || ['0990', '0991', '0992', '0993', '0994', '0996'].includes(prefix4)) {
    return 'همراه اول';
  }
  if (['0930', '0933', '0935', '0936', '0937', '0938', '0939', '0901', '0902', '0903', '0904', '0905', '0941'].includes(prefix4)) {
    return 'ایرانسل';
  }
  if (['0920', '0921', '0922', '0923'].includes(prefix4)) {
    return 'رایتل';
  }
  if (prefix4 === '0998') {
    return 'شاتل موبایل';
  }
  if (prefix4 === '0999') {
    return 'سامان‌تل / آپتل';
  }
  if (prefix4 === '0932' || prefix4 === '0934') {
    return 'تالیا / کیش سلولار';
  }
  return 'اپراتور همراه';
}

/**
 * بررسی اینکه آیا شماره تکرار ساختگی یک رقم یا شماره فیک مانند 123456789011 است یا خیر
 */
export function isBogusPhoneNumber(normalizedPhone: string): boolean {
  if (!normalizedPhone) return true;
  // بررسی تکرار یک رقم برای کل ۹ رقم انتهایی (مانند 09111111111 یا 09000000000)
  if (/^09(\d)\1{8}$/.test(normalizedPhone)) {
    return true;
  }
  // شماره‌های شناخته‌شده ساختگی
  const fakeSamples = [
    '09000000000',
    '09111111111',
    '09222222222',
    '09333333333',
    '09444444444',
    '09555555555',
    '09666666666',
    '09777777777',
    '09888888888',
    '09999999999',
    '12345678901',
    '123456789011',
    '01234567890',
  ];
  if (fakeSamples.includes(normalizedPhone)) {
    return true;
  }
  return false;
}

/**
 * اعتبارسنجی دقیق و جامع با بازگشت خطای واضح فارسی
 */
export function validateIranianMobileDetailed(raw: string): {
  isValid: boolean;
  error?: string;
  normalized: string;
  operatorName?: string;
} {
  if (!raw || !raw.trim()) {
    return {
      isValid: false,
      error: 'شماره تلفن همراه الزامی است.',
      normalized: '',
    };
  }

  const normalized = normalizeIranianPhone(raw);

  // بررسی عدم شروع با ۰۹ (مانند نمونه ذکرشده کاربر: ۱۲۳۴۵۶۷۸۹۰۱۱)
  if (!normalized.startsWith('09')) {
    return {
      isValid: false,
      error: 'شماره همراه باید حتماً با ۰۹ شروع شود. شماره‌های نامعتبر مانند ۱۲۳۴۵۶۷۸۹۰۱۱ پذیرفته نمی‌شوند.',
      normalized,
    };
  }

  // بررسی طول ۱۱ رقمی
  if (normalized.length !== 11) {
    return {
      isValid: false,
      error: `طول شماره واردشده (${normalized.length} رقم) نامعتبر است. شماره همراه باید دقیقاً ۱۱ رقم باشد (مثال: ۰۹۱۲۳۴۵۶۷۸۹).`,
      normalized,
    };
  }

  // بررسی شماره‌های ساختگی و تکرار ارقام
  if (isBogusPhoneNumber(normalized)) {
    return {
      isValid: false,
      error: 'شماره واردشده ساختگی یا دارای ارقام تکراری نامعتبر است. لطفاً شماره موبایل واقعی خود را وارد نمایید.',
      normalized,
    };
  }

  // تطبیق با رجکس رسمی اپراتورهای ایران
  if (!IRANIAN_MOBILE_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: 'پیش‌شماره اپراتور موبایل معتبر نیست. لطفاً شماره معتبر همراه اول، ایرانسل، رایتل و... را وارد فرمایید.',
      normalized,
    };
  }

  const operatorName = getIranianMobileOperator(normalized) || 'اپراتور همراه';
  return {
    isValid: true,
    normalized,
    operatorName,
  };
}

/**
 * تابع ساده سازگار برای کدهای موجود
 */
export function isValidIranianMobile(phone: string): boolean {
  return validateIranianMobileDetailed(phone).isValid;
}

/**
 * نمایش شماره به‌صورت خوانا (0912 345 6789)
 */
export function formatIranianPhoneDisplay(phone: string): string {
  const norm = normalizeIranianPhone(phone);
  if (norm.length === 11 && norm.startsWith('09')) {
    return `${norm.slice(0, 4)} ${norm.slice(4, 7)} ${norm.slice(7)}`;
  }
  return phone;
}
