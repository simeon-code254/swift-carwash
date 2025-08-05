import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Earnings from './pages/Earnings';
import JobRequests from './pages/JobRequests';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App Component
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <div className="flex">
                <Navigation />
                <div className="flex-1">
                  <Dashboard />
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/earnings" 
          element={
            <ProtectedRoute>
              <div className="flex">
                <Navigation />
                <div className="flex-1">
                  <Earnings />
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/job-requests" 
          element={
            <ProtectedRoute>
              <div className="flex">
                <Navigation />
                <div className="flex-1">
                  <JobRequests />
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <div className="flex">
                <Navigation />
                <div className="flex-1">
                  <Chat />
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <div className="flex">
                <Navigation />
                <div className="flex-1">
                  <Settings />
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
      
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#1f2937',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
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
    </Router>
  );
};

// Root App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
