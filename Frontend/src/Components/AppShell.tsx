import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './Header';

export function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace Content Area */}
      <div className="app-main-wrapper">
        <AppHeader
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          title="Hey, let's make progress."
          subtitle="Career Workspace"
        />

        <main className="app-page-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
