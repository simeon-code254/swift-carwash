import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const PromoBanner = ({ onBannerClick }) => {
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // Rotate every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/promos/active');
      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error('Fetch banners error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = (banner) => {
    if (onBannerClick) {
      onBannerClick(banner);
    } else if (banner.actionUrl) {
      window.open(banner.actionUrl, '_blank');
    } else if (banner.discountCode) {
      // Apply discount code to current booking
      toast.success(`Promo code ${banner.discountCode} applied!`);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-16 rounded-lg animate-pulse">
        <div className="h-full flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg">
      {/* Banner */}
      <div
        className="relative h-16 bg-gradient-to-r from-blue-500 to-purple-600 cursor-pointer transition-all duration-300 hover:scale-105"
        onClick={() => handleBannerClick(currentBanner)}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        <div className="relative h-full flex items-center justify-between px-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm md:text-base">
              {currentBanner.title}
            </h3>
            <p className="text-white text-xs md:text-sm opacity-90">
              {currentBanner.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentBanner.discountCode && (
              <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded">
                {currentBanner.discountCode}
              </span>
            )}
            <span className="text-white text-sm font-medium">
              {currentBanner.actionText}
            </span>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentBannerIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBanner; 