import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrderItem, ServiceItem, UserProfile, AdminStats } from '../types';
import { formatPersianPrice, toPersianDigits } from '../utils/persianDate';
import { OrderInvoiceModal } from './OrderInvoiceModal';
import { AdminChatTab } from './AdminChatTab';

interface AdminPanelProps {
  onServicePriceUpdated?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onServicePriceUpdated }) => {
  const { token, isAdminPanelOpen, closeAdminPanel, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'messages' | 'services' | 'users' | 'analytics' | 'settings'>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // پیش‌انتخاب برای انتقال سریع از تب‌های سفارشات یا کاربران به چت
  const [preSelectedOrderId, setPreSelectedOrderId] = useState<string | null>(null);
  const [preSelectedUserId, setPreSelectedUserId] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // فرم‌های کنترل قیمت
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({});
  const [batchPercent, setBatchPercent] = useState('10');

  // یادداشت ادمین
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [adminNoteText, setAdminNoteText] = useState('');
  const [deliveryLinkText, setDeliveryLinkText] = useState('');

  // ثبت دستی سفارش
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerContact, setManualCustomerContact] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualUrgency, setManualUrgency] = useState<'normal' | 'express' | 'vip'>('normal');
  const [manualDescription, setManualDescription] = useState('');

  // تغییر رمز ادمین
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // پیش‌فاکتور
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderItem | null>(null);

  // پیام اعلان
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // واکشی داده‌ها از سرور
  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // ۱. سفارشات
      const resOrders = await fetch('/api/orders', { headers });
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data.orders || []);
      }

      // ۲. خدمات
      const resServices = await fetch('/api/services?admin=true');
      if (resServices.ok) {
        const data = await resServices.json();
        const sList: ServiceItem[] = data.services || [];
        setServices(sList);
        const pInputs: Record<string, string> = {};
        const dInputs: Record<string, string> = {};
        sList.forEach((s) => {
          pInputs[s.id] = s.startingPrice.toString();
          dInputs[s.id] = (s.discountPercent || 0).toString();
        });
        setPriceInputs(pInputs);
        setDiscountInputs(dInputs);
        if (sList.length > 0 && !manualServiceId) {
          setManualServiceId(sList[0].id);
          setManualPrice(sList[0].startingPrice.toString());
        }
      }

      // ۳. کاربران
      const resUsers = await fetch('/api/admin/users', { headers });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data.users || []);
      }

      // ۴. آمار
      const resStats = await fetch('/api/admin/stats', { headers });
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminPanelOpen) {
      fetchData();
    }
  }, [isAdminPanelOpen]);

  if (!isAdminPanelOpen) return null;

  // ۱. عملیات سفارشات
  const handleStatusChange = async (orderId: string, newStatus: OrderItem['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showNotification('success', 'وضعیت سفارش با موفقیت بروزرسانی شد');
        fetchData();
      }
    } catch {
      showNotification('error', 'خطا در تغییر وضعیت سفارش');
    }
  };

  const handleSaveAdminNote = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminNote: adminNoteText,
          deliveryLink: deliveryLinkText,
        }),
      });
      if (res.ok) {
        showNotification('success', 'یادداشت داخلی و لینک تحویل ذخیره شد');
        setEditingOrderId(null);
        fetchData();
      }
    } catch {
      showNotification('error', 'خطا در ثبت یادداشت');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification('success', 'سفارش حذف شد');
        fetchData();
      }
    } catch {
      showNotification('error', 'خطا در حذف سفارش');
    }
  };

  // ثبت دستی سفارش جدید
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomerName || !manualCustomerContact || !manualPrice) return;

    const chosenService = services.find((s) => s.id === manualServiceId) || services[0];

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: chosenService.id,
          serviceTitle: chosenService.title,
          customerName: manualCustomerName.trim(),
          customerContact: manualCustomerContact.trim(),
          urgency: manualUrgency,
          calculatedPrice: Number(manualPrice),
          description: manualDescription.trim(),
          status: 'pending',
        }),
      });

      if (res.ok) {
        showNotification('success', 'سفارش جدید با موفقیت ثبت شد');
        setIsManualOrderOpen(false);
        setManualCustomerName('');
        setManualCustomerContact('');
        setManualDescription('');
        fetchData();
      }
    } catch {
      showNotification('error', 'خطا در ثبت سفارش');
    }
  };

  // ۲. عملیات خدمات و قیمت‌ها
  const handleSaveService = async (serviceId: string) => {
    const rawPrice = priceInputs[serviceId];
    const rawDiscount = discountInputs[serviceId];
    const newPrice = Number(rawPrice);
    const discount = Number(rawDiscount) || 0;

    if (isNaN(newPrice) || newPrice < 0) {
      showNotification('error', 'مبلغ قیمت نامعتبر است');
      return;
    }

    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startingPrice: newPrice,
          discountPercent: discount,
        }),
      });

      if (res.ok) {
        showNotification('success', 'قیمت و مشخصات خدمت بروزرسانی و در سایت ذخیره شد');
        fetchData();
        if (onServicePriceUpdated) onServicePriceUpdated();
      }
    } catch {
      showNotification('error', 'خطا در ذخیره قیمت');
    }
  };

  const handleToggleServiceActive = async (service: ServiceItem) => {
    const newStatus = service.isActive === false ? true : false;
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        showNotification('success', `خدمت با موفقیت ${newStatus ? 'فعال' : 'غیرفعال'} شد`);
        fetchData();
        if (onServicePriceUpdated) onServicePriceUpdated();
      }
    } catch {
      showNotification('error', 'خطا در تغییر وضعیت خدمت');
    }
  };

  const handleBatchPriceChange = async (multiplier: number) => {
    try {
      const res = await fetch('/api/services/batch-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ percentChange: multiplier }),
      });
      if (res.ok) {
        showNotification('success', `قیمت تمامی خدمات با تغییر ${multiplier > 0 ? '+' : ''}${multiplier}٪ بروز شد`);
        fetchData();
        if (onServicePriceUpdated) onServicePriceUpdated();
      }
    } catch {
      showNotification('error', 'خطا در اعمال تغییر دسته‌جمعی');
    }
  };

  // ۳. تغییر رمز عبور ادمین
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.length < 5) {
      showNotification('error', 'رمز عبور باید حداقل ۵ کاراکتر باشد');
      return;
    }
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newAdminPassword }),
      });
      if (res.ok) {
        showNotification('success', 'رمز عبور ادمین با موفقیت تغییر یافت');
        setNewAdminPassword('');
      } else {
        showNotification('error', 'خطا در تغییر رمز عبور');
      }
    } catch {
      showNotification('error', 'خطای سرور');
    }
  };

  // ۴. خروجی گزارش CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showNotification('error', 'سفارشی برای خروجی وجود ندارد');
      return;
    }
    const headers = ['کد پیگیری', 'عنوان خدمت', 'نام مشتری', 'تماس', 'اولویت', 'مبلغ (تومان)', 'وضعیت', 'تاریخ'];
    const rows = orders.map((o) => [
      `STD-${o.trackingCode}`,
      `"${o.serviceTitle.replace(/"/g, '""')}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerContact}"`,
      o.urgency,
      o.calculatedPrice,
      o.status,
      new Date(o.createdAt).toLocaleDateString('fa-IR'),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `studio-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'فایل اکسل/CSV سفارشات دانلود شد');
  };

  // فیلتر و جستجوی سفارشات
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter;
    const matchesSearch =
      !orderSearch.trim() ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerContact.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.trackingCode.includes(orderSearch) ||
      o.serviceTitle.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // فیلتر و جستجوی کاربران
  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const s = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(s) ||
      u.username.toLowerCase().includes(s) ||
      (u.phone && u.phone.includes(s))
    );
  });

  const getStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">در انتظار بررسی</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">در حال انجام</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">تکمیل و تحویل‌شده</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">لغو شده</span>;
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-panel-title"
        className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/90 backdrop-blur-xl p-2 sm:p-4 flex justify-center items-center"
        onClick={closeAdminPanel}
      >
        <div
          className="relative w-full max-w-6xl max-h-[calc(100vh-2rem)] rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-[0_25px_80px_rgba(0,180,255,0.25)] text-slate-100 m-auto flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ۱. هدر اصلی پنل ادمین */}
          <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="admin-panel-title" className="text-base sm:text-xl font-black text-white">
                    پنل جامع مدیریت و کنترل استودیو
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    STUDIO_CORE // PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  کنترل قیمت‌ها، نظارت بر درخواست‌ها و سفارش‌های انجام‌شده، مدیریت کاربران و گزارشات مالی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                title="دانلود خروجی اکسل سفارشات"
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>خروجی اکسل</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  closeAdminPanel();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
              >
                خروج از ادمین
              </button>

              <button
                onClick={closeAdminPanel}
                aria-label="بستن پنل مدیریت"
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ۲. نوار تب‌های پنل */}
          <div className="px-4 sm:px-6 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>درخواست‌ها و سفارشات</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-bold">
                {toPersianDigits(orders.length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'messages'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>گفت‌وگو و پیام‌ها</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>کنترل قیمت و خدمات ({toPersianDigits(services.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>لیست کاربران ({toPersianDigits(users.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'analytics'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              گزارش مالی و عملکرد
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              تنظیمات ادمین
            </button>

            <button
              onClick={fetchData}
              title="بروزرسانی داده‌ها"
              className="mr-auto px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
            >
              ↻ تازه‌سازی
            </button>
          </div>

          {/* پیام اعلان موفقیت یا خطا */}
          {notification && (
            <div
              className={`mx-6 mt-3 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-ping" />
              <span>{notification.text}</span>
            </div>
          )}

          {/* بدنه محتوای تب‌ها */}
          <div
            className={`flex-1 ${
              activeTab === 'messages'
                ? 'p-2 sm:p-4 flex flex-col min-h-0 overflow-hidden'
                : 'p-4 sm:p-6 overflow-y-auto space-y-6'
            }`}
          >
            
            {/* ========================================================================= */}
            {/* ۱. تب درخواست‌ها و سفارشات (با تفکیک کامل سفارش‌های انجام‌شده) */}
            {/* ========================================================================= */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                
                {/* نوار جستجو و فیلترهای وضعیت */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  
                  {/* فیلترهای کلیکی وضعیت */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setOrderFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        orderFilter === 'all'
                          ? 'bg-slate-200 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      همه ({toPersianDigits(orders.length)})
                    </button>
                    <button
                      onClick={() => setOrderFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        orderFilter === 'pending'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      در انتظار بررسی ({toPersianDigits(orders.filter(o => o.status === 'pending').length)})
                    </button>
                    <button
                      onClick={() => setOrderFilter('in_progress')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        orderFilter === 'in_progress'
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-cyan-300'
                      }`}
                    >
                      در حال انجام ({toPersianDigits(orders.filter(o => o.status === 'in_progress').length)})
                    </button>
                    <button
                      onClick={() => setOrderFilter('completed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        orderFilter === 'completed'
                          ? 'bg-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : 'bg-slate-950 text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      سفارش‌های انجام‌شده ({toPersianDigits(orders.filter(o => o.status === 'completed').length)})
                    </button>
                    <button
                      onClick={() => setOrderFilter('cancelled')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        orderFilter === 'cancelled'
                          ? 'bg-rose-400 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-rose-300'
                      }`}
                    >
                      لغو شده ({toPersianDigits(orders.filter(o => o.status === 'cancelled').length)})
                    </button>
                  </div>

                  {/* جستجو و دکمه ثبت دستی */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="جستجو در سفارشات..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-48"
                    />

                    <button
                      onClick={() => setIsManualOrderOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow-sm transition-all"
                    >
                      + ثبت سفارش دستی
                    </button>
                  </div>
                </div>

                {/* فرم پاپ‌آپ ثبت سفارش دستی */}
                {isManualOrderOpen && (
                  <form onSubmit={handleCreateManualOrder} className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        ثبت سفارش مستقیم و دستی توسط ادمین
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsManualOrderOpen(false)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        ✕ انصراف
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">خدمت استودیو:</label>
                        <select
                          value={manualServiceId}
                          onChange={(e) => {
                            setManualServiceId(e.target.value);
                            const found = services.find(s => s.id === e.target.value);
                            if (found) setManualPrice(found.startingPrice.toString());
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        >
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">نام کارفرما / مشتری:</label>
                        <input
                          type="text"
                          required
                          placeholder="علیرضا یا شرکت..."
                          value={manualCustomerName}
                          onChange={(e) => setManualCustomerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">شماره یا آیدی تلگرام:</label>
                        <input
                          type="text"
                          required
                          placeholder="0912... یا @id"
                          value={manualCustomerContact}
                          onChange={(e) => setManualCustomerContact(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">مبلغ توافقی (تومان):</label>
                        <input
                          type="number"
                          required
                          value={manualPrice}
                          onChange={(e) => setManualPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">اولویت زمان‌بندی:</label>
                        <select
                          value={manualUrgency}
                          onChange={(e) => setManualUrgency(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        >
                          <option value="normal">عادی (استاندارد)</option>
                          <option value="express">اکسپرس (فوری)</option>
                          <option value="vip">VIP با نظارت مدیر</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">توضیحات و شرح نیازمندی:</label>
                      <textarea
                        rows={2}
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        placeholder="جزئیات توافق یا لینک‌های رفرنس..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsManualOrderOpen(false)}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md"
                      >
                        ثبت سفارش در سیستم
                      </button>
                    </div>
                  </form>
                )}

                {/* کارت‌های سفارشات */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
                    هیچ سفارشی با این مشخصات یافت نشد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {filteredOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className={`p-4 sm:p-5 rounded-2xl transition-all border ${
                          ord.status === 'completed'
                            ? 'bg-slate-900/90 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.08)]'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          
                          {/* اطلاعات سفارش */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                                کد پیگیری: STD-{toPersianDigits(ord.trackingCode)}
                              </span>
                              {getStatusBadge(ord.status)}
                              <span className="text-xs text-slate-400">
                                {new Date(ord.createdAt).toLocaleDateString('fa-IR')}
                              </span>
                              {ord.completedAt && (
                                <span className="text-xs text-emerald-400 font-medium">
                                  ✓ تحویل در: {new Date(ord.completedAt).toLocaleDateString('fa-IR')}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-white">
                              {ord.serviceTitle}
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 bg-black/30 p-2.5 rounded-xl border border-slate-800/60">
                              <div>
                                <span className="text-slate-400">کارفرما: </span>
                                <strong className="text-white">{ord.customerName}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400">تماس / تلگرام: </span>
                                <span className="font-mono text-cyan-300">{ord.customerContact}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">اولویت: </span>
                                <span className="font-semibold text-slate-200">
                                  {ord.urgency === 'vip' ? 'مدیریت VIP (+۵۰٪)' : ord.urgency === 'express' ? 'اکسپرس فوری (+۲۵٪)' : 'عادی'}
                                </span>
                              </div>
                            </div>

                            {/* توضیحات مشتری */}
                            {ord.description && (
                              <div className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 font-semibold block mb-0.5">درخواست مشتری:</span>
                                <p className="leading-relaxed">{ord.description}</p>
                              </div>
                            )}

                            {/* یادداشت ادمین و لینک تحویل (در صورت وجود) */}
                            {ord.adminNote && (
                              <div className="text-xs bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-200 space-y-1">
                                <span className="font-bold text-cyan-300 block">یادداشت داخلی استودیو:</span>
                                <p>{ord.adminNote}</p>
                              </div>
                            )}

                            {ord.deliveryLink && (
                              <div className="text-xs text-emerald-300 bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                                <span className="font-bold">لینک تحویل فایل‌ها:</span>
                                <a href={ord.deliveryLink} target="_blank" rel="noreferrer" className="underline font-mono truncate">
                                  {ord.deliveryLink}
                                </a>
                              </div>
                            )}

                            {/* فرم ویرایش یادداشت ادمین */}
                            {editingOrderId === ord.id && (
                              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-400/50 space-y-2 mt-2">
                                <span className="text-xs font-bold text-cyan-300 block">ویرایش یادداشت و لینک تحویل:</span>
                                <input
                                  type="text"
                                  placeholder="یادداشت داخلی (مثلاً: فایل ارسال شد / در انتظار تایید)"
                                  value={adminNoteText}
                                  onChange={(e) => setAdminNoteText(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="لینک دانلود پروژه (Google Drive, Dropbox, ...)"
                                  value={deliveryLinkText}
                                  onChange={(e) => setDeliveryLinkText(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setEditingOrderId(null)}
                                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                                  >
                                    انصراف
                                  </button>
                                  <button
                                    onClick={() => handleSaveAdminNote(ord.id)}
                                    className="px-4 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                                  >
                                    ذخیره یادداشت
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ستون عملیات مالی و تغییر وضعیت */}
                          <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] text-slate-400 block">مبلغ سفارش:</span>
                              <span className="text-base sm:text-lg font-black text-white">
                                {formatPersianPrice(ord.calculatedPrice)}
                              </span>
                            </div>

                            {/* تغییر وضعیت */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">وضعیت:</span>
                              <select
                                value={ord.status}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderItem['status'])}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-semibold"
                              >
                                <option value="pending">در انتظار بررسی</option>
                                <option value="in_progress">در حال انجام</option>
                                <option value="completed">تکمیل و تحویل‌شده</option>
                                <option value="cancelled">لغو شده</option>
                              </select>
                            </div>

                            {/* دکمه‌های اکشن سریع */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => {
                                  setPreSelectedOrderId(ord.id);
                                  setActiveTab('messages');
                                }}
                                title="ارسال پیام و باز کردن گفت‌وگو با مشتری این سفارش"
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <span>💬 پیام به مشتری</span>
                              </button>

                              <button
                                onClick={() => setSelectedInvoiceOrder(ord)}
                                title="مشاهده و چاپ پیش‌فاکتور رسمی"
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <span>📄 پیش‌فاکتور</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingOrderId(ord.id);
                                  setAdminNoteText(ord.adminNote || '');
                                  setDeliveryLinkText(ord.deliveryLink || '');
                                }}
                                title="افزودن یا ویرایش یادداشت و لینک تحویل"
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                              >
                                ✎ یادداشت
                              </button>

                              <button
                                onClick={() => handleDeleteOrder(ord.id)}
                                title="حذف سفارش"
                                className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs transition-colors"
                              >
                                🗑
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* ۱.۵. تب گفت‌وگوها، پیام‌ها و ارتباط با مشتریان (Live Chat Center) */}
            {/* ========================================================================= */}
            {activeTab === 'messages' && (
              <AdminChatTab
                token={token || ''}
                users={users}
                orders={orders}
                preSelectedOrderId={preSelectedOrderId}
                preSelectedUserId={preSelectedUserId}
                onClearPreSelected={() => {
                  setPreSelectedOrderId(null);
                  setPreSelectedUserId(null);
                }}
                showNotification={showNotification}
              />
            )}

            {/* ========================================================================= */}
            {/* ۲. تب کنترل قیمت و مدیریت خدمات */}
            {/* ========================================================================= */}
            {activeTab === 'services' && (
              <div className="space-y-5">
                
                {/* ابزار تغییر گروهی قیمت‌ها */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-bold text-white block">تغییر دسته‌جمعی تعرفه تمام خدمات</span>
                    <span className="text-xs text-slate-400">امکان اعمال تورم یا تخفیف همگانی به تمامی ۹ خدمت استودیو</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBatchPriceChange(10)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all"
                    >
                      +۱۰٪ افزایش همگانی
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchPriceChange(-10)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all"
                    >
                      -۱۰٪ تخفیف همگانی
                    </button>
                  </div>
                </div>

                {/* کارت‌های تک‌تک خدمات */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        svc.isActive === false
                          ? 'bg-slate-950/60 border-slate-800 opacity-60'
                          : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            {svc.number}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white">{svc.title}</h4>
                        </div>

                        {/* تاگل فعال / غیرفعال بودن */}
                        <button
                          type="button"
                          onClick={() => handleToggleServiceActive(svc)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            svc.isActive !== false
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {svc.isActive !== false ? '● فعال در سایت' : '○ غیرفعال'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            قیمت شروع به تومان:
                          </label>
                          <input
                            type="number"
                            value={priceInputs[svc.id] || ''}
                            onChange={(e) =>
                              setPriceInputs({
                                ...priceInputs,
                                [svc.id]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            درصد تخفیف ویژه (٪):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            placeholder="مثال: 15"
                            value={discountInputs[svc.id] || '0'}
                            onChange={(e) =>
                              setDiscountInputs({
                                ...discountInputs,
                                [svc.id]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          نمایش کنونی: <strong className="text-slate-100">{formatPersianPrice(svc.startingPrice)}</strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveService(svc.id)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95"
                        >
                          ذخیره تغییرات قیمت
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ۳. تب مشاهده و مدیریت کاربران */}
            {/* ========================================================================= */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                
                {/* جستجوی کاربران */}
                <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400">
                    مجموع کاربران ثبت‌نام‌شده: <strong className="text-white">{toPersianDigits(users.length)} نفر</strong>
                  </span>

                  <input
                    type="text"
                    placeholder="جستجوی کاربر با نام، نام کاربری یا شماره..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-64"
                  />
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">نام و نام خانوادگی</th>
                        <th className="p-3.5">نام کاربری</th>
                        <th className="p-3.5">شماره تماس / آیدی</th>
                        <th className="p-3.5">نقش</th>
                        <th className="p-3.5">تعداد سفارشات</th>
                        <th className="p-3.5">مجموع خرید</th>
                        <th className="p-3.5">تاریخ عضویت</th>
                        <th className="p-3.5">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/70">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span>{u.fullName}</span>
                          </td>
                          <td className="p-3.5 font-mono text-cyan-300">{u.username}</td>
                          <td className={`p-3.5 text-slate-300 ${u.phone ? 'font-mono' : ''}`}>
                            {u.phone || 'ثبت نشده'}
                          </td>
                          <td className="p-3.5">
                            {u.role === 'admin' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                مدیر ارشد
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                                مشتری
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-200">
                            {toPersianDigits(u.ordersCount || 0)}
                          </td>
                          <td className="p-3.5 font-extrabold text-cyan-300">
                            {u.totalSpent ? formatPersianPrice(u.totalSpent) : '۰ تومان'}
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fa-IR') : '-'}
                          </td>
                          <td className="p-3.5 flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                setPreSelectedUserId(u.id);
                                setActiveTab('messages');
                              }}
                              title="ارسال پیام مستقیم به این کاربر"
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>💬 ارسال پیام</span>
                            </button>
                            <button
                              onClick={() => {
                                setOrderSearch(u.fullName);
                                setActiveTab('orders');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                            >
                              سفارشات
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ۴. تب گزارش مالی و عملکرد */}
            {/* ========================================================================= */}
            {activeTab === 'analytics' && stats && (
              <div className="space-y-6">
                
                {/* کارت‌های شاخص‌های کلیدی عملکرد (KPIs) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 block">درآمد سفارش‌های تکمیل‌شده</span>
                    <span className="text-2xl font-black text-emerald-400 block">
                      {formatPersianPrice(stats.completedRevenue || 0)}
                    </span>
                    <span className="text-[10px] text-emerald-500/80">وصول‌شده و تسویه قطعی</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 block">ارزش کل پروژه‌ها</span>
                    <span className="text-2xl font-black text-cyan-300 block">
                      {formatPersianPrice(stats.totalRevenue || 0)}
                    </span>
                    <span className="text-[10px] text-slate-500">جاری + تکمیل‌شده</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 block">تعداد سفارش‌های انجام‌شده</span>
                    <span className="text-2xl font-black text-white block">
                      {toPersianDigits(stats.completedOrders || 0)} سفارش
                    </span>
                    <span className="text-[10px] text-cyan-400">تحویل ۱۰۰٪ موفق</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 block">نرخ تحویل و رضایت</span>
                    <span className="text-2xl font-black text-white block">
                      {stats.totalOrders > 0
                        ? toPersianDigits(Math.round(((stats.completedOrders + stats.inProgressOrders) / stats.totalOrders) * 100))
                        : '۱۰۰'}٪
                    </span>
                    <span className="text-[10px] text-emerald-400">بدون تاخیر در تحویل</span>
                  </div>
                </div>

                {/* وضعیت پروژه‌ها */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white">تفکیک وضعیت سفارشات استودیو</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                      <span className="text-xs text-amber-300 block mb-1">در انتظار بررسی</span>
                      <span className="text-xl font-bold text-white">{toPersianDigits(stats.pendingOrders)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                      <span className="text-xs text-cyan-300 block mb-1">در حال تولید و ادیت</span>
                      <span className="text-xl font-bold text-white">{toPersianDigits(stats.inProgressOrders)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                      <span className="text-xs text-emerald-400 block mb-1">تکمیل و تحویل‌شده</span>
                      <span className="text-xl font-bold text-white">{toPersianDigits(stats.completedOrders)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                      <span className="text-xs text-rose-400 block mb-1">لغو شده</span>
                      <span className="text-xl font-bold text-white">{toPersianDigits(stats.cancelledOrders || 0)}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* ۵. تب تنظیمات ادمین و تغییر رمز عبور */}
            {/* ========================================================================= */}
            {activeTab === 'settings' && (
              <div className="max-w-xl mx-auto space-y-6">
                
                {/* تغییر رمز عبور ادمین */}
                <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">تغییر رمز عبور ادمین</h4>
                    <p className="text-xs text-slate-400">
                      رمز عبور پیش‌فرض کنونی: <code className="text-cyan-300 font-mono">admin123</code>. شما می‌توانید رمز جدیدی برای امنیت پنل تعریف کنید.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">رمز عبور جدید ادمین:</label>
                    <input
                      type="password"
                      required
                      minLength={5}
                      placeholder="حداقل ۵ کاراکتر..."
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    ذخیره رمز عبور جدید ادمین
                  </button>
                </form>

                {/* اطلاعات فنی پایگاه داده */}
                <div className="p-5 rounded-2xl bg-black/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                  <span className="font-bold text-slate-200 block">پایداری داده‌ها (Data Persistence):</span>
                  <p>تمامی تغییرات قیمت‌ها، وضعیت سفارش‌ها، یادداشت‌ها و کاربران مستقیماً در فایل محلی <code className="text-cyan-300 font-mono">data/db.json</code> ذخیره می‌شوند و با ری‌استارت سرور هیچ دیتایی از دست نمی‌رود.</p>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* مدال پیش‌فاکتور رسمی برای مشاهده و چاپ */}
      <OrderInvoiceModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </>
  );
};
