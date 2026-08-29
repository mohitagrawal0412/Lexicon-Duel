import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isConfigured } = useAuth();

  // If Firebase isn't configured, let them through (guest mode)
  if (!isConfigured) {
    return children;
  }

  if (loading) {
    return (
      <div className="game-bg flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
