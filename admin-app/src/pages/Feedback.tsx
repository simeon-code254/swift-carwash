import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle, MessageSquare, User, Calendar } from 'lucide-react';

interface Feedback {
  _id: string;
  booking: {
    _id: string;
    customerName: string;
    serviceType: string;
    scheduledDate: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  washer: {
    name: string;
    phone: string;
  };
  rating: number;
  comment: string;
  serviceType: string;
  adminAlerted: boolean;
  apologyDiscountApplied: boolean;
  discountAmount: number;
  createdAt: string;
}

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`/api/feedback/admin?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }
      
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('Fetch feedbacks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLowRatingAlert = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/alert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as alerted');
      }
      
      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f._id === feedbackId ? { ...f, adminAlerted: true } : f
      ));
    } catch (error) {
      console.error('Alert error:', error);
    }
  };

  const applyApologyDiscount = async (feedbackId: string, amount: number) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply discount');
      }
      
      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f._id === feedbackId ? { ...f, apologyDiscountApplied: true, discountAmount: amount } : f
      ));
    } catch (error) {
      console.error('Discount error:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-600';
    if (rating <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (feedback: Feedback) => {
    if (feedback.rating <= 3 && !feedback.adminAlerted) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Needs Attention</span>;
    }
    if (feedback.apologyDiscountApplied) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Discount Applied</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Feedback</h1>
        <p className="text-gray-600">Monitor and respond to customer feedback</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Feedback</option>
          <option value="low">Low Ratings (1-3)</option>
          <option value="high">High Ratings (4-5)</option>
          <option value="unalerted">Needs Attention</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold">{feedbacks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold">
                {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Low Ratings</p>
              <p className="text-2xl font-bold">
                {feedbacks.filter(f => f.rating <= 3).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <User className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Discounts Applied</p>
              <p className="text-2xl font-bold">
                {feedbacks.filter(f => f.apologyDiscountApplied).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Feedback</h2>
          
          {feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No feedback found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= feedback.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`font-semibold ${getRatingColor(feedback.rating)}`}>
                        {feedback.rating}/5
                      </span>
                    </div>
                    {getStatusBadge(feedback)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">{feedback.customer.name}</p>
                      <p className="text-sm text-gray-500">{feedback.customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Washer</p>
                      <p className="font-medium">{feedback.washer.name}</p>
                      <p className="text-sm text-gray-500">{feedback.washer.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Service</p>
                      <p className="font-medium">{feedback.serviceType.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {feedback.comment && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">Comment</p>
                      <p className="text-gray-800">{feedback.comment}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {feedback.rating <= 3 && !feedback.adminAlerted && (
                      <button
                        onClick={() => handleLowRatingAlert(feedback._id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Mark as Alerted
                      </button>
                    )}
                    
                    {feedback.rating <= 3 && !feedback.apologyDiscountApplied && (
                      <button
                        onClick={() => applyApologyDiscount(feedback._id, 200)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Apply Ksh 200 Discount
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedFeedback(feedback)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Feedback Details</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= selectedFeedback.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xl font-semibold ${getRatingColor(selectedFeedback.rating)}`}>
                  {selectedFeedback.rating}/5
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Customer Information</h4>
                  <p>Name: {selectedFeedback.customer.name}</p>
                  <p>Phone: {selectedFeedback.customer.phone}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Washer Information</h4>
                  <p>Name: {selectedFeedback.washer.name}</p>
                  <p>Phone: {selectedFeedback.washer.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Booking Details</h4>
                <p>Service: {selectedFeedback.serviceType.replace('_', ' ')}</p>
                <p>Date: {new Date(selectedFeedback.createdAt).toLocaleDateString()}</p>
              </div>

              {selectedFeedback.comment && (
                <div>
                  <h4 className="font-semibold text-gray-900">Comment</h4>
                  <p className="text-gray-700">{selectedFeedback.comment}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-2">Actions</h4>
                <div className="flex space-x-2">
                  {selectedFeedback.rating <= 3 && !selectedFeedback.adminAlerted && (
                    <button
                      onClick={() => {
                        handleLowRatingAlert(selectedFeedback._id);
                        setSelectedFeedback(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Mark as Alerted
                    </button>
                  )}
                  
                  {selectedFeedback.rating <= 3 && !selectedFeedback.apologyDiscountApplied && (
                    <button
                      onClick={() => {
                        applyApologyDiscount(selectedFeedback._id, 200);
                        setSelectedFeedback(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Apply Ksh 200 Discount
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback; 