import React, { useRef, useEffect, useState, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'down' | 'up' | 'none';
  className?: string;
  distance?: number;
  once?: boolean;
}

/**
 * کامپوننت افکت ظهور پویا و زنده هنگام اسکرول به پایین و بالا (Dynamic Bidirectional Scroll Reveal)
 * ویژگی‌ها:
 * ۱. واکنش پویا در هر بار ورود و خروج از ویوپورت (هنگام اسکرول به پایین و بازگشت به بالا)
 * ۲. افکت ترکیبی رفع تاری (Blur-to-Clear) و حرکت نرم سه‌بعدی
 * ۳. اجرای ۶۰ فریم پایدار بر روی پردازنده گرافیکی (GPU Compositor)
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  direction = 'down',
  className = '',
  distance = 28,
  once = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollDir, setScrollDir] = useState<'down' | 'up'>('down');
  const ref = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 2) {
        setScrollDir('down');
      } else if (currentY < lastScrollY.current - 2) {
        setScrollDir('up');
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          // ریست شدن وضعیت هنگام خروج از دید، تا در اسکرول مجدد به بالا یا پایین دوباره با پویایی ظاهر شود
          setIsVisible(false);
        }
      },
      {
        threshold: 0.08,
        rootMargin: '-25px 0px -35px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const baseOffset = direction === 'none' ? 0 : scrollDir === 'down' ? -distance : distance;

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : `translate3d(0, ${baseOffset}px, 0) scale(0.97)`,
        filter: isVisible ? 'blur(0px)' : 'blur(8px)',
        transition: isVisible
          ? `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, filter 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
          : 'opacity 0.35s ease-out 0s, transform 0.35s ease-out 0s, filter 0.35s ease-out 0s',
        willChange: 'opacity, transform, filter',
      }}
      className={className}
    >
      {children}
    </div>
  );
};
