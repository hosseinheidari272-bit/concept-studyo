import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { PromoHeaderBanner } from './components/PromoHeaderBanner';
import { HeroSection } from './components/HeroSection';
import { StudioHighlights } from './components/StudioHighlights';
import { ServicesSection } from './components/ServicesSection';
import { OrderModal } from './components/OrderModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { UserPanelPage } from './components/UserPanelPage';
import { UserChatModal } from './components/UserChatModal';
import { Footer } from './components/Footer';
import { SeoFaqSection } from './components/SeoFaqSection';
import { ThreeHeroCanvas } from './components/ThreeHeroCanvas';
import { TrustAndGuaranteesSection } from './components/TrustAndGuaranteesSection';
import { ClientTestimonialsSection } from './components/ClientTestimonialsSection';
import { WorkflowStepsSection } from './components/WorkflowStepsSection';
import { QuickEstimatorSection } from './components/QuickEstimatorSection';
import { CustomInteractiveCursor } from './components/CustomInteractiveCursor';
import { ServiceItem, CoinSystemSettings, PromoBannerSettings } from './types';
import { studioServices } from './data/services';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const INITIAL_COIN_SYSTEM: CoinSystemSettings = {
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

const INITIAL_PROMO_BANNER: PromoBannerSettings = {
  enabled: false,
  text: 'حراج ویژه فصل: تا ۲۰٪ تخفیف روی پکیج‌های طراحی هویت بصری و پلتفرم‌های دیجیتال نسل بعدی!',
  badgeText: 'پیشنهاد ویژه',
  stickyOnScroll: true,
  linkHash: '#services',
};

function AppContent() {
  const { isLight } = useTheme();
  const [services, setServices] = useState<ServiceItem[]>(studioServices);
  const [showPrices, setShowPrices] = useState<boolean>(true);
  const [telegramUrl, setTelegramUrl] = useState<string>('https://t.me/concept_studio');
  const [baleUrl, setBaleUrl] = useState<string>('');
  const [coinSystem, setCoinSystem] = useState<CoinSystemSettings>(INITIAL_COIN_SYSTEM);
  const [promoBanner, setPromoBanner] = useState<PromoBannerSettings>(INITIAL_PROMO_BANNER);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isServicesLoading, setIsServicesLoading] = useState(true);

  // بررسی اینکه آیا در یک صفحه مستقل (/?page=panel) باز شده است یا خیر
  const [activePageView, setActivePageView] = useState<'home' | 'user_panel' | 'admin_panel'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('page') === 'panel') {
        return params.get('mode') === 'admin' ? 'admin_panel' : 'user_panel';
      }
    }
    return 'home';
  });

  // وضعیت مودال گفت‌وگوی آنلاین کاربران
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatInitialOrderId, setChatInitialOrderId] = useState<string | undefined>(undefined);
  const [chatInitialOrderTitle, setChatInitialOrderTitle] = useState<string | undefined>(undefined);

  // دریافت لیست خدمات، قیمت‌ها، تنظیمات ضرب سکه و تیتر تبلیغاتی از سرور
  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        if (data.services && data.services.length > 0) {
          setServices(data.services);
        }
        if (typeof data.showPrices === 'boolean') {
          setShowPrices(data.showPrices);
        }
        if (typeof data.telegramUrl === 'string') {
          setTelegramUrl(data.telegramUrl);
        }
        if (typeof data.baleUrl === 'string') {
          setBaleUrl(data.baleUrl);
        }
        if (data.coinSystem) {
          setCoinSystem(data.coinSystem);
        }
        if (data.promoBanner) {
          setPromoBanner(data.promoBanner);
        }
        if (data.settings) {
          if (typeof data.settings.telegramUrl === 'string') {
            setTelegramUrl(data.settings.telegramUrl);
          }
          if (typeof data.settings.baleUrl === 'string') {
            setBaleUrl(data.settings.baleUrl);
          }
          if (data.settings.coinSystem) {
            setCoinSystem(data.settings.coinSystem);
          }
          if (data.settings.promoBanner) {
            setPromoBanner(data.settings.promoBanner);
          }
        }
      }
    } catch {
      // استفاده از لیست پیش‌فرض در صورت عدم پاسخ سرور
    } finally {
      setIsServicesLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenOrder = (service: ServiceItem) => {
    setSelectedService(service);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedService(null);
  };

  const handleOpenChat = (orderId?: string, orderTitle?: string) => {
    setChatInitialOrderId(orderId);
    setChatInitialOrderTitle(orderTitle);
    setIsChatModalOpen(true);
  };

  // اگر صفحه مستقل پنل مدیریت باز شده باشد
  if (activePageView === 'admin_panel') {
    return (
      <>
        <CustomInteractiveCursor />
        <AdminPanel
          isFullPage={true}
          onServicePriceUpdated={fetchServices}
          onExitFullPage={() => {
            if (window.location.search.includes('page=panel')) {
              window.history.pushState({}, '', window.location.pathname || './');
            }
            setActivePageView('home');
          }}
        />
        <AuthModal />
      </>
    );
  }

  // اگر صفحه مستقل پنل کاربری و کیف پول کوین باز شده باشد
  if (activePageView === 'user_panel') {
    return (
      <>
        <CustomInteractiveCursor />
        <UserPanelPage
          coinSystem={coinSystem}
          onBackToSite={() => {
            if (window.location.search.includes('page=panel')) {
              window.history.pushState({}, '', window.location.pathname || './');
            }
            setActivePageView('home');
          }}
          onOpenChat={handleOpenChat}
          onOpenAdminFullPage={() => setActivePageView('admin_panel')}
        />
        <UserChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setChatInitialOrderId(undefined);
            setChatInitialOrderTitle(undefined);
          }}
          initialOrderId={chatInitialOrderId}
          initialOrderTitle={chatInitialOrderTitle}
        />
        <AuthModal />
        <AdminPanel onServicePriceUpdated={fetchServices} />
      </>
    );
  }

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 ${
        isLight
          ? 'bg-[#F8FAFC] text-slate-900 selection:bg-sky-500/20 selection:text-sky-900'
          : 'bg-[#04070D] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
      }`}
    >
      {/* نشانگر تعاملی سفارشی دایره‌ای موس (فقط در دستگاه‌های دارای موس دسکتاپ) */}
      <CustomInteractiveCursor />

      {/* پس‌زمینه منظومه شمسی سه‌بعدی (Three.js 3D Solar System Canvas) */}
      <ThreeHeroCanvas />

      {/* نورهای اتمسفریک ظریف در پس‌زمینه متناسب با تم روشن و تیره */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[420px] pointer-events-none z-0 transition-opacity duration-500 ${
          isLight
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.14)_0%,rgba(255,255,255,0)_70%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(0,180,255,0.09)_0%,rgba(0,0,0,0)_70%)]'
        }`}
        aria-hidden="true"
      />
      <div
        className={`absolute top-[850px] right-0 w-[550px] h-[450px] pointer-events-none z-0 transition-opacity duration-500 ${
          isLight
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,rgba(255,255,255,0)_70%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.06)_0%,rgba(0,0,0,0)_70%)]'
        }`}
        aria-hidden="true"
      />

      {/* کانتینر اصلی صفحه با فواصل بهینه‌شده */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-14">
        {/* نوار بالای صفحه */}
        <TopBar
          onOpenChat={() => handleOpenChat()}
          onOpenOrderModal={() => handleOpenOrder(services[0] || studioServices[0])}
          onOpenUserPanel={() => setActivePageView('user_panel')}
          coinSystem={coinSystem}
          telegramUrl={telegramUrl}
          baleUrl={baleUrl}
        />

        {/* تیتر تبلیغاتی زیر هدر (قابل کنترل از پنل همراه با حالت چسبان یا غیراستیکی در اسکرول) */}
        <PromoHeaderBanner promo={promoBanner} />

        {/* بخش اصلی معرفی استودیو */}
        <main>
          <HeroSection
            onOpenOrderModal={() => handleOpenOrder(services[0] || studioServices[0])}
            onOpenChat={() => handleOpenChat()}
          />

          {/* چهار اصل تمایز استودیو */}
          <StudioHighlights />

          {/* بخش جامع خدمات تخصصی */}
          <ServicesSection
            services={services}
            showPrices={showPrices}
            isLoading={isServicesLoading}
            onSelectService={handleOpenOrder}
            onOpenChatForService={(srv) => handleOpenChat(undefined, srv.title)}
            onOpenGeneralChat={() => handleOpenChat(undefined, 'پروژه ترکیبی / سفارشی / ترجمه و دوبله')}
          />

          {/* ابزار محاسبه‌گر برخط پیش‌فاکتور و تخمین سرمایه‌گذاری برای تسریع در فروش */}
          <QuickEstimatorSection
            services={services}
            coinSystem={coinSystem}
            onSelectServiceAndOrder={(srv) => handleOpenOrder(srv)}
            onOpenChat={(orderId, topic) => handleOpenChat(orderId, topic)}
          />

          {/* مسیر شفاف ۴ مرحله‌ای از ثبت اولیه تا تحویل سورس */}
          <WorkflowStepsSection
            onOpenOrderModal={() => handleOpenOrder(services[0] || studioServices[0])}
            onOpenChat={() => handleOpenChat()}
          />

          {/* بخش ۶ تضمین رسمی، بازگشت وجه ۱۰۰٪، ۲ دور ادیت رایگان و حفظ محرمانگی */}
          <TrustAndGuaranteesSection
            onOpenOrderModal={() => handleOpenOrder(services[0] || studioServices[0])}
            onOpenChat={() => handleOpenChat()}
          />

          {/* نظرات مستند و تاییدشده کارفرمایان همراه با نتایج واقعی بیزینس */}
          <ClientTestimonialsSection />

          {/* بخش سوالات متداول و راهنمای جامع (منطبق با اسکیماهای سئو FAQPage) */}
          <SeoFaqSection onOpenChat={() => handleOpenChat()} />
        </main>

        {/* فوتر حرفه‌ای همراه با لینک‌های تلگرام و گروه بله */}
        <Footer
          onOpenChat={() => handleOpenChat()}
          telegramUrl={telegramUrl}
          baleUrl={baleUrl}
        />
      </div>

      {/* دکمه شناور گفت‌وگو و پشتیبانی مستقیم با ابعاد بزرگ‌تر جهت لمس آسان در موبایل */}
      <aside aria-label="دکمه شناور گفت‌وگو" className="fixed bottom-4 left-4 sm:bottom-5 sm:left-5 z-40">
        <button
          onClick={() => handleOpenChat()}
          data-cursor-text="چت"
          title="گفت‌وگو و پشتیبانی مستقیم با مدیریت"
          className={`btn-shimmer group relative flex items-center gap-2.5 px-4 sm:px-5 py-3 min-h-[50px] rounded-full border transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${
            isLight
              ? 'bg-white/95 hover:bg-sky-50 border-sky-400/80 hover:border-sky-500 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.16)] hover:shadow-[0_14px_35px_rgba(2,132,199,0.28)]'
              : 'bg-slate-900/95 hover:bg-slate-850 border-cyan-500/55 hover:border-cyan-400 text-white shadow-[0_8px_30px_rgba(0,0,0,0.65)] hover:shadow-[0_10px_32px_rgba(0,229,255,0.35)]'
          }`}
        >
          <div
            className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              isLight ? 'bg-sky-500/15 text-sky-600' : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
                isLight ? 'bg-sky-500' : 'bg-cyan-400'
              }`}
            />
          </div>
          <div className="text-right">
            <span
              className={`block text-xs sm:text-sm font-black transition-colors ${
                isLight
                  ? 'text-slate-900 group-hover:text-sky-700'
                  : 'text-white group-hover:text-cyan-200'
              }`}
            >
              گفت‌وگو و استعلام
            </span>
            <span
              className={`block text-[10px] font-bold ${
                isLight ? 'text-sky-700' : 'text-cyan-300/90'
              }`}
            >
              پاسخگویی مستقیم مدیریت
            </span>
          </div>
        </button>
      </aside>

      {/* مودال ثبت سفارش و استعلام */}
      {isOrderModalOpen && (
        <OrderModal
          initialService={selectedService}
          services={services}
          showPrices={showPrices}
          coinSystem={coinSystem}
          onOpenUserPanel={() => setActivePageView('user_panel')}
          onClose={handleCloseOrderModal}
          onOpenChatForOrder={(orderId, orderTitle) => {
            handleCloseOrderModal();
            handleOpenChat(orderId, orderTitle);
          }}
        />
      )}

      {/* مودال گفت‌وگوی زنده و پشتیبانی کاربران */}
      <UserChatModal
        isOpen={isChatModalOpen}
        onClose={() => {
          setIsChatModalOpen(false);
          setChatInitialOrderId(undefined);
          setChatInitialOrderTitle(undefined);
        }}
        initialOrderId={chatInitialOrderId}
        initialOrderTitle={chatInitialOrderTitle}
      />

      {/* مودال احراز هویت (ورود و ثبت‌نام) */}
      <AuthModal />

      {/* پنل مدیریت ادمین */}
      <AdminPanel onServicePriceUpdated={fetchServices} />
    </div>
  );
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#04070D] text-slate-100 flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0B101E] border border-cyan-500/30 shadow-2xl space-y-4">
            <h1 className="text-lg font-black text-cyan-300">استودیو دیزاین کانسپت</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              در بارگذاری یکی از اجزای نمایشی خطایی رخ داد. با نوسازی صفحه، برنامه به حالت عادی بازمی‌گردد.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all"
            >
              بارگذاری مجدد صفحه
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
