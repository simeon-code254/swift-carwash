import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, RefreshCw, Bell, MessageCircle, Shield, 
  Database, Server, User, Key, Globe, Smartphone, Wifi,
  CheckCircle, XCircle, AlertCircle, Info, Lock, Eye, EyeOff,
  Zap, Shield as ShieldIcon, Activity, Clock, Users as UsersIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SMSConfig {
  enabled: boolean;
  provider: string;
  apiKey: string;
  fromNumber: string;
}

interface SystemConfig {
  maintenanceMode: boolean;
  autoBackup: boolean;
  notifications: boolean;
  maxBookingsPerDay: number;
  businessHours: {
    start: string;
    end: string;
  };
  autoConfirmBookings: boolean;
}

const Settings: React.FC = () => {
  const [smsConfig, setSmsConfig] = useState<SMSConfig>({
    enabled: false,
    provider: 'simulated',
    apiKey: '',
    fromNumber: ''
  });
  
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    autoBackup: true,
    notifications: true,
    maxBookingsPerDay: 50,
    businessHours: {
      start: '08:00',
      end: '18:00'
    },
    autoConfirmBookings: false
  });

  const [loading, setLoading] = useState(false);
  const [smsStatus, setSmsStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchSMSConfig();
  }, []);

  const fetchSMSConfig = async () => {
    try {
      const response = await fetch('/api/sms/config');
      if (response.ok) {
        const config = await response.json();
        setSmsConfig({
          enabled: config.enabled || false,
          provider: config.provider || 'simulated',
          apiKey: config.apiKey || '',
          fromNumber: config.fromNumber || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch SMS config:', error);
    }
  };

  const saveSMSConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sms/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(smsConfig)
      });

      if (response.ok) {
        toast.success('SMS configuration saved successfully!');
      } else {
        toast.error('Failed to save SMS configuration');
      }
    } catch (error) {
      toast.error('Error saving SMS configuration');
    } finally {
      setLoading(false);
    }
  };

  const testSMS = async () => {
    setSmsStatus('testing');
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          to: '+1234567890',
          message: 'Test SMS from admin dashboard - SwiftWash System'
        })
      });

      if (response.ok) {
        setSmsStatus('success');
        toast.success('SMS test sent successfully!');
      } else {
        setSmsStatus('error');
        toast.error('SMS test failed');
      }
    } catch (error) {
      setSmsStatus('error');
      toast.error('SMS test error');
    }
  };

  const saveSystemConfig = async () => {
    setLoading(true);
    try {
      // Simulate saving system config
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('System configuration saved successfully!');
    } catch (error) {
      toast.error('Error saving system configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h2>
            <p className="text-gray-600 text-lg">Configure your car wash management system</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
            <SettingsIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* SMS Configuration */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">SMS Configuration</h3>
              <p className="text-gray-600">Configure SMS notifications for clients</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={testSMS}
              disabled={smsStatus === 'testing'}
              className="btn-secondary flex items-center px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              {smsStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              Test SMS
            </button>
            {smsStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {smsStatus === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              SMS Provider
            </label>
            <select
              value={smsConfig.provider}
              onChange={(e) => setSmsConfig({...smsConfig, provider: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="simulated">Simulated (Development)</option>
              <option value="twilio">Twilio</option>
              <option value="aws">AWS SNS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              SMS Status
            </label>
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                checked={smsConfig.enabled}
                onChange={(e) => setSmsConfig({...smsConfig, enabled: e.target.checked})}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                {smsConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                smsConfig.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {smsConfig.enabled ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={smsConfig.apiKey}
                onChange={(e) => setSmsConfig({...smsConfig, apiKey: e.target.value})}
                placeholder="Enter SMS API key"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              From Number
            </label>
            <input
              type="text"
              value={smsConfig.fromNumber}
              onChange={(e) => setSmsConfig({...smsConfig, fromNumber: e.target.value})}
              placeholder="+1234567890"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSMSConfig}
            disabled={loading}
            className="btn-primary flex items-center px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save SMS Config
          </button>
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">System Configuration</h3>
            <p className="text-gray-600">Manage system settings and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Maintenance Mode
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={systemConfig.maintenanceMode}
                  onChange={(e) => setSystemConfig({...systemConfig, maintenanceMode: e.target.checked})}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {systemConfig.maintenanceMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                systemConfig.maintenanceMode ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
              }`}>
                {systemConfig.maintenanceMode ? 'Maintenance' : 'Operational'}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Auto Backup
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={systemConfig.autoBackup}
                  onChange={(e) => setSystemConfig({...systemConfig, autoBackup: e.target.checked})}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {systemConfig.autoBackup ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                systemConfig.autoBackup ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {systemConfig.autoBackup ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Notifications
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={systemConfig.notifications}
                  onChange={(e) => setSystemConfig({...systemConfig, notifications: e.target.checked})}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {systemConfig.notifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                systemConfig.notifications ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {systemConfig.notifications ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Auto Confirm Bookings
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={systemConfig.autoConfirmBookings}
                  onChange={(e) => setSystemConfig({...systemConfig, autoConfirmBookings: e.target.checked})}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {systemConfig.autoConfirmBookings ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                systemConfig.autoConfirmBookings ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {systemConfig.autoConfirmBookings ? 'Auto' : 'Manual'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Max Bookings Per Day
            </label>
            <input
              type="number"
              value={systemConfig.maxBookingsPerDay}
              onChange={(e) => setSystemConfig({...systemConfig, maxBookingsPerDay: parseInt(e.target.value)})}
              min="1"
              max="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Business Hours
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="time"
                value={systemConfig.businessHours.start}
                onChange={(e) => setSystemConfig({
                  ...systemConfig, 
                  businessHours: {...systemConfig.businessHours, start: e.target.value}
                })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={systemConfig.businessHours.end}
                onChange={(e) => setSystemConfig({
                  ...systemConfig, 
                  businessHours: {...systemConfig.businessHours, end: e.target.value}
                })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSystemConfig}
            disabled={loading}
            className="btn-primary flex items-center px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save System Config
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mr-4">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">System Status</h3>
            <p className="text-gray-600">Current system health and status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm font-semibold text-green-800">Database</p>
              <p className="text-xs text-green-600">Connected</p>
            </div>
          </div>

          <div className="flex items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
            <Wifi className="w-8 h-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm font-semibold text-blue-800">API Server</p>
              <p className="text-xs text-blue-600">Running</p>
            </div>
          </div>

          <div className="flex items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
            <Bell className="w-8 h-8 text-orange-500 mr-4" />
            <div>
              <p className="text-sm font-semibold text-orange-800">SMS Service</p>
              <p className="text-xs text-orange-600">
                {smsConfig.enabled ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          <div className="flex items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
            <Activity className="w-8 h-8 text-purple-500 mr-4" />
            <div>
              <p className="text-sm font-semibold text-purple-800">System Load</p>
              <p className="text-xs text-purple-600">Normal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
            <Info className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">System Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-600">SMS notifications are sent automatically when booking status changes</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-600">System backups are performed daily at 2:00 AM</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-600">Maintenance mode disables new bookings but allows existing ones to continue</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-600">For production, configure a real SMS provider like Twilio or AWS SNS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 