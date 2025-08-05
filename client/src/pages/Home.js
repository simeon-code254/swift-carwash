import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Clock, 
  MapPin, 
  Star, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin as MapPinIcon,
  Sparkles,
  Award,
  Truck
} from 'lucide-react';
import PromoBanner from '../components/PromoBanner';

const Home = () => {
  const features = [
    {
      icon: Car,
      title: 'Professional Car Wash',
      description: 'Expert cleaning services for all vehicle types with premium products',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Clock,
      title: 'Quick & Convenient',
      description: 'Book your slot online and get your car washed in 30-90 minutes',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: MapPin,
      title: 'Mobile Service',
      description: 'We come to your location - no need to drive anywhere',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Payment on delivery with secure booking system',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const services = [
    {
      name: 'Body Wash',
      price: 'KES 200-300',
      description: 'Exterior wash and dry for your vehicle',
      features: ['Exterior wash', 'Tire cleaning', 'Window cleaning', 'Drying'],
      icon: '🚗',
      popular: false
    },
    {
      name: 'Interior & Exterior',
      price: 'KES 300-400',
      description: 'Complete inside and outside cleaning',
      features: ['Full exterior wash', 'Interior vacuum', 'Dashboard cleaning', 'Tire dressing'],
      icon: '✨',
      popular: true
    },
    {
      name: 'Full Service',
      price: 'KES 1,200-1,500',
      description: 'Complete car wash including everything',
      features: ['Complete wash', 'Engine cleaning', 'Interior detailing', 'All services included'],
      icon: '👑',
      popular: true
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Kimani',
      role: 'Business Owner',
      content: 'SwiftWash has been a game-changer for my business. Professional service and my car always looks brand new!',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'John Mwangi',
      role: 'Family Man',
      content: 'The mobile service is so convenient. They come to my home and do an amazing job. Highly recommended!',
      rating: 5,
      avatar: '👨‍👩‍👧‍👦'
    },
    {
      name: 'Mary Wanjiku',
      role: 'Executive',
      content: 'Premium service at reasonable prices. My SUV has never looked better. Excellent customer service!',
      rating: 5,
      avatar: '👩‍💻'
    }
  ];

  const stats = [
    { number: '5000+', label: 'Happy Customers' },
    { number: '98%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Support Available' },
    { number: '30min', label: 'Average Time' }
  ];

  const handleBannerClick = (banner) => {
    if (banner.discountCode) {
      // Navigate to booking with promo code
      window.location.href = `/book?promo=${banner.discountCode}`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional
              <span className="block text-yellow-400">Car Wash</span>
              At Your Doorstep
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Book online, we come to you. Premium car wash services in Nairobi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/book"
                className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-200 flex items-center justify-center"
              >
                Book Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/my-washes"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition-colors duration-200"
              >
                My Washes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PromoBanner onBannerClick={handleBannerClick} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SwiftWash?
            </h2>
            <p className="text-xl text-gray-600">
              Professional car wash services delivered to your location
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} text-white mb-4`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect wash package for your vehicle
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className={`relative bg-white rounded-lg shadow-lg p-6 border-2 ${
                service.popular ? 'border-yellow-400' : 'border-gray-200'
              }`}>
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    {service.price}
                  </p>
                  <p className="text-gray-600 mb-6">
                    {service.description}
                  </p>
                  
                  <ul className="text-left space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    to="/book"
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 block text-center"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-600">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Book your car wash today and experience the difference
          </p>
          <Link
            to="/book"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center"
          >
            Book Your Wash
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 