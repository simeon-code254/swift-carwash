import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Car,
  Settings,
  Eye,
  Plus,
  Download,
  Filter
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalUsers: 0,
    averageRating: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);

  // Mock data - in real app, this would come from API
  const mockRecentActivities = [
    {
      id: '1',
      type: 'booking',
      message: 'New booking from John Doe',
      time: '2 minutes ago',
      status: 'pending'
    },
    {
      id: '2',
      type: 'payment',
      message: 'Payment received from Jane Smith',
      time: '5 minutes ago',
      status: 'completed'
    },
    {
      id: '3',
      type: 'booking',
      message: 'Booking completed for Mike Johnson',
      time: '10 minutes ago',
      status: 'completed'
    },
    {
      id: '4',
      type: 'user',
      message: 'New user registration: Sarah Wilson',
      time: '15 minutes ago',
      status: 'new'
    }
  ];

  const mockPendingBookings = [
    {
      id: '1',
      customerName: 'John Doe',
      carType: 'sedan',
      washType: 'premium',
      location: 'University of Nairobi',
      scheduledDate: '2024-01-15',
      scheduledTime: '10:00',
      price: 1200
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      carType: 'suv',
      washType: 'basic',
      location: 'Muthaiga Golf Club',
      scheduledDate: '2024-01-15',
      scheduledTime: '14:00',
      price: 1000
    }
  ];

  const adminActions = [
    {
      title: 'Manage Bookings',
      description: 'View and manage all bookings',
      icon: Calendar,
      link: '/admin/bookings',
      color: 'bg-blue-600 hover:bg-blue-700',
      primary: true
    },
    {
      title: 'User Management',
      description: 'Manage user accounts',
      icon: Users,
      link: '/admin/users',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: BarChart3,
      link: '/admin/analytics',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Settings',
      description: 'System configuration',
      icon: Settings,
      link: '/admin/settings',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  const quickStats = [
    {
      title: 'Total Bookings',
      value: adminStats.totalBookings.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pending Bookings',
      value: adminStats.pendingBookings.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: `KES ${adminStats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: '+18%',
      changeType: 'positive'
    },
    {
      title: 'Total Users',
      value: adminStats.totalUsers.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  useEffect(() => {
    // Simulate fetching admin stats
    setAdminStats({
      totalBookings: 156,
      pendingBookings: 8,
      completedBookings: 148,
      totalRevenue: 187500,
      totalUsers: 89,
      averageRating: 4.7
    });

    setRecentActivities(mockRecentActivities);
    setPendingBookings(mockPendingBookings);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return Calendar;
      case 'payment':
        return CreditCard;
      case 'user':
        return Users;
      default:
        return AlertCircle;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'pending':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'new':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your car wash business operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">Admin</p>
                  <p className="text-gray-500 dark:text-gray-400">System Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft hover:shadow-medium transition-all duration-200 transform hover:scale-105 ${
                action.primary ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg text-white ${action.color}`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pending Bookings
                </h2>
                <Link
                  to="/admin/bookings"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 text-sm font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.customerName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{booking.carType} - {booking.washType}</span>
                          <span>{booking.scheduledDate} at {booking.scheduledTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        KES {booking.price.toLocaleString()}
                      </span>
                      <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pendingBookings.length === 0 && (
              <div className="px-6 py-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No pending bookings
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  All bookings have been processed
                </p>
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activities
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentActivities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.status)}`}>
                        <ActivityIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {recentActivities.length === 0 && (
              <div className="px-6 py-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No recent activities
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Activities will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 