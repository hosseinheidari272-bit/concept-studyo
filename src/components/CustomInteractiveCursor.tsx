import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * نشانگر موس سفارشی دایره‌ای با میکرو-اینتراکشن هوشمند (Custom Interactive Cursor)
 * - فقط در دستگاه‌های دارای موس دقیق (pointer: fine) فعال می‌شود
 * - در موبایل و صفحات لمسی غیرفعال است تا هیچ مصرف باتری یا تداخلی ایجاد نکند
 * - هنگام رفتن روی دکمه‌ها، لینک‌ها و کارت‌ها بزرگ‌تر شده و حالت تعاملی می‌گیرد
 */
export const CustomInteractiveCursor: React.FC = () => {
  const { isLight } = useTheme();
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string>('');

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkCapability = () => {
      setIsFinePointer(mediaQuery.matches && !reducedMotionQuery.matches && window.innerWidth >= 1024);
    };

    checkCapability();
    mediaQuery.addEventListener('change', checkCapability);
    window.addEventListener('resize', checkCapability, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', checkCapability);
      window.removeEventListener('resize', checkCapability);
    };
  }, []);

  useEffect(() => {
    if (!isFinePointer) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        setIsVisible(true);
        ringX = mouseX;
        ringY = mouseY;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest(
          'button, a, [role="button"], input, select, textarea, label, [data-cursor-interactive]'
        ) as HTMLElement | null;

        if (interactiveEl) {
          setIsHoveringInteractive(true);
          const customText = interactiveEl.getAttribute('data-cursor-text');
          setHoverLabel(customText || '');
        } else {
          setIsHoveringInteractive(false);
          setHoverLabel('');
        }
      }
    };

    const onMouseDown = () => setIsPressed(true);
    const onMouseUp = () => setIsPressed(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    const animateRing = () => {
      // حرکت نرم و فنری دایره بیرونی به سمت نشانگر
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    rafId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, [isFinePointer, isVisible]);

  if (!isFinePointer) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
      aria-hidden="true"
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.25s ease' }}
    >
      {/* حلقه دایره‌ای هوشمند با قابلیت بزرگ‌شدن روی دکمه‌ها و کارت‌ها */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full flex items-center justify-center transition-[width,height,background-color,border-color,box-shadow] duration-200 ease-out will-change-transform ${
          isPressed
            ? 'w-8 h-8'
            : isHoveringInteractive
            ? hoverLabel
              ? 'w-20 h-20'
              : 'w-12 h-12'
            : 'w-8 h-8'
        } ${
          isLight
            ? isHoveringInteractive
              ? 'bg-sky-500/15 border-2 border-sky-500 shadow-[0_0_25px_rgba(2,132,199,0.3)] backdrop-blur-[2px]'
              : 'bg-sky-500/5 border border-sky-500/55 shadow-[0_0_12px_rgba(2,132,199,0.15)]'
            : isHoveringInteractive
            ? 'bg-cyan-400/15 border-2 border-cyan-400 shadow-[0_0_28px_rgba(0,229,255,0.45)] backdrop-blur-[2px]'
            : 'bg-cyan-400/5 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
        }`}
      >
        {hoverLabel && (
          <span
            className={`text-[10px] font-black tracking-tight px-1 text-center leading-tight select-none ${
              isLight ? 'text-sky-900' : 'text-cyan-200'
            }`}
          >
            {hoverLabel}
          </span>
        )}
      </div>

      {/* نقطه مرکزی تیز و دقیق */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color,opacity] duration-150 will-change-transform ${
          isHoveringInteractive && hoverLabel
            ? 'w-1 h-1 opacity-0'
            : isPressed
            ? 'w-3 h-3'
            : isHoveringInteractive
            ? 'w-2.5 h-2.5'
            : 'w-2 h-2'
        } ${
          isLight
            ? 'bg-sky-600 shadow-[0_0_8px_rgba(2,132,199,0.8)]'
            : 'bg-cyan-300 shadow-[0_0_10px_#00e5ff]'
        }`}
      />
    </div>
  );
};
