const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Comprehensive AI chatbot training dataset for SwiftWash
const chatbotResponses = {
  // Greetings and Introduction
  greetings: {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    responses: [
      'Hello! I\'m SwiftWash, your AI assistant. Welcome to our mobile car wash service! How can I help you today?',
      'Hi there! I\'m SwiftWash, ready to help with all your car wash needs. What can I assist you with?',
      'Welcome to SwiftWash! I\'m here to make your car wash experience smooth and convenient. How may I help?'
    ]
  },

  // Services Information
  services: {
    patterns: ['services', 'what services', 'car wash services', 'cleaning services', 'what do you offer', 'packages', 'options'],
    responses: [
      'SwiftWash offers premium mobile car wash services:\n\n🚗 **Basic Wash** - KES 500\n• Exterior wash & dry\n• Tire cleaning\n• Basic interior wipe\n\n🚗 **Premium Wash** - KES 800\n• Everything in Basic +\n• Interior vacuuming\n• Dashboard cleaning\n• Window cleaning\n\n🚗 **Full Service** - KES 1,200\n• Everything in Premium +\n• Engine bay cleaning\n• Wax application\n• Interior sanitization\n\n🚗 **Express Wash** - KES 400\n• Quick exterior wash\n• Perfect for busy schedules',
      'Our comprehensive services include:\n• Basic Wash (KES 500)\n• Premium Wash (KES 800)\n• Full Service (KES 1,200)\n• Express Wash (KES 400)\n\nWe also offer add-ons like waxing, interior sanitization, and engine cleaning. What interests you?',
      'At SwiftWash, we provide:\n\n💰 **Affordable Options:**\n- Express Wash: KES 400\n- Basic Wash: KES 500\n- Premium Wash: KES 800\n- Full Service: KES 1,200\n\n🎯 **Specialized Services:**\n- Interior deep cleaning\n- Engine bay cleaning\n- Wax & polish\n- Pet hair removal\n\nWhich service catches your eye?'
    ]
  },

  // Pricing Questions
  pricing: {
    patterns: ['price', 'cost', 'how much', 'rates', 'pricing', 'fee', 'charges', 'expensive', 'cheap', 'budget'],
    responses: [
      'SwiftWash offers competitive pricing:\n\n💵 **Service Rates:**\n• Express Wash: KES 400\n• Basic Wash: KES 500\n• Premium Wash: KES 800\n• Full Service: KES 1,200\n\n🎓 **Student Discount:** 15% off with valid ID\n👥 **Referral Bonus:** KES 100 off for each friend you refer\n📦 **Package Deals:** Save up to 20% on multiple bookings\n\nAll prices include quality products and professional service!',
      'Our transparent pricing structure:\n\n🚗 Express Wash: KES 400 (30-45 min)\n🚗 Basic Wash: KES 500 (45-60 min)\n🚗 Premium Wash: KES 800 (60-75 min)\n🚗 Full Service: KES 1,200 (90-120 min)\n\n💡 **Money-Saving Tips:**\n• Book in advance for 10% discount\n• Student discount available\n• Refer friends for KES 100 off\n• Weekly packages available',
      'SwiftWash pricing is designed to be affordable:\n\n💰 **Standard Rates:**\n- Express: KES 400\n- Basic: KES 500\n- Premium: KES 800\n- Full Service: KES 1,200\n\n🎯 **Special Offers:**\n- Students: 15% discount\n- Referrals: KES 100 off\n- First-time customers: 10% off\n- Weekend packages available\n\nNo hidden fees - what you see is what you pay!'
    ]
  },

  // Booking Process
  booking: {
    patterns: ['book', 'booking', 'schedule', 'appointment', 'reserve', 'make appointment', 'how to book', 'book now', 'reservation'],
    responses: [
      'Booking with SwiftWash is super easy! 🎉\n\n📱 **How to Book:**\n1. Visit our website or app\n2. Select your preferred service\n3. Choose date & time\n4. Enter your location\n5. Confirm booking\n\n⏰ **Available Times:**\n• Weekdays: 8:00 AM - 6:00 PM\n• Weekends: 9:00 AM - 5:00 PM\n\n📍 **We come to you!** Just provide your address and we\'ll be there.\n\nNeed help booking? Call us at +254 700 000 000',
      'Ready to book your car wash? Here\'s how:\n\n🔄 **Simple 3-Step Process:**\n1️⃣ Choose your service (Basic/Premium/Full/Express)\n2️⃣ Pick your preferred date & time\n3️⃣ Provide your location\n\n✅ **Instant Confirmation**\n✅ **Flexible Scheduling**\n✅ **Same-day booking available**\n✅ **Free cancellation up to 2 hours before**\n\nBook now and experience the SwiftWash difference!',
      'Booking your SwiftWash service:\n\n📅 **Booking Options:**\n• Online booking (24/7)\n• Phone booking: +254 700 000 000\n• WhatsApp: +254 700 000 000\n\n⏰ **Scheduling:**\n• Same-day booking available\n• Advance booking up to 30 days\n• Flexible time slots\n• Weekend availability\n\n🎯 **What you need:**\n• Vehicle location\n• Preferred service\n• Contact information\n\nWe\'ll confirm your booking immediately!'
    ]
  },

  // Contact Information
  contact: {
    patterns: ['contact', 'phone', 'call', 'email', 'support', 'help', 'reach', 'speak', 'talk', 'customer service'],
    responses: [
      '📞 **Contact SwiftWash:**\n\n📱 **Phone:** +254 700 000 000\n📧 **Email:** info@swiftwash.com\n💬 **WhatsApp:** +254 700 000 000\n🌐 **Website:** www.swiftwash.com\n\n⏰ **Customer Service Hours:**\n• Monday - Friday: 7:00 AM - 8:00 PM\n• Saturday: 8:00 AM - 6:00 PM\n• Sunday: 9:00 AM - 5:00 PM\n\n💡 **We\'re here to help with:**\n• Booking assistance\n• Service questions\n• Payment support\n• Feedback and complaints\n\n**SwiftWash - Your car wash partner!**',
      'Get in touch with SwiftWash:\n\n📞 **Contact Details:**\n- Phone: +254 700 000 000\n- WhatsApp: +254 700 000 000\n- Email: info@swiftwash.com\n- Website: www.swiftwash.com\n\n⏰ **Available Hours:**\n- Weekdays: 7:00 AM - 8:00 PM\n- Weekends: 8:00 AM - 6:00 PM\n\n🎯 **How we can help:**\n- Booking assistance\n- Service information\n- Payment support\n- Feedback and complaints\n- Emergency support\n\nWe\'re always here for you!',
      'SwiftWash contact information:\n\n📱 **Reach us at:**\n• Phone: +254 700 000 000\n• WhatsApp: +254 700 000 000\n• Email: info@swiftwash.com\n• Website: www.swiftwash.com\n\n⏰ **Service Hours:**\n• Weekdays: 7:00 AM - 8:00 PM\n• Weekends: 8:00 AM - 6:00 PM\n\n💬 **We help with:**\n• Booking questions\n• Service inquiries\n• Payment issues\n• Feedback\n• Complaints\n\n**Your satisfaction is our priority!**'
    ]
  },

  // Default Response
  default: {
    responses: [
      'Hi! I\'m SwiftWash, your AI assistant. I can help you with:\n\n🚗 **Services & Pricing**\n📅 **Booking & Scheduling**\n📍 **Location & Coverage**\n💳 **Payment Options**\n⏰ **Service Times**\n🎓 **Student Discounts**\n👥 **Referral Program**\n\nFor specific questions, just ask! For complex inquiries, contact us:\n📞 Phone: +254 700 000 000\n📧 Email: info@swiftwash.com',
      'Hello! I\'m SwiftWash, here to help with your car wash needs. I can assist with:\n\n🚗 Services and pricing\n📅 Booking and scheduling\n📍 Location and coverage\n💳 Payment options\n⏰ Service times\n🎓 Student discounts\n👥 Referral program\n\nAsk me anything! For detailed help, contact:\n📞 +254 700 000 000\n📧 info@swiftwash.com',
      'Welcome to SwiftWash! I\'m your AI assistant. I can help with:\n\n🚗 Services and pricing\n📅 Booking and scheduling\n📍 Location and coverage\n💳 Payment options\n⏰ Service times\n🎓 Student discounts\n👥 Referral program\n\nJust ask! For complex questions, reach us:\n📞 +254 700 000 000\n📧 info@swiftwash.com'
    ]
  }
};

// Enhanced function to find the best matching response
const findResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Check for exact matches first
  for (const [category, data] of Object.entries(chatbotResponses)) {
    if (category === 'default') continue;
    
    for (const pattern of data.patterns) {
      if (lowerMessage.includes(pattern)) {
        const responses = data.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }
  
  // Return default response if no pattern matches
  const defaultResponses = chatbotResponses.default.responses;
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// @route   POST /api/ai-chatbot/chat
// @desc    Chat with AI chatbot
// @access  Public
router.post('/chat', [
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    
    // Get AI response
    const response = findResponse(message);
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI chatbot error:', error);
    res.status(500).json({ 
      error: 'Sorry, I\'m having trouble processing your request. Please contact us at +254 700 000 000 or info@swiftwash.com for immediate assistance.',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/ai-chatbot/health
// @desc    Check chatbot health
// @access  Public
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SwiftWash AI Chatbot is running',
    timestamp: new Date().toISOString(),
    version: '2.0',
    features: [
      'Comprehensive service information',
      'Pricing and discounts',
      'Booking assistance',
      'Location and coverage',
      'Payment options',
      'Student and referral programs',
      'Emergency services',
      'Feedback and support'
    ]
  });
});

module.exports = router; 