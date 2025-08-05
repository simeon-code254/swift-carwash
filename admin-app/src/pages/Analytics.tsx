import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Calendar, Users, 
  Car, Clock, CheckCircle, XCircle, Activity, RefreshCw,
  ArrowUpRight, ArrowDownRight, Eye, Download, Filter,
  TrendingDown, Target, Zap, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    growth: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    rejected: number;
    growth: number;
  };
  services: {
    fullService: number;
    exteriorOnly: number;
    interiorOnly: number;
    premium: number;
  };
  performance: {
    averageRating: number;
    customerSatisfaction: number;
    completionRate: number;
    responseTime: number;
  };
  trends: {
    daily: Array<{ date: string; bookings: number; revenue: number }>;
    weekly: Array<{ week: string; bookings: number; revenue: number }>;
    monthly: Array<{ month: string; bookings: number; revenue: number }>;
  };
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenue: {
      total: 0,
      monthly: 0,
      weekly: 0,
      daily: 0,
      growth: 0
    },
    bookings: {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      rejected: 0,
      growth: 0
    },
    services: {
      fullService: 0,
      exteriorOnly: 0,
      interiorOnly: 0,
      premium: 0
    },
    performance: {
      averageRating: 4.8,
      customerSatisfaction: 95,
      completionRate: 98,
      responseTime: 2.5
    },
    trends: {
      daily: [],
      weekly: [],
      monthly: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to fetch analytics:', response.status);
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported successfully!');
  };

  // Updated to show whole numbers without currency symbols
  const formatCurrency = (amount: number) => {
    return `kes ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${Math.floor(value)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600 text-lg">Comprehensive insights into your car wash business</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="btn-secondary flex items-center px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportReport}
              className="btn-primary flex items-center px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              analyticsData.revenue.growth > 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {analyticsData.revenue.growth > 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
              {formatPercentage(analyticsData.revenue.growth)}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(analyticsData.revenue.total)}
            </p>
            <p className="text-sm text-gray-500 mt-2">vs last period</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              analyticsData.bookings.growth > 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {analyticsData.bookings.growth > 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
              {formatPercentage(analyticsData.bookings.growth)}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">
              {analyticsData.bookings.total}
            </p>
            <p className="text-sm text-gray-500 mt-2">vs last period</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              High
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900">
              {Math.floor(analyticsData.performance.completionRate)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">Successfully completed</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              <Zap className="w-3 h-3 mr-1" />
              Excellent
            </div>
          </div>
                      <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Customer Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.floor(analyticsData.performance.averageRating)}/5
              </p>
              <p className="text-sm text-gray-500 mt-2">Average rating</p>
            </div>
        </div>
      </div>

      {/* Revenue & Bookings Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Revenue Overview</h3>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedMetric === 'revenue' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}>
                Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('bookings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedMetric === 'bookings' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}>
                Bookings
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {analyticsData.trends.daily.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.date}</p>
                  <p className="text-xs text-gray-500">
                    {selectedMetric === 'revenue' ? formatCurrency(item.revenue) : `${item.bookings} bookings`}
                  </p>
                </div>
                <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${selectedMetric === 'revenue' 
                        ? (item.revenue / Math.max(...analyticsData.trends.daily.map(d => d.revenue))) * 100
                        : (item.bookings / Math.max(...analyticsData.trends.daily.map(d => d.bookings))) * 100
                      }%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Service Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analyticsData.services).map(([service, count], index) => {
              const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600'];
              const percentage = Math.floor((count / analyticsData.bookings.total) * 100);
              
              return (
                <div key={service} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 bg-gradient-to-r ${colors[index % colors.length]} rounded-full mr-4`}></div>
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Customer Satisfaction</h4>
              <p className="text-xs text-gray-500">Based on ratings & feedback</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">{Math.floor(analyticsData.performance.customerSatisfaction)}%</p>
            <p className="text-sm text-gray-500">Satisfied customers</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Response Time</h4>
              <p className="text-xs text-gray-500">Average response time</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">{Math.floor(analyticsData.performance.responseTime)}h</p>
            <p className="text-sm text-gray-500">Average response</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Service Quality</h4>
              <p className="text-xs text-gray-500">Based on completion rate</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">{Math.floor(analyticsData.performance.completionRate)}%</p>
            <p className="text-sm text-gray-500">Success rate</p>
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{analyticsData.bookings.pending}</p>
            <p className="text-sm font-medium text-gray-600">Pending</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{analyticsData.bookings.confirmed}</p>
            <p className="text-sm font-medium text-gray-600">Confirmed</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{analyticsData.bookings.completed}</p>
            <p className="text-sm font-medium text-gray-600">Completed</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200">
            <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{analyticsData.bookings.rejected}</p>
            <p className="text-sm font-medium text-gray-600">Rejected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 