interface AudioWaveformProps {
  barsCount?: number;
  isActive?: boolean;
}

export function AudioWaveform({ barsCount = 18, isActive = true }: AudioWaveformProps) {
  // Pre-computed static base heights and animation delays for pure CSS animation
  const bars = Array.from({ length: barsCount }, (_, i) => {
    const centerDist = Math.abs(i - barsCount / 2) / (barsCount / 2);
    const weight = 1 - centerDist * 0.45;
    const baseHeight = Math.round(18 * weight + 6);
    // Deterministic staggered delay pattern
    const delay = (Math.sin(i * 1.3) * 0.4 + 0.45).toFixed(2);
    const duration = (0.55 + (i % 4) * 0.12).toFixed(2);
    return { id: i, baseHeight, delay, duration };
  });

  return (
    <div className="flex items-center gap-1.5 h-10 px-3 py-1 bg-slate-900/5 dark:bg-zinc-900/40 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 backdrop-blur-sm select-none">
      <div className="flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase ml-1">
          LIVE AI VOICE
        </span>
      </div>

      <div className="flex items-center gap-[3px] ml-auto h-8 items-center">
        {bars.map((bar, i) => (
          <span
            key={bar.id}
            className="w-[3px] rounded-full origin-bottom"
            style={{
              height: `${bar.baseHeight}px`,
              background:
                i % 3 === 0
                  ? 'linear-gradient(180deg, #6366f1, #4f46e5)'
                  : i % 3 === 1
                  ? 'linear-gradient(180deg, #8b5cf6, #7c3aed)'
                  : 'linear-gradient(180deg, #06b6d4, #0284c7)',
              animation: isActive ? `soundWave ${bar.duration}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${bar.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
