import React, { useState, useEffect } from 'react';
import { Image, Star, Eye, Download, Upload, Trash2, Share2 } from 'lucide-react';

interface BookingPhoto {
  _id: string;
  customer: {
    name: string;
    phone: string;
  };
  assignedWorker: {
    name: string;
  };
  photos: {
    before: Array<{
      url: string;
      uploadedAt: string;
      uploadedBy: {
        name: string;
      };
    }>;
    after: Array<{
      url: string;
      uploadedAt: string;
      uploadedBy: {
        name: string;
      };
    }>;
  };
  serviceType: string;
  scheduledDate: string;
  status: string;
}

interface Feedback {
  _id: string;
  customer: {
    name: string;
  };
  washer: {
    name: string;
  };
  rating: number;
  comment: string;
  serviceType: string;
  createdAt: string;
}

const Resources = () => {
  const [bookings, setBookings] = useState<BookingPhoto[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'feedback'>('photos');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [photosResponse, feedbacksResponse] = await Promise.all([
        fetch('/api/photos/admin/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/feedback/admin', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        setBookings(photosData.bookings || []);
      }

      if (feedbacksResponse.ok) {
        const feedbacksData = await feedbacksResponse.json();
        setFeedbacks(feedbacksData);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pushToHomepage = async (type: 'photos' | 'feedback', ids: string[]) => {
    try {
      const response = await fetch('/api/admin/push-to-homepage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, ids })
      });

      if (!response.ok) {
        throw new Error('Failed to push to homepage');
      }

      alert('Content pushed to homepage successfully!');
    } catch (error) {
      console.error('Push to homepage error:', error);
      alert('Failed to push to homepage');
    }
  };

  const downloadPhoto = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Resources</h1>
        <p className="text-gray-600">Manage photos and feedback for homepage content</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'photos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Image className="w-4 h-4 inline mr-2" />
              Photos ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feedback'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Feedback ({feedbacks.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Customer Photos</h2>
            {selectedPhotos.length > 0 && (
              <button
                onClick={() => pushToHomepage('photos', selectedPhotos)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Push to Homepage ({selectedPhotos.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.customer.name}</h3>
                      <p className="text-sm text-gray-600">{booking.serviceType.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPhotos.includes(booking._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPhotos([...selectedPhotos, booking._id]);
                          } else {
                            setSelectedPhotos(selectedPhotos.filter(id => id !== booking._id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  {/* Before Photos */}
                  {booking.photos.before.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Before Photos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {booking.photos.before.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo.url}
                              alt={`Before ${index + 1}`}
                              className="w-full h-24 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                              <button
                                onClick={() => downloadPhoto(photo.url, `before-${booking._id}-${index}.jpg`)}
                                className="opacity-0 group-hover:opacity-100 bg-white p-1 rounded"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* After Photos */}
                  {booking.photos.after.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">After Photos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {booking.photos.after.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo.url}
                              alt={`After ${index + 1}`}
                              className="w-full h-24 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                              <button
                                onClick={() => downloadPhoto(photo.url, `after-${booking._id}-${index}.jpg`)}
                                className="opacity-0 group-hover:opacity-100 bg-white p-1 rounded"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Customer Feedback</h2>
            {selectedFeedbacks.length > 0 && (
              <button
                onClick={() => pushToHomepage('feedback', selectedFeedbacks)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Push to Homepage ({selectedFeedbacks.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbacks.map((feedback) => (
              <div key={feedback._id} className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{feedback.customer.name}</h3>
                    <p className="text-sm text-gray-600">{feedback.serviceType.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFeedbacks.includes(feedback._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeedbacks([...selectedFeedbacks, feedback._id]);
                        } else {
                          setSelectedFeedbacks(selectedFeedbacks.filter(id => id !== feedback._id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="flex items-center mb-3">
                  {getRatingStars(feedback.rating)}
                  <span className="ml-2 text-sm font-medium">{feedback.rating}/5</span>
                </div>

                {feedback.comment && (
                  <p className="text-sm text-gray-700 mb-3">"{feedback.comment}"</p>
                )}

                <div className="text-xs text-gray-500">
                  <p>Washer: {feedback.washer.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {activeTab === 'photos' && bookings.length === 0 && (
        <div className="text-center py-12">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No photos available</p>
        </div>
      )}

      {activeTab === 'feedback' && feedbacks.length === 0 && (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No feedback available</p>
        </div>
      )}
    </div>
  );
};

export default Resources; 