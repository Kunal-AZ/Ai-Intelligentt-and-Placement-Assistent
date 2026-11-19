import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './Header';

export function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const pageNames: Record<string, string> = {
    '/dashboard': 'Command Center',
    '/resume': 'Resume Studio & ATS Audit',
    '/skills': 'Skill Evidence & Gaps',
    '/careers': 'Skill Evidence & Gaps',
    '/jobs': 'Job Matches',
    '/applications': 'Application Tracker',
    '/interviews': 'AI Mock Interviews',
    '/roadmap': 'Learning Roadmap',
    '/profile': 'Student Profile',
    '/settings': 'Settings',
    '/plans': 'Plans & Billing',
    '/chat': 'AI Career Coach',
  };

  const pageTitle = pageNames[location.pathname] ?? 'Career Workspace';

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      {/* Main Workspace Content Area */}
      <div className="app-main-wrapper">
        <AppHeader
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          title={pageTitle}
        />

        <main className="app-content-viewport" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
