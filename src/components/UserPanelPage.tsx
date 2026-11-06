import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CoinSystemSettings, CoinTransaction, OrderItem, PaymentGatewaySettings } from '../types';
import { CoinEmblem, COIN_DESIGN_CATALOG } from './CoinBadge';
import { WalletBannerSkeleton, CoinPackageSkeleton } from './LoadingSkeleton';
import { formatPersianPrice, toPersianDigits } from '../utils/persianDate';
import { apiFetch as fetch } from '../utils/offlineApiBridge';
import {
  normalizeIranianPhone,
  validateIranianMobileDetailed,
  PHONE_VERIFICATION_RULES,
} from '../utils/phoneUtils';

interface UserPanelPageProps {
  coinSystem: CoinSystemSettings;
  paymentGateway?: PaymentGatewaySettings;
  onBackToSite: () => void;
  onOpenChat: (orderId?: string, orderTitle?: string) => void;
  onOpenAdminFullPage?: () => void;
}

export const UserPanelPage: React.FC<UserPanelPageProps> = ({
  coinSystem,
  paymentGateway: propGateway,
  onBackToSite,
  onOpenChat,
  onOpenAdminFullPage,
}) => {
  const { user, token, isAdmin, openAuthModal, refreshUser, logout } = useAuth();
  const { isLight, toggleTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<'wallet' | 'orders' | 'transactions' | 'profile'>('wallet');
  const [customCoinsInput, setCustomCoinsInput] = useState<string>('3');
  const [requestNote, setRequestNote] = useState<string>('');
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedSheba, setCopiedSheba] = useState(false);

  // وضعیت ویرایش پروفایل کاربری و اعتبارسنجی شماره تماس
  const [profileFullName, setProfileFullName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePhoneError, setProfilePhoneError] = useState('');
  const [profileOperator, setProfileOperator] = useState<string | null>(null);
  const [profilePhoneCheck, setProfilePhoneCheck] = useState<{
    exists: boolean;
    registered?: boolean;
    user?: { fullName: string; username: string };
    message?: string;
  } | null>(null);
  const [isCheckingProfilePhone, setIsCheckingProfilePhone] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const copyCardNumber = () => {
    if (!gatewayConfig.cardNumber) return;
    const cleanNumber = gatewayConfig.cardNumber.replace(/\s|-/g, '');
    navigator.clipboard?.writeText(cleanNumber);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const copyShebaNumber = () => {
    if (!gatewayConfig.shebaNumber) return;
    const cleanSheba = gatewayConfig.shebaNumber.replace(/\s/g, '');
    navigator.clipboard?.writeText(cleanSheba);
    setCopiedSheba(true);
    setTimeout(() => setCopiedSheba(false), 2500);
  };

  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewaySettings>(
    propGateway || {
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
    }
  );

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // وضعیت مدال ثبت تجربه و نظر سفارش
  const [reviewOrder, setReviewOrder] = useState<OrderItem | null>(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    outcome: '',
    quote: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleOpenReviewModal = (ord: OrderItem) => {
    setReviewOrder(ord);
    setReviewFormData({
      rating: 5,
      outcome: 'تحویل فوق‌سریع با رعایت بالاترین استانداردهای کیفیت',
      quote: '',
    });
    setReviewSuccess(null);
    setReviewError(null);
  };

  const handleSubmitOrderReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder || !reviewFormData.quote.trim()) return;
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user?.fullName || user?.username || 'کاربر استودیو',
          role: 'کارفرمای محترم',
          company: user?.username ? `@${user.username}` : 'سفارش اختصاصی',
          service: reviewOrder.serviceTitle,
          category: reviewOrder.serviceId.includes('web')
            ? 'web'
            : reviewOrder.serviceId.includes('brand') || reviewOrder.serviceId.includes('logo')
            ? 'branding'
            : '3d',
          rating: reviewFormData.rating,
          outcome: reviewFormData.outcome.trim() || 'تحویل فوق‌سریع و حفظ کمال کیفیت سینمایی',
          quote: reviewFormData.quote.trim(),
          orderId: reviewOrder.id,
          trackingCode: reviewOrder.trackingCode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccess(
          data.message || 'تجربه ارزشمند شما ثبت شد و پس از بررسی مدیریت در سایت منتشر خواهد شد.'
        );
      } else {
        setReviewError(data.error || 'خطا در ثبت نظر');
      }
    } catch {
      setReviewError('خطای ارتباط با سرور');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 6500);
  };

  useEffect(() => {
    if (user) {
      setProfileFullName(user.fullName || '');
      const userPhone = user.phone || '';
      setProfilePhone(userPhone);
      if (userPhone) {
        const val = validateIranianMobileDetailed(userPhone);
        if (val.isValid) {
          setProfileOperator(val.operatorName || null);
        }
      }
    }
  }, [user]);

  const handleProfilePhoneChange = (val: string) => {
    const norm = normalizeIranianPhone(val);
    setProfilePhone(norm);
    setProfilePhoneCheck(null);
    setProfileMessage(null);

    if (!norm) {
      setProfilePhoneError('');
      setProfileOperator(null);
      return;
    }

    if (!norm.startsWith('09') && norm.length >= 3) {
      setProfilePhoneError('شماره همراه باید حتماً با ۰۹ شروع شود (مانند ۰۹۱۲۳۴۵۶۷۸۹). شماره‌های نامعتبر مانند ۱۲۳۴۵۶۷۸۹۰۱۱ پذیرفته نمی‌شوند.');
      setProfileOperator(null);
      return;
    }

    if (norm.length >= 11) {
      const detail = validateIranianMobileDetailed(norm);
      if (!detail.isValid) {
        setProfilePhoneError(detail.error || 'شماره موبایل وارد شده نامعتبر است.');
        setProfileOperator(null);
      } else {
        setProfilePhoneError('');
        setProfileOperator(detail.operatorName || null);
        checkProfilePhoneUniqueness(norm);
      }
    } else {
      setProfilePhoneError('');
      setProfileOperator(null);
    }
  };

  const checkProfilePhoneUniqueness = async (cleanPhone: string) => {
    if (!cleanPhone || cleanPhone.length < 11) return;
    if (user?.phone && normalizeIranianPhone(user.phone) === cleanPhone) {
      setProfilePhoneCheck(null);
      return;
    }
    setIsCheckingProfilePhone(true);
    try {
      const res = await fetch(`/api/users/check-phone?phone=${encodeURIComponent(cleanPhone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.registered && data.user && data.user.id !== user?.id) {
          setProfilePhoneCheck(data);
        } else {
          setProfilePhoneCheck(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingProfilePhone(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!profileFullName.trim()) {
      setProfileMessage({ type: 'error', text: 'نام و نام خانوادگی الزامی است' });
      return;
    }

    const val = validateIranianMobileDetailed(profilePhone);
    if (!val.isValid) {
      setProfilePhoneError(val.error || 'شماره موبایل نامعتبر است');
      setProfileMessage({ type: 'error', text: val.error || 'شماره تلفن همراه معتبر ۱۱ رقمی با ۰۹ الزامی است' });
      return;
    }

    // بررسی عدم تکراری بودن شماره تلفن در پایگاه داده
    if (user?.phone && normalizeIranianPhone(user.phone) !== val.normalized) {
      try {
        const checkRes = await fetch(`/api/users/check-phone?phone=${encodeURIComponent(val.normalized)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.registered && checkData.user && checkData.user.id !== user?.id) {
            setProfileMessage({
              type: 'error',
              text: `این شماره موبایل متعلق به حساب کاربری دیگری («${checkData.user.fullName}») است و امکان ثبت تکراری وجود ندارد.`,
            });
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileFullName.trim(),
          phone: val.normalized,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage({ type: 'success', text: data.message || 'مشخصات حساب شما با موفقیت بروزرسانی شد' });
        await refreshUser();
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'خطا در ذخیره اطلاعات' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'خطای ارتباط با سرور' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.settings?.paymentGateway) {
          setGatewayConfig(sData.settings.paymentGateway);
        }
      }
    } catch {
      // ignore
    }

    if (!token) return;
    setIsLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, txRes] = await Promise.all([
        fetch('/api/orders', { headers }),
        fetch('/api/coins/transactions', { headers }),
      ]);

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.orders || []);
      }
      if (txRes.ok) {
        const tData = await txRes.json();
        setTransactions(tData.transactions || []);
      }
      await refreshUser();
    } catch {
      // ignore
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // بررسی بازگشت از درگاه پرداخت بانکی
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      const mintedCoins = params.get('coins') || '';
      const refCode = params.get('ref') || '';
      showFeedback(
        'success',
        `🎉 پرداخت آنلاین شما با موفقیت تایید شد! ${mintedCoins ? `${toPersianDigits(mintedCoins)} کوین` : 'کوین'} با کد پیگیری ${refCode} به صورت آنی به کیف پول شما اضافه گردید.`
      );
      params.delete('payment');
      params.delete('coins');
      params.delete('ref');
      const cleanQuery = params.toString();
      const basePath = window.location.pathname || './';
      window.history.replaceState({}, '', cleanQuery ? `${basePath}?${cleanQuery}` : `${basePath}?page=panel`);
    } else if (paymentStatus === 'failed') {
      showFeedback('error', 'فرآیند پرداخت آنلاین لغو شد یا ناموفق بود. در صورت کسر وجه، تا ۷۲ ساعت به حساب شما بازمی‌گردد.');
      params.delete('payment');
      const cleanQuery = params.toString();
      const basePath = window.location.pathname || './';
      window.history.replaceState({}, '', cleanQuery ? `${basePath}?${cleanQuery}` : `${basePath}?page=panel`);
    }
  }, [token]);

  // شروع پرداخت آنلاین از طریق درگاه شاپرک (زرین‌پال / زیبال / لینک شخصی / شبیه‌ساز تست)
  const handleOnlineGatewayPayment = async (opts: { packageId?: string; coins?: number }) => {
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    setIsSubmittingTopup(true);
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(opts),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        showFeedback('error', data.error || 'خطا در اتصال به درگاه پرداخت آنلاین');
      }
    } catch {
      showFeedback('error', 'خطای ارتباط با درگاه پرداخت');
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const handleRequestPackageTopup = async (packageId: string) => {
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    setIsSubmittingTopup(true);
    try {
      const res = await fetch('/api/coins/topup-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId,
          note: requestNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(
          'success',
          data.message || 'درخواست افزودن کوین با موفقیت ثبت شد. پس از تایید مدیریت به کیف پول شما اضافه می‌شود.'
        );
        setRequestNote('');
        fetchUserData();
      } else {
        showFeedback('error', data.error || 'خطا در ثبت درخواست افزودن کوین');
      }
    } catch {
      showFeedback('error', 'خطای ارتباط با سرور');
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const handleRequestCustomTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    const count = Math.floor(Number(customCoinsInput) || 0);
    if (count < 1) {
      showFeedback('error', 'لطفاً حداقل ۱ کوین وارد کنید');
      return;
    }

    setIsSubmittingTopup(true);
    try {
      const res = await fetch('/api/coins/topup-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coins: count,
          note: requestNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(
          'success',
          data.message || 'درخواست افزودن کوین دلخواه ثبت شد و پس از تایید مدیریت در کیف پول شما شارژ می‌گردد.'
        );
        setRequestNote('');
        fetchUserData();
      } else {
        showFeedback('error', data.error || 'خطا در ثبت درخواست کوین');
      }
    } catch {
      showFeedback('error', 'خطای ارتباط با سرور');
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const activePackages = (coinSystem.packages || []).filter((p) => p.isActive !== false);
  const customCoinsNum = Math.max(1, Math.floor(Number(customCoinsInput) || 1));
  const matchedTier = activePackages.find((p) => p.coins === customCoinsNum);
  const customCalculatedToman = matchedTier
    ? matchedTier.priceToman
    : customCoinsNum * (coinSystem.unitPriceToman || 500000);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? 'bg-[#F1F5F9] text-slate-900' : 'bg-[#04070D] text-slate-100'
      }`}
    >
      {/* نوار هدر اختصاصی صفحه پنل کاربری */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${
          isLight
            ? 'bg-white/95 border-slate-200/90 shadow-xs'
            : 'bg-[#070B14]/95 border-slate-800/90 shadow-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* لوگوی سکه با پس‌زمینه مشکی محافظ چشم */}
            <div className="p-1.5 rounded-2xl bg-[#07090E] border border-amber-400/50 shadow-[0_4px_16px_rgba(0,0,0,0.65)]">
              <CoinEmblem design={coinSystem.activeDesign || 'royal_crest'} size="md" withDarkFrame={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black">
                  پنل کاربری و کیف پول {coinSystem.coinName || 'کوین استودیو'}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#07090E] text-amber-400 border border-amber-400/40">
                  VERIFIED_WALLET
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                مدیریت موجودی سکه، افزودن کوین با بسته‌های آماده یا تعداد دلخواه و پیگیری سفارشات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {isAdmin && onOpenAdminFullPage && (
              <button
                type="button"
                onClick={onOpenAdminFullPage}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all flex items-center gap-1.5"
              >
                <span>⚙️</span>
                <span>ورود به پنل مدیریت و ضرب سکه</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
              }`}
            >
              {isLight ? 'تم تیره' : 'تم روشن'}
            </button>

            <a
              href="/"
              onClick={(e) => {
                // اگر داخل همان تب باز شده بود بدون رفرش برگردد
                if (!window.location.search.includes('page=panel')) {
                  e.preventDefault();
                  onBackToSite();
                }
              }}
              className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isLight
                  ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <span>بازگشت به صفحه اصلی سایت</span>
              <span>←</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {!user ? (
          /* اگر کاربر هنوز لاگین نکرده باشد */
          <div
            className={`p-8 sm:p-12 rounded-3xl border text-center max-w-xl mx-auto space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/90 border-slate-800 shadow-2xl'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#07090E] border-2 border-amber-400 flex items-center justify-center mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              <CoinEmblem design={coinSystem.activeDesign || 'royal_crest'} size="lg" withDarkFrame={false} />
            </div>
            <h2 className="text-xl font-black">ورود به پنل کاربری و کیف پول سکه</h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              برای مشاهده موجودی کوین، افزودن سکه جدید و بررسی سفارش‌های خود لطفاً وارد حساب کاربری شوید یا ثبت‌نام کنید.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all"
              >
                ورود به حساب کاربری
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className={`px-6 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
              >
                ایجاد حساب جدید
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ۱. کارت اصلی کیف پول زرد و مشکی یا لودینگ اسکلتون */}
            {isLoadingData ? (
              <WalletBannerSkeleton />
            ) : (
              <section
                aria-label="کیف پول سکه کاربر"
                className="relative rounded-3xl bg-[#07090E] border-2 border-amber-400/60 p-6 sm:p-8 text-white shadow-[0_20px_55px_rgba(0,0,0,0.65),0_0_30px_rgba(250,204,21,0.12)] overflow-hidden"
              >
                {/* افکت نوری زرد و مشکی در پس‌زمینه کارت */}
                <div
                  className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.18)_0%,transparent_70%)] pointer-events-none"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="p-3 rounded-3xl bg-[#0D111A] border-2 border-amber-400 shadow-[0_0_25px_rgba(250,204,21,0.3)]">
                      <CoinEmblem design={coinSystem.activeDesign || 'royal_crest'} size="xl" withDarkFrame={false} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                          {coinSystem.coinSymbol || 'CSC'} // OFFICIAL COIN
                        </span>
                        {user.coinEnabled && !coinSystem.enabled && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 border border-emerald-300">
                            ✦ دسترسی ویژه کوین فعال است
                          </span>
                        )}
                        <span className="text-xs text-slate-300 font-semibold">
                          حساب کاربری: <strong className="text-white">{user.fullName}</strong>
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                          {toPersianDigits((user.coins || 0).toLocaleString('en-US'))}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-amber-100">
                          {coinSystem.coinName || 'کوین استودیو'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        معادل ارزش فعلی کیف پول شما:{' '}
                        <strong className="text-amber-300 font-mono">
                          {formatPersianPrice((user.coins || 0) * (coinSystem.unitPriceToman || 500000))}
                        </strong>{' '}
                        (نرخ پایه هر ۱ سکه: {formatPersianPrice(coinSystem.unitPriceToman || 500000)})
                      </p>
                    </div>
                  </div>

                  {/* نشان امنیت ضد هک و اطلاعات کاربر */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-end justify-between gap-3 w-full lg:w-auto border-t lg:border-t-0 border-slate-800/80 pt-4 lg:pt-0">
                    <div className="px-3.5 py-2 rounded-2xl bg-[#111520] border border-amber-400/30 flex items-center gap-2 text-xs text-amber-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>محافظت‌شده با امضای رمزنگاری سرور (HMAC-SHA256)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchUserData}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                      >
                        ↻ بروزرسانی موجودی
                      </button>
                      <button
                        type="button"
                        onClick={logout}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 transition-colors"
                      >
                        خروج از حساب
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* اعلان بازخورد */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
                  feedback.type === 'success'
                    ? 'bg-[#07090E] border-amber-400 text-amber-300 shadow-lg'
                    : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span>{feedback.text}</span>
                </div>
                <button onClick={() => setFeedback(null)} className="text-xs opacity-75 hover:opacity-100">
                  ✕
                </button>
              </div>
            )}

            {/* تب‌های صفحه پنل کاربری */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveSection('wallet')}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSection === 'wallet'
                    ? 'bg-[#07090E] text-amber-300 border-2 border-amber-400 shadow-[0_6px_20px_rgba(0,0,0,0.3)]'
                    : isLight
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>➕ افزودن کوین و تعرفه بسته‌ها</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('orders')}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSection === 'orders'
                    ? 'bg-[#07090E] text-amber-300 border-2 border-amber-400 shadow-[0_6px_20px_rgba(0,0,0,0.3)]'
                    : isLight
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>📦 سفارش‌های من ({toPersianDigits(orders.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('transactions')}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSection === 'transactions'
                    ? 'bg-[#07090E] text-amber-300 border-2 border-amber-400 shadow-[0_6px_20px_rgba(0,0,0,0.3)]'
                    : isLight
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>📜 تاریخچه تراکنش‌های سکه ({toPersianDigits(transactions.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSection === 'profile'
                    ? 'bg-[#07090E] text-amber-300 border-2 border-amber-400 shadow-[0_6px_20px_rgba(0,0,0,0.3)]'
                    : isLight
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>👤 اطلاعات حساب و شماره تماس</span>
              </button>
            </div>

            {/* ===================================================================== */}
            {/* بخش ۱: افزودن کوین (۴ طرح آماده زرد و مشکی + محاسبه‌گر تعداد دلخواه X) */}
            {/* ===================================================================== */}
            {activeSection === 'wallet' && (
              <div className="space-y-6">
                {/* بررسی فعال بودن کوین برای کاربر (فعال‌سازی سراسری یا تکی توسط ادمین) */}
                {!coinSystem.enabled && !user?.coinEnabled && !isAdmin ? (
                  <div
                    className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 ${
                      isLight
                        ? 'bg-amber-50/70 border-amber-200 text-slate-900'
                        : 'bg-slate-900/90 border-amber-400/30 text-white'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#07090E] border-2 border-amber-400 flex items-center justify-center mx-auto shadow-lg">
                      <CoinEmblem design={coinSystem.activeDesign || 'royal_crest'} size="lg" withDarkFrame={false} />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-base sm:text-lg font-black text-amber-400">
                        سامانه کوین اختصاصی استودیو
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        سامانه پرداخت و شارژ کوین در حال حاضر برای حساب کاربری شما در مرحله فعال‌سازی توسط مدیریت قرار دارد.
                        مدیریت استودیو می‌تواند این ویژگی را به صورت تکی و اختصاصی برای شما فعال کند.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenChat(undefined, 'درخواست فعال‌سازی تکی سامانه کوین برای حساب کاربری')}
                      className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
                    >
                      <span>💬 درخواست فعال‌سازی تکی کوین در چت پشتیبانی</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* توضیح نرخ پایه ۱ کوین */}
                    <div
                      className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isLight
                          ? 'bg-white border-slate-200/90 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span>افزودن کوین به کیف پول (بسته‌های رسمی زرد و مشکی)</span>
                        </h2>
                        <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          ارزش پایه هر <strong className="font-black">۱ کوین</strong> برابر با{' '}
                          <strong className="font-black text-amber-500">
                            {formatPersianPrice(coinSystem.unitPriceToman || 500000)}
                          </strong>{' '}
                          است. می‌توانید یکی از ۴ طرح آماده زیر را انتخاب کنید یا هر تعداد دلخواه را سفارش دهید.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenChat(undefined, 'شارژ فوری کیف پول کوین')}
                        className="px-4 py-2.5 rounded-xl bg-[#07090E] hover:bg-slate-900 text-amber-300 border border-amber-400/50 text-xs font-black whitespace-nowrap shadow-md transition-all"
                      >
                        💬 هماهنگی مستقیم شارژ در چت
                      </button>
                    </div>

                    {/* گرید ۴ بسته و طرح آماده کوین یا اسکلتون لودینگ */}
                    {isLoadingData ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <CoinPackageSkeleton key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {activePackages.map((pkg, idx) => {
                          const designInfo = COIN_DESIGN_CATALOG.find((d) => d.id === pkg.designId) || COIN_DESIGN_CATALOG[0];
                          const regularPrice = pkg.coins * (coinSystem.unitPriceToman || 500000);
                          const hasDiscount = pkg.priceToman < regularPrice;

                          return (
                            <div
                              key={pkg.id}
                              className="group relative rounded-3xl bg-[#080B12] border-2 border-amber-400/40 hover:border-amber-400 p-5 text-white flex flex-col justify-between shadow-[0_14px_35px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1"
                            >
                              <div>
                                {/* بج بالای کارت */}
                                <div className="flex items-center justify-between gap-2 mb-4">
                                  <span className="text-[10px] font-mono font-bold text-slate-400">
                                    PLAN_0{idx + 1}
                                  </span>
                                  {pkg.badge ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                                      {pkg.badge}
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300">
                                      {designInfo.title}
                                    </span>
                                  )}
                                </div>

                                {/* لوگوی زرد و مشکی اختصاصی هر بسته */}
                                <div className="flex items-center gap-3.5 mb-4">
                                  <div className="p-2.5 rounded-2xl bg-[#04060A] border border-amber-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                                    <CoinEmblem design={pkg.designId} size="lg" withDarkFrame={false} />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-black text-white">{pkg.title}</h3>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                      <span className="text-2xl font-black text-amber-300">
                                        {toPersianDigits(pkg.coins)}
                                      </span>
                                      <span className="text-xs font-bold text-amber-100/90">
                                        {coinSystem.coinName || 'کوین'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* قیمت هر بسته */}
                                <div className="p-3 rounded-2xl bg-[#0D121D] border border-slate-800/90 mb-4 space-y-1">
                                  <span className="text-[11px] text-slate-400 block">
                                    هر {toPersianDigits(pkg.coins)} عدد برابر با:
                                  </span>
                                  <div className="text-base font-black text-amber-300">
                                    {formatPersianPrice(pkg.priceToman)}
                                  </div>
                                  {hasDiscount && (
                                    <div className="text-[11px] text-slate-500 line-through">
                                      قیمت پایه: {formatPersianPrice(regularPrice)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                {gatewayConfig.onlineEnabled && (
                                  <button
                                    type="button"
                                    disabled={isSubmittingTopup}
                                    onClick={() => handleOnlineGatewayPayment({ packageId: pkg.id })}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs shadow-[0_0_18px_rgba(250,204,21,0.35)] transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    {isSubmittingTopup
                                      ? 'در حال انتقال...'
                                      : `⚡ پرداخت آنلاین و شارژ آنی (${toPersianDigits(pkg.coins)} کوین)`}
                                  </button>
                                )}

                                {gatewayConfig.cardToCardEnabled && (
                                  <button
                                    type="button"
                                    disabled={isSubmittingTopup}
                                    onClick={() => handleRequestPackageTopup(pkg.id)}
                                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    💳 ثبت درخواست با کارت به کارت
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* کارت اطلاعات حساب بانکی (کپی سریع با یک کلیک شماره کارت و شماره شبا + ارسال عکس فیش در چت) */}
                    {gatewayConfig.cardToCardEnabled && (
                      <div className="p-5 sm:p-7 rounded-3xl bg-[#07090E] border-2 border-cyan-500/40 text-white space-y-5 shadow-2xl">
                        {/* هدر بخش کارت به کارت */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-cyan-400 text-slate-950 shadow-sm">
                              پرداخت دستی / کارت به کارت بانکی
                            </span>
                            <span className="text-xs font-bold text-cyan-300">
                              {gatewayConfig.bankName || 'بانک ملت / سامان'} — به نام:{' '}
                              <strong className="text-white">
                                {gatewayConfig.cardHolderName || 'مدیریت استودیو دیزاین کانسپت'}
                              </strong>
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>کپی سریع با ۱ کلیک</span>
                          </span>
                        </div>

                        {/* دو کارت برجسته شماره کارت و شماره شبا با قابلیت کپی سریع با ۱ کلیک */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* ۱. کادر شماره کارت با دکمه کپی اختصاصی */}
                          <div
                            onClick={copyCardNumber}
                            title="برای کپی سریع شماره کارت کلیک کنید"
                            className="p-4 rounded-2xl bg-slate-900/95 border border-amber-400/50 hover:border-amber-400 cursor-pointer transition-all duration-200 group flex items-center justify-between gap-3 shadow-lg"
                          >
                            <div className="space-y-1 min-w-0" dir="ltr">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  شماره کارت (۱۶ رقمی)
                                </span>
                                <span className="text-[10px] text-amber-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  • کلیک برای کپی
                                </span>
                              </div>
                              <span className="text-base sm:text-lg font-mono font-black tracking-widest text-amber-300 block truncate group-hover:text-amber-200">
                                {gatewayConfig.cardNumber || 'در پنل مدیریت ثبت می‌شود'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyCardNumber();
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                                copiedCard
                                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
                              }`}
                            >
                              <span>{copiedCard ? '✓ کپی شد!' : '📋 کپی شماره کارت'}</span>
                            </button>
                          </div>

                          {/* ۲. کادر شماره شبا (IBAN) با دکمه کپی اختصاصی */}
                          <div
                            onClick={copyShebaNumber}
                            title="برای کپی سریع شماره شبا کلیک کنید"
                            className="p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/50 hover:border-cyan-400 cursor-pointer transition-all duration-200 group flex items-center justify-between gap-3 shadow-lg"
                          >
                            <div className="space-y-1 min-w-0" dir="ltr">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  شماره شبا (IBAN / IR)
                                </span>
                                <span className="text-[10px] text-cyan-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  • کلیک برای کپی
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm font-mono font-black tracking-wider text-cyan-200 block truncate group-hover:text-cyan-100">
                                {gatewayConfig.shebaNumber || 'IR000000000000000000000000'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyShebaNumber();
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                                copiedSheba
                                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm'
                              }`}
                            >
                              <span>{copiedSheba ? '✓ کپی شد!' : '📋 کپی شماره شبا'}</span>
                            </button>
                          </div>
                        </div>

                        {/* بنر راهنمای شفاف: ارسال عکس فیش در چت تا زمان اتصال درگاه و تایید دستی ادمین */}
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <strong className="text-amber-300 font-black block flex items-center gap-2">
                              <span>📸</span>
                              <span>ارسال عکس فیش واریز جهت تایید دستی مدیریت استودیو</span>
                            </strong>
                            <p className="leading-relaxed text-amber-100/90 text-[11px] sm:text-xs">
                              تا زمان اضافه شدن درگاه پرداخت بانکی، لطفاً پس از کارت‌به‌کارت وجه، تصویر یا اسکرین‌شات فیش واریزی خود را در چت پشتیبانی ارسال فرمایید تا ادمین به صورت دستی آن را بررسی و کوین‌ها را بلافاصله ضرب و به کیف پولتان اضافه کند.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenChat(undefined, 'ارسال عکس فیش واریز کارت به کارت جهت تایید و شارژ کوین')}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs whitespace-nowrap shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                          >
                            <span>📸 ارسال فیش واریز در چت</span>
                            <span>←</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                  {/* فرم انتخاب تعداد دلخواه (هر X تعداد = فلان تومان) */}
                  <form
                    onSubmit={handleRequestCustomTopup}
                    className={`p-6 rounded-3xl border space-y-4 ${
                      isLight
                        ? 'bg-white border-slate-200/90 shadow-sm'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-500/15 pb-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                          <span>🔢</span>
                          <span>محاسبه‌گر و افزودن تعداد دلخواه کوین (هر X تعداد کوین)</span>
                        </h3>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          تعداد سکه مورد نظر خود را وارد کنید و به صورت آنی (درگاه آنلاین) یا کارت‌به‌کارت کیف پول خود را شارژ نمایید.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-xs font-bold block mb-1.5">
                          تعداد کوین درخواستی (X عدد):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          value={customCoinsInput}
                          onChange={(e) => setCustomCoinsInput(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-bold focus:outline-none ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                              : 'bg-slate-950 border-slate-700 text-white focus:border-amber-400'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1.5">
                          کد پیگیری کارت‌به‌کارت یا توضیح (اختیاری):
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: ۴ رقم آخر کارت یا کد پیگیری..."
                          value={requestNote}
                          onChange={(e) => setRequestNote(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                              : 'bg-slate-950 border-slate-700 text-white focus:border-amber-400'
                          }`}
                        />
                      </div>

                      {/* نمایش باکس مشکی-زرد نتیجه محاسبه */}
                      <div className="p-3.5 rounded-2xl bg-[#07090E] border border-amber-400/50 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            مبلغ هر {toPersianDigits(customCoinsNum)} کوین:
                          </span>
                          <span className="text-sm sm:text-base font-black text-amber-300">
                            {formatPersianPrice(customCalculatedToman)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {gatewayConfig.onlineEnabled && (
                            <button
                              type="button"
                              disabled={isSubmittingTopup}
                              onClick={() => handleOnlineGatewayPayment({ coins: customCoinsNum })}
                              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all active:scale-95 disabled:opacity-50"
                            >
                              ⚡ پرداخت آنلاین
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isSubmittingTopup}
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            ثبت رسید کارت
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

            {/* ===================================================================== */}
            {/* بخش ۲: سفارش‌های کاربر */}
            {/* ===================================================================== */}
            {activeSection === 'orders' && (
              <div className="space-y-4">
                {isLoadingData ? (
                  <div className="p-8 text-center text-xs text-slate-400">در حال بارگذاری سفارشات...</div>
                ) : orders.length === 0 ? (
                  <div
                    className={`p-10 rounded-3xl border text-center space-y-2 ${
                      isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="text-sm font-bold">هنوز سفارشی در حساب شما ثبت نشده است.</p>
                    <p className="text-xs">می‌توانید از صفحه اصلی سایت خدمات مورد نظر را با کوین یا به صورت معمولی ثبت کنید.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#07090E] text-amber-300 border border-amber-400/40">
                              STD-{toPersianDigits(ord.trackingCode)}
                            </span>
                            {ord.paidWithCoins && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#07090E] text-amber-400 border border-amber-400/50">
                                🪙 پرداخت‌شده با {toPersianDigits(ord.coinsSpent || 0)} کوین
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(ord.createdAt).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          <h3 className="text-base font-black">{ord.serviceTitle}</h3>
                          {ord.description && (
                            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{ord.description}</p>
                          )}
                          {ord.deliveryLink && (
                            <div className="pt-1">
                              <a
                                href={ord.deliveryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 underline"
                              >
                                <span>🔗 دانلود فایل‌های تحویلی پروژه</span>
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                          <span className="text-sm font-black">
                            {formatPersianPrice(ord.calculatedPrice)}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(ord)}
                              className="px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="ثبت تجربه و نظر درباره این سفارش"
                            >
                              <span>⭐ ثبت تجربه</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenChat(ord.trackingCode, ord.serviceTitle)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#07090E] text-amber-300 border border-amber-400/40 text-xs font-bold"
                            >
                              💬 گفت‌وگو
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===================================================================== */}
            {/* بخش ۳: تاریخچه تراکنش‌ها و درخواست‌های کوین */}
            {/* ===================================================================== */}
            {activeSection === 'transactions' && (
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div
                    className={`p-10 rounded-3xl border text-center text-xs ${
                      isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    هنوز تراکنشی برای کیف پول سکه شما ثبت نشده است.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              tx.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                : tx.status === 'pending'
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            }`}
                          >
                            {tx.status === 'completed'
                              ? 'تایید و اعمال‌شده'
                              : tx.status === 'pending'
                              ? 'در انتظار تایید مدیریت'
                              : 'رد شده'}
                          </span>
                          <span className="text-xs font-bold">{tx.note}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          {new Date(tx.createdAt).toLocaleString('fa-IR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {tx.priceToman ? (
                          <span className="text-xs text-slate-400 font-mono">
                            ({formatPersianPrice(tx.priceToman)})
                          </span>
                        ) : null}
                        <span
                          className={`px-3 py-1 rounded-xl font-black text-xs bg-[#07090E] border ${
                            tx.amount > 0
                              ? 'text-amber-300 border-amber-400/50'
                              : 'text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {tx.amount > 0 ? `+${toPersianDigits(tx.amount)}` : toPersianDigits(tx.amount)}{' '}
                          {coinSystem.coinName || 'کوین'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ===================================================================== */}
            {/* بخش ۴: اطلاعات حساب کاربری، شماره تلفن همراه و قوانین صحت اطلاعات */}
            {/* ===================================================================== */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* کارت راهنما و هدر بخش پروفایل */}
                <div
                  className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span>مشخصات حساب کاربری و شماره تلفن همراه معتبر</span>
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      برای دریافت به موقع پیامک‌های تحویل پروژه، فاکتور و پیگیری سفارشات، شماره همراه باید معتبر و فعال باشد.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#07090E] text-cyan-300 border border-cyan-500/30">
                      @{user.username}
                    </span>
                  </div>
                </div>

                {/* پیام بازخورد ذخیره اطلاعات */}
                {profileMessage && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
                      profileMessage.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${profileMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{profileMessage.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileMessage(null)}
                      className="text-xs opacity-75 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ستون ۲ سهمی: فرم ویرایش مشخصات */}
                  <div
                    className={`lg:col-span-2 p-6 sm:p-7 rounded-3xl border space-y-5 ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <h4 className="text-sm font-black border-b border-slate-500/15 pb-3">
                      ویرایش نام و شماره تلفن همراه
                    </h4>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      {/* نام کاربری (ثابت) */}
                      <div>
                        <label className="block text-xs font-semibold mb-1 opacity-75">
                          نام کاربری سیستم (شناسه ورود، غیرقابل تغییر):
                        </label>
                        <input
                          type="text"
                          disabled
                          value={user.username}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 text-xs sm:text-sm text-slate-400 font-mono cursor-not-allowed"
                        />
                      </div>

                      {/* نام و نام خانوادگی */}
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          نام و نام خانوادگی <span className="text-cyan-400">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          value={profileFullName}
                          onChange={(e) => setProfileFullName(e.target.value)}
                          placeholder="مثال: علیرضا محمدی"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                              : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                          }`}
                        />
                      </div>

                      {/* فیلد اعتبارسنجی شماره موبایل با Regex ایرانی */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold">
                            شماره تلفن همراه (جهت احراز و پیامک تحویل) <span className="text-rose-400">* (الزامی)</span>:
                          </label>
                          <div className="flex items-center gap-1.5">
                            {isCheckingProfilePhone && (
                              <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                                <span className="w-2 h-2 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                بررسی دیتابیس...
                              </span>
                            )}
                            {profileOperator && !profilePhoneError && !profilePhoneCheck?.registered && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                ✓ اپراتور {profileOperator}
                              </span>
                            )}
                          </div>
                        </div>

                        <input
                          type="tel"
                          required
                          dir="ltr"
                          placeholder="09123456789"
                          value={profilePhone}
                          onChange={(e) => handleProfilePhoneChange(e.target.value)}
                          onBlur={() => profilePhone.length >= 11 && checkProfilePhoneUniqueness(profilePhone)}
                          maxLength={13}
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-right focus:outline-none transition-colors ${
                            profilePhoneError || (profilePhoneCheck?.registered)
                              ? 'border-rose-500 focus:border-rose-400 bg-rose-500/5'
                              : profileOperator
                              ? 'border-emerald-500/60 focus:border-emerald-400'
                              : isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                              : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                          }`}
                        />

                        {profilePhoneError && (
                          <p className="mt-1.5 text-[11px] text-rose-300 leading-relaxed flex items-start gap-1">
                            <span className="text-rose-400 font-bold shrink-0">✕</span>
                            <span>{profilePhoneError}</span>
                          </p>
                        )}

                        {/* اخطار در صورت تکراری بودن شماره در پایگاه داده */}
                        {profilePhoneCheck?.registered && profilePhoneCheck.user && (
                          <div className="mt-2.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-rose-400">
                              <span>⛔</span>
                              <span>شماره موبایل تکراری است!</span>
                            </span>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              این شماره موبایل قبلاً برای حساب کاربری «<strong className="text-white">{profilePhoneCheck.user.fullName}</strong>» ثبت گردیده است. طبق قوانین پایگاه داده، هر شماره تلفن تنها به یک حساب اختصاص می‌یابد.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-end">
                        <button
                          type="submit"
                          disabled={isSavingProfile || Boolean(profilePhoneError) || Boolean(profilePhoneCheck?.registered)}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isSavingProfile ? 'در حال ذخیره و بررسی...' : 'ذخیره تغییرات شماره و پروفایل'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* ستون ۱ سهمی: جعبه اختصاصی قوانین رسمی استودیو در مورد صحت اطلاعات */}
                  <div
                    className={`p-6 rounded-3xl border space-y-4 ${
                      isLight ? 'bg-amber-50/70 border-amber-300/80 text-slate-900' : 'bg-[#07090E] border-amber-400/40 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 border-b border-amber-400/20 pb-3">
                      <span className="text-lg">⚖️</span>
                      <h4 className="text-sm font-black text-amber-400">
                        قوانین صحت اطلاعات تماس
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed">
                      <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                        {PHONE_VERIFICATION_RULES.full}
                      </p>

                      <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 space-y-1.5">
                        <strong className="text-amber-300 block font-bold">
                          نمونه‌های غیرمجاز و مسدودشونده:
                        </strong>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                          <li>شماره‌های ساختگی مانند <span className="font-mono text-rose-300">123456789011</span></li>
                          <li>ارقام تکراری مانند <span className="font-mono text-rose-300">09111111111</span></li>
                          <li>پیش‌شماره‌های نامعتبر خارج از شبکه رسمی ایران</li>
                        </ul>
                      </div>

                      <div className="text-[11px] text-slate-400 pt-1">
                        🔒 اطلاعات تماس شما نزد استودیو با استاندارد محرمانگی مطلق (NDA) نگهداری شده و در اختیار هیچ شخص ثالثی قرار نمی‌گیرد.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* مدال اختصاصی ثبت نظر و تجربه کاربری برای سفارش */}
        {reviewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div
              className={`relative w-full max-w-lg my-8 p-6 sm:p-7 rounded-3xl border shadow-2xl transition-all ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0A0E17] border-slate-800 text-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="absolute top-5 left-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>

              <div className="mb-5">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-400 border border-amber-400/30 inline-block mb-2">
                  کد رهگیری سفارش: STD-{toPersianDigits(reviewOrder.trackingCode)}
                </span>
                <h3 className="text-base sm:text-lg font-black">
                  ثبت تجربه همکاری برای «{reviewOrder.serviceTitle}»
                </h3>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  بازخورد شما درباره سرعت فوق‌العاده بالا، کیفیت سینمایی و تحویل پروژه، پس از تایید مدیریت در سایت درج می‌شود.
                </p>
              </div>

              {reviewSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-3">
                  <div className="text-3xl">✓</div>
                  <h4 className="font-black text-sm">با تشکر از ثبت نظر شما!</h4>
                  <p className="text-xs leading-relaxed">{reviewSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setReviewOrder(null)}
                    className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all"
                  >
                    بستن
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrderReview} className="space-y-4">
                  {reviewError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                      {reviewError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold mb-1">امتیاز شما به این سفارش (۱ تا ۵ ستاره):</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                          className={`text-xl transition-transform hover:scale-125 ${
                            star <= reviewFormData.rating ? 'text-amber-400' : 'text-slate-600'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-xs text-amber-300 font-bold mr-2">
                        ({reviewFormData.rating} از ۵ ستاره)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">دستاورد یا نتیجه شاخص (در ۱ خط):</label>
                    <input
                      type="text"
                      placeholder="مثال: تحویل فوق‌سریع در ۴۸ ساعت و رضایت کامل از کیفیت"
                      value={reviewFormData.outcome}
                      onChange={(e) =>
                        setReviewFormData({ ...reviewFormData, outcome: e.target.value })
                      }
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">متن تجربه و میزان رضایت شما: *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="تجربه خود از سرعت اجرای بالا، کیفیت نهایی و نحوه پشتیبانی تیم استودیو را بنویسید..."
                      value={reviewFormData.quote}
                      onChange={(e) =>
                        setReviewFormData({ ...reviewFormData, quote: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewOrder(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-6 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      {isSubmittingReview ? 'در حال ثبت...' : 'ارسال برای تایید مدیریت'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
