import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Shield,
  Car,
  DollarSign,
  MessageSquare,
  AlertCircle,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Worker {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  totalEarnings: number;
  status: 'available' | 'busy' | 'offline';
  currentBooking?: {
    _id: string;
    customerName: string;
    carType: string;
    serviceType: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
  };
  schedule?: {
    isAvailableToday: boolean;
    startTime: string;
    endTime: string;
    isWithinWorkingHours: boolean;
    isWorking: boolean;
  };
  createdAt: string;
}

interface JobRequest {
  _id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  message: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
}

interface Booking {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  carType: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  price: number;
  assignedWorker?: string;
}

const Workers: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showJobRequestModal, setShowJobRequestModal] = useState(false);
  const [showWorkerDetailsModal, setShowWorkerDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [selectedJobRequest, setSelectedJobRequest] = useState<JobRequest | null>(null);
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState<Worker | null>(null);
  const [workerEarnings, setWorkerEarnings] = useState<any>(null);

  // Form state for adding worker
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'worker'
  });

  // Form state for editing worker
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'worker'
  });

  // Form state for job request response
  const [jobRequestResponse, setJobRequestResponse] = useState({
    status: 'approved',
    adminResponse: ''
  });

  useEffect(() => {
    fetchWorkers();
    fetchBookings();
    fetchJobRequests();
    fetchWorkerStatus();
  }, []);

  // Poll for updates every 60 seconds to avoid rate limiting
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWorkers();
      fetchBookings();
      fetchJobRequests();
      fetchWorkerStatus();
    }, 60000); // Increased to 60 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/workers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setWorkers(response.data.workers);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to fetch workers');
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobRequests = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/job-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setJobRequests(response.data.jobRequests);
    } catch (error) {
      console.error('Error fetching job requests:', error);
      toast.error('Failed to fetch job requests');
    }
  };

  const fetchWorkerStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/workers/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update workers with status information
      setWorkers(prevWorkers => {
        const updatedWorkers = prevWorkers.map(worker => {
          const statusWorker = response.data.workers.find((w: any) => w._id === worker._id);
          return statusWorker ? { ...worker, ...statusWorker } : worker;
        });
        return updatedWorkers;
      });
    } catch (error) {
      console.error('Error fetching worker status:', error);
    }
  };

  const fetchWorkerEarnings = async (workerId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`/api/admin/workers/${workerId}/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setWorkerEarnings(response.data);
    } catch (error) {
      console.error('Error fetching worker earnings:', error);
      toast.error('Failed to fetch worker earnings');
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Creating worker with data:', formData);
      console.log('Using token:', token);
      
      const response = await axios.post('/api/admin/workers', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Worker creation response:', response.data);
      toast.success('Worker created successfully');
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'worker' });
      fetchWorkers();
    } catch (error: any) {
      console.error('Worker creation error:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.error || 'Failed to create worker';
      toast.error(message);
    }
  };

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerDetails) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/workers/${selectedWorkerDetails._id}/details`, editFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Worker details updated successfully');
      setShowWorkerDetailsModal(false);
      setSelectedWorkerDetails(null);
      fetchWorkers();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update worker';
      toast.error(message);
    }
  };

  const toggleWorkerStatus = async (workerId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/workers/${workerId}`, {
        isActive: !currentStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success(`Worker ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchWorkers();
    } catch (error) {
      toast.error('Failed to update worker status');
    }
  };

  const deleteWorker = async (workerId: string, workerName: string) => {
    if (!window.confirm(`Are you sure you want to delete worker "${workerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/workers/${workerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success(`Worker "${workerName}" deleted successfully`);
      fetchWorkers();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete worker';
      toast.error(message);
    }
  };

  const assignBookingToWorker = async () => {
    if (!selectedWorker || !selectedBooking) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/bookings/${selectedBooking._id}/assign`, {
        workerId: selectedWorker
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Booking assigned successfully');
      setShowAssignModal(false);
      setSelectedBooking(null);
      setSelectedWorker('');
      fetchBookings();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to assign booking';
      toast.error(message);
    }
  };

  const openAssignModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedWorker('');
    setShowAssignModal(true);
    // Refresh workers list when opening assign modal to ensure real-time data
    fetchWorkers();
  };

  const handleJobRequestResponse = async () => {
    if (!selectedJobRequest) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/job-requests/${selectedJobRequest._id}`, jobRequestResponse, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Job request response sent successfully');
      setShowJobRequestModal(false);
      setSelectedJobRequest(null);
      setJobRequestResponse({ status: 'approved', adminResponse: '' });
      fetchJobRequests();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to respond to job request';
      toast.error(message);
    }
  };

  const openWorkerDetails = (worker: Worker) => {
    setSelectedWorkerDetails(worker);
    setEditFormData({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role
    });
    fetchWorkerEarnings(worker._id);
    setShowWorkerDetailsModal(true);
  };

  const openJobRequest = (request: JobRequest) => {
    setSelectedJobRequest(request);
    setJobRequestResponse({ status: 'approved', adminResponse: '' });
    setShowJobRequestModal(true);
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const types: { [key: string]: string } = {
      body_wash: 'Body Wash',
      interior_exterior: 'Interior & Exterior',
      engine: 'Engine Cleaning',
      vacuum: 'Vacuum Service',
      full_service: 'Full Service'
    };
    return types[serviceType] || serviceType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const pendingJobRequests = jobRequests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers Management</h1>
          <p className="text-gray-600">Manage workers and assign tasks</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Worker
        </button>
      </div>

      {/* Job Requests Notification */}
      {pendingJobRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {pendingJobRequests.length} pending job request{pendingJobRequests.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-yellow-700">
                  Workers are requesting job assignments
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowJobRequestModal(true)}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
            >
              View Requests
            </button>
          </div>
        </div>
      )}

      {/* Workers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Workers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker) => (
                <tr key={worker._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                        <div className="text-sm text-gray-500">ID: {worker._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.email}</div>
                    <div className="text-sm text-gray-500">{worker.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      worker.role === 'supervisor' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {worker.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(worker.totalEarnings || 0)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {/* Worker Status */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        worker.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : worker.status === 'busy'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {worker.status === 'available' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </>
                        ) : worker.status === 'busy' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Busy
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Offline
                          </>
                        )}
                      </span>
                      
                      {/* Schedule Info */}
                      {worker.schedule && (
                        <div className="text-xs text-gray-500">
                          {worker.schedule.isWorking ? (
                            <span className="text-green-600">Working hours</span>
                          ) : (
                            <span className="text-gray-500">
                              {worker.schedule.startTime} - {worker.schedule.endTime}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Current Booking */}
                      {worker.currentBooking && (
                        <div className="text-xs text-blue-600">
                          {worker.currentBooking.customerName} - {worker.currentBooking.serviceType}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openWorkerDetails(worker)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleWorkerStatus(worker._id, worker.isActive)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          worker.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={worker.isActive ? 'Deactivate Worker' : 'Activate Worker'}
                      >
                        {worker.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteWorker(worker._id, worker.name)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        title="Delete Worker"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unassigned Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Unassigned Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings
                .filter(booking => !booking.assignedWorker && booking.status === 'confirmed')
                .map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                    <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getServiceTypeLabel(booking.serviceType)}</div>
                    <div className="text-sm text-gray-500">{booking.carType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(booking.scheduledDate)}</div>
                    <div className="text-sm text-gray-500">{booking.scheduledTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Confirmed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openAssignModal(booking)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Assign Worker
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Worker</h3>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="worker">Worker</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Worker Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Worker</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Booking Details:</p>
              <p className="text-sm font-medium">{selectedBooking.customerName} - {getServiceTypeLabel(selectedBooking.serviceType)}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Worker</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a worker...</option>
                {workers
                  .filter(worker => worker.isActive)
                  .map((worker) => (
                  <option key={worker._id} value={worker._id}>
                    {worker.name} ({worker.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedBooking(null);
                  setSelectedWorker('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignBookingToWorker}
                disabled={!selectedWorker}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Request Modal */}
      {showJobRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Job Requests ({pendingJobRequests.length})</h3>
            
            {pendingJobRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No pending job requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingJobRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.workerName}</h4>
                        <p className="text-sm text-gray-600">{request.workerEmail}</p>
                        <p className="text-sm text-gray-500">{formatDate(request.date)}</p>
                      </div>
                      <button
                        onClick={() => openJobRequest(request)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      >
                        Respond
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-900 mb-1">Request:</p>
                      <p className="text-sm text-gray-700">{request.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowJobRequestModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Job Request Response Modal */}
      {selectedJobRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Respond to Job Request</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">From: {selectedJobRequest.workerName}</p>
              <p className="text-sm text-gray-600 mb-2">Date: {formatDate(selectedJobRequest.date)}</p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-900 mb-1">Request:</p>
                <p className="text-sm text-gray-700">{selectedJobRequest.message}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
              <select
                value={jobRequestResponse.status}
                onChange={(e) => setJobRequestResponse({ ...jobRequestResponse, status: e.target.value as 'approved' | 'rejected' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
              <textarea
                value={jobRequestResponse.adminResponse}
                onChange={(e) => setJobRequestResponse({ ...jobRequestResponse, adminResponse: e.target.value })}
                placeholder="Enter your response to the worker..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setSelectedJobRequest(null);
                  setJobRequestResponse({ status: 'approved', adminResponse: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJobRequestResponse}
                disabled={!jobRequestResponse.adminResponse.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worker Details Modal */}
      {showWorkerDetailsModal && selectedWorkerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Worker Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Worker Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Worker Information</h4>
                <form onSubmit={handleEditWorker} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="worker">Worker</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Update Details
                  </button>
                </form>
              </div>

              {/* Earnings Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Earnings Summary</h4>
                {workerEarnings ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(workerEarnings.totalEarnings)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">Period Earnings</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatCurrency(workerEarnings.totalAmount)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">Tasks Completed</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {workerEarnings.totalTasks}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading earnings...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Worker Schedule and Status */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Schedule & Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Status */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="font-medium text-gray-900 mb-2">Current Status</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedWorkerDetails.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedWorkerDetails.status === 'busy'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedWorkerDetails.status === 'available' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </>
                        ) : selectedWorkerDetails.status === 'busy' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Busy
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Offline
                          </>
                        )}
                      </span>
                    </div>
                    
                    {selectedWorkerDetails.currentBooking && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Job:</span>
                        <span className="text-sm font-medium text-blue-600">
                          {selectedWorkerDetails.currentBooking.customerName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Working Schedule */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="font-medium text-gray-900 mb-2">Working Schedule</h5>
                  {selectedWorkerDetails.schedule ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Available Today:</span>
                        <span className={`text-sm font-medium ${
                          selectedWorkerDetails.schedule.isAvailableToday ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedWorkerDetails.schedule.isAvailableToday ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Working Hours:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedWorkerDetails.schedule.startTime} - {selectedWorkerDetails.schedule.endTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Currently Working:</span>
                        <span className={`text-sm font-medium ${
                          selectedWorkerDetails.schedule.isWorking ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {selectedWorkerDetails.schedule.isWorking ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Schedule information not available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setShowWorkerDetailsModal(false);
                  setSelectedWorkerDetails(null);
                  setWorkerEarnings(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers; 