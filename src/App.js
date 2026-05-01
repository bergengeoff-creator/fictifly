import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AgeGate from './pages/AgeGate';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import ClassroomDashboard from './pages/ClassroomDashboard';
import Microfiction from './pages/generators/Microfiction';
import FlashFiction from './pages/generators/FlashFiction';
import PublicProfile from './pages/PublicProfile';
import VerifyEmail from './pages/VerifyEmail';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/age-gate" element={<AgeGate />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          {/* Email verification holding page â€” shown after standard/teacher signup */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          {/* Supabase redirects here after user clicks confirmation link */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/classroom" element={<ProtectedRoute><ClassroomDashboard /></ProtectedRoute>} />
          <Route path="/generators/microfiction" element={<ProtectedRoute><Microfiction /></ProtectedRoute>} />
          <Route path="/generators/flash-fiction" element={<ProtectedRoute><FlashFiction /></ProtectedRoute>} />
          <Route path="/writers/:username" element={<PublicProfile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}