import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const BookingModification = ({ booking, onModification, onClose }) => {
  const [modificationType, setModificationType] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!modificationType) {
      toast.error('Please select a modification type');
      return;
    }

    if (modificationType === 'reschedule' && (!newDate || !newTime)) {
      toast.error('Please select new date and time');
      return;
    }

    if (modificationType === 'location_change' && !newLocation) {
      toast.error('Please enter new location');
      return;
    }

    if (modificationType === 'cancel' && !reason) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);

    try {
      let newValue = '';
      
      switch (modificationType) {
        case 'reschedule':
          newValue = `${newDate} ${newTime}`;
          break;
        case 'location_change':
          newValue = newLocation;
          break;
        case 'cancel':
          newValue = 'cancelled';
          break;
      }

      const response = await fetch(`/api/bookings/${booking._id}/modify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          modificationType,
          newValue,
          reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to modify booking');
      }

      const updatedBooking = await response.json();
      toast.success('Booking modified successfully');
      onModification(updatedBooking);
      onClose();
    } catch (error) {
      console.error('Modification error:', error);
      toast.error('Failed to modify booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Modify Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modification Type
            </label>
            <select
              value={modificationType}
              onChange={(e) => setModificationType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select modification type</option>
              <option value="reschedule">Reschedule</option>
              <option value="location_change">Change Location</option>
              <option value="cancel">Cancel Booking</option>
            </select>
          </div>

          {modificationType === 'reschedule' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {modificationType === 'location_change' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Location
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Enter new location"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {(modificationType === 'cancel' || modificationType === 'reschedule' || modificationType === 'location_change') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modificationType === 'cancel' ? 'Cancellation Reason' : 'Reason (Optional)'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={modificationType === 'cancel' ? 'Please provide a reason for cancellation' : 'Optional reason for modification'}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit Modification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModification; 