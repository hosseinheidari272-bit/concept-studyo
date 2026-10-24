import React from 'react';
import { OrderItem } from '../types';
import { formatPersianPrice, toPersianDigits } from '../utils/persianDate';

interface OrderInvoiceModalProps {
  order: OrderItem | null;
  onClose: () => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (status: OrderItem['status']) => {
    switch (status) {
      case 'completed':
        return 'تکمیل و تسویه شده';
      case 'in_progress':
        return 'در حال اجرای پروژه';
      case 'cancelled':
        return 'لغو شده';
      default:
        return 'در انتظار بررسی اولیه';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-title"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/90 backdrop-blur-md p-3 sm:p-5 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-[0_25px_80px_rgba(0,180,255,0.25)] text-slate-100 m-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مدال پیش‌فاکتور */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h3 id="invoice-title" className="text-base sm:text-lg font-black text-white">
              پیش‌فاکتور و رسید رسمی استودیو
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>چاپ / ذخیره PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="بستن فاکتور"
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* محتوای قابل چاپ فاکتور */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 bg-slate-950" id="printable-invoice">
          
          {/* هدر سند با مهر دیجیتال */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xl font-black text-white block">استودیو دیزاین و خدمات دیجیتال</span>
              <span className="text-xs text-slate-400 block mt-0.5">پلتفرم تخصصی رندرینگ، ویدیو و معماری دیجیتال</span>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-300 space-y-1 bg-black/40 p-3 rounded-2xl border border-slate-800">
              <div><strong className="text-slate-400">شماره سند:</strong> STD-{toPersianDigits(order.trackingCode)}</div>
              <div><strong className="text-slate-400">تاریخ صدور:</strong> {new Date(order.createdAt).toLocaleDateString('fa-IR')}</div>
              <div><strong className="text-slate-400">وضعیت سند:</strong> <span className="text-cyan-300 font-bold">{getStatusText(order.status)}</span></div>
            </div>
          </div>

          {/* اطلاعات مشتری و کارفرما */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">مشخصات کارفرما / خریدار:</span>
              <span className="text-sm font-bold text-white block">{order.customerName}</span>
              <span className="text-cyan-300 font-mono block mt-0.5">{order.customerContact}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">اولویت تحویل و گارانتی:</span>
              <span className="font-semibold text-slate-200 block">
                {order.urgency === 'vip' ? 'مدیریت ارشد VIP (+۵۰٪)' : order.urgency === 'express' ? 'اکسپرس فوری (+۲۵٪)' : 'تحویل استاندارد'}
              </span>
              <span className="text-emerald-400 block mt-0.5">همراه با سورس فایل‌ها و لایسنس تجاری کامل</span>
            </div>
          </div>

          {/* جدول ردیف‌های خدمت */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="p-3">ردیف</th>
                  <th className="p-3">عنوان خدمت تخصصی</th>
                  <th className="p-3">نوع اولویت</th>
                  <th className="p-3">مبلغ نهایی (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/70">
                <tr>
                  <td className="p-3 text-slate-400">۱</td>
                  <td className="p-3 font-bold text-white">{order.serviceTitle}</td>
                  <td className="p-3 text-slate-300">
                    {order.urgency === 'vip' ? 'مدیریت VIP' : order.urgency === 'express' ? 'اکسپرس' : 'عادی'}
                  </td>
                  <td className="p-3 font-extrabold text-cyan-300 text-sm">
                    {formatPersianPrice(order.calculatedPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* شرح پروژه یا نیازمندی‌ها */}
          {order.description && (
            <div className="p-4 rounded-2xl bg-black/50 border border-slate-800/80 text-xs space-y-1">
              <span className="text-slate-400 font-semibold block">شرح نیازمندی و اهداف کارفرما:</span>
              <p className="text-slate-300 leading-relaxed">{order.description}</p>
            </div>
          )}

          {/* یادداشت ادمین و لینک فایل تحویل */}
          {(order.adminNote || order.deliveryLink) && (
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-2">
              <span className="text-cyan-300 font-bold block">گزارش و تحویل استودیو:</span>
              {order.adminNote && <p className="text-slate-300 leading-relaxed">{order.adminNote}</p>}
              {order.deliveryLink && (
                <div className="pt-1">
                  <span className="text-slate-400 ml-1">لینک دسترسی به فایل‌ها:</span>
                  <a
                    href={order.deliveryLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 underline font-mono break-all"
                  >
                    {order.deliveryLink}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* شرایط و مهر استودیو */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="space-y-1 text-center sm:text-right">
              <p>• این سند به‌صورت دیجیتال صادر شده و مورد تایید استودیو است.</p>
              <p>• تمامی رندرها با پشتیبانی فنی ۲۴/۷ و بازبینی رایگان همراه هستند.</p>
            </div>

            <div className="flex flex-col items-center p-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mb-1" />
              <span className="text-[11px] font-bold text-white">مهر رسمی استودیو خلاقیت</span>
              <span className="text-[9px] text-cyan-300 font-mono">VERIFIED // DIGITAL_SEAL</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
