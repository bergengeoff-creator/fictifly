import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F5EFE6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        color: '#9A8878',
        fontSize: '0.95rem',
        fontStyle: 'italic',
      }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}