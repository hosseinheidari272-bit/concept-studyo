import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { HeroSection } from './components/HeroSection';
import { StudioHighlights } from './components/StudioHighlights';
import { ServicesSection } from './components/ServicesSection';
import { OrderModal } from './components/OrderModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { UserChatModal } from './components/UserChatModal';
import { Footer } from './components/Footer';
import { ThreeHeroCanvas } from './components/ThreeHeroCanvas';
import { ServiceItem } from './types';
import { studioServices } from './data/services';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { isLight } = useTheme();
  const [services, setServices] = useState<ServiceItem[]>(studioServices);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // وضعیت مودال گفت‌وگوی آنلاین کاربران
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatInitialOrderId, setChatInitialOrderId] = useState<string | undefined>(undefined);
  const [chatInitialOrderTitle, setChatInitialOrderTitle] = useState<string | undefined>(undefined);

  // دریافت لیست خدمات و قیمت‌های به‌روز از سرور
  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        if (data.services && data.services.length > 0) {
          setServices(data.services);
        }
      }
    } catch {
      // استفاده از لیست پیش‌فرض در صورت عدم پاسخ سرور
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

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 ${
        isLight
          ? 'bg-[#F8FAFC] text-slate-900 selection:bg-sky-500/20 selection:text-sky-900'
          : 'bg-[#04070D] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
      }`}
    >
      {/* پس‌زمینه موج‌های سه‌بعدی (Three.js 3D Wave Canvas) */}
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

      {/* کانتینر اصلی صفحه */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-20">
        {/* نوار بالای صفحه */}
        <TopBar
          onOpenChat={() => handleOpenChat()}
          onOpenOrderModal={() => handleOpenOrder(services[0] || studioServices[0])}
        />

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
            onSelectService={handleOpenOrder}
            onOpenChatForService={(srv) => handleOpenChat(undefined, srv.title)}
            onOpenGeneralChat={() => handleOpenChat(undefined, 'پروژه ترکیبی / سفارشی / ترجمه و دوبله')}
          />
        </main>

        {/* فوتر حرفه‌ای */}
        <Footer onOpenChat={() => handleOpenChat()} />
      </div>

      {/* دکمه شناور گفت‌وگو و پشتیبانی مستقیم با ارتفاع استاندارد */}
      <aside aria-label="دکمه شناور گفت‌وگو" className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => handleOpenChat()}
          title="گفت‌وگو و پشتیبانی مستقیم با مدیریت"
          className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full border transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-white/95 hover:bg-sky-50 border-sky-400/70 hover:border-sky-500 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_35px_rgba(2,132,199,0.28)]'
              : 'bg-slate-900/95 hover:bg-slate-850 border-cyan-500/50 hover:border-cyan-400 text-white shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(0,229,255,0.35)]'
          }`}
        >
          <div
            className={`relative flex items-center justify-center w-7 h-7 rounded-full ${
              isLight ? 'bg-sky-500/15 text-sky-600' : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                isLight ? 'bg-sky-500' : 'bg-cyan-400'
              }`}
            />
          </div>
          <div className="text-right">
            <span
              className={`block text-xs font-black transition-colors ${
                isLight
                  ? 'text-slate-900 group-hover:text-sky-700'
                  : 'text-white group-hover:text-cyan-200'
              }`}
            >
              گفت‌وگو و استعلام
            </span>
            <span
              className={`block text-[10px] font-medium ${
                isLight ? 'text-sky-600' : 'text-cyan-300/80'
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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
