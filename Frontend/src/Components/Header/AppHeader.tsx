import { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
  subtitle?: string;
}

export function AppHeader({ onToggleSidebar, title = "Hey, let's make progress.", subtitle = "Career Workspace" }: AppHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Resume Parsed', time: '10m ago', text: '4 key strengths and 2 critical skill gaps identified.' },
    { id: 2, title: 'New Job Match', time: '1h ago', text: 'Razorpay SDE-1 Backend match score updated to 88%.' },
    { id: 3, title: 'Mock Interview Ready', time: 'Yesterday', text: 'AI evaluated your Cache Stampede response (94%).' },
  ];

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="sidebar-mobile-toggle"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        )}

        <div className="app-topbar-headings">
          <span className="app-topbar-eyebrow">{subtitle}</span>
          <h1 className="app-topbar-title">{title}</h1>
        </div>
      </div>

      <div className="app-topbar-right">
        {/* Search Bar */}
        <div className="topbar-search">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search skills, roles, metrics…"
            className="topbar-search-input"
            aria-label="Search within workspace"
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>

        {/* Notifications Dropdown */}
        <div className="notification-wrapper">
          <button
            type="button"
            className={`topbar-icon-btn ${unreadCount > 0 ? 'has-badge' : ''}`}
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            title="Notifications"
            aria-label="View notifications"
            aria-expanded={showNotifications}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="notif-badge-dot" />}
          </button>

          {showNotifications && (
            <div className="notification-popover">
              <div className="popover-header">
                <h3>Notifications</h3>
                <span className="popover-tag">Activity</span>
              </div>
              <div className="popover-list">
                {notifications.map((item) => (
                  <div key={item.id} className="popover-item">
                    <div className="popover-item-dot" />
                    <div className="popover-item-content">
                      <div className="popover-item-header">
                        <strong>{item.title}</strong>
                        <span>{item.time}</span>
                      </div>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <NavLink to="/profile" className="profile-chip" title="Go to profile">
          <div className="avatar-chip">
            <span>KS</span>
          </div>
          <span className="profile-chip-name">Kunal Sharma</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </NavLink>
      </div>
    </header>
  );
}
