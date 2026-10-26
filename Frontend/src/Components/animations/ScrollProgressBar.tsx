import { useEffect, useState } from 'react';

/**
 * ScrollProgressBar component
 * Displays a sleek, illuminated neon gradient progress bar at the very top of the window
 * that precisely reflects user scroll position across the page.
 */
export function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none transition-all duration-75"
      style={{
        background: 'rgba(240, 244, 255, 0.4)',
      }}
      aria-hidden="true"
    >
      <div
        className="h-full relative transition-[width] duration-150 ease-out"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #4f46e5 0%, #8b5cf6 50%, #06b6d4 100%)',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.8), 0 0 20px rgba(139, 92, 246, 0.5)',
        }}
      >
        {/* Glow head point */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff,0_0_16px_#06b6d4]"
        />
      </div>
    </div>
  );
}
