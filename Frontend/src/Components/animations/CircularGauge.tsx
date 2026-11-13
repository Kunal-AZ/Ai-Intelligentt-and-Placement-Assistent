import { useEffect, useId, useRef, useState } from 'react';

interface CircularGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function CircularGauge({
  score,
  size = 110,
  strokeWidth = 9,
  label = 'READINESS',
}: CircularGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const gradientId = `gaugeGrad_${safeId}`;
  const glowId = `gaugeGlow_${safeId}`;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startScore = displayScore;
    const duration = 750;
    const startTime = performance.now();

    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + (score - startScore) * ease);
      setDisplayScore(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animateNumber);
      }
    };

    rafRef.current = requestAnimationFrame(animateNumber);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, displayScore)) / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-all duration-700 ease-out"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="60%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200/50 dark:text-zinc-800/80"
        />

        {/* Dynamic Glowing Value Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          filter={`url(#${glowId})`}
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Center Digital Score Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
          {displayScore}
          <span className="text-xs font-semibold text-[var(--text-muted)]">%</span>
        </span>
        <span className="text-[9px] font-bold tracking-widest text-[var(--text-secondary)] uppercase mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}
