import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './Components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FeaturePage } from './pages/FeaturePage';
import { ChatPage } from './pages/ChatPage';
import { ArchitecturePage } from './pages/ArchitecturePage';

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Auth routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected shell routes */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />

        <Route
          path="/resume"
          element={
            <FeaturePage
              eyebrow="Resume Studio"
              icon="📄"
              title="Your resume, backed by evidence."
              description="Upload a PDF or DOCX. The platform validates the file, processes it privately, and keeps its analysis separate from your original document."
              action="Upload resume"
              endpoint="/resumes"
              accept=".pdf,.docx"
            />
          }
        />

        <Route
          path="/skills"
          element={
            <FeaturePage
              eyebrow="Skill Evidence"
              icon="🎯"
              title="Record what you can show."
              description="Skill gaps are calculated from evidence rather than assumed percentages. Every skill you record is verified against your resume and assessments."
              action="Add your first skill"
            />
          }
        />

        <Route
          path="/careers"
          element={
            <FeaturePage
              eyebrow="Career Paths"
              icon="🗺️"
              title="Choose a direction with context."
              description="Recommendations appear only for selected roles supported by recorded evidence. See real role requirements and how your profile matches."
              action="Choose a target role"
            />
          }
        />

        <Route
          path="/jobs"
          element={
            <FeaturePage
              eyebrow="Job Matches"
              icon="💼"
              title="Compare requirements, not promises."
              description="See required and preferred skills with transparent evidence coverage. Every match is explained so you understand your strengths and gaps."
              action="Browse active jobs"
            />
          }
        />

        <Route
          path="/interviews"
          element={
            <FeaturePage
              eyebrow="Mock Interviews"
              icon="🎤"
              title="Practice one answer at a time."
              description="Get structured feedback on accuracy, communication, structure, and reasoning. Your answers are evaluated against real role expectations."
              action="Start an interview"
            />
          }
        />

        <Route
          path="/roadmap"
          element={
            <FeaturePage
              eyebrow="Learning Roadmap"
              icon="🛣️"
              title="Build the next useful skill."
              description="Your roadmap adapts as evidence and performance arrive. Each step is selected based on the highest-impact skill gaps for your target role."
              action="No roadmap generated yet"
            />
          }
        />

        <Route
          path="/analytics"
          element={
            <FeaturePage
              eyebrow="Analytics"
              icon="📊"
              title="Progress, without invented metrics."
              description="Charts appear when there is enough verified assessment and interview data. Every metric is tied to actual evidence, never to assumptions."
              action="No evidence to chart yet"
            />
          }
        />

        <Route
          path="/profile"
          element={
            <FeaturePage
              eyebrow="Profile"
              icon="👤"
              title="Tell us where you are going."
              description="Set education details and target roles so recommendations remain relevant. Your profile drives the personalisation engine across every feature."
              action="Complete your profile"
            />
          }
        />

        <Route path="/chat" element={<ChatPage />} />
      </Route>

      {/* Fallback redirect to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
