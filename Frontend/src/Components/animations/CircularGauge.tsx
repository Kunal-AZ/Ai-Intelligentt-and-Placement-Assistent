import { useEffect, useState } from 'react';

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
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Smooth number animation
    let start = 0;
    const duration = 800; // ms
    const startTime = performance.now();

    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(ease * score));

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      }
    };

    requestAnimationFrame(animateNumber);
  }, [score]);

  // Dashoffset calculation
  const strokeDashoffset = circumference - (score / 100) * circumference;

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
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="60%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(226, 232, 240, 0.8)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Active Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          filter="url(#gaugeGlow)"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      {/* Center Label and Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
          {displayScore}%
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {label}
        </span>
      </div>
    </div>
  );
}
