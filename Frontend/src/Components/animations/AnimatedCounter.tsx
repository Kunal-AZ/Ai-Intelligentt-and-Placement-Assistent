import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number; // milliseconds
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  end,
  duration = 1600,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const elementRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const formatValue = (val: number) => {
      const numStr = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString();
      return `${prefix}${numStr}${suffix}`;
    };

    if (prefersReducedMotion) {
      el.textContent = formatValue(end);
      return;
    }

    let started = false;
    let animationFrameId: number;

    const startAnimation = () => {
      let startTime: number | null = null;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        // Easing: easeOutCubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = easedProgress * end;

        if (el) {
          el.textContent = formatValue(currentVal);
        }

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else if (el) {
          el.textContent = formatValue(end);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          observer.disconnect();
          startAnimation();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration, prefix, suffix, decimals]);

  // Initial SSR / first-paint text content
  const initialText = `${prefix}${decimals > 0 ? (0).toFixed(decimals) : '0'}${suffix}`;

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {initialText}
    </span>
  );
}
