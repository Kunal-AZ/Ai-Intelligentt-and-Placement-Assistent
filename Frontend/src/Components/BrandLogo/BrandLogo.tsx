import React from 'react';

export interface BrandLogoProps {
  /** Size in pixels of the square logo icon. Defaults to 30. */
  size?: number;
  /** Whether to show the text label 'HiPlacement'. Defaults to true. */
  showText?: boolean;
  /** Optional badge text, e.g. 'AI 2.0' */
  badge?: string;
  /** Optional subtitle below the brand title. */
  subtitle?: string;
  /** Whether sidebar is in collapsed icon-only mode */
  isCollapsed?: boolean;
  /** Custom container class */
  className?: string;
  /** Optional custom text styling */
  textClassName?: string;
}

export function BrandLogo({
  size = 30,
  showText = true,
  badge,
  subtitle,
  isCollapsed = false,
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  return (
    <div className={`brand-logo-root inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon with perfect aspect ratio and dynamic theme switcher */}
      <div
        className="brand-logo-icon-box relative shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200"
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-hidden="true"
      >
        {/* Dark mode version: crisp pure white emblem on transparent background */}
        <img
          src="/logo-dark.png"
          alt="HiPlacement emblem"
          width={size}
          height={size}
          className="logo-img logo-img-dark w-full h-full object-contain pointer-events-none"
          loading="eager"
          decoding="async"
        />
        {/* Light mode version: crisp dark emblem on transparent background */}
        <img
          src="/logo-light.png"
          alt="HiPlacement emblem"
          width={size}
          height={size}
          className="logo-img logo-img-light w-full h-full object-contain pointer-events-none"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Typography */}
      {showText && !isCollapsed && (
        <div className={`flex flex-col justify-center leading-none ${textClassName}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[15px] tracking-tight text-[var(--text-primary)]">
              HiPlacement
            </span>
            {badge && (
              <span className="badge badge-mono text-[9px] py-0 px-1.5 font-bold tracking-wider">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-[9px] font-semibold text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandLogo;

