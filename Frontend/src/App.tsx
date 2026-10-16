import { Navigate, Route, Routes } from 'react-router-dom';
import { ArchitecturePage } from './pages/ArchitecturePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ArchitecturePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
