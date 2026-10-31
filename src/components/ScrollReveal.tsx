import React, { useRef, useEffect, useState, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'down' | 'up' | 'none';
  className?: string;
  distance?: number;
  once?: boolean;
  initialVisible?: boolean;
}

/**
 * کامپوننت سبک و مطمئن ظهور المان‌ها (Lightweight GPU-Accelerated Scroll Reveal)
 * تشخیص آنی المان‌های درون ویوپورت در بدو ورود (بدون نیاز به اسکرول کردن اولیه)
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  direction = 'down',
  className = '',
  distance = 20,
  once = true,
  initialVisible = false,
}) => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // بررسی فوری موقعیت در ویوپورت به محض لود صفحه (بدون نیاز به اسکرول اولیه کاربر)
    const rect = el.getBoundingClientRect();
    const isAlreadyInViewport =
      rect.top < window.innerHeight + 80 && rect.bottom > -80;

    if (isAlreadyInViewport) {
      setIsVisible(true);
      if (once) return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0,
        rootMargin: '100px 0px 100px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const baseOffset = direction === 'none' ? 0 : direction === 'down' ? 18 : -distance;

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${baseOffset}px, 0)`,
        transition: `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
      className={className}
    >
      {children}
    </div>
  );
};

