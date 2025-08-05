import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return admin ? <Dashboard /> : <Login />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#1f2937',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            padding: '16px 20px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
            minWidth: '300px',
          },
          success: {
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#1f2937',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#1f2937',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;
