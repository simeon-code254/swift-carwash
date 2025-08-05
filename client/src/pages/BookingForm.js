import React, { useState, useEffect } from 'react';
import { Car, Clock, MapPin, Phone, User, Calendar, CheckCircle, Sparkles, Shield, Truck, Star, Zap, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const BookingForm = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerLocation: '',
    carType: 'saloon',
    serviceType: 'body_wash',
    scheduledDate: '',
    scheduledTime: '08:00',
    carDetails: {
      make: '',
      model: '',
      color: '',
      plateNumber: ''
    },
    specialInstructions: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [pricing, setPricing] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  
  // Fallback pricing in case server fails
  const fallbackPricing = {
    saloon: {
      body_wash: 200,
      interior_exterior: 300,
      engine: 250,
      vacuum: 200,
      full_service: 1200
    },
    suv: {
      body_wash: 300,
      interior_exterior: 400,
      engine: 250,
      vacuum: 200,
      full_service: 1500
    }
  };

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const serviceTypes = [
    { value: 'body_wash', label: 'Body Wash', description: 'Exterior wash and dry', icon: '🚗', popular: false },
    { value: 'interior_exterior', label: 'Interior & Exterior', description: 'Complete inside and outside cleaning', icon: '✨', popular: true },
    { value: 'engine', label: 'Engine Cleaning', description: 'Engine bay cleaning and degreasing', icon: '🔧', popular: false },
    { value: 'vacuum', label: 'Vacuum Service', description: 'Interior vacuum and dusting', icon: '🧹', popular: false },
    { value: 'full_service', label: 'Full Service', description: 'Complete car wash including everything', icon: '👑', popular: true }
  ];

  // Function to get correct price for service card preview
  const getServicePrice = (serviceValue, carType = 'saloon') => {
    // Try server pricing first, then fallback
    if (pricing && pricing[carType] && pricing[carType][serviceValue]) {
      return pricing[carType][serviceValue];
    }
    
    const fallbackPrice = fallbackPricing[carType]?.[serviceValue] || 0;
    return fallbackPrice;
  };

  useEffect(() => {
    fetchPricing();
    // Calculate initial price
    const initialPrice = getServicePrice(formData.serviceType, formData.carType);
    setSelectedPrice(initialPrice);
    
    // Check for rebook data from localStorage
    const rebookData = localStorage.getItem('rebookData');
    if (rebookData) {
      try {
        const parsedData = JSON.parse(rebookData);
        setFormData(prev => ({
          ...prev,
          customerName: parsedData.customerName || '',
          customerPhone: parsedData.customerPhone || '',
          customerLocation: parsedData.customerLocation || '',
          carType: parsedData.carType || 'saloon',
          serviceType: parsedData.serviceType || 'body_wash',
          carDetails: parsedData.carDetails || {
            make: '',
            model: '',
            color: '',
            plateNumber: ''
          },
          specialInstructions: parsedData.specialInstructions || ''
        }));
        
        // Clear the rebook data after using it
        localStorage.removeItem('rebookData');
        
        toast.success('Your previous booking details have been loaded');
      } catch (error) {
        console.error('Error parsing rebook data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.carType && formData.serviceType) {
      const price = getServicePrice(formData.serviceType, formData.carType);
      
      if (price > 0) {
        setSelectedPrice(price);
      } else {
        setSelectedPrice(0);
      }
    }
  }, [pricing, formData.carType, formData.serviceType]);

  // Force price calculation when pricing is loaded
  useEffect(() => {
    if (pricing && formData.carType && formData.serviceType) {
      const price = getServicePrice(formData.serviceType, formData.carType);
      setSelectedPrice(price);
    }
  }, [pricing]);

  const fetchPricing = async () => {
    try {
      setIsLoadingPricing(true);
      const response = await fetch('/api/bookings/pricing');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.pricing) {
        setPricing(data.pricing);
      } else {
        setPricing(null);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setPricing(null);
      toast.error('Using fallback pricing due to server error');
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Recalculate price when car type or service type changes
    if (name === 'carType' || name === 'serviceType') {
      const newCarType = name === 'carType' ? value : formData.carType;
      const newServiceType = name === 'serviceType' ? value : formData.serviceType;
      
      // Calculate price immediately
      const price = getServicePrice(newServiceType, newCarType);
      setSelectedPrice(price);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.customerName || !formData.customerPhone || !formData.customerLocation || !formData.scheduledDate) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      // Include the calculated price in the form data
      const bookingData = {
        ...formData,
        price: selectedPrice
      };
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Booking created successfully! You will receive SMS notifications.');
        setCurrentStep(4); // Success step
      } else {
        const errorMessage = data.error || data.errors?.[0]?.msg || 'Failed to create booking';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tell Us About You
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We'll use this information to provide the best service
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            <User className="inline w-4 h-4 mr-2 text-blue-500" />
            Full Name
          </label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-300"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Phone className="inline w-4 h-4 mr-2 text-green-500" />
            Phone Number
          </label>
          <input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-green-300"
            placeholder="+254 700 000 000"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          <MapPin className="inline w-4 h-4 mr-2 text-red-500" />
          Service Location
        </label>
        <textarea
          name="customerLocation"
          value={formData.customerLocation}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-red-300 resize-none"
          placeholder="Enter your address or location where you'd like the service"
          required
        />
      </div>

      {/* Trust indicators */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            <span>Secure Booking</span>
          </div>
          <div className="flex items-center">
            <Truck className="w-4 h-4 mr-2 text-blue-500" />
            <span>Mobile Service</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            <span>5-Star Rated</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Car className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Service
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select your vehicle type and preferred service package
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Car className="inline w-4 h-4 mr-2 text-blue-500" />
            Vehicle Type
          </label>
          <select
            name="carType"
            value={formData.carType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-300"
          >
            <option value="saloon">🚗 Saloon Car</option>
            <option value="suv">🚙 SUV</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Service Package
          </label>
          <select
            name="serviceType"
            value={formData.serviceType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-green-300"
          >
            {serviceTypes.map(service => (
              <option key={service.value} value={service.value}>
                {service.icon} {service.label} {service.popular && '⭐'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enhanced Service Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceTypes.map(service => (
          <div
            key={service.value}
            className={`relative rounded-2xl border-2 cursor-pointer transition-all duration-500 p-8 group ${
              formData.serviceType === service.value
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-2xl scale-105 ring-4 ring-blue-200 dark:ring-blue-800'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:shadow-xl hover:scale-105 bg-white dark:bg-gray-800'
            }`}
            onClick={() => {
              const newServiceType = service.value;
              const currentCarType = formData.carType;
              
              // Update form data
              setFormData(prev => ({ ...prev, serviceType: newServiceType }));
              
              // Immediately calculate and set price
              const price = getServicePrice(newServiceType, currentCarType);
              setSelectedPrice(price);
            }}
          >
            {/* Enhanced Service Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 ${
                  formData.serviceType === service.value ? 'ring-4 ring-blue-200 dark:ring-blue-800' : ''
                }`}>
                  <span className="text-3xl">{service.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-1">
                    {service.label}
                  </h4>
                  {service.popular && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                      ⭐ Popular
                    </span>
                  )}
                </div>
              </div>
              
              {/* Enhanced Selection Indicator */}
              {formData.serviceType === service.value && (
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            {/* Enhanced Service Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {service.description}
            </p>
            
            {/* Enhanced Price Preview */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Starting from
                </span>
                <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                  KES {getServicePrice(service.value, formData.carType).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Details (Optional)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            name="carDetails.make"
            value={formData.carDetails.make}
            onChange={handleInputChange}
            placeholder="Car Make (e.g., Toyota)"
            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-300"
          />
          <input
            type="text"
            name="carDetails.model"
            value={formData.carDetails.model}
            onChange={handleInputChange}
            placeholder="Car Model (e.g., Corolla)"
            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-300"
          />
          <input
            type="text"
            name="carDetails.color"
            value={formData.carDetails.color}
            onChange={handleInputChange}
            placeholder="Car Color"
            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-300"
          />
          <input
            type="text"
            name="carDetails.plateNumber"
            value={formData.carDetails.plateNumber}
            onChange={handleInputChange}
            placeholder="Plate Number"
            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-300"
          />
        </div>
      </div>
      
      {/* Enhanced Price Display */}
      {isLoadingPricing ? (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading pricing...</span>
          </div>
        </div>
      ) : formData.carType && formData.serviceType && selectedPrice > 0 ? (
        <div className="mt-8 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-1">
                    💰 Service Price
                  </h4>
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    {formData.carType === 'saloon' ? '🚗 Saloon Car' : '🚙 SUV'} - {serviceTypes.find(s => s.value === formData.serviceType)?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <Zap className="w-4 h-4 mr-2" />
                <span>Instant pricing with premium service</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-green-800 dark:text-green-200 mb-2">
                KES {selectedPrice.toLocaleString()}
              </p>
              <div className="flex items-center justify-end text-sm text-green-600 dark:text-green-400">
                <span>💳 Payment on delivery</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="text-center">
            <p className="text-yellow-700 dark:text-yellow-300 font-medium">
              {!pricing ? '⏳ Loading pricing data...' : 
               !formData.carType ? '🚗 Please select vehicle type' :
               !formData.serviceType ? '✨ Please select service package' :
               selectedPrice === 0 ? '❌ Price not available for selected options' :
               '📋 Please select vehicle type and service to see pricing'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Schedule Your Service
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Pick a convenient time for your car wash
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Calendar className="inline w-4 h-4 mr-2 text-purple-500" />
            Preferred Date
          </label>
          <input
            type="date"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-purple-300"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Clock className="inline w-4 h-4 mr-2 text-pink-500" />
            Preferred Time
          </label>
          <select
            name="scheduledTime"
            value={formData.scheduledTime}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-pink-300"
          >
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Special Instructions
        </label>
        <textarea
          name="specialInstructions"
          value={formData.specialInstructions}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-300 resize-none"
          placeholder="Any special requests or instructions for our team..."
        />
      </div>

      {/* Enhanced Price Display for Step 3 */}
      {isLoadingPricing ? (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading pricing...</span>
          </div>
        </div>
      ) : formData.carType && formData.serviceType && selectedPrice > 0 ? (
        <div className="mt-8 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-purple-800 dark:text-purple-200 mb-1">
                    💰 Total Price
                  </h4>
                  <p className="text-purple-700 dark:text-purple-300 font-medium">
                    {formData.carType === 'saloon' ? '🚗 Saloon Car' : '🚙 SUV'} - {serviceTypes.find(s => s.value === formData.serviceType)?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Premium service with complete care</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-2">
                KES {selectedPrice.toLocaleString()}
              </p>
              <div className="flex items-center justify-end text-sm text-purple-600 dark:text-purple-400">
                <span>💳 Payment on delivery</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="text-center">
            <p className="text-yellow-700 dark:text-yellow-300 font-medium">
              {!pricing ? '⏳ Loading pricing data...' : 
               !formData.carType ? '🚗 Please select vehicle type' :
               !formData.serviceType ? '✨ Please select service package' :
               selectedPrice === 0 ? '❌ Price not available for selected options' :
               '📋 Please select vehicle type and service to see pricing'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-8">
      <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎉 Booking Confirmed!
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Your car wash booking has been successfully created. You'll receive SMS notifications for:
        </p>
      </div>
      
      <div className="space-y-4 text-left max-w-md mx-auto">
        <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
          <span className="font-medium">Booking confirmation</span>
        </div>
        <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <CheckCircle className="w-6 h-6 text-blue-500 mr-3" />
          <span className="font-medium">When cleaning starts</span>
        </div>
        <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <CheckCircle className="w-6 h-6 text-purple-500 mr-3" />
          <span className="font-medium">When service is completed</span>
        </div>
        <div className="flex items-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
          <CheckCircle className="w-6 h-6 text-pink-500 mr-3" />
          <span className="font-medium">When car is ready for delivery</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Pro tip:</strong> Our team will arrive 10 minutes before your scheduled time to ensure punctual service.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
              <Car className="w-14 h-14 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Book Your Car Wash
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Experience premium mobile car care services delivered right to your doorstep
          </p>
          
          {/* Enhanced Trust badges */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <Shield className="w-4 h-4 mr-2 text-green-500" />
              <span>100% Secure</span>
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <Truck className="w-4 h-4 mr-2 text-blue-500" />
              <span>Mobile Service</span>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        {currentStep < 4 && (
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                    step <= currentStep 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl scale-110' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-500 ${
                      step < currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6 space-x-16">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Customer Info</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Service Details</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Schedule</span>
            </div>
          </div>
        )}

        {/* Enhanced Form Content */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-white/30 dark:border-gray-700/30">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderSuccess()}

          {/* Enhanced Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-12">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium hover:shadow-lg"
              >
                ← Previous
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Booking...
                    </div>
                  ) : (
                    'Create Booking ✨'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm; 