import { useEffect, useState } from 'react';

interface AudioWaveformProps {
  barsCount?: number;
  isActive?: boolean;
}

export function AudioWaveform({ barsCount = 18, isActive = true }: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barsCount }, () => Math.floor(Math.random() * 20) + 10)
  );

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barsCount }, (_, i) => {
          // Bell curve weighting in middle
          const centerDist = Math.abs(i - barsCount / 2) / (barsCount / 2);
          const weight = 1 - centerDist * 0.4;
          return Math.floor((Math.random() * 26 + 8) * weight);
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isActive, barsCount]);

  return (
    <div className="flex items-center gap-1.5 h-10 px-3 py-1 bg-slate-900/5 rounded-xl border border-slate-200/60 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase ml-1">
          LIVE AI VOICE
        </span>
      </div>

      <div className="flex items-center gap-[3px] ml-auto h-8">
        {heights.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full transition-all duration-150 ease-in-out"
            style={{
              height: `${h}px`,
              background:
                i % 3 === 0
                  ? 'linear-gradient(180deg, #6366f1, #4f46e5)'
                  : i % 3 === 1
                  ? 'linear-gradient(180deg, #8b5cf6, #7c3aed)'
                  : 'linear-gradient(180deg, #06b6d4, #0284c7)',
              boxShadow: h > 20 ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
