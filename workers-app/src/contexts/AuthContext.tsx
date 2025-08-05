import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Worker {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  worker: Worker | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('workerToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Check if worker is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('workerToken');
      const storedWorker = localStorage.getItem('workerData');

      if (storedToken && storedWorker) {
        try {
          setWorker(JSON.parse(storedWorker));
          
          // Verify token with backend
          const response = await axios.get('/api/workers/profile');
          setWorker(response.data.worker);
          localStorage.setItem('workerData', JSON.stringify(response.data.worker));
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/workers/login', { 
        email, 
        password 
      });
      const { token, worker: workerData } = response.data;

      setWorker(workerData);
      localStorage.setItem('workerToken', token);
      localStorage.setItem('workerData', JSON.stringify(workerData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast.success('Login successful!');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setWorker(null);
    localStorage.removeItem('workerToken');
    localStorage.removeItem('workerData');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const value = {
    worker,
    loading,
    login,
    logout,
    isAuthenticated: !!worker
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 