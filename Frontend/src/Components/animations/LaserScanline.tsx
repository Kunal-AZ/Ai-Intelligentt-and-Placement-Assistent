interface LaserScanlineProps {
  label?: string;
}

export function LaserScanline({ label = 'ATS PARSING ENGINE' }: LaserScanlineProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl z-20" aria-hidden="true">
      {/* Animated laser line sweeping vertically */}
      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_#6366f1,0_0_24px_#8b5cf6] animate-laser-scan">
        <div className="absolute right-4 -top-3.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 shadow-sm backdrop-blur-sm">
          ✦ {label}
        </div>
      </div>
    </div>
  );
}
