import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './Components/AppShell';
import { hasAccessToken, restoreSession } from './lib/api';

// Lazy-load route pages to enable route-level code splitting and minimize initial bundle size
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ResumeStudioPage = lazy(() => import('./pages/ResumeStudioPage').then((m) => ({ default: m.ResumeStudioPage })));
const SkillEvidencePage = lazy(() => import('./pages/SkillEvidencePage').then((m) => ({ default: m.SkillEvidencePage })));
const CareerRecommendationsPage = lazy(() => import('./pages/CareerRecommendationsPage').then((m) => ({ default: m.CareerRecommendationsPage })));
const JobMatchesPage = lazy(() => import('./pages/JobMatchesPage').then((m) => ({ default: m.JobMatchesPage })));
const MockInterviewsPage = lazy(() => import('./pages/MockInterviewsPage').then((m) => ({ default: m.MockInterviewsPage })));
const LearningRoadmapPage = lazy(() => import('./pages/LearningRoadmapPage').then((m) => ({ default: m.LearningRoadmapPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));

function RouteLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3" aria-busy="true" aria-label="Loading page">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--text-primary)] animate-spin" />
      <span className="text-xs font-mono text-[var(--text-muted)]">Loading workspace...</span>
    </div>
  );
}

function RequireAuthentication() {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(!hasAccessToken());
  const [isAuthenticated, setIsAuthenticated] = useState(hasAccessToken());

  useEffect(() => {
    if (hasAccessToken()) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }
    let isMounted = true;
    restoreSession().then((token: string | null) => {
      if (isMounted) {
        setIsAuthenticated(Boolean(token));
        setIsChecking(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) return <RouteLoader />;
  return isAuthenticated ? <AppShell /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Auth routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected shell routes */}
        <Route element={<RequireAuthentication />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resume" element={<ResumeStudioPage />} />
          <Route path="/skills" element={<SkillEvidencePage />} />
          <Route path="/careers" element={<CareerRecommendationsPage />} />
          <Route path="/jobs" element={<JobMatchesPage />} />
          <Route path="/interviews" element={<MockInterviewsPage />} />
          <Route path="/roadmap" element={<LearningRoadmapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>

        {/* Fallback redirect to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
