import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return null;
  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
