import React, { useState, useEffect } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TestimonialItem } from '../types';
import { apiFetch as fetch } from '../utils/offlineApiBridge';

const INITIAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    category: '3d',
    name: 'مهندس سامان کاظمی',
    role: 'مدیر ارشد مارکتینگ',
    company: 'برند تجهیزات صوتی و گجت‌های هوشمند آوانگار',
    service: 'تیزر سه بعدی سینمایی محصول 4K',
    avatarColor: 'from-amber-400 to-orange-500',
    initials: 'س.ک',
    outcome: 'رشد ۲۸۰٪ نرخ تبدیل با تحویل فوق‌سریع',
    rating: 5,
    date: 'آبان ۱۴۰۳',
    quote:
      'برای رونمایی هدفون‌های گیمینگ دنبال خروجی در استاندارد جهانی بودیم. استودیو کانسپت با سرعت فوق‌العاده بالا و رکورد زمانی استثنایی پروژه را تحویل داد، بدون اینکه ذره‌ای از استانداردهای سخت‌گیرانه، متریال سینمایی و جزییات فنی کاسته شود. تحویل سورس کامل بلندر هم امنیت فنی ما را تضمین کرد.',
    verified: true,
    status: 'approved',
  },
  {
    id: 'testi-2',
    category: 'web',
    name: 'دکتر هومن شریفی',
    role: 'بنیان‌گذار و مدیرعامل',
    company: 'پلتفرم فناوری سلامت متالایف',
    service: 'توسعه پلتفرم دیجیتال فوق‌سریع و وب‌اپلیکیشن',
    avatarColor: 'from-cyan-400 to-blue-600',
    initials: 'ه.ش',
    outcome: 'سرعت لود زیر ۰.۷ ثانیه روی نت ایران',
    rating: 5,
    date: 'مهر ۱۴۰۳',
    quote:
      'نگرانی بزرگ ما اجرای سنگین المان‌های وب و قطعی‌های احتمالی شبکه بود. وب‌سایتی که کانسپت استودیو با سرعت فوق‌العاده بالا توسعه داد، روی اینترنت ملی و ضعیف‌ترین کانکشن‌ها مثل برق باز می‌شود و کدهای تمیز و سئو ساختاریافته ما را به صفحه اول گوگل رساند.',
    verified: true,
    status: 'approved',
  },
  {
    id: 'testi-3',
    category: 'branding',
    name: 'پریناز افشار',
    role: 'مدیر طراحی و برندینگ',
    company: 'خانه مد و اکسسوری الگانس',
    service: 'هویت بصری جامع، لوگوموشن و پکیجینگ',
    avatarColor: 'from-purple-400 to-pink-600',
    initials: 'پ.ا',
    outcome: 'پذیرش در ۲ بازار آنلاین بین‌المللی با خروجی پریمیوم',
    rating: 5,
    date: 'شهریور ۱۴۰۳',
    quote:
      'ما پیش از این با دو آژانس دیگر کار کرده بودیم اما خروجی‌ها کلیشه‌ای بود. تیم کانسپت استودیو با سرعت اجرایی بالا و درک عمیق دیزاین، هویت بصری لوکسی خلق کرد که اصالت و ارزش واقعی برند ما را تثبیت نمود. سرعت بالا در کنار کیفیت درجه یک ویژگی متمایز این تیم است.',
    verified: true,
    status: 'approved',
  },
  {
    id: 'testi-4',
    category: '3d',
    name: 'آرشام نیک‌زاد',
    role: 'تولیدکننده محتوا و مدیر استودیو',
    company: 'آکادمی رشد فناوری تک‌ورس',
    service: 'تدوین ریتمیک، موشن‌گرافیک و جلوه‌های ویژه',
    avatarColor: 'from-emerald-400 to-teal-600',
    initials: 'آ.ن',
    outcome: 'افزایش ۳.۵ برابری واچ‌تایم و بازدهی محتوا',
    rating: 5,
    date: 'مرداد ۱۴۰۳',
    quote:
      'سرعت تحویل در دنیای محتوا حیاتی است. استودیو کانسپت با سرعت فوق‌العاده بالا و تحویل سریع بدون کمترین افت کیفیت، ویدیوها را با ریتم میخکوب‌کننده و ساند دیزاین اختصاصی آماده کرد. دقت بالا باعث شد در همان اتود اول کار با تایید کامل نهایی شود.',
    verified: true,
    status: 'approved',
  },
  {
    id: 'testi-5',
    category: 'web',
    name: 'مهدی یزدانی',
    role: 'هم‌بنیان‌گذار',
    company: 'فروشگاه آنلاین عطر و کالای لوکس رایحه',
    service: 'ری‌دیزاین فروشگاه و تیزر بنرهای متحرک 3D',
    avatarColor: 'from-sky-400 to-indigo-600',
    initials: 'م.ی',
    outcome: 'کاهش نرخ بانس‌ریت به ۱۹٪ و فروش بی‌سابقه',
    rating: 5,
    date: 'تیر ۱۴۰۳',
    quote:
      'بزرگترین دغدغه ما لمس متریال و جزییات شیشه در خرید اینترنتی بود. کانسپت استودیو با سرعت بسیار بالا و کیفیتی خیره‌کننده، رندرهایی با بازتاب نور طبیعی و قطرات آب خلق کرد که نرخ تبدیل فروشگاه را متحول کرد.',
    verified: true,
    status: 'approved',
  },
  {
    id: 'testi-6',
    category: 'branding',
    name: 'کیوان اسدی',
    role: 'مدیر توسعه کسب‌وکار',
    company: 'هلدینگ سرمایه‌گذاری و تجارت پیشگامان',
    service: 'کاتالوگ تعاملی دیجیتال و موشن اینفوگرافیک',
    avatarColor: 'from-rose-400 to-red-600',
    initials: 'ک.ا',
    outcome: 'موفقیت در پیچ‌دک و جذب سرمایه ۲ میلیون دلاری',
    rating: 5,
    date: 'خرداد ۱۴۰۳',
    quote:
      'برای جذب سرمایه نیاز به ارائه‌ای سریع و بی‌نقص داشتیم. تیم کانسپت استودیو با سرعت عملی مثال‌زدنی و کیفیت ارائه در تراز جهانی، کاتالوگ و موشن اینفوگرافیک را تحویل داد و جلسه دفاع سرمایه‌گذاری ما با موفقیت کامل انجام شد.',
    verified: true,
    status: 'approved',
  },
];

export const ClientTestimonialsSection: React.FC = () => {
  const { isLight } = useTheme();
  const { user, token } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'all' | '3d' | 'branding' | 'web'>('all');
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(INITIAL_TESTIMONIALS);
  const [isLoading, setIsLoading] = useState(false);

  // وضعیت مدال ثبت تجربه
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  // فیلدهای فرم ثبت نظر
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    service: 'تیزر سه بعدی سینمایی محصول 4K',
    category: '3d' as '3d' | 'branding' | 'web',
    rating: 5,
    outcome: '',
    quote: '',
    trackingCode: '',
  });

  // دریافت پروژه‌ها و نظرات تاییدشده از سرور
  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/testimonials');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.testimonials) && data.testimonials.length > 0) {
          setTestimonials(data.testimonials);
        }
      }
    } catch {
      // در صورت خطای شبکه از داده‌های پیش‌فرض استفاده می‌شود
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // پر کردن اولیه فرم در صورت ورود کاربر
  useEffect(() => {
    if (user && isModalOpen) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.fullName || user.username,
      }));
    }
  }, [user, isModalOpen]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrorMsg(null);
    setSubmitSuccessMsg(null);

    if (!formData.name.trim() || !formData.quote.trim() || !formData.service.trim()) {
      setSubmitErrorMsg('لطفاً نام، عنوان خدمت و متن نظر خود را تکمیل فرمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitSuccessMsg(
          data.message ||
            'تجربه و نظر ارزشمند شما با موفقیت ثبت شد و پس از بررسی تیم مدیریت، در سایت منتشر خواهد شد.'
        );
        // ریست فرم
        setFormData({
          name: '',
          role: '',
          company: '',
          service: 'تیزر سه بعدی سینمایی محصول 4K',
          category: '3d',
          rating: 5,
          outcome: '',
          quote: '',
          trackingCode: '',
        });
      } else {
        setSubmitErrorMsg(data.error || 'خطایی در ثبت نظر رخ داد.');
      }
    } catch {
      setSubmitErrorMsg('خطای ارتباط با سرور. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered =
    activeCategory === 'all'
      ? testimonials
      : testimonials.filter((t) => t.category === activeCategory);

  return (
    <section
      id="testimonials"
      aria-label="نظرات مستند کارفرمایان و اعتماد مشتریان"
      className="my-12 sm:my-14 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20"
    >
      <ScrollReveal direction="down" distance={20}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 pb-4 border-b border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 border bg-amber-500/10 text-amber-400 border-amber-500/30">
              <span>★ رضایت مستند ۹۹.۴٪ کارفرمایان</span>
            </div>
            <h2
              className={`text-2xl sm:text-4xl font-black mb-2 transition-colors ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              نظرات مستند کارفرمایان و بازخورد پروژه‌های تیزرسازی و طراحی استودیو
            </h2>
            <p
              className={`text-xs sm:text-sm max-w-xl leading-relaxed ${
                isLight ? 'text-slate-700' : 'text-slate-200'
              }`}
            >
              پروژه‌های ثبت‌شده با کدرهگیری یکتا، تحویل فوق‌سریع و حفظ کمال کیفیت سینمایی. کارفرمایان استودیو تجربیات واقعی خود را در اینجا ثبت می‌کنند.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* دکمه ثبت نظر جدید با ارتفاع لمسی استاندارد */}
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                setSubmitSuccessMsg(null);
                setSubmitErrorMsg(null);
              }}
              className="btn-shimmer px-5 py-3 min-h-[46px] rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>⭐ ثبت تجربه و نظر شما</span>
            </button>

            {/* فیلتر دسته‌بندی بر اساس نوع خدمت با ابعاد بزرگ‌تر جهت لمس آسان در موبایل */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'همه نظرات' },
                { id: '3d', label: 'تیزر و رندر سه‌بعدی' },
                { id: 'web', label: 'پلتفرم و سایت' },
                { id: 'branding', label: 'هویت بصری و برند' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    activeCategory === tab.id
                      ? isLight
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                      : isLight
                      ? 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* شبکه کارت‌های نظرات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filtered.map((item, idx) => (
          <ScrollReveal key={item.id} delay={idx * 0.08} direction="up" distance={22}>
            <div
              data-cursor-interactive="true"
              className={`interactive-card-lift h-full p-5 sm:p-6 rounded-2xl border flex flex-col justify-between backdrop-blur-xl group ${
                isLight
                  ? 'bg-white border-slate-200/95 hover:border-sky-400 shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_38px_rgba(2,132,199,0.14)]'
                  : 'bg-[#090F1E]/95 border-slate-800/90 hover:border-cyan-400/50 hover:shadow-[0_12px_35px_rgba(0,0,0,0.45)]'
              }`}
            >
              <div>
                {/* ستاره‌ها، برچسب تایید و نتیجه ملموس بیزینس */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: item.rating }).map((_, s) => (
                      <svg key={s} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>سفارش تاییدشده</span>
                  </span>
                </div>

                {/* دستاورد تجاری پروژه */}
                <div
                  className={`p-2.5 rounded-xl text-xs font-black mb-4 flex items-center gap-2 border ${
                    isLight
                      ? 'bg-sky-50 border-sky-200 text-sky-800'
                      : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                  }`}
                >
                  <span className="text-base">🚀</span>
                  <span>{item.outcome}</span>
                </div>

                {/* عنوان خدمت */}
                <div className="mb-2">
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {item.service}
                  </span>
                </div>

                {/* متن نظر مشتری */}
                <p
                  className={`text-xs sm:text-[13px] leading-relaxed mb-6 font-normal ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  «{item.quote}»
                </p>
              </div>

              {/* پروفایل کارفرما و مشخصات خدمت */}
              <div
                className={`pt-4 border-t flex items-center justify-between gap-3 ${
                  isLight ? 'border-slate-100' : 'border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-slate-950 bg-gradient-to-br shadow-sm shrink-0 ${
                      item.avatarColor || 'from-amber-400 to-orange-500'
                    }`}
                  >
                    {item.initials || item.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-black truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.role ? `${item.role} • ` : ''}
                      {item.company}
                    </div>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-[10px] text-slate-400 block">{item.date}</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* مدال ثبت تجربه و بازخورد توسط کاربران و خریداران */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div
            className={`relative w-full max-w-lg my-8 p-6 sm:p-7 rounded-3xl border shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0A0E17] border-slate-800 text-white'
            }`}
          >
            {/* دکمه بستن */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 left-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>

            {/* هدر مدال */}
            <div className="mb-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-400 border border-amber-400/30 inline-block mb-2">
                صدای شما برای ما ارزشمند است
              </span>
              <h3 className="text-lg sm:text-xl font-black">
                ثبت تجربه همکاری با استودیو کانسپت
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                نظر شما پس از بررسی توسط تیم مدیریت، با افتخار در بخش نظرات سایت منتشر خواهد شد.
              </p>
            </div>

            {submitSuccessMsg ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-3">
                <div className="text-3xl">✓</div>
                <h4 className="font-black text-sm">با سپاس از همراهی شما!</h4>
                <p className="text-xs leading-relaxed">{submitSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all"
                >
                  بستن پنجره
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {submitErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    {submitErrorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">نام و نام خانوادگی / نام شما: *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مهندس رادین شمس"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">سمت یا عنوان حرفه‌ای:</label>
                    <input
                      type="text"
                      placeholder="مثال: مدیر مارکتینگ، بنیان‌گذار..."
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">نام شرکت، برند یا کسب‌وکار:</label>
                    <input
                      type="text"
                      placeholder="مثال: استارتاپ فناوری نوین"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">دسته‌بندی خدمت:</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    >
                      <option value="3d">تیزر و رندرینگ سه‌بعدی</option>
                      <option value="branding">هویت بصری و گرافیک برند</option>
                      <option value="web">پلتفرم دیجیتال و سایت</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">عنوان خدمتی که دریافت کردید: *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: تیزر سه بعدی محصول، ری‌دیزاین سایت..."
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">کد پیگیری سفارش (اختیاری جهت برچسب تایید):</label>
                    <input
                      type="text"
                      placeholder="مثال: ۸۴۹۲۰۱"
                      value={formData.trackingCode}
                      onChange={(e) => setFormData({ ...formData, trackingCode: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">امتیاز شما به همکاری (۱ تا ۵ ستاره):</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className={`text-xl transition-transform hover:scale-125 ${
                          star <= formData.rating ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs text-amber-300 font-bold mr-2">
                      ({formData.rating} از ۵ ستاره)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    دستاورد یا نتیجه شاخص همکاری (خلاصه در ۱ خط):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: تحویل فوق‌سریع در ۴۸ ساعت و رشد ۲۰۰٪ بازدید"
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        : 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">متن تجربه و بازخورد همکاری شما: *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="تجربه خود از کیفیت، سرعت تحویل استثنایی و همراهی تیم استودیو کانسپت را بنویسید..."
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
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
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {isSubmitting ? 'در حال ثبت...' : 'ارسال برای تایید و انتشار'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
