import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/PageLoader';
import { Login } from '../pages/Login';

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user || !profile?.is_active) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function LoginRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user && profile?.is_active) return <Navigate to="/dashboard" replace />;
  return <Login />;
}
