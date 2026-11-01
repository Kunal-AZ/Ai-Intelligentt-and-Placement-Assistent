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
    '/architecture': 'Platform Architecture',
    '/resume': 'Resume Studio & ATS Audit',
    '/skills': 'Skill Evidence & Gaps',
    '/careers': 'Skill Evidence & Gaps',
    '/jobs': 'Verified Job Recommendations',
    '/interviews': 'AI Mock Interviews',
    '/roadmap': '30-Day Placement Roadmap',
    '/profile': 'Student Profile & Settings',
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
