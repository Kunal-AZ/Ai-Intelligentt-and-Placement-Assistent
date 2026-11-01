import { useEffect, useRef } from 'react';

/**
 * ScrollProgressBar component
 * Displays a high-precision neon gradient progress bar at the top of the viewport.
 * Uses GPU-accelerated transform: scaleX without triggering React re-renders on scroll.
 */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      if (!barRef.current) return;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / totalHeight)) : 0;
      barRef.current.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none"
      style={{ background: 'rgba(240, 244, 255, 0.25)' }}
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left will-change-transform"
        style={{
          transform: 'scaleX(0)',
          background: 'linear-gradient(90deg, #4f46e5 0%, #8b5cf6 50%, #06b6d4 100%)',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.8), 0 0 20px rgba(139, 92, 246, 0.5)',
        }}
      />
    </div>
  );
}
