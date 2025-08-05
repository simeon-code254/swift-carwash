import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import BookingModification from '../components/BookingModification';

const MyWashes = () => {
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [showModification, setShowModification] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const serviceTypes = [
    'body_wash', 'interior_exterior', 'engine', 'vacuum', 'full_service'
  ];

  const months = [
    { value: '', label: 'All Months' },
    { value: '2024-01', label: 'January 2024' },
    { value: '2024-02', label: 'February 2024' },
    { value: '2024-03', label: 'March 2024' },
    { value: '2024-04', label: 'April 2024' },
    { value: '2024-05', label: 'May 2024' },
    { value: '2024-06', label: 'June 2024' },
    { value: '2024-07', label: 'July 2024' },
    { value: '2024-08', label: 'August 2024' },
    { value: '2024-09', label: 'September 2024' },
    { value: '2024-10', label: 'October 2024' },
    { value: '2024-11', label: 'November 2024' },
    { value: '2024-12', label: 'December 2024' }
  ];

  // Format phone number to 254XXXXXXXXX format
  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If it starts with 7, add 254
    if (cleaned.startsWith('7') && cleaned.length === 9) {
      cleaned = '254' + cleaned;
    }
    
    // If it doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  const sendVerificationCode = async () => {
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    
    // Validate phone number format
    if (!/^254\d{9}$/.test(formattedPhone)) {
      toast.error('Please enter a valid phone number (e.g., 254XXXXXXXXX)');
      return;
    }

    setSendingCode(true);
    try {
      const response = await fetch('/api/phone-verification/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: formattedPhone })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Update phone state with formatted number
      setPhone(formattedPhone);
      toast.success('Verification code sent to your phone');
    } catch (error) {
      console.error('Send code error:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      toast.error('Please enter verification code');
      return;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    setVerifying(true);
    try {
      const response = await fetch('/api/phone-verification/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: formattedPhone, otp: verificationCode })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid verification code');
      }

      const data = await response.json();
      // Store user data if needed
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setIsVerified(true);
      toast.success('Phone number verified successfully');
      fetchBookings();
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Use formatted phone number
      const formattedPhone = formatPhoneNumber(phone);
      let url = `/api/bookings/customer/${formattedPhone}`;
      const params = new URLSearchParams();
      
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedService) params.append('serviceType', selectedService);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Fetch bookings error:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (booking) => {
    try {
      // Generate PDF receipt using jsPDF
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      
      // Add company logo/header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SwiftWash', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Car Wash Service Receipt', 105, 30, { align: 'center' });
      
      // Add receipt details
      doc.setFontSize(10);
      doc.text('Receipt Details:', 20, 50);
      
      const details = [
        ['Booking ID:', booking._id],
        ['Customer Name:', booking.customerName],
        ['Phone:', booking.customerPhone],
        ['Service Type:', booking.serviceType.replace('_', ' ')],
        ['Date:', new Date(booking.scheduledDate).toLocaleDateString()],
        ['Time:', booking.scheduledTime],
        ['Price:', `Ksh ${booking.price}`],
        ['Status:', booking.status],
        ['Location:', booking.customerLocation],
        ['Car Type:', booking.carType]
      ];
      
      let yPos = 60;
      details.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 60, yPos);
        yPos += 8;
      });
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for choosing SwiftWash!', 105, 200, { align: 'center' });
      doc.text('For support, contact us at support@swiftwash.com', 105, 210, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${booking._id}.pdf`);
      
      toast.success('Receipt downloaded as PDF');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const rebookWithSameDetails = async (booking) => {
    try {
      // Navigate to booking form with pre-filled data
      const bookingData = {
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerLocation: booking.customerLocation,
        carType: booking.carType,
        serviceType: booking.serviceType,
        carDetails: booking.carDetails,
        specialInstructions: booking.specialInstructions
      };
      
      // Store booking data in localStorage for pre-filling
      localStorage.setItem('rebookData', JSON.stringify(bookingData));
      
      // Navigate to booking form
      window.location.href = '/book';
      
      toast.success('Redirecting to booking form with your details');
    } catch (error) {
      console.error('Rebook error:', error);
      toast.error('Failed to rebook');
    }
  };

  const handleModification = (updatedBooking) => {
    setBookings(bookings.map(b => b._id === updatedBooking._id ? updatedBooking : b));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      started_cleaning: 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatServiceType = (serviceType) => {
    return serviceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">My Washes</h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your phone number to view your wash history
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 254700000000 or 0700000000"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter your phone number in any format (we'll convert it automatically)
              </p>
            </div>

            <button
              onClick={sendVerificationCode}
              disabled={sendingCode || !phone}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingCode ? 'Sending...' : 'Send Verification Code'}
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={verifyCode}
              disabled={verifying || !verificationCode}
              className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">My Washes</h1>
          <p className="text-gray-600 mb-4">Phone: {formatPhoneNumber(phone)}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Service Type
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Services</option>
                {serviceTypes.map(service => (
                  <option key={service} value={service}>
                    {formatServiceType(service)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={fetchBookings}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Bookings'}
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {formatServiceType(booking.serviceType)}
                    </h3>
                    <p className="text-gray-600">
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">{booking.scheduledTime}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {booking.customerLocation}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Car Type:</span> {booking.carType}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    Ksh {booking.price}
                  </p>
                </div>

                                 <div className="flex space-x-2">
                   <button
                     onClick={() => downloadReceipt(booking)}
                     className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                   >
                     Download Receipt
                   </button>
                   {['pending', 'confirmed'].includes(booking.status) && (
                     <button
                       onClick={() => {
                         setSelectedBooking(booking);
                         setShowModification(true);
                       }}
                       className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                     >
                       Modify
                     </button>
                   )}
                   {['delivered', 'done'].includes(booking.status) && (
                     <button
                       onClick={() => rebookWithSameDetails(booking)}
                       className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                     >
                       Rebook
                     </button>
                   )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModification && selectedBooking && (
        <BookingModification
          booking={selectedBooking}
          onModification={handleModification}
          onClose={() => {
            setShowModification(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default MyWashes; 