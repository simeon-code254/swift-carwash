import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface JobRequest {
  _id: string;
  message: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
}

const JobRequests: React.FC = () => {
  const { worker } = useAuth();
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newRequest, setNewRequest] = useState('');

  useEffect(() => {
    fetchJobRequests();
  }, []);

  const fetchJobRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('workerToken');
      const response = await axios.get('/api/workers/job-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setJobRequests(response.data.jobRequests);
    } catch (error) {
      console.error('Error fetching job requests:', error);
      toast.error('Failed to fetch job requests');
    } finally {
      setLoading(false);
    }
  };

  const submitJobRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('workerToken');
              await axios.post('/api/workers/job-request', {
        message: newRequest
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.success('Job request submitted successfully');
      setNewRequest('');
      setShowForm(false);
      fetchJobRequests();
    } catch (error) {
      console.error('Error submitting job request:', error);
      toast.error('Failed to submit job request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: Clock
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Job Requests</h1>
                <p className="text-sm text-gray-600">Request work assignments from admin</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchJobRequests}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Refresh requests"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Request Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Submit New Job Request</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitJobRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Admin
                </label>
                <textarea
                  value={newRequest}
                  onChange={(e) => setNewRequest(e.target.value)}
                  placeholder="Describe the type of work you're looking for, your availability, or any specific requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Job Requests List */}
        <div className="space-y-6">
          {jobRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No job requests yet</h3>
              <p className="text-gray-600 mb-4">
                Submit a job request to let the admin know you're available for work.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Submit First Request</span>
              </button>
            </div>
          ) : (
            jobRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={request._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">{request.message}</p>
                      <p className="text-sm text-gray-600">{formatDate(request.date)}</p>
                    </div>
                    
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>
                  
                  {request.adminResponse && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Admin Response:</h4>
                      <p className="text-sm text-gray-700">{request.adminResponse}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Information Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">About Job Requests</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use job requests to let admin know you're available for work</li>
                <li>• Include details about your availability, preferred work types, or special requests</li>
                <li>• Admin will review and respond to your requests</li>
                <li>• Approved requests may lead to work assignments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRequests; 