import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Car, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  LogOut,
  RefreshCw,
  MessageSquare,
  Search,
  Clock,
  Eye,
  XCircle,
  Activity,
  Truck,
  Menu,
  Users,
  Image,
  FileText
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Workers from './Workers';
import PromoBanners from './PromoBanners';
import Resources from './Resources';
import Chat from './Chat';

interface Booking {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  carType: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  price: number;
  specialInstructions?: string;
  carDetails?: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  status: 'pending' | 'confirmed' | 'started_cleaning' | 'done' | 'delivered' | 'rejected';
  paymentStatus: string;
  assignedWorker?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  deliveredBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayBookings: number;
  averageRating: number;
}

const Dashboard: React.FC = () => {
  const { admin, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    inProgressBookings: 0,
    completedBookings: 0,
    deliveredBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    todayBookings: 0,
    averageRating: 4.8
  });

  // Helper function to safely format currency
  const formatCurrency = (amount: number | undefined) => {
    return (amount || 0).toLocaleString();
  };
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [showAllRecentBookings, setShowAllRecentBookings] = useState(false);

  useEffect(() => {
    // Test database connection first
    testDatabase();
    
    // Check if we have a valid admin token
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No admin token found, attempting auto-login...');
      handleAutoLogin();
    } else {
      console.log('Admin token found, proceeding with data fetch...');
      fetchBookings();
      fetchStats();
      fetchWorkers();
    }
  }, []);

  // Poll for updates every 60 seconds to ensure real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings();
      fetchStats();
      fetchWorkers();
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleAutoLogin = async () => {
    try {
      console.log('Attempting auto-login with admin credentials...');
      const response = await axios.post('/api/admin/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        console.log('Auto-login successful, fetching data...');
        fetchBookings();
        fetchStats();
        fetchWorkers();
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      toast.error('Failed to authenticate admin');
    }
  };

  const testDatabase = async () => {
    try {
      console.log('Testing database connection...');
      const response = await axios.get('/api/admin/test-db');
      console.log('Database test response:', response.data);
      
      if (response.data.success) {
        console.log('Database is working!');
        console.log('Total bookings:', response.data.totalBookings);
        console.log('Has sample booking:', response.data.hasSampleBooking);
      } else {
        console.error('Database test failed:', response.data);
      }
    } catch (error) {
      console.error('Database test error:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching stats with token:', token ? 'Token exists' : 'No token');
      console.log('Token value:', token);
      
      const response = await axios.get('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Stats response:', response.data);
      console.log('Response status:', response.status);
      
      // Ensure all stats have default values
      const safeStats = {
        totalBookings: response.data.stats?.totalBookings || 0,
        pendingBookings: response.data.stats?.pendingBookings || 0,
        confirmedBookings: response.data.stats?.confirmedBookings || 0,
        inProgressBookings: response.data.stats?.inProgressBookings || 0,
        completedBookings: response.data.stats?.completedBookings || 0,
        deliveredBookings: response.data.stats?.deliveredBookings || 0,
        totalRevenue: response.data.stats?.totalRevenue || 0,
        monthlyRevenue: response.data.stats?.monthlyRevenue || 0,
        todayBookings: response.data.stats?.todayBookings || 0,
        averageRating: response.data.stats?.averageRating || 4.8
      };
      
      console.log('Safe stats:', safeStats);
      setStats(safeStats);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      toast.error(`Failed to fetch dashboard stats: ${error.response?.data?.error || error.message}`);
      // Keep default stats values on error
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/workers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setWorkers(response.data.workers || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to fetch workers');
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/bookings/${bookingId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update the booking in the local state without refreshing the entire list
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking._id === bookingId 
            ? { ...booking, status: newStatus as Booking['status'] }
            : booking
        )
      );

      toast.success('Booking status updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update booking status';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'started_cleaning': return 'bg-orange-100 text-orange-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-3 h-3" />;
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'started_cleaning': return <Loader className="w-3 h-3" />;
      case 'done': return <CheckCircle className="w-3 h-3" />;
      case 'delivered': return <Truck className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'car_wash':
        return 'Car Wash';
      case 'interior_cleaning':
        return 'Interior Cleaning';
      case 'exterior_cleaning':
        return 'Exterior Cleaning';
      case 'full_detailing':
        return 'Full Detailing';
      default:
        return serviceType.replace('_', ' ');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleAssignBooking = async () => {
    if (!selectedWorkerId || !selectedBooking) {
      toast.error('Please select a worker');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/bookings/${selectedBooking._id}/assign`, {
        workerId: selectedWorkerId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('Booking assigned successfully');
      setShowAssignModal(false);
      setSelectedWorkerId('');
      fetchBookings(); // Refresh bookings to show updated assignment
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to assign booking';
      toast.error(message);
    }
  };

  const openAssignModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedWorkerId('');
    setShowAssignModal(true);
    // Refresh workers list when opening assign modal to ensure real-time data
    fetchWorkers();
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {admin?.username}!</h1>
                  <p className="text-indigo-100 text-lg">Here's what's happening with SwiftWash today</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{stats.totalBookings}</div>
                    <div className="text-indigo-100 text-sm">Total Bookings</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">KES {(stats.totalRevenue || 0).toLocaleString()}</div>
                    <div className="text-indigo-100 text-sm">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgressBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Loader className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.deliveredBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">KES {(stats.monthlyRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageRating || 4.8}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowAllRecentBookings(!showAllRecentBookings)}
                      className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {showAllRecentBookings ? 'See Less' : 'See More'}
                    </button>
                    <button
                      onClick={() => setActiveSection('bookings')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {(bookings || []).filter(booking => !['delivered', 'rejected'].includes(booking.status)).slice(0, showAllRecentBookings ? bookings.length : 5).map((booking) => (
                  <div key={booking._id} className="px-8 py-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {booking.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{booking.customerName}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{getServiceTypeLabel(booking.serviceType)} - {booking.carType}</span>
                            <span>{new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">KES {(booking.price || 0).toLocaleString()}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-8">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
                  <p className="text-indigo-100 text-lg">Manage and track all car wash bookings</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{(bookings || []).filter(b => !['delivered', 'rejected'].includes(b.status)).length}</div>
                    <div className="text-indigo-100 text-sm">Active Bookings</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{(bookings || []).filter(b => ['delivered', 'rejected'].includes(b.status)).length}</div>
                    <div className="text-indigo-100 text-sm">Completed Jobs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search Bookings</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by customer name, phone, or service type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 min-w-[150px]"
                    >
                      <option value="all">All Active</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="started_cleaning">🔄 In Progress</option>
                      <option value="done">✅ Completed</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchBookings}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Bookings Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">All Bookings</h3>
                    <p className="text-gray-600 mt-1">Showing {(bookings || []).filter(booking => 
                      // Only count active bookings (not delivered or rejected)
                      !['delivered', 'rejected'].includes(booking.status) &&
                      (filter === 'all' || booking.status === filter) &&
                      (searchTerm === '' || 
                       booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       booking.customerPhone.includes(searchTerm) ||
                       booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length} active bookings</p>
                  </div>
                  <button
                    onClick={() => setShowAllBookings(!showAllBookings)}
                    className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    {showAllBookings ? 'See Less' : 'See More'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer & Service Details</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(bookings || [])
                      .filter(booking => 
                        // Only show active bookings (not delivered or rejected)
                        !['delivered', 'rejected'].includes(booking.status) &&
                        (filter === 'all' || booking.status === filter) &&
                        (searchTerm === '' || 
                         booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerPhone.includes(searchTerm) ||
                         booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .slice(0, showAllBookings ? undefined : 10)
                      .map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50 transition-all duration-200">
                          <td className="px-8 py-6">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                                  {booking.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{booking.customerName}</div>
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {booking.customerPhone}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center mb-1">
                                  <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                  {booking.customerLocation}
                                </div>
                                <div className="flex items-center mb-1">
                                  <Car className="w-3 h-3 mr-1 text-gray-400" />
                                  {getServiceTypeLabel(booking.serviceType)} - {booking.carType}
                                </div>
                                {booking.specialInstructions && (
                                  <div className="text-sm text-blue-600">
                                    📝 {booking.specialInstructions}
                                  </div>
                                )}
                                {booking.carDetails && (
                                  <div className="text-xs text-gray-500">
                                    {booking.carDetails.make} {booking.carDetails.model} - {booking.carDetails.color} ({booking.carDetails.plateNumber})
                                  </div>
                                )}
                                {booking.assignedWorker && (
                                  <div className="text-xs text-green-600 font-medium">
                                    👤 Assigned to worker
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(booking.scheduledDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {booking.scheduledTime}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">
                                {booking.status === 'pending' ? '⏳ Pending' :
                                 booking.status === 'confirmed' ? '✅ Confirmed' :
                                 booking.status === 'started_cleaning' ? '🧽 Started Cleaning' :
                                 booking.status === 'done' ? '✨ Done' :
                                 booking.status === 'delivered' ? '🚗 Delivered' :
                                 '❌ Rejected'}
                              </span>
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">KES {(booking.price || 0).toLocaleString()}</div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <select
                                value={booking.status}
                                onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                                className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="confirmed">✅ Confirmed</option>
                                <option value="started_cleaning">🧽 Started Cleaning</option>
                                <option value="done">✨ Done</option>
                                <option value="delivered">🚗 Delivered</option>
                                <option value="rejected">❌ Rejected</option>
                              </select>
                              <button
                                onClick={() => openAssignModal(booking)}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                  booking.assignedWorker 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {booking.assignedWorker ? '👤 Reassign' : '👤 Assign'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!showAllBookings && (bookings || []).filter(booking => 
                // Only count active bookings (not delivered or rejected)
                !['delivered', 'rejected'].includes(booking.status) &&
                (filter === 'all' || booking.status === filter) &&
                (searchTerm === '' || 
                 booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 booking.customerPhone.includes(searchTerm) ||
                 booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))
              ).length > 10 && (
                <div className="px-8 py-4 border-t border-gray-100 bg-gray-50">
                                      <button
                      onClick={() => setShowAllBookings(true)}
                      className="w-full py-3 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                    >
                      Show More Bookings ({bookings.filter(booking => 
                        // Only count active bookings (not delivered or rejected)
                        !['delivered', 'rejected'].includes(booking.status) &&
                        (filter === 'all' || booking.status === filter) &&
                        (searchTerm === '' || 
                         booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerPhone.includes(searchTerm) ||
                         booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length - 10} more)
                    </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'workers':
        return <Workers />;

      case 'promos':
        return <PromoBanners />;

      case 'previous-jobs':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Previous Jobs</h1>
                  <p className="text-indigo-100 text-lg">View completed and rejected bookings</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{(bookings || []).filter(b => ['delivered', 'rejected'].includes(b.status)).length}</div>
                    <div className="text-indigo-100 text-sm">Completed Jobs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Jobs Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Previous Jobs</h3>
                    <p className="text-gray-600 mt-1">Showing {(bookings || []).filter(booking => 
                      ['delivered', 'rejected'].includes(booking.status) &&
                      (searchTerm === '' || 
                       booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       booking.customerPhone.includes(searchTerm) ||
                       booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length} completed jobs</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 min-w-[150px]"
                    >
                      <option value="all">All Previous</option>
                      <option value="delivered">🚚 Delivered</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                    <button
                      onClick={fetchBookings}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer & Service Details</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(bookings || [])
                      .filter(booking => 
                        ['delivered', 'rejected'].includes(booking.status) &&
                        (filter === 'all' || booking.status === filter) &&
                        (searchTerm === '' || 
                         booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerPhone.includes(searchTerm) ||
                         booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50 transition-all duration-200">
                          <td className="px-8 py-6">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                                  {booking.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{booking.customerName}</div>
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {booking.customerPhone}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center mb-1">
                                  <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                  {booking.customerLocation}
                                </div>
                                <div className="flex items-center mb-1">
                                  <Car className="w-3 h-3 mr-1 text-gray-400" />
                                  {getServiceTypeLabel(booking.serviceType)} - {booking.carType}
                                </div>
                                {booking.specialInstructions && (
                                  <div className="text-sm text-blue-600">
                                    📝 {booking.specialInstructions}
                                  </div>
                                )}
                                {booking.carDetails && (
                                  <div className="text-xs text-gray-500">
                                    {booking.carDetails.make} {booking.carDetails.model} - {booking.carDetails.color} ({booking.carDetails.plateNumber})
                                  </div>
                                )}
                                {booking.assignedWorker && (
                                  <div className="text-xs text-green-600 font-medium">
                                    👤 Assigned to worker
                                  </div>
                                )}
                                {booking.rejectionReason && (
                                  <div className="text-xs text-red-600 font-medium">
                                    ❌ {booking.rejectionReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(booking.scheduledDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {booking.scheduledTime}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">
                                {booking.status === 'delivered' ? '🚚 Delivered' : '❌ Rejected'}
                              </span>
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">KES {(booking.price || 0).toLocaleString()}</div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  // View booking details
                                  toast.success('Viewing booking details');
                                }}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                👁️ View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Analytics</h1>
                  <p className="text-indigo-100 text-lg">Detailed insights and performance metrics</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{(bookings || []).length}</div>
                    <div className="text-indigo-100 text-sm">Total Bookings</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">KES {(bookings || []).reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()}</div>
                    <div className="text-indigo-100 text-sm">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Distribution</h3>
                <div className="space-y-4">
                                     {(() => {
                     const serviceCounts: { [key: string]: number } = (bookings || []).reduce((acc, booking) => {
                       const service = getServiceTypeLabel(booking.serviceType);
                       acc[service] = (acc[service] || 0) + 1;
                       return acc;
                     }, {} as { [key: string]: number });
                     
                     return Object.entries(serviceCounts).map(([service, count]) => (
                       <div key={service} className="flex items-center justify-between">
                         <div className="flex items-center">
                           <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                           <span className="text-sm font-medium text-gray-700">{service}</span>
                         </div>
                         <span className="text-sm font-semibold text-gray-900">{count}</span>
                       </div>
                     ));
                   })()}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                <div className="space-y-4">
                                     {(() => {
                     const statusCounts: { [key: string]: number } = (bookings || []).reduce((acc, booking) => {
                       acc[booking.status] = (acc[booking.status] || 0) + 1;
                       return acc;
                     }, {} as { [key: string]: number });
                     
                     return Object.entries(statusCounts).map(([status, count]) => (
                       <div key={status} className="flex items-center justify-between">
                         <div className="flex items-center">
                           <div className={`w-3 h-3 rounded-full mr-3 ${
                             status === 'pending' ? 'bg-yellow-500' :
                             status === 'confirmed' ? 'bg-blue-500' :
                             status === 'started_cleaning' ? 'bg-orange-500' :
                             status === 'done' ? 'bg-green-500' :
                             status === 'delivered' ? 'bg-purple-500' :
                             'bg-red-500'
                           }`}></div>
                           <span className="text-sm font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                         </div>
                         <span className="text-sm font-semibold text-gray-900">{count}</span>
                       </div>
                     ));
                   })()}
                </div>
              </div>

              {/* Revenue Analytics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      KES {(bookings || []).reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Average Order Value</span>
                    <span className="text-lg font-bold text-blue-600">
                      KES {bookings.length > 0 ? (bookings.reduce((sum, b) => sum + (b.price || 0), 0) / bookings.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Completed Revenue</span>
                    <span className="text-lg font-bold text-purple-600">
                      KES {(bookings || []).filter(b => ['done', 'delivered'].includes(b.status)).reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {bookings.length > 0 ? Math.round(((bookings.filter(b => ['done', 'delivered'].includes(b.status)).length / bookings.length) * 100)) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Active Jobs</span>
                    <span className="text-lg font-bold text-blue-600">
                      {(bookings || []).filter(b => !['delivered', 'rejected'].includes(b.status)).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Pending Jobs</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {(bookings || []).filter(b => b.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {(bookings || []).slice(0, 5).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {booking.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
                        <p className="text-xs text-gray-500">{getServiceTypeLabel(booking.serviceType)} - KES {(booking.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'chat':
        return <Chat />;

      case 'resources':
        return <Resources />;

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-600 to-purple-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-indigo-500">
          <div className="flex items-center">
            <Car className="w-8 h-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">SwiftWash</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'overview'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Overview
            </button>
            <button
              onClick={() => setActiveSection('bookings')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'bookings'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Car className="w-5 h-5 mr-3" />
              Bookings
            </button>
            <button
              onClick={() => setActiveSection('workers')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'workers'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Workers
            </button>
            <button
              onClick={() => setActiveSection('promos')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'promos'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Image className="w-5 h-5 mr-3" />
              Promo Banners
            </button>
            <button
              onClick={() => setActiveSection('previous-jobs')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'previous-jobs'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Previous Jobs
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'analytics'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Activity className="w-5 h-5 mr-3" />
              Analytics
            </button>
            <button
              onClick={() => setActiveSection('chat')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'chat'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Chat
            </button>
            <button
              onClick={() => setActiveSection('resources')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'resources'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Resources
            </button>
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
                {activeSection === 'overview' && 'Dashboard'}
                {activeSection === 'bookings' && 'Booking Management'}
                {activeSection === 'workers' && 'Worker Management'}
                {activeSection === 'promos' && 'Promo Banners'}
                {activeSection === 'previous-jobs' && 'Previous Jobs'}
                {activeSection === 'analytics' && 'Analytics'}
                {activeSection === 'chat' && 'Team Chat'}
                {activeSection === 'resources' && 'Resources'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Live
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {admin?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{admin?.username || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="bg-gray-50 flex-1">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                  </div>
                </div>
              ) : (
                renderSection()
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Booking to Worker</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Booking Details:</p>
                <p className="text-sm font-medium">{selectedBooking.customerName} - {getServiceTypeLabel(selectedBooking.serviceType)}</p>
                <p className="text-sm text-gray-500">{selectedBooking.scheduledDate} at {selectedBooking.scheduledTime}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker</label>
                <select 
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a worker...</option>
                  {workers.filter(worker => worker.isActive).map((worker) => (
                    <option key={worker._id} value={worker._id}>
                      {worker.name} ({worker.status || 'available'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedWorkerId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignBooking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 