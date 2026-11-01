import React, { useRef, useEffect } from 'react';

interface InteractiveSpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
  style?: React.CSSProperties;
}

export function InteractiveSpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(99, 102, 241, 0.14)',
  enableTilt = true,
  style = {},
}: InteractiveSpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const spotlight = spotlightRef.current;
    if (!card || !spotlight) return;

    let rafId: number | null = null;
    let rect = card.getBoundingClientRect();

    const handleMouseEnter = () => {
      rect = card.getBoundingClientRect();
      spotlight.style.opacity = '1';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        spotlight.style.background = `radial-gradient(450px circle at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`;

        if (enableTilt) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;
          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
        }

        rafId = null;
      });
    };

    const handleMouseLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      spotlight.style.opacity = '0';
      if (enableTilt) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      }
    };

    card.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    card.addEventListener('mousemove', handleMouseMove, { passive: true });
    card.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enableTilt, spotlightColor]);

  return (
    <div
      ref={cardRef}
      className={`w-full relative overflow-hidden transition-transform duration-300 ease-out will-change-transform ${className}`}
      style={style}
    >
      {/* Dynamic Cursor Spotlight Radial Glow */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10 opacity-0"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
