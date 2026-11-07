import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  OrderItem,
  ServiceItem,
  UserProfile,
  AdminStats,
  CoinSystemSettings,
  PromoBannerSettings,
  PaymentGatewaySettings,
  CoinPackageItem,
  CoinDesignId,
  CoinTransaction,
  TestimonialItem,
} from '../types';
import { formatPersianPrice, toPersianDigits } from '../utils/persianDate';
import { OrderInvoiceModal } from './OrderInvoiceModal';
import { AdminChatTab } from './AdminChatTab';
import { CoinEmblem, COIN_DESIGN_CATALOG } from './CoinBadge';
import { apiFetch as fetch } from '../utils/offlineApiBridge';

interface AdminPanelProps {
  onServicePriceUpdated?: () => void;
  isFullPage?: boolean;
  onExitFullPage?: () => void;
}

const DEFAULT_ADMIN_COIN_PACKAGES: CoinPackageItem[] = [
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
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onServicePriceUpdated,
  isFullPage = false,
  onExitFullPage,
}) => {
  const { token, isAdminPanelOpen, closeAdminPanel, refreshUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'orders' | 'messages' | 'coins' | 'services' | 'users' | 'analytics' | 'settings' | 'testimonials'
  >('orders');
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

  // فرم‌های کنترل قیمت، لینک‌های ارتباطی و نمایش سراسری
  const [showPricesOnSite, setShowPricesOnSite] = useState<boolean>(true);
  const [telegramUrlInput, setTelegramUrlInput] = useState<string>('https://t.me/concept_studio');
  const [baleUrlInput, setBaleUrlInput] = useState<string>('');
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({});
  const [batchPercent, setBatchPercent] = useState('10');

  // تنظیمات ضرب سکه (Coin System) و تیتر تبلیغاتی بالای سایت (Promo Banner)
  const [coinSystemState, setCoinSystemState] = useState<CoinSystemSettings>({
    enabled: false,
    coinName: 'کوین استودیو',
    coinSymbol: 'CSC',
    activeDesign: 'royal_crest',
    unitPriceToman: 500000,
    packages: DEFAULT_ADMIN_COIN_PACKAGES,
  });
  const [promoBannerState, setPromoBannerState] = useState<PromoBannerSettings>({
    enabled: false,
    text: 'حراج ویژه فصل: تا ۲۰٪ تخفیف روی پکیج‌های طراحی هویت بصری و پلتفرم‌های دیجیتال نسل بعدی!',
    badgeText: 'پیشنهاد ویژه',
    stickyOnScroll: true,
    linkHash: '#services',
  });
  const [paymentGatewayState, setPaymentGatewayState] = useState<PaymentGatewaySettings>({
    onlineEnabled: true,
    activeProvider: 'zarinpal',
    sandboxMode: true,
    zarinpalMerchantId: '',
    zibalMerchantId: 'zibal',
    customPaymentUrl: '',
    cardToCardEnabled: true,
    cardNumber: '',
    shebaNumber: 'IR240130100000000057446210',
    cardHolderName: 'مدیریت استودیو دیزاین کانسپت',
    bankName: 'بانک ملت / سامان',
    paymentInstruction:
      'پس از واریز وجه، ۴ رقم آخر کارت یا کد پیگیری رسید را در کادر زیر وارد کنید تا کوین بلافاصله به حساب شما اضافه شود.',
  });
  const [isBackupWorking, setIsBackupWorking] = useState(false);
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [grantUserId, setGrantUserId] = useState<string>('');
  const [grantAmount, setGrantAmount] = useState<string>('5');
  const [grantNote, setGrantNote] = useState<string>('');

  // وضعیت پروژه‌ها و نظرات کارفرمایان
  const [adminTestimonials, setAdminTestimonials] = useState<TestimonialItem[]>([]);
  const [testimonialStats, setTestimonialStats] = useState<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  }>({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [testiFilter, setTestiFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isSubmittingNewTestimonial, setIsSubmittingNewTestimonial] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    company: '',
    service: 'تیزر سه بعدی سینمایی محصول 4K',
    category: '3d' as '3d' | 'branding' | 'web',
    outcome: 'تحویل فوق‌سریع با حفظ بالاترین کیفیت سینمایی',
    rating: 5,
    quote: '',
  });

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

  // تغییر مشخصات ورود ادمین
  const [newAdminUsername, setNewAdminUsername] = useState('');
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

      // ۲. خدمات و تنظیمات سایت
      const resServices = await fetch('/api/services?admin=true', { headers });
      if (resServices.ok) {
        const data = await resServices.json();
        const sList: ServiceItem[] = data.services || [];
        setServices(sList);
        if (typeof data.showPrices === 'boolean') {
          setShowPricesOnSite(data.showPrices);
        }
        if (typeof data.telegramUrl === 'string') {
          setTelegramUrlInput(data.telegramUrl);
        }
        if (typeof data.baleUrl === 'string') {
          setBaleUrlInput(data.baleUrl);
        }
        if (data.coinSystem) {
          setCoinSystemState(data.coinSystem);
        }
        if (data.promoBanner) {
          setPromoBannerState(data.promoBanner);
        }
        if (data.paymentGateway) {
          setPaymentGatewayState(data.paymentGateway);
        }
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
        const uList: UserProfile[] = data.users || [];
        setUsers(uList);
        if (uList.length > 0 && !grantUserId) {
          setGrantUserId(uList[0].id);
        }
      }

      // ۴. آمار
      const resStats = await fetch('/api/admin/stats', { headers });
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data);
      }

      // ۵. تراکنش‌ها و درخواست‌های شارژ کوین
      const resCoins = await fetch('/api/coins/transactions?all=true', { headers });
      if (resCoins.ok) {
        const data = await resCoins.json();
        setCoinTransactions(data.transactions || []);
      }

      // ۶. پروژه‌ها و نظرات کارفرمایان
      const resTesti = await fetch('/api/admin/testimonials', { headers });
      if (resTesti.ok) {
        const data = await resTesti.json();
        setAdminTestimonials(data.testimonials || []);
        if (data.stats) {
          setTestimonialStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminPanelOpen || isFullPage) {
      fetchData();
    }
  }, [isAdminPanelOpen, isFullPage]);

  if (!isAdminPanelOpen && !isFullPage) return null;

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

  const handleToggleShowPrices = async () => {
    setIsUpdatingSettings(true);
    const newStatus = !showPricesOnSite;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ showPrices: newStatus }),
      });
      if (res.ok) {
        setShowPricesOnSite(newStatus);
        showNotification(
          'success',
          newStatus
            ? 'نمایش عمومی قیمت‌ها در سایت فعال شد (محدوده قیمت شروع تا ۱۰ برابر)'
            : 'نمایش قیمت‌ها در سایت غیرفعال شد (مخفی و حالت استعلام توافقی)'
        );
        if (onServicePriceUpdated) onServicePriceUpdated();
      } else {
        showNotification('error', 'خطا در تغییر وضعیت نمایش قیمت');
      }
    } catch {
      showNotification('error', 'خطای شبکه در ذخیره تنظیمات');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // ۲.۵. ذخیره لینک‌های تلگرام و گروه بله
  const handleSaveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegramUrl: telegramUrlInput.trim(),
          baleUrl: baleUrlInput.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setTelegramUrlInput(data.settings.telegramUrl ?? '');
          setBaleUrlInput(data.settings.baleUrl ?? '');
        }
        showNotification('success', 'لینک‌های ارتباطی تلگرام و گروه بله در سراسر سایت بروزرسانی شد');
        if (onServicePriceUpdated) onServicePriceUpdated();
      } else {
        showNotification('error', 'خطا در ذخیره لینک‌های ارتباطی');
      }
    } catch {
      showNotification('error', 'خطای شبکه در ذخیره لینک‌ها');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // ۲.۵.۲. ذخیره تنظیمات درگاه پرداخت آنلاین (زرین‌پال / زیبال / لینک پرداخت) و کارت‌به‌کارت
  const handleSavePaymentGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentGateway: paymentGatewayState,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.paymentGateway) {
          setPaymentGatewayState(data.settings.paymentGateway);
        }
        showNotification(
          'success',
          'تنظیمات درگاه پرداخت آنلاین و اطلاعات کارت به کارت با موفقیت ذخیره شد'
        );
        if (onServicePriceUpdated) onServicePriceUpdated();
      } else {
        showNotification('error', 'خطا در ذخیره تنظیمات درگاه پرداخت');
      }
    } catch {
      showNotification('error', 'خطای شبکه در ذخیره تنظیمات درگاه');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // ۲.۵.۳. دانلود بکاپ کامل دیتابیس (ویژه هاست رایگان و انتقال سرور)
  const handleDownloadBackup = async () => {
    if (!token) return;
    setIsBackupWorking(true);
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        showNotification('error', 'خطا در دریافت فایل پشتیبان');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `concept-studio-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'فایل پشتیبان کامل دیتابیس با موفقیت دانلود شد');
    } catch {
      showNotification('error', 'خطا در دانلود بکاپ');
    } finally {
      setIsBackupWorking(false);
    }
  };

  // ۲.۵.۴. آپلود و بازگردانی ۱-کلیکی فایل بکاپ دیتابیس
  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setIsBackupWorking(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'پشتیبان دیتابیس با موفقیت بازگردانی شد');
        fetchData();
        if (onServicePriceUpdated) onServicePriceUpdated();
      } else {
        showNotification('error', data.error || 'خطا در بازیابی فایل پشتیبان');
      }
    } catch {
      showNotification('error', 'فایل انتخاب‌شده معتبر نیست (فقط فایل JSON بکاپ سایت)');
    } finally {
      setIsBackupWorking(false);
      e.target.value = '';
    }
  };

  // ۲.۶. کلیک روی دکمه «ضرب سکه» (فعال یا غیرفعال کردن نمایش لوگو و سیستم کوین برای تمام کاربران)
  const handleToggleMintCoinSystem = async () => {
    setIsUpdatingSettings(true);
    const nextEnabled = !coinSystemState.enabled;
    const updatedCoinSystem: CoinSystemSettings = {
      ...coinSystemState,
      enabled: nextEnabled,
    };
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coinSystem: updatedCoinSystem,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.coinSystem) {
          setCoinSystemState(data.settings.coinSystem);
        } else {
          setCoinSystemState(updatedCoinSystem);
        }
        showNotification(
          'success',
          nextEnabled
            ? '🪙 ضرب سکه فعال شد! لوگو و کیف پول زرد و مشکی برای تمامی کاربران در سایت به نمایش درآمد.'
            : 'نمایش سکه و کیف پول کوین در سایت متوقف شد.'
        );
        if (onServicePriceUpdated) onServicePriceUpdated();
        await refreshUser();
      } else {
        showNotification('error', 'خطا در تغییر وضعیت ضرب سکه');
      }
    } catch {
      showNotification('error', 'خطای شبکه در ارتباط با سرور');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // ۲.۷. ذخیره کامل تنظیمات کوین (قیمت ۱ دونه کوین + بسته‌های هر X تعداد + طرح لوگو)
  const handleSaveCoinSettings = async (customState?: CoinSystemSettings) => {
    setIsUpdatingSettings(true);
    const payload = customState || coinSystemState;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coinSystem: payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.coinSystem) {
          setCoinSystemState(data.settings.coinSystem);
        }
        showNotification('success', 'تعرفه کوین‌ها، بسته‌های آماده و طرح سکه با موفقیت ذخیره شد');
        if (onServicePriceUpdated) onServicePriceUpdated();
      } else {
        showNotification('error', 'خطا در ذخیره تنظیمات سکه');
      }
    } catch {
      showNotification('error', 'خطای ارتباط با سرور');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // ۲.۸. ضرب و اعطای مستقیم کوین به کاربر توسط ادمین
  const handleGrantCoinsToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Math.floor(Number(grantAmount) || 0);
    if (!grantUserId || amountNum === 0) {
      showNotification('error', 'لطفاً کاربر و تعداد کوین غیرصفر را مشخص کنید');
      return;
    }
    try {
      const res = await fetch('/api/admin/coins/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: grantUserId,
          amount: amountNum,
          note: grantNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'موجودی کوین کاربر بروزرسانی شد');
        setGrantNote('');
        fetchData();
        await refreshUser();
      } else {
        showNotification('error', data.error || 'خطا در تغییر موجودی سکه کاربر');
      }
    } catch {
      showNotification('error', 'خطای ارتباط با سرور');
    }
  };

  // ۲.۹. تایید یا رد درخواست شارژ کوین کاربران
  const handleResolveTopupRequest = async (txId: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/coins/requests/${txId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approve }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'وضعیت درخواست کوین ثبت شد');
        fetchData();
        await refreshUser();
      } else {
        showNotification('error', data.error || 'خطا در بررسی درخواست کوین');
      }
    } catch {
      showNotification('error', 'خطای ارتباط با سرور');
    }
  };

  // ۲.۹.۱. فعال‌سازی یا غیرفعال‌سازی کوین برای هر کاربر انتخابی توسط مدیریت
  const handleToggleUserCoinAccess = async (userId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const res = await fetch(`/api/admin/users/${userId}/coin-access`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(
          'success',
          data.message || `دسترسی کوین برای کاربر مورد نظر ${nextStatus ? 'فعال' : 'غیرفعال'} شد`
        );
        fetchData();
        await refreshUser();
      } else {
        showNotification('error', data.error || 'خطا در تغییر دسترسی کوین کاربر');
      }
    } catch {
      showNotification('error', 'خطای ارتباط با سرور');
    }
  };

  // ۲.۱۰. ذخیره تنظیمات تیتر تبلیغاتی زیر هدر (Promo Header Banner)
  const handleSavePromoBanner = async (customPromo?: PromoBannerSettings) => {
    setIsUpdatingSettings(true);
    const payload = customPromo || promoBannerState;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promoBanner: payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.promoBanner) {
          setPromoBannerState(data.settings.promoBanner);
        }
        showNotification('success', 'تنظیمات تیتر تبلیغاتی زیر هدر با موفقیت ذخیره شد');
        if (onServicePriceUpdated) onServicePriceUpdated();
      } else {
        showNotification('error', 'خطا در ذخیره تیتر تبلیغاتی');
      }
    } catch {
      showNotification('error', 'خطای ارتباط با سرور');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // ۲.۱۱. عملیات مدیریت پروژه‌ها و نظرات کارفرمایان
  const handleApproveTestimonial = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'نظر با موفقیت تایید و در سایت منتشر شد');
        fetchData();
      } else {
        showNotification('error', data.error || 'خطا در تایید نظر');
      }
    } catch {
      showNotification('error', 'خطای شبکه در تایید نظر');
    }
  };

  const handleRejectTestimonial = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'rejected' }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'نظر رد شد و در سایت نمایش داده نمی‌شود');
        fetchData();
      } else {
        showNotification('error', data.error || 'خطا در تغییر وضعیت نظر');
      }
    } catch {
      showNotification('error', 'خطای شبکه');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm('آیا از حذف دائمی این پروژه یا نظر مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'مورد با موفقیت حذف شد');
        fetchData();
      } else {
        showNotification('error', data.error || 'خطا در حذف');
      }
    } catch {
      showNotification('error', 'خطای ارتباط با سرور');
    }
  };

  const handleCreateNewTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.name.trim() || !newTestimonial.quote.trim()) {
      showNotification('error', 'لطفاً نام و متن نظر را وارد کنید');
      return;
    }
    setIsSubmittingNewTestimonial(true);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTestimonial),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'پروژه و نظر با موفقیت در سایت منتشر شد');
        setNewTestimonial({
          name: '',
          role: '',
          company: '',
          service: 'تیزر سه بعدی سینمایی محصول 4K',
          category: '3d',
          outcome: 'تحویل فوق‌سریع با حفظ بالاترین کیفیت سینمایی',
          rating: 5,
          quote: '',
        });
        fetchData();
      } else {
        showNotification('error', data.error || 'خطا در ثبت');
      }
    } catch {
      showNotification('error', 'خطای شبکه در ثبت نظر');
    } finally {
      setIsSubmittingNewTestimonial(false);
    }
  };

  // ۳. تغییر مشخصات امنیتی ادمین
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.length < 6) {
      showNotification('error', 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد');
      return;
    }
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: newAdminPassword,
          newUsername: newAdminUsername.trim() || undefined,
        }),
      });
      if (res.ok) {
        showNotification('success', 'مشخصات امنیتی ادمین با موفقیت تغییر یافت');
        setNewAdminPassword('');
        setNewAdminUsername('');
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification('error', err.error || 'خطا در تغییر مشخصات امنیتی');
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
        role={isFullPage ? 'region' : 'dialog'}
        aria-modal={isFullPage ? undefined : 'true'}
        aria-labelledby="admin-panel-title"
        className={
          isFullPage
            ? 'min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col'
            : 'fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/90 backdrop-blur-xl p-2 sm:p-4 flex justify-center items-center'
        }
        onClick={isFullPage ? undefined : closeAdminPanel}
      >
        <div
          className={
            isFullPage
              ? 'relative w-full max-w-7xl mx-auto my-4 sm:my-6 flex-1 rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-[0_25px_80px_rgba(0,180,255,0.2)] text-slate-100 flex flex-col overflow-hidden'
              : 'relative w-full max-w-6xl max-h-[calc(100vh-2rem)] rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-[0_25px_80px_rgba(0,180,255,0.25)] text-slate-100 m-auto flex flex-col overflow-hidden'
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* ۱. هدر اصلی پنل ادمین */}
          <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#07090E] border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                <CoinEmblem design={coinSystemState.activeDesign || 'royal_crest'} size="md" withDarkFrame={false} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="admin-panel-title" className="text-base sm:text-xl font-black text-white">
                    پنل جامع مدیریت، ضرب سکه و کنترل استودیو
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                    STUDIO_CORE // PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ضرب سکه و مدیریت کیف پول کوین، تیتر تبلیغاتی بالای سایت، کنترل قیمت‌ها، سفارش‌ها و پیام‌ها
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isFullPage && (
                <a
                  href="/?page=panel&mode=admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="باز کردن پنل مدیریت در یک صفحه و تب مستقل جدید"
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.35)]"
                >
                  <span>↗ باز کردن در صفحه جدید</span>
                </a>
              )}

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
                  if (onExitFullPage) onExitFullPage();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
              >
                خروج از ادمین
              </button>

              <button
                onClick={() => {
                  if (isFullPage && onExitFullPage) {
                    onExitFullPage();
                  } else {
                    closeAdminPanel();
                  }
                }}
                aria-label="بستن پنل مدیریت"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-200 hover:text-white text-xs font-bold transition-colors"
              >
                {isFullPage ? 'بازگشت به سایت ←' : '✕'}
              </button>
            </div>
          </div>

          {/* ۲. نوار تب‌های پنل */}
          <div className="px-4 sm:px-6 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('coins')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'coins'
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(250,204,21,0.5)]'
                  : 'bg-[#07090E] text-amber-300 border border-amber-400/40 hover:border-amber-400'
              }`}
            >
              <span>🪙 ضرب سکه و تیتر تبلیغاتی</span>
              {coinTransactions.filter((t) => t.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {toPersianDigits(coinTransactions.filter((t) => t.status === 'pending').length)}
                </span>
              )}
            </button>

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
              onClick={() => setActiveTab('testimonials')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'testimonials'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                  : 'text-amber-300 hover:text-white hover:bg-slate-800 border border-amber-400/30'
              }`}
            >
              <span>⭐ پروژه‌ها و نظرات</span>
              {testimonialStats.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {toPersianDigits(testimonialStats.pending)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              تنظیمات و لینک‌های ارتباطی
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
            {/* ۰. تب ضرب سکه (Mint Coin)، بسته‌های ۴گانه زرد و مشکی و تیتر تبلیغاتی */}
            {/* ========================================================================= */}
            {activeTab === 'coins' && (
              <div className="space-y-6">
                {/* بخش ۱: دکمه اصلی «ضرب سکه» برای فعال‌سازی سکه در سایت */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#07090E] border-2 border-amber-400/60 shadow-[0_18px_50px_rgba(0,0,0,0.6),0_0_28px_rgba(250,204,21,0.12)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#0E121B] border-2 border-amber-400 shadow-[0_0_24px_rgba(250,204,21,0.3)] shrink-0">
                      <CoinEmblem
                        design={coinSystemState.activeDesign || 'royal_crest'}
                        size="xl"
                        withDarkFrame={false}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-xl font-black text-white">
                          عملیات «ضرب سکه» و پول اختصاصی سایت ({coinSystemState.coinName || 'کوین استودیو'})
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                            coinSystemState.enabled
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {coinSystemState.enabled ? '● ضرب سکه فعال در کل سایت' : '○ غیرفعال'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        با کلیک روی دکمه <strong className="text-amber-300">«ضرب سکه»</strong>، لوگوی سکه با ترکیب رنگ{' '}
                        <strong className="text-amber-300">زرد و مشکی</strong> (همراه با قاب مشکی ضد زنندگی چشم در تم روشن) در هدر سایت، پنل کاربری و پنجره ثبت سفارش برای تمام کاربران فعال می‌شود تا موجودی خود را ببینند و خریدهایشان را با کوین انجام دهند.
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-amber-300/90 pt-1">
                        <span>🛡️ امنیت ضد هک:</span>
                        <span>موجودی هر کاربر با امضای رمزنگاری سرور (HMAC-SHA256) قفل شده و از سمت مرورگر غیرقابل دستکاری است.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingSettings}
                    onClick={handleToggleMintCoinSystem}
                    className={`px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2.5 whitespace-nowrap shrink-0 active:scale-95 shadow-lg ${
                      coinSystemState.enabled
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 border-2 border-rose-400/60 text-rose-200'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 shadow-[0_0_28px_rgba(250,204,21,0.5)]'
                    }`}
                  >
                    <CoinEmblem
                      design={coinSystemState.activeDesign || 'royal_crest'}
                      size="sm"
                      withDarkFrame={true}
                    />
                    <span>
                      {coinSystemState.enabled
                        ? 'توقف نمایش سکه در سایت'
                        : '🪙 ضرب سکه (فعال‌سازی سکه برای تمام کاربران)'}
                    </span>
                  </button>
                </div>

                {/* بخش ۲: انتخاب از بین ۴ طرح آماده سکه زرد و مشکی (۱ طرح اصلی + ۳ طرح آماده دیگر) */}
                <div className="p-5 rounded-3xl bg-slate-900/85 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span>۴ طرح آماده لوگو و سکه (زرد و مشکی — بدون نیاز به طراحی مجدد)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        علاوه بر طرح اصلی، ۳ طرح دیگر هم از همین الان آماده و داخل سیستم قرار داده شده است. هر زمان بخواهید می‌توانید با یک کلیک طرح اصلی سکه سایت را تغییر دهید.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {COIN_DESIGN_CATALOG.map((design, idx) => {
                      const isSelected = coinSystemState.activeDesign === design.id;
                      return (
                        <button
                          key={design.id}
                          type="button"
                          onClick={() => {
                            const updated: CoinSystemSettings = {
                              ...coinSystemState,
                              activeDesign: design.id,
                            };
                            setCoinSystemState(updated);
                            handleSaveCoinSettings(updated);
                          }}
                          className={`p-4 rounded-2xl text-right transition-all border-2 flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#07090E] border-amber-400 shadow-[0_0_24px_rgba(250,204,21,0.25)]'
                              : 'bg-[#090C14] border-slate-800 hover:border-amber-400/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="p-2 rounded-2xl bg-[#04060A] border border-amber-400/50">
                              <CoinEmblem design={design.id} size="lg" withDarkFrame={false} />
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isSelected ? '✓ طرح فعال سایت' : `طرح شماره ${toPersianDigits(idx + 1)}`}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-black text-white">{design.title}</div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{design.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* بخش ۳: تعیین نرخ پایه هر ۱ دونه کوین و تعرفه هر X تعداد کوین (۴ بسته آماده) */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/85 border border-amber-500/30 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>💰</span>
                        <span>تعیین قیمت هر ۱ دونه کوین و بسته‌های هر X تعداد کوین</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        در این بخش مشخص کنید هر ۱ عدد سکه معادل چند تومان است و هر X تعداد سکه در بسته‌ها با چه قیمتی عرضه شود.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isUpdatingSettings}
                      onClick={() => handleSaveCoinSettings()}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all active:scale-95 shrink-0"
                    >
                      {isUpdatingSettings ? 'در حال ذخیره...' : '💾 ذخیره قیمت کوین و بسته‌ها'}
                    </button>
                  </div>

                  {/* تنظیم نام سکه و قیمت هر ۱ دونه */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#07090E] p-4 rounded-2xl border border-amber-400/30">
                    <div>
                      <label className="text-xs font-bold text-amber-300 block mb-1.5">
                        قیمت پایه هر ۱ دونه کوین (تومان):
                      </label>
                      <input
                        type="number"
                        min={1000}
                        step={10000}
                        value={coinSystemState.unitPriceToman}
                        onChange={(e) => {
                          const val = Math.max(1000, Number(e.target.value) || 0);
                          setCoinSystemState({
                            ...coinSystemState,
                            unitPriceToman: val,
                          });
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-400/50 text-sm text-amber-300 font-mono font-black focus:outline-none focus:border-amber-300"
                      />
                      <span className="text-[11px] text-slate-400 block mt-1">
                        هر ۱ دونه برابر است با: <strong className="text-white">{formatPersianPrice(coinSystemState.unitPriceToman || 0)}</strong>
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        نام پول / سکه سایت:
                      </label>
                      <input
                        type="text"
                        value={coinSystemState.coinName}
                        onChange={(e) =>
                          setCoinSystemState({
                            ...coinSystemState,
                            coinName: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        نماد اختصاری سکه (Symbol):
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={coinSystemState.coinSymbol}
                        onChange={(e) =>
                          setCoinSystemState({
                            ...coinSystemState,
                            coinSymbol: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* جدول ویرایش ۴ بسته آماده (هر X تعداد = فلان تومان) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-300">
                        تعرفه بسته‌های آماده (هر X تعداد کوین برابر با فلان تومان — شامل ۱ طرح پایه + ۳ طرح اضافه):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newPkg: CoinPackageItem = {
                            id: 'pkg_' + Date.now(),
                            title: `بسته ویژه (${toPersianDigits(15)} کوین)`,
                            coins: 15,
                            priceToman: 15 * (coinSystemState.unitPriceToman || 500000),
                            designId: 'solar_nova',
                            badge: 'بسته جدید',
                            isActive: true,
                          };
                          setCoinSystemState({
                            ...coinSystemState,
                            packages: [...coinSystemState.packages, newPkg],
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors"
                      >
                        + افزودن ردیف تعداد جدید
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {coinSystemState.packages.map((pkg, idx) => (
                        <div
                          key={pkg.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            pkg.isActive !== false
                              ? 'bg-[#080B12] border-amber-400/40'
                              : 'bg-slate-950/60 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-xl bg-[#04060A] border border-amber-400/50">
                                <CoinEmblem design={pkg.designId} size="md" withDarkFrame={false} />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono text-amber-400 block">
                                  بسته شماره {toPersianDigits(idx + 1)}
                                </span>
                                <input
                                  type="text"
                                  value={pkg.title}
                                  onChange={(e) => {
                                    const next = [...coinSystemState.packages];
                                    next[idx] = { ...pkg, title: e.target.value };
                                    setCoinSystemState({ ...coinSystemState, packages: next });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...coinSystemState.packages];
                                  next[idx] = { ...pkg, isActive: pkg.isActive === false ? true : false };
                                  setCoinSystemState({ ...coinSystemState, packages: next });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                  pkg.isActive !== false
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                              >
                                {pkg.isActive !== false ? 'فعال' : 'مخفی'}
                              </button>
                              {coinSystemState.packages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = coinSystemState.packages.filter((_, i) => i !== idx);
                                    setCoinSystemState({ ...coinSystemState, packages: next });
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px]"
                                  title="حذف بسته"
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">
                                تعداد کوین (X عدد):
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={pkg.coins}
                                onChange={(e) => {
                                  const next = [...coinSystemState.packages];
                                  next[idx] = { ...pkg, coins: Math.max(1, Number(e.target.value) || 1) };
                                  setCoinSystemState({ ...coinSystemState, packages: next });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">
                                قیمت کل بسته (تومان):
                              </label>
                              <input
                                type="number"
                                min={1000}
                                step={10000}
                                value={pkg.priceToman}
                                onChange={(e) => {
                                  const next = [...coinSystemState.packages];
                                  next[idx] = { ...pkg, priceToman: Math.max(1000, Number(e.target.value) || 1000) };
                                  setCoinSystemState({ ...coinSystemState, packages: next });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">
                                طرح لوگوی این بسته:
                              </label>
                              <select
                                value={pkg.designId}
                                onChange={(e) => {
                                  const next = [...coinSystemState.packages];
                                  next[idx] = { ...pkg, designId: e.target.value as CoinDesignId };
                                  setCoinSystemState({ ...coinSystemState, packages: next });
                                }}
                                className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                              >
                                {COIN_DESIGN_CATALOG.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                            <span>نمایش در پنل کاربری:</span>
                            <strong className="text-amber-300">
                              هر {toPersianDigits(pkg.coins)} دونه = {formatPersianPrice(pkg.priceToman)}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* بخش ۴: افزودن مستقیم کوین به کاربر توسط ادمین + تایید درخواست‌های شارژ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* فرم ضرب و تخصیص فوری سکه به کاربر */}
                  <form
                    onSubmit={handleGrantCoinsToUser}
                    className="p-5 rounded-3xl bg-slate-900/85 border border-slate-800 space-y-4"
                  >
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>⚡</span>
                        <span>افزودن یا کسر مستقیم کوین برای کاربر</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        سکه ضرب‌شده با امضای رمزنگاری سرور مستقیماً به کیف پول کاربر اضافه می‌شود.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-300 font-bold block mb-1">
                          انتخاب کاربر:
                        </label>
                        <select
                          value={grantUserId}
                          onChange={(e) => setGrantUserId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} ({u.username}) — موجودی فعلی: {toPersianDigits(u.coins || 0)} کوین
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-300 font-bold block mb-1">
                            تعداد کوین (مثبت = افزودن، منفی = کسر):
                          </label>
                          <input
                            type="number"
                            value={grantAmount}
                            onChange={(e) => setGrantAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-300 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-300 font-bold block mb-1">
                            علت یا توضیح تراکنش:
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: هدیه مدیریت یا شارژ کیف پول"
                            value={grantNote}
                            onChange={(e) => setGrantNote(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all"
                    >
                      🪙 اعمال و ضرب سکه در حساب کاربر
                    </button>
                  </form>

                  {/* لیست درخواست‌های افزودن کوین ثبت‌شده توسط کاربران */}
                  <div className="p-5 rounded-3xl bg-slate-900/85 border border-slate-800 space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-white">
                          درخواست‌های «افزودن کوین» کاربران
                        </h4>
                        <p className="text-xs text-slate-400">
                          درخواست‌هایی که کاربران از پنل کاربری ثبت کرده‌اند
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#07090E] text-amber-300 border border-amber-400/40">
                        {toPersianDigits(coinTransactions.filter((t) => t.status === 'pending').length)} در انتظار
                      </span>
                    </div>

                    <div className="flex-1 max-h-60 overflow-y-auto space-y-2.5 pr-1">
                      {coinTransactions.filter((t) => t.type === 'topup_request').length === 0 ? (
                        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                          هنوز درخواستی برای شارژ کوین ثبت نشده است.
                        </div>
                      ) : (
                        coinTransactions
                          .filter((t) => t.type === 'topup_request')
                          .map((reqTx) => (
                            <div
                              key={reqTx.id}
                              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <strong className="text-xs text-white">{reqTx.userFullName}</strong>
                                  <span className="px-2 py-0.5 rounded bg-[#07090E] text-amber-300 border border-amber-400/40 text-[11px] font-black">
                                    +{toPersianDigits(reqTx.amount)} کوین
                                  </span>
                                  {reqTx.priceToman ? (
                                    <span className="text-[11px] text-cyan-300 font-mono">
                                      ({formatPersianPrice(reqTx.priceToman)})
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-[11px] text-slate-400">{reqTx.note}</p>
                              </div>

                              {reqTx.status === 'pending' ? (
                                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                  {reqTx.userId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreSelectedUserId(reqTx.userId);
                                        setActiveTab('messages');
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1 transition-all"
                                      title="مشاهده چت مستقیم با کاربر جهت بررسی عکس فیش واریزی"
                                    >
                                      <span>📸 فیش در چت</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleResolveTopupRequest(reqTx.id, true)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                                  >
                                    ✓ تایید و ضرب سکه
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResolveTopupRequest(reqTx.id, false)}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold"
                                  >
                                    رد
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {reqTx.userId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreSelectedUserId(reqTx.userId);
                                        setActiveTab('messages');
                                      }}
                                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                                    >
                                      <span>💬 مشاهده چت کاربر</span>
                                    </button>
                                  )}
                                  <span
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                                      reqTx.status === 'completed'
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : 'bg-rose-500/15 text-rose-300'
                                    }`}
                                  >
                                    {reqTx.status === 'completed' ? '✓ تایید شده' : '✕ رد شده'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                {/* بخش ۴.۵: فعال‌سازی و کنترل کوین برای هر کاربر انتخابی */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0B0F19] via-slate-900 to-[#0B0F19] border border-amber-400/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 text-sm">
                          🪙
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-white">
                          فعال‌سازی کوین برای هر کاربر به صورت تکی و انتخابی
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        می‌توانید سیستم کوین را برای کاربران خاصی که می‌خواهید فعال کنید؛ حتی اگر کلید عمومی «ضرب سکه» خاموش باشد، کاربران تاییدشده به کوین، کیف‌پول و خرید خدمات دسترسی خواهند داشت.
                      </p>
                    </div>
                    <span className="text-xs text-amber-300 font-bold px-3 py-1 rounded-xl bg-black/60 border border-amber-400/30 whitespace-nowrap">
                      {toPersianDigits(users.filter((u) => u.coinEnabled).length)} کاربر دارای دسترسی ویژه
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                          u.coinEnabled
                            ? 'bg-[#080B12] border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <strong className="text-xs text-white block truncate">{u.fullName}</strong>
                          <span className="text-[11px] font-mono text-cyan-300 block truncate">@{u.username}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            موجودی: {toPersianDigits(u.coins || 0)} کوین
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleUserCoinAccess(u.id, Boolean(u.coinEnabled))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap active:scale-95 ${
                            u.coinEnabled
                              ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                          }`}
                        >
                          {u.coinEnabled ? '✓ کوین فعال' : '+ فعال‌سازی'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* بخش ۵: مدیریت «تیتر تبلیغاتی زیر هدر» (Promo Header Banner) و رفتار اسکرول */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#090D18] to-slate-900 border border-cyan-500/35 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            promoBannerState.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                          }`}
                        />
                        <h4 className="text-sm sm:text-base font-black text-white">
                          مدیریت «تیتر تبلیغاتی بالای سایت» (زیر هدر اصلی)
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        نمایش نوار اعلان و حراج ویژه با متن کوتاه دقیقاً در زیر هدر بالایی سایت، همراه با قابلیت انتخاب ثابت ماندن یا مخفی شدن هنگام اسکرول کاربر.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isUpdatingSettings}
                        onClick={() => {
                          const updated: PromoBannerSettings = {
                            ...promoBannerState,
                            enabled: !promoBannerState.enabled,
                          };
                          setPromoBannerState(updated);
                          handleSavePromoBanner(updated);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          promoBannerState.enabled
                            ? 'bg-rose-500/20 border border-rose-400/50 text-rose-200'
                            : 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                        }`}
                      >
                        {promoBannerState.enabled ? 'خاموش کردن تیتر تبلیغاتی' : '✓ فعال کردن تیتر تبلیغاتی'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        متن کوتاه تیتر تبلیغاتی (مثال: حراج ویژه یا اطلاعیه مهم):
                      </label>
                      <input
                        type="text"
                        maxLength={220}
                        placeholder="مثال: حراج ویژه عیدانه — تا ۲۵٪ تخفیف روی تمامی خدمات طراحی..."
                        value={promoBannerState.text}
                        onChange={(e) =>
                          setPromoBannerState({
                            ...promoBannerState,
                            text: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        برچسب کنار تیتر (Badge):
                      </label>
                      <input
                        type="text"
                        maxLength={40}
                        placeholder="پیشنهاد ویژه"
                        value={promoBannerState.badgeText || ''}
                        onChange={(e) =>
                          setPromoBannerState({
                            ...promoBannerState,
                            badgeText: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* انتخاب رفتار تیتر تبلیغاتی هنگام اسکرول کردن صفحه */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black text-white block">
                        وضعیت نمایش تیتر هنگام اسکرول کردن سایت توسط کاربر:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        مشخص کنید وقتی کاربر صفحه را به پایین اسکرول می‌کند، این تیتر تبلیغاتی بالای صفحه همراه او بماند یا فقط در بالای صفحه باشد.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setPromoBannerState({
                            ...promoBannerState,
                            stickyOnScroll: true,
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          promoBannerState.stickyOnScroll
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        📌 هنگام اسکرول باقی بماند (چسبان)
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPromoBannerState({
                            ...promoBannerState,
                            stickyOnScroll: false,
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          !promoBannerState.stickyOnScroll
                            ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-black'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        ⬆️ با اسکرول رد شود (فقط بالای سایت)
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isUpdatingSettings}
                      onClick={() => handleSavePromoBanner()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md transition-all"
                    >
                      ذخیره تنظیمات تیتر تبلیغاتی
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                
                {/* کنترل وضعیت نمایش سراسری قیمت‌ها در سایت */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${showPricesOnSite ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <h4 className="text-sm sm:text-base font-black text-white">
                        کنترل نمایش قیمت‌ها در وب‌سایت
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        showPricesOnSite 
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}>
                        {showPricesOnSite ? 'قیمت‌ها روشن' : 'قیمت‌ها خاموش'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      {showPricesOnSite
                        ? 'در حال حاضر قیمت‌ها به صورت محدوده تعرفه پروژه (شروع از قیمت پایه تا ۱۰ برابر آن) برای بازدیدکنندگان سایت نمایش داده می‌شوند.'
                        : 'قیمت‌ها در تمامی بخش‌های سایت مخفی شده‌اند و به جای ارقام، عبارت «استعلام و مشاوره توافقی» نمایش داده می‌شود.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingSettings}
                    onClick={handleToggleShowPrices}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0 shadow-md ${
                      showPricesOnSite
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    }`}
                  >
                    <span>
                      {showPricesOnSite ? 'مخفی کردن قیمت‌ها در سایت' : 'فعال کردن نمایش قیمت‌ها'}
                    </span>
                    <span className="text-sm">{showPricesOnSite ? '✕' : '✓'}</span>
                  </button>
                </div>

                {/* ابزار تغییر گروهی قیمت‌ها */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-bold text-white block">تغییر دسته‌جمعی تعرفه تمام خدمات</span>
                    <span className="text-xs text-slate-400">امکان اعمال افزایش یا تخفیف درصدی به تمامی خدمات استودیو</span>
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
                  {services.map((svc) => {
                    const currentInputPrice = Number(priceInputs[svc.id]) || svc.startingPrice;
                    const maxRangePrice = currentInputPrice * 10;
                    return (
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
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

                        {/* پیش‌نمایش محدوده قیمتی در سایت (شروع تا ۱۰ برابر) */}
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between mb-3">
                          <span className="text-slate-400">محدوده نمایش در سایت:</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            از {formatPersianPrice(currentInputPrice)} تا {formatPersianPrice(maxRangePrice)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="text-xs text-slate-400">
                            قیمت ذخیره‌شده فعلی: <strong className="text-slate-100">{formatPersianPrice(svc.startingPrice)}</strong>
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
                    );
                  })}
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
                        <th className="p-3.5">وضعیت کوین (تکی)</th>
                        <th className="p-3.5">موجودی کوین</th>
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
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleUserCoinAccess(u.id, Boolean(u.coinEnabled))}
                              title="فعال‌سازی یا غیرفعال‌سازی تکی کوین برای این کاربر"
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 whitespace-nowrap active:scale-95 ${
                                u.coinEnabled
                                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.25)]'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              <span>{u.coinEnabled ? '✓ کوین فعال' : '○ غیرفعال'}</span>
                            </button>
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#07090E] border border-amber-400/50 text-amber-300 font-black text-xs">
                              <span>🪙</span>
                              <span>{toPersianDigits(u.coins || 0)}</span>
                            </span>
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
                                setGrantUserId(u.id);
                                setActiveTab('coins');
                              }}
                              title="ضرب و افزودن کوین برای این کاربر"
                              className="px-2.5 py-1 rounded-lg bg-[#07090E] hover:bg-slate-900 text-amber-300 border border-amber-400/50 text-xs font-bold transition-colors"
                            >
                              🪙 ضرب سکه
                            </button>
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
            {/* ۵. تب تنظیمات ادمین، درگاه پرداخت مستقل، بکاپ هاست رایگان و امنیت */}
            {/* ========================================================================= */}
            {activeTab === 'settings' && (
              <div className="max-w-3xl mx-auto space-y-6">

                {/* ۱. پنل مستقل درگاه پرداخت آنلاین (شاپرک / زرین‌پال / زیبال / لینک پرداخت) و کارت‌به‌کارت */}
                <form
                  onSubmit={handleSavePaymentGateway}
                  className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#07090E] via-slate-900 to-[#0B0F17] border-2 border-amber-400/45 space-y-5 shadow-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] mb-1.5">
                        ۱۰۰٪ مستقل و بدون نیاز به برنامه‌نویس
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>💳</span>
                        <span>تنظیمات درگاه پرداخت آنلاین (شاپرک) و کارت‌به‌کارت بانکی</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        هر زمان اینماد یا کد درگاه گرفتید، فقط کد مرچنت را در کادر زیر قرار دهید تا شارژ کوین به صورت خودکار و آنی انجام شود. حتی بدون درگاه هم می‌توانید از کارت‌به‌کارت یا لینک پرداخت شخصی استفاده کنید.
                      </p>
                    </div>
                  </div>

                  {/* الف) تنظیمات درگاه آنلاین */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-amber-300 block">
                          ۱. درگاه پرداخت آنلاین و شارژ خودکار سکه
                        </span>
                        <span className="text-[11px] text-slate-400">
                          نمایش دکمه «پرداخت آنلاین و شارژ آنی» در پنل کاربری مشتریان
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentGatewayState((prev) => ({ ...prev, onlineEnabled: !prev.onlineEnabled }))
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          paymentGatewayState.onlineEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {paymentGatewayState.onlineEnabled ? '✓ درگاه آنلاین فعال است' : 'غیرفعال'}
                      </button>
                    </div>

                    {paymentGatewayState.onlineEnabled && (
                      <div className="space-y-4 pt-2 border-t border-slate-800/80">
                        {/* انتخاب شرکت ارائه‌دهنده درگاه */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-2">
                            انتخاب نوع درگاه پرداخت آنلاین:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {[
                              {
                                id: 'zarinpal' as const,
                                title: 'زرین‌پال (ZarinPal)',
                                sub: 'محبوب‌ترین درگاه شاپرک با واریز آنی سکه',
                              },
                              {
                                id: 'zibal' as const,
                                title: 'زیبال (Zibal)',
                                sub: 'تسویه سریع و پشتیبانی از کد تست zibal',
                              },
                              {
                                id: 'custom_link' as const,
                                title: 'لینک پرداخت شخصی',
                                sub: 'زرین‌لینک، پی‌پینگ، آیدی‌پی (بدون کدنویسی)',
                              },
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                  setPaymentGatewayState((prev) => ({ ...prev, activeProvider: item.id }))
                                }
                                className={`p-3 rounded-xl border text-right transition-all ${
                                  paymentGatewayState.activeProvider === item.id
                                    ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span className="text-xs font-black block text-amber-300">{item.title}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{item.sub}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* کلید حالت آزمایشی (Sandbox) */}
                        {paymentGatewayState.activeProvider !== 'custom_link' && (
                          <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-black text-amber-300 block">
                                🧪 حالت تست آزمایشی شاپرک (Sandbox — بدون نیاز به اینماد و اینترنت خارجی)
                              </span>
                              <span className="text-[11px] text-slate-300 block mt-0.5">
                                تا زمانی که کد مرچنت واقعی نگرفته‌اید این گزینه را روشن بگذارید تا صفحه شبیه‌ساز شاپرک باز شود و شارژ خودکار سکه را تست کنید. پس از دریافت مرچنت کد واقعی، این گزینه را خاموش کنید.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPaymentGatewayState((prev) => ({ ...prev, sandboxMode: !prev.sandboxMode }))
                              }
                              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                                paymentGatewayState.sandboxMode
                                  ? 'bg-amber-400 text-slate-950 shadow-md'
                                  : 'bg-emerald-500 text-slate-950 shadow-md'
                              }`}
                            >
                              {paymentGatewayState.sandboxMode ? 'حالت تست (Sandbox) روشن' : 'حالت واقعی شاپرک (Live)'}
                            </button>
                          </div>
                        )}

                        {/* فیلد کد مرچنت زرین‌پال */}
                        {paymentGatewayState.activeProvider === 'zarinpal' && (
                          <div>
                            <label className="text-xs font-bold text-amber-300 block mb-1.5">
                              کد مرچنت ۳۶ رقمی زرین‌پال (Merchant ID):
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              value={paymentGatewayState.zarinpalMerchantId}
                              onChange={(e) =>
                                setPaymentGatewayState((prev) => ({
                                  ...prev,
                                  zarinpalMerchantId: e.target.value,
                                }))
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              کد ۳۶ کاراکتری که از پنل کاربری زرین‌پال دریافت می‌کنید. آدرس بازگشت (Callback) به صورت کاملاً خودکار توسط سایت تنظیم می‌شود.
                            </span>
                          </div>
                        )}

                        {/* فیلد کد مرچنت زیبال */}
                        {paymentGatewayState.activeProvider === 'zibal' && (
                          <div>
                            <label className="text-xs font-bold text-amber-300 block mb-1.5">
                              کد مرچنت زیبال (Zibal Merchant):
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder="zibal"
                              value={paymentGatewayState.zibalMerchantId}
                              onChange={(e) =>
                                setPaymentGatewayState((prev) => ({
                                  ...prev,
                                  zibalMerchantId: e.target.value,
                                }))
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              در زیبال، کلمه <code className="text-amber-300 font-mono">zibal</code> برای تست است و پس از تایید درگاه، کد مرچنت اختصاصی خود را جایگزین می‌کنید.
                            </span>
                          </div>
                        )}

                        {/* فیلد لینک پرداخت شخصی */}
                        {paymentGatewayState.activeProvider === 'custom_link' && (
                          <div>
                            <label className="text-xs font-bold text-amber-300 block mb-1.5">
                              آدرس صفحه پرداخت شخصی شما (زرین‌لینک / پی‌پینگ / آیدی‌پی):
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder="https://zarinp.al/your_shop_name"
                              value={paymentGatewayState.customPaymentUrl}
                              onChange={(e) =>
                                setPaymentGatewayState((prev) => ({
                                  ...prev,
                                  customPaymentUrl: e.target.value,
                                }))
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              کاربر با کلیک روی دکمه پرداخت به این لینک هدایت می‌شود و همزمان درخواست او در لیست درخواست‌های کوین شما ثبت می‌گردد.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ب) تنظیمات کارت به کارت بانکی و شماره شبا (بدون نیاز به اینماد) */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-cyan-300 block">
                          ۲. روش کارت به کارت بانکی و شماره شبا (بدون نیاز به اینماد)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          نمایش کارت بانکی شما در پنل کاربری با قابلیت کپی سریع شماره کارت و ثبت کد پیگیری واریز
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentGatewayState((prev) => ({
                            ...prev,
                            cardToCardEnabled: !prev.cardToCardEnabled,
                          }))
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          paymentGatewayState.cardToCardEnabled
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {paymentGatewayState.cardToCardEnabled ? '✓ کارت به کارت فعال است' : 'غیرفعال'}
                      </button>
                    </div>

                    {paymentGatewayState.cardToCardEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            شماره کارت ۱۶ رقمی:
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            placeholder="6037-9975-XXXX-XXXX"
                            value={paymentGatewayState.cardNumber}
                            onChange={(e) =>
                              setPaymentGatewayState((prev) => ({ ...prev, cardNumber: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            شماره شبا (اختیاری - همراه با IR):
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            placeholder="IR000000000000000000000000"
                            value={paymentGatewayState.shebaNumber}
                            onChange={(e) =>
                              setPaymentGatewayState((prev) => ({ ...prev, shebaNumber: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            نام صاحب حساب:
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: علی محمدی"
                            value={paymentGatewayState.cardHolderName}
                            onChange={(e) =>
                              setPaymentGatewayState((prev) => ({ ...prev, cardHolderName: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            نام بانک:
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: بانک ملت / سامان"
                            value={paymentGatewayState.bankName}
                            onChange={(e) =>
                              setPaymentGatewayState((prev) => ({ ...prev, bankName: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            توضیحات راهنمای پرداخت برای مشتری:
                          </label>
                          <input
                            type="text"
                            value={paymentGatewayState.paymentInstruction}
                            onChange={(e) =>
                              setPaymentGatewayState((prev) => ({
                                ...prev,
                                paymentInstruction: e.target.value,
                              }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingSettings}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95"
                    >
                      {isUpdatingSettings ? 'در حال ذخیره...' : '💾 ذخیره تنظیمات درگاه پرداخت و کارت بانکی'}
                    </button>
                  </div>
                </form>

                {/* ۲. پشتیبان‌گیری و بازیابی ۱-کلیکی دیتابیس (مخصوص هاست‌های رایگان و جابه‌جایی سرور) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/35 space-y-4 shadow-lg">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] mb-1.5">
                      ویژه هاست رایگان و حفظ دائمی اطلاعات
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>💾</span>
                      <span>پشتیبان‌گیری و بازگردانی ۱-کلیکی کل اطلاعات سایت (Backup & Restore)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      چون در ابتدا قصد دارید سایت را روی سرویس‌های رایگان آنلاین کنید، با دکمه زیر هر زمان بخواهید می‌توانید کل اطلاعات سایت (کاربران، موجودی کوین‌ها، سفارش‌ها، پیام‌های چت و تنظیمات) را در یک فایل دانلود کنید و روی هر سرور جدیدی با یک کلیک بازگردانی نمایید.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isBackupWorking}
                      onClick={handleDownloadBackup}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span>⬇️ دانلود فایل بکاپ کامل سایت (JSON)</span>
                    </button>

                    <label className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-2">
                      <span>⬆️ انتخاب و بازگردانی فایل بکاپ</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleRestoreBackupFile}
                        disabled={isBackupWorking}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* ۳. مدیریت لینک‌های ارتباطی (تلگرام و گروه بله در فوتر و منوی سایت) */}
                <form onSubmit={handleSaveSocialLinks} className="p-5 sm:p-6 rounded-2xl bg-slate-900/85 border border-cyan-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        مدیریت لینک‌های ارتباطی (تلگرام و گروه بله)
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        لینک‌های زیر در فوتر سایت و منوی دسترسی سریع بالای صفحه قرار دارند. وقتی لینک گروه بله را وارد و ذخیره کنید، برچسب «به‌زودی» به طور خودکار برداشته می‌شود.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-cyan-300 block mb-1.5">
                        لینک ارتباط در تلگرام (Telegram):
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="https://t.me/your_id"
                        value={telegramUrlInput}
                        onChange={(e) => setTelegramUrlInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-[11px] text-slate-500 block mt-1">
                        مثال: <code className="font-mono text-slate-400">https://t.me/concept_studio</code>
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-emerald-300 block mb-1.5">
                        لینک گروه بله (Bale Group):
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="https://ble.ir/join/..."
                        value={baleUrlInput}
                        onChange={(e) => setBaleUrlInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
                      />
                      <span className="text-[11px] text-slate-500 block mt-1">
                        در صورت خالی بودن، برچسب «به‌زودی» کنار دکمه گروه بله نمایش داده می‌شود و به محض ثبت لینک، برچسب «به‌زودی» حذف شده و دکمه فعال می‌گردد.
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingSettings}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
                    >
                      {isUpdatingSettings ? 'در حال ذخیره...' : 'ذخیره لینک‌های تلگرام و بله'}
                    </button>
                  </div>
                </form>

                {/* ۴. تغییر نام کاربری و رمز عبور ادمین */}
                <form onSubmit={handleChangePassword} className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white mb-1">ارتقای امنیت و تغییر رمز عبور مدیریت</h4>
                    <p className="text-xs text-slate-400">
                      برای حفظ امنیت کامل پنل مدیریت، می‌توانید نام کاربری و رمز عبور اختصاصی جدید تعریف نمایید.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        نام کاربری جدید ادمین (اختیاری):
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="در صورت عدم تغییر خالی بگذارید"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        رمز عبور جدید ادمین <span className="text-cyan-400">*</span>:
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        dir="ltr"
                        placeholder="حداقل ۶ کاراکتر..."
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      بروزرسانی اطلاعات امنیتی ادمین
                    </button>
                  </div>
                </form>

                {/* ۵. دفترچه راهنمای دائمی آفلاین (همیشه همراه شما داخل پنل مدیریت) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-black/60 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                      <span>📘</span>
                      <span>راهنمای دائمی داخلی (بدون نیاز به اینترنت یا دسترسی به هوش مصنوعی)</span>
                    </h4>
                    <div className="flex items-center gap-2 text-[11px]">
                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono hover:bg-cyan-500/25 transition-colors"
                      >
                        /sitemap.xml ↗
                      </a>
                      <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono hover:bg-emerald-500/25 transition-colors"
                      >
                        /robots.txt ↗
                      </a>
                    </div>
                  </div>

                  <ul className="space-y-2.5 list-disc list-inside text-slate-400">
                    <li>
                      <strong className="text-white">راهنمای گام‌به‌گام مهاجرت سرور با فایل بکاپ JSON:</strong> ۱) در سایت فعلی وارد پنل مدیریت ← تب تنظیمات شوید و روی دکمه سبز «⬇️ دانلود فایل بکاپ کامل سایت (JSON)» کلیک کنید تا فایل روی گوشی یا کامپیوتر شما ذخیره شود. ۲) پس از راه‌اندازی سایت روی هاست یا سرور جدید، وارد پنل مدیریت سایت جدید شوید. ۳) در تب تنظیمات روی دکمه «⬆️ انتخاب و بازگردانی فایل بکاپ» کلیک کرده و همان فایل JSON را انتخاب کنید تا تمام کاربران، موجودی کوین‌ها، سفارش‌ها، پیام‌های چت و تنظیمات در ۲ ثانیه منتقل شوند.
                    </li>
                    <li>
                      <strong className="text-white">سئو و ثبت در گوگل سرچ کنسول (Google Search Console):</strong> فایل‌های استاندارد <code className="font-mono text-cyan-300">/sitemap.xml</code> و <code className="font-mono text-emerald-300">/robots.txt</code> به همراه اسکیماهای پیشرفته JSON-LD روی سایت فعال هستند. پس از اتصال دامنه، آدرس <code className="font-mono text-cyan-300">sitemap.xml</code> را در Google Search Console ثبت نمایید.
                    </li>
                    <li>
                      <strong className="text-white">نحوه فعال‌سازی درگاه بانکی خودکار:</strong> در سایت «زرین‌پال» یا «زیبال» ثبت‌نام کرده و درخواست درگاه دهید. کد ۳۶ رقمی دریافت‌شده (Merchant ID) را در کادر بالا وارد کنید و دکمه «حالت تست (Sandbox)» را خاموش کنید تا به «حالت واقعی شاپرک (Live)» تبدیل شود.
                    </li>
                    <li>
                      <strong className="text-white">کار بدون اینماد (کارت به کارت و لینک شخصی):</strong> اگر هنوز اینماد نگرفته‌اید، شماره کارت ۱۶ رقمی خود را در بخش «کارت به کارت» وارد کنید یا لینک صفحه شخصی زرین‌لینک/پی‌پینگ خود را در بخش «لینک پرداخت شخصی» قرار دهید.
                    </li>
                    <li>
                      <strong className="text-white">نصب روی هاست و سرور ایرانی (لیارا / پارس‌پک):</strong> پروژه به صورت یکپارچه با دستور <code className="font-mono text-cyan-300">npm run build</code> بیلد شده و با دستور <code className="font-mono text-cyan-300">npm start</code> روی پورت <code className="font-mono text-cyan-300">3000</code> اجرا می‌شود.
                    </li>
                  </ul>
                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* تب ۸: مدیریت پروژه‌های ثبت‌شده و نظرات کارفرمایان (Testimonials / Portfolio) */}
            {/* ===================================================================== */}
            {activeTab === 'testimonials' && (
              <div className="space-y-6">
                {/* بنر آمار کلی نظرات و پروژه‌ها */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">کل پروژه‌ها و نظرات:</span>
                    <span className="text-xl font-black text-white">
                      {toPersianDigits(adminTestimonials.length)}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
                    <span className="text-[11px] text-emerald-400 block mb-1">منتشرشده در سایت:</span>
                    <span className="text-xl font-black text-emerald-300">
                      {toPersianDigits(adminTestimonials.filter((t) => t.status === 'approved').length)}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 relative overflow-hidden">
                    <span className="text-[11px] text-amber-300 block mb-1">در انتظار بررسی مدیریت:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-amber-400">
                        {toPersianDigits(adminTestimonials.filter((t) => t.status === 'pending').length)}
                      </span>
                      {adminTestimonials.filter((t) => t.status === 'pending').length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">رد شده / غیرفعال:</span>
                    <span className="text-xl font-black text-slate-400">
                      {toPersianDigits(adminTestimonials.filter((t) => t.status === 'rejected').length)}
                    </span>
                  </div>
                </div>

                {/* بخش نظرات در انتظار تایید مدیریت */}
                {adminTestimonials.filter((t) => t.status === 'pending').length > 0 && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-400/50 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>نظرات جدید دریافتی از کاربران (نیازمند بررسی و تایید شما)</span>
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950">
                        {toPersianDigits(adminTestimonials.filter((t) => t.status === 'pending').length)} مورد جدید
                      </span>
                    </div>

                    <div className="space-y-3">
                      {adminTestimonials
                        .filter((t) => t.status === 'pending')
                        .map((t) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-xl bg-slate-950/90 border border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-2 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-white">{t.name}</span>
                                {t.role && (
                                  <span className="text-xs text-slate-400">({t.role})</span>
                                )}
                                {t.company && (
                                  <span className="text-xs text-cyan-300">«{t.company}»</span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                  {t.service}
                                </span>
                                {t.trackingCode && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                    کد سفارش: {toPersianDigits(t.trackingCode)}
                                  </span>
                                )}
                                <span className="text-amber-400 text-xs font-bold">
                                  {'★'.repeat(t.rating)} ({toPersianDigits(t.rating)} از ۵)
                                </span>
                              </div>

                              {t.outcome && (
                                <p className="text-xs font-bold text-cyan-300">
                                  🚀 نتیجه شاخص: {t.outcome}
                                </p>
                              )}

                              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                «{t.quote}»
                              </p>

                              <span className="text-[10px] text-slate-500 block">
                                ثبت‌شده در: {t.date}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              <button
                                type="button"
                                onClick={() => handleApproveTestimonial(t.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>✓ تایید و انتشار در سایت</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectTestimonial(t.id)}
                                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
                              >
                                ✕ رد نظر
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTestimonial(t.id)}
                                className="px-2.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs transition-all"
                                title="حذف دائمی"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* فرم افزودن دستی پروژه یا نظر توسط مدیریت */}
                <form
                  onSubmit={handleCreateNewTestimonial}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
                >
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>➕</span>
                      <span>افزودن مستقیم پروژه یا نظر کارفرما (انتشار فوری در سایت)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      می‌توانید نمونه‌کارهای موفق، نظرات مشتریان قدیمی یا پروژه‌های شاخص استودیو را مستقیماً به ویترین نظرات سایت اضافه کنید.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        نام کارفرما یا برند <span className="text-cyan-400">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: مهندس رامین کمالی"
                        value={newTestimonial.name}
                        onChange={(e) =>
                          setNewTestimonial({ ...newTestimonial, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        سمت یا عنوان حرفه‌ای:
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: مدیر ارشد مارکتینگ"
                        value={newTestimonial.role}
                        onChange={(e) =>
                          setNewTestimonial({ ...newTestimonial, role: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        نام شرکت یا مجموعه:
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: هلدینگ صنعتی آریا"
                        value={newTestimonial.company}
                        onChange={(e) =>
                          setNewTestimonial({ ...newTestimonial, company: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        عنوان خدمت انجام‌شده:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: تیزر سه بعدی سینمایی محصول 4K"
                        value={newTestimonial.service}
                        onChange={(e) =>
                          setNewTestimonial({ ...newTestimonial, service: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        دسته‌بندی اصلی:
                      </label>
                      <select
                        value={newTestimonial.category}
                        onChange={(e) =>
                          setNewTestimonial({
                            ...newTestimonial,
                            category: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="3d">تیزر و رندر سه‌بعدی</option>
                        <option value="branding">هویت بصری و برندینگ</option>
                        <option value="web">پلتفرم دیجیتال و سایت</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        امتیاز رضایت:
                      </label>
                      <select
                        value={newTestimonial.rating}
                        onChange={(e) =>
                          setNewTestimonial({
                            ...newTestimonial,
                            rating: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value={5}>۵ ستاره (عالی)</option>
                        <option value={4}>۴ ستاره (بسیار خوب)</option>
                        <option value={3}>۳ ستاره (متوسط)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      دستاورد یا نتیجه ملموس بیزینس (نمایش برجسته با بج):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: سرعت تحویل فوق‌العاده بالا و رشد ۲۸۰٪ فروش کمپین"
                      value={newTestimonial.outcome}
                      onChange={(e) =>
                        setNewTestimonial({ ...newTestimonial, outcome: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      متن بازخورد / توصیف همکاری <span className="text-cyan-400">*</span>:
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="متن نظر کارفرما درباره سرعت فوق‌العاده تحویل، حفظ کیفیت سینمایی و همکاری با استودیو..."
                      value={newTestimonial.quote}
                      onChange={(e) =>
                        setNewTestimonial({ ...newTestimonial, quote: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingNewTestimonial}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingNewTestimonial ? 'در حال انتشار...' : '✓ ثبت و انتشار آنی در سایت'}
                    </button>
                  </div>
                </form>

                {/* فهرست پروژه‌ها و نظرات موجود با امکان حذف و مدیریت */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>📁</span>
                      <span>تمام پروژه‌ها و نظرات ثبت‌شده در سیستم ({toPersianDigits(adminTestimonials.length)})</span>
                    </h4>

                    {/* فیلتر وضعیت */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'all', label: 'همه' },
                        { id: 'approved', label: 'منتشرشده' },
                        { id: 'pending', label: 'در انتظار' },
                        { id: 'rejected', label: 'رد شده' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTestiFilter(f.id as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            testiFilter === f.id
                              ? 'bg-cyan-500 text-slate-950 font-black'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminTestimonials
                      .filter((t) => (testiFilter === 'all' ? true : t.status === testiFilter))
                      .map((t) => (
                        <div
                          key={t.id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-white">{t.name}</span>
                                {t.company && (
                                  <span className="text-xs text-slate-400">({t.company})</span>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  t.status === 'approved'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : t.status === 'pending'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {t.status === 'approved'
                                  ? 'منتشر در سایت'
                                  : t.status === 'pending'
                                  ? 'در انتظار بررسی'
                                  : 'رد شده'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold">
                                {t.service}
                              </span>
                              <span className="text-amber-400 font-bold">
                                {'★'.repeat(t.rating)}
                              </span>
                              <span className="text-slate-500 text-[11px]">{t.date}</span>
                            </div>

                            {t.outcome && (
                              <div className="text-[11px] font-bold text-cyan-300 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-800/40">
                                🚀 {t.outcome}
                              </div>
                            )}

                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                              «{t.quote}»
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                            <span className="text-[10px] text-slate-500">
                              شناسه: <code className="font-mono">{t.id}</code>
                            </span>
                            <div className="flex items-center gap-2">
                              {t.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveTestimonial(t.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
                                >
                                  ✓ تایید و انتشار
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteTestimonial(t.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors"
                              >
                                🗑️ حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
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
