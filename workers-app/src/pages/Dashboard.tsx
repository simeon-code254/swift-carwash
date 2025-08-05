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
  MessageSquare
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Task {
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
  specialInstructions?: string;
  carDetails?: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  assignedWorker: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { worker, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: AlertCircle
    },
    confirmed: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: CheckCircle
    },
    started_cleaning: {
      label: 'Started Cleaning',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      icon: Loader
    },
    done: {
      label: 'Done',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      icon: CheckCircle
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      icon: CheckCircle
    }
  };

  const serviceTypes = {
    body_wash: 'Body Wash',
    interior_exterior: 'Interior & Exterior',
    engine: 'Engine Cleaning',
    vacuum: 'Vacuum Service',
    full_service: 'Full Service'
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/workers/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingStatus(taskId);
      
      // Update booking status using worker-specific endpoint
      await axios.patch(`/api/workers/bookings/${taskId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('workerToken')}`
        }
      });
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
      
      toast.success(`Status updated to ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? React.createElement(config.icon, { className: 'w-4 h-4' }) : null;
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = ['pending', 'confirmed', 'started_cleaning', 'done', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Assigned Tasks</h2>
          <p className="text-gray-600">Manage and update the status of your assigned car wash jobs</p>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
            <p className="text-gray-600">You don't have any tasks assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.map((task) => {
              const currentStatus = statusConfig[task.status as keyof typeof statusConfig];
              const nextStatus = getNextStatus(task.status);
              
              return (
                <div key={task._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {task.customerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {serviceTypes[task.serviceType as keyof typeof serviceTypes]} - {task.carType}
                      </p>
                    </div>
                    
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatus?.color}`}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1">{currentStatus?.label}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{task.customerPhone}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{task.customerLocation}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(task.scheduledDate)} at {task.scheduledTime}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Price: </span>
                        <span className="text-green-600 font-semibold">KES {task.price.toLocaleString()}</span>
                      </div>
                      {task.carDetails && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Car: </span>
                          {task.carDetails.make} {task.carDetails.model} ({task.carDetails.color})
                        </div>
                      )}
                      {task.specialInstructions && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Special Instructions: </span>
                          {task.specialInstructions}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  {nextStatus && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Update Status:</span>
                      <button
                        onClick={() => updateTaskStatus(task._id, nextStatus)}
                        disabled={updatingStatus === task._id}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updatingStatus === task._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            Mark as {statusConfig[nextStatus as keyof typeof statusConfig]?.label}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 