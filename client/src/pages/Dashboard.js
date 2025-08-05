import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Car, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard,
  Plus,
  Eye,
  Settings,
  History,
  Star,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalSpent: 0,
    averageRating: 0
  });

  // Mock data - in real app, this would come from API
  const recentBookings = [
    {
      id: '1',
      carType: 'sedan',
      washType: 'premium',
      location: 'University of Nairobi',
      scheduledDate: '2024-01-15',
      scheduledTime: '10:00',
      status: 'confirmed',
      price: 1200
    },
    {
      id: '2',
      carType: 'suv',
      washType: 'basic',
      location: 'Muthaiga Golf Club',
      scheduledDate: '2024-01-12',
      scheduledTime: '14:00',
      status: 'completed',
      price: 1000
    }
  ];

  const userActions = [
    {
      title: 'Book New Service',
      description: 'Schedule a car wash',
      icon: Plus,
      link: '/book',
      color: 'bg-primary-600 hover:bg-primary-700',
      primary: true
    },
    {
      title: 'My Bookings',
      description: 'View all your bookings',
      icon: Calendar,
      link: '/my-bookings',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Service History',
      description: 'View past services',
      icon: History,
      link: '/history',
      color: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      title: 'Profile Settings',
      description: 'Update your information',
      icon: Settings,
      link: '/profile',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const quickStats = [
    {
      title: 'Total Bookings',
      value: userStats.totalBookings.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Active Bookings',
      value: userStats.activeBookings.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Total Spent',
      value: `KES ${userStats.totalSpent.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Average Rating',
      value: `${userStats.averageRating}/5`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    }
  ];

  useEffect(() => {
    // Simulate fetching user stats
    setUserStats({
      totalBookings: 12,
      activeBookings: 2,
      totalSpent: 15400,
      averageRating: 4.8
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Here's what's happening with your car wash bookings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{user?.userType}</p>
                <p className="text-gray-500 dark:text-gray-400">Member</p>
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
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {userActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft hover:shadow-medium transition-all duration-200 transform hover:scale-105 ${
                action.primary ? 'ring-2 ring-primary-200 dark:ring-primary-800' : ''
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

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Bookings
              </h2>
              <Link
                to="/my-bookings"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {booking.carType.charAt(0).toUpperCase() + booking.carType.slice(1)} - {booking.washType.charAt(0).toUpperCase() + booking.washType.slice(1)} Wash
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{booking.scheduledDate}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{booking.scheduledTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      KES {booking.price.toLocaleString()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {recentBookings.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start by booking your first car wash service
              </p>
              <Link
                to="/book"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Book Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 