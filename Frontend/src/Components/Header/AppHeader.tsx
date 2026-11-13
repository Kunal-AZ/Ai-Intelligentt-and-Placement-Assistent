import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import { BrandLogo } from '../BrandLogo';
import { api } from '../../lib/api';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
}

export function AppHeader({ onToggleSidebar, title = 'Command center' }: AppHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState<{ firstName?: string; lastName?: string }>({});
  useEffect(() => { api<{ profile: { firstName?: string; lastName?: string } }>('/profile').then((result) => setProfile(result.profile ?? {})).catch(() => setProfile({})); }, []);
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const initials = [profile.firstName, profile.lastName].filter(Boolean).map((part) => part![0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="topbar-icon-btn lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        )}

        <div className="lg:hidden flex items-center">
          <BrandLogo size={22} showText={false} />
        </div>

        <h1 className="topbar-page-title">{title}</h1>
      </div>

      <div className="app-topbar-right">
        {/* Instant Theme Toggle */}
        <ThemeToggle />

        {/* Global Search Shortcut */}
        <div className="hidden sm:flex items-center">
          <button
            type="button"
            className="topbar-search-btn"
            onClick={() => alert('Search command palette: Type to find any skill, role, or interview drill.')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search workspace…</span>
            <kbd className="topbar-kbd">⌘K</kbd>
          </button>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotifications && (
            <div className="popover-card">
              <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">Notifications</span>
                <span className="badge badge-mono text-[9px]">Activity Stream</span>
              </div>
              <div className="p-4 text-xs text-[var(--text-muted)]">
                Notifications will appear here as activity is recorded.
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <NavLink
          to="/profile"
          className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--text-inverse)] font-bold text-[10px] flex items-center justify-center">
            {initials}
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)] hidden md:inline">
            {name || 'Profile'}
          </span>
        </NavLink>
      </div>
    </header>
  );
}
