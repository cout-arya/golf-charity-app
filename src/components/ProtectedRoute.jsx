import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-on-surface">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && profile?.role !== 'admin') {
    return <Navigate to="/user" replace />;
  }

  return children;
};
