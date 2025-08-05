import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

// Context
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import AIChatbot from './components/AIChatbot';
import WhatsAppSupport from './components/WhatsAppSupport';

// Pages
import Home from './pages/Home';
import BookingForm from './pages/BookingForm';
import MyBookings from './pages/MyBookings';
import MyWashes from './pages/MyWashes';
import PhoneLogin from './pages/auth/PhoneLogin';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <main className="pt-16">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/book" element={<BookingForm />} />
                <Route path="/track" element={<MyBookings />} />
                <Route path="/my-washes" element={<MyWashes />} />
                <Route path="/phone-login" element={<PhoneLogin />} />
                
                {/* 404 Route */}
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <Footer />
            <AIChatbot />
            <WhatsAppSupport />
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1f2937',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
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
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)',
                },
                iconTheme: {
                  primary: '#22c55e',
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
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 