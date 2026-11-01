import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem('hiplacement-theme') || localStorage.getItem('pathway-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    // Ensure document element has data-theme
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const syncTheme = () => {
      const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      setTheme(current);
    };

    window.addEventListener('hiplacement-theme-change', syncTheme);
    window.addEventListener('pathway-theme-change', syncTheme);
    window.addEventListener('storage', syncTheme);
    return () => {
      window.removeEventListener('hiplacement-theme-change', syncTheme);
      window.removeEventListener('pathway-theme-change', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem('hiplacement-theme', nextTheme);
      localStorage.setItem('pathway-theme', nextTheme);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('hiplacement-theme-change'));
    window.dispatchEvent(new Event('pathway-theme-change'));
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      role="switch"
      aria-checked={isDark}
    >
      <span className="theme-toggle-track">
        {/* Sun Icon */}
        <span className={`theme-toggle-icon sun ${!isDark ? 'is-active' : ''}`} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </span>

        {/* Moon Icon */}
        <span className={`theme-toggle-icon moon ${isDark ? 'is-active' : ''}`} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </span>

        {/* Sliding Thumb */}
        <span className={`theme-toggle-thumb ${isDark ? 'is-dark' : 'is-light'}`} aria-hidden="true">
          {isDark ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}
