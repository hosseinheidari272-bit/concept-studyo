import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installOfflineApiBridge } from './utils/offlineApiBridge';

// فعال‌سازی موتور هیبریدی و آفلاین جهت کارکرد ۱۰۰٪ روی GitHub Pages، Netlify، هاست‌های ایرانی و اینترنت ملی
installOfflineApiBridge();

const rootElement = document.getElementById('root');
if (rootElement) {
  (window as any).__CONCEPT_STUDIO_MOUNTED__ = true;
  createRoot(rootElement).render(<App />);
}

// ثبت سرویس‌ورکر برای کش آفلاین کامل فونت‌ها، استایل‌ها و هسته برنامه
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // در محیط‌هایی که سرویس‌ورکر محدود است بدون خطا ادامه می‌دهد
    });
  });
}
