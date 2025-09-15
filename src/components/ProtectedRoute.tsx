import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useEffect, useState } from 'react';

const ProtectedRoute = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUser({ name: 'Sahil Mor' });
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
