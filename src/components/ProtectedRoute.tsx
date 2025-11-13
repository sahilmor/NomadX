import { useAuth } from '@/contexts/AuthContext'; // Make sure to uncomment this
import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
// Remove the 'useEffect' and 'useState' for the fake auth

const ProtectedRoute = () => {
  // Use the real user and loading state from your AuthContext
  const { user, isLoading } = useAuth(); 

  if (isLoading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!user) {
    // If not loading and no user, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If user exists, render the child routes (e.g., Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;