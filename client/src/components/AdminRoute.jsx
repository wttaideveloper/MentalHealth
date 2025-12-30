import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAdminAuth } from '../utils/admin';
import { isAuthenticated } from '../utils/auth';

function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      // First check if user is authenticated
      if (!isAuthenticated()) {
        setLoading(false);
        setIsUserAdmin(false);
        return;
      }

      // Then check if user is admin
      try {
        const authStatus = await checkAdminAuth();
        setIsUserAdmin(authStatus.isAdmin);
      } catch (error) {
        setIsUserAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mh-light">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green mb-4"></div>
          <p className="text-mh-dark">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default AdminRoute;

