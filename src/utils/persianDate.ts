/**
 * توابع کمکی تبدیل اعداد و تاریخ‌های شمسی
 */

export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/[0-9]/g, (char) => persianDigits[parseInt(char, 10)]);
}

export function formatPersianPrice(amount: number): string {
  const formatted = amount.toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

export function getIranianDayOfWeek(date: Date = new Date()): {
  index: number;
  dayName: string;
  dayShort: string;
} {
  const day = date.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const mapping: Record<number, { dayName: string; dayShort: string }> = {
    6: { dayName: 'شنبه', dayShort: 'ش' },
    0: { dayName: 'یک‌شنبه', dayShort: 'ی' },
    1: { dayName: 'دوشنبه', dayShort: 'د' },
    2: { dayName: 'سه‌شنبه', dayShort: 'س' },
    3: { dayName: 'چهارشنبه', dayShort: 'چ' },
    4: { dayName: 'پنج‌شنبه', dayShort: 'پ' },
    5: { dayName: 'جمعه', dayShort: 'ج' },
  };
  return {
    index: day,
    dayName: mapping[day].dayName,
    dayShort: mapping[day].dayShort,
  };
}

export function calculateDiscount(price: number, percent: number): number {
  if (percent <= 0) return price;
  return Math.round(price * (1 - percent / 100));
}
