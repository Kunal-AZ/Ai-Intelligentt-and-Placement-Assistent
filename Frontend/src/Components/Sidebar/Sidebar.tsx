import { NavLink, useNavigate } from 'react-router-dom';
import { setAccessToken } from '../../lib/api';
import { BrandLogo } from '../BrandLogo';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Command Center', path: '/dashboard', icon: '⌂' },
      { label: 'Architecture', path: '/architecture', icon: '⚡' },
    ],
  },
  {
    title: 'Evidence Engine',
    items: [
      { label: 'Resume Studio', path: '/resume', icon: '📄', badge: 'AI' },
      { label: 'Skill Evidence & Gaps', path: '/skills', icon: '🎯' },
      { label: 'Job Matches', path: '/jobs', icon: '💼', badge: '12' },
    ],
  },
  {
    title: 'Interview & Coaching',
    items: [
      { label: 'AI Mock Interviews', path: '/interviews', icon: '🎤' },
      { label: 'Learning Roadmap', path: '/roadmap', icon: '🛣️' },
      { label: 'AI Career Coach', path: '/chat', icon: '✦', badge: 'Pro' },
      { label: 'Student Profile', path: '/profile', icon: '👤' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();

  function handleSignOut() {
    setAccessToken(null);
    navigate('/login');
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`app-sidebar ${isOpen ? 'is-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-wrapper">
          <NavLink className="sidebar-brand" to="/dashboard" onClick={onClose} title="HiPlacement Home">
            <BrandLogo size={28} isCollapsed={isCollapsed} badge="2.0" subtitle="AI Placement Engine" />
          </NavLink>

          {/* Close for mobile */}
          {onClose && (
            <button
              type="button"
              className="topbar-icon-btn lg:hidden w-7 h-7"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}

          {/* Collapse for desktop */}
          {onCollapse && (
            <button
              type="button"
              className="hidden lg:flex topbar-icon-btn w-7 h-7"
              onClick={onCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="sidebar-nav-scroll">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              {!isCollapsed && (
                <p className="sidebar-section-title">{section.title}</p>
              )}
              {section.items.map(({ label, path, icon, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={({ isActive }: { isActive: boolean }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                  title={label}
                >
                  <span className="sidebar-link-icon">{icon}</span>
                  {!isCollapsed && <span>{label}</span>}
                  {!isCollapsed && badge && <span className="sidebar-badge">{badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="sidebar-user-card"
            title="Manage profile"
          >
            <div className="user-avatar-circle">KS</div>
            {!isCollapsed && (
              <div className="user-meta-text">
                <span className="user-meta-name">Kunal Sharma</span>
                <span className="user-meta-role">SDE-1 Backend Track</span>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            className="btn-ghost text-xs justify-start py-2 w-full text-[var(--status-danger)]"
            onClick={handleSignOut}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
