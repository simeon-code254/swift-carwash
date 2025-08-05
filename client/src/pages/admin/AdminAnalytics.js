import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  CreditCard, 
  Star,
  Car,
  MapPin,
  Clock,
  DollarSign,
  Activity,
  PieChart,
  BarChart,
  LineChart
} from 'lucide-react';

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      total: 0,
      monthly: 0,
      weekly: 0,
      daily: 0,
      growth: 0
    },
    bookings: {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      growth: 0
    },
    users: {
      total: 0,
      active: 0,
      new: 0,
      growth: 0
    },
    ratings: {
      average: 0,
      total: 0,
      distribution: []
    }
  });

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, this would come from API
  const mockAnalyticsData = {
    revenue: {
      total: 187500,
      monthly: 45000,
      weekly: 12000,
      daily: 1800,
      growth: 18.5
    },
    bookings: {
      total: 156,
      completed: 148,
      pending: 8,
      cancelled: 12,
      growth: 12.3
    },
    users: {
      total: 89,
      active: 67,
      new: 23,
      growth: 8.7
    },
    ratings: {
      average: 4.7,
      total: 134,
      distribution: [
        { rating: 5, count: 89, percentage: 66.4 },
        { rating: 4, count: 32, percentage: 23.9 },
        { rating: 3, count: 8, percentage: 6.0 },
        { rating: 2, count: 3, percentage: 2.2 },
        { rating: 1, count: 2, percentage: 1.5 }
      ]
    }
  };

  const topLocations = [
    { name: 'University of Nairobi', bookings: 45, revenue: 54000 },
    { name: 'Muthaiga Golf Club', bookings: 32, revenue: 38400 },
    { name: 'JKUAT Main Campus', bookings: 28, revenue: 33600 },
    { name: 'Strathmore University', bookings: 25, revenue: 30000 },
    { name: 'Kenyatta University', bookings: 22, revenue: 26400 }
  ];

  const popularServices = [
    { name: 'Premium Wash', bookings: 78, revenue: 93600 },
    { name: 'Basic Wash', bookings: 45, revenue: 36000 },
    { name: 'Interior Clean', bookings: 23, revenue: 34500 },
    { name: 'Exterior Only', bookings: 10, revenue: 12000 }
  ];

  const recentTrends = [
    { date: '2024-01-01', bookings: 12, revenue: 14400 },
    { date: '2024-01-02', bookings: 15, revenue: 18000 },
    { date: '2024-01-03', bookings: 18, revenue: 21600 },
    { date: '2024-01-04', bookings: 14, revenue: 16800 },
    { date: '2024-01-05', bookings: 20, revenue: 24000 },
    { date: '2024-01-06', bookings: 22, revenue: 26400 },
    { date: '2024-01-07', bookings: 19, revenue: 22800 }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);
  }, []);

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  const periodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Business insights and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    KES {analyticsData.revenue.total.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className={`flex items-center text-sm font-medium ${getGrowthColor(analyticsData.revenue.growth)}`}>
                {React.createElement(getGrowthIcon(analyticsData.revenue.growth), { className: "w-4 h-4 mr-1" })}
                {analyticsData.revenue.growth}%
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.bookings.total}
                  </p>
                </div>
              </div>
              <div className={`flex items-center text-sm font-medium ${getGrowthColor(analyticsData.bookings.growth)}`}>
                {React.createElement(getGrowthIcon(analyticsData.bookings.growth), { className: "w-4 h-4 mr-1" })}
                {analyticsData.bookings.growth}%
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                  <Users className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.users.total}
                  </p>
                </div>
              </div>
              <div className={`flex items-center text-sm font-medium ${getGrowthColor(analyticsData.users.growth)}`}>
                {React.createElement(getGrowthIcon(analyticsData.users.growth), { className: "w-4 h-4 mr-1" })}
                {analyticsData.users.growth}%
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600">
                  <Star className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Rating
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.ratings.average}/5
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {analyticsData.ratings.total} reviews
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Locations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Locations
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topLocations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {location.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {location.bookings} bookings
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        KES {location.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Services */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Popular Services
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {popularServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3">
                        <Car className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {service.bookings} bookings
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        KES {service.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rating Distribution
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analyticsData.ratings.distribution.map((rating) => (
                <div key={rating.rating} className="flex items-center">
                  <div className="flex items-center w-16">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {rating.rating}★
                    </span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${rating.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {rating.count} ({rating.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Trends
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Date
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Bookings
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrends.map((trend, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 text-sm text-gray-900 dark:text-white">
                        {trend.date}
                      </td>
                      <td className="py-2 text-sm text-gray-900 dark:text-white">
                        {trend.bookings}
                      </td>
                      <td className="py-2 text-sm text-gray-900 dark:text-white">
                        KES {trend.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 