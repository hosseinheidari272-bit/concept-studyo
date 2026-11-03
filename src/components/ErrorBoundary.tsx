import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.removeItem('concept_studio_view');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#04070D] text-slate-100 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="max-w-md w-full bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-emerald-950/40">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-bold">
              ✦
            </div>
            <h2 className="text-xl font-bold text-white mb-2">استودیو دیزاین کانسپت</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              یک خطای موقت در پردازش گرافیکی یا حافظه رخ داد. با بارگذاری مجدد، استودیو با ساختار بهینه‌شده سبک بالا خواهد آمد.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all"
              >
                بارگذاری مجدد استودیو ↻
              </button>
              <a
                href="./"
                className="w-full py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors border border-slate-700/60"
              >
                بازگشت به صفحه اصلی
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
