import React, { useState } from 'react';
import { Phone, Search, Clock, MapPin, Car, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/track/${phoneNumber}`);
      const data = await response.json();

      if (response.ok) {
        setBookings(data);
        setHasSearched(true);
        if (data.length === 0) {
          toast.info('No bookings found for this phone number');
        } else {
          toast.success(`Found ${data.length} booking(s)`);
        }
      } else {
        toast.error(data.error || 'Failed to fetch bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Track Your Bookings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enter your phone number to track your car wash bookings
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-6">
            {bookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Bookings Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No bookings were found for the phone number: {phoneNumber}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const status = statusConfig[booking.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {booking.customerName}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {serviceTypes[booking.serviceType]} - {booking.carType === 'saloon' ? 'Saloon Car' : 'SUV'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${status.color}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {status.label}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {booking.customerLocation}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Car className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {booking.carDetails?.make} {booking.carDetails?.model} {booking.carDetails?.color}
                            {booking.carDetails?.plateNumber && ` (${booking.carDetails.plateNumber})`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                            KES {booking.price.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {booking.specialInstructions && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Special Instructions:</strong> {booking.specialInstructions}
                          </p>
                        </div>
                      )}

                      {/* Progress Timeline */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Progress</h4>
                        <div className="space-y-2">
                          {Object.entries(statusConfig).map(([statusKey, statusInfo]) => {
                            const isCompleted = ['pending', 'confirmed', 'started_cleaning', 'done', 'delivered'].indexOf(statusKey) <= 
                                              ['pending', 'confirmed', 'started_cleaning', 'done', 'delivered'].indexOf(booking.status);
                            const isCurrent = statusKey === booking.status;
                            
                            return (
                              <div key={statusKey} className="flex items-center">
                                <div className={`w-4 h-4 rounded-full mr-3 ${
                                  isCompleted 
                                    ? 'bg-green-500' 
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`} />
                                <span className={`text-sm ${
                                  isCurrent 
                                    ? 'font-medium text-primary-600 dark:text-primary-400' 
                                    : isCompleted 
                                      ? 'text-gray-600 dark:text-gray-400' 
                                      : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings; 