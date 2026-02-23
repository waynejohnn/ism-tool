import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-500)',
      }}>
        <div>Verifying access...</div>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser || currentUser.role !== 'Admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
