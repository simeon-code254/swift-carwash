# 🚗 Swift Carwash - Complete Car Wash Management System

A comprehensive car wash management platform with separate applications for customers, workers, and administrators. Built with React, Node.js, and MongoDB.

## 🌟 Features

### Customer App
- **Booking Management**: Schedule car wash appointments
- **Real-time Chat**: AI-powered chatbot for customer support
- **Payment Integration**: Secure payment processing
- **Booking Modifications**: Edit or cancel appointments
- **Feedback System**: Rate and review services
- **Promotional Banners**: View current offers and deals
- **WhatsApp Support**: Direct messaging integration

### Worker App
- **Job Management**: View and accept car wash jobs
- **Earnings Tracking**: Monitor daily/weekly earnings
- **Chat System**: Communicate with customers and admin
- **Settings**: Personalize app preferences
- **Navigation**: Easy-to-use interface for mobile workers

### Admin Dashboard
- **Analytics**: Comprehensive business insights and reports
- **Worker Management**: Monitor and manage worker accounts
- **Booking Oversight**: View and manage all appointments
- **Feedback Management**: Monitor customer reviews
- **Promo Management**: Create and manage promotional campaigns
- **Resource Management**: Handle system resources and settings

### Backend Server
- **RESTful API**: Complete backend services
- **Authentication**: Secure user authentication and authorization
- **Database Management**: MongoDB integration with Mongoose
- **File Upload**: Handle image uploads for car photos
- **SMS Integration**: Phone verification and notifications
- **Payment Processing**: Stripe integration for payments

## 🏗️ Architecture

```
swift-carwash/
├── admin-app/          # React TypeScript admin dashboard
├── client/             # React JavaScript customer app
├── workers-app/        # React TypeScript worker app
├── server/             # Node.js Express backend
└── docs/              # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/simeon-code254/swift-carwash.git
   cd swift-carwash
   ```

2. **Install dependencies for all apps**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   
   # Install admin app dependencies
   cd ../admin-app
   npm install
   
   # Install workers app dependencies
   cd ../workers-app
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cd server
   cp env-template.txt .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. **Start the development servers**
   ```bash
   # Start backend server
   cd server
   npm run dev
   
   # Start client app (in new terminal)
   cd client
   npm start
   
   # Start admin app (in new terminal)
   cd admin-app
   npm start
   
   # Start workers app (in new terminal)
   cd workers-app
   npm start
   ```

## 📱 Applications

### Customer App (Port 3000)
- **URL**: http://localhost:3000
- **Purpose**: Main customer-facing application
- **Features**: Booking, payments, chat, feedback

### Admin Dashboard (Port 3001)
- **URL**: http://localhost:3001
- **Purpose**: Administrative management interface
- **Features**: Analytics, worker management, system oversight

### Workers App (Port 3002)
- **URL**: http://localhost:3002
- **Purpose**: Mobile interface for car wash workers
- **Features**: Job management, earnings tracking, communication

### Backend Server (Port 5000)
- **URL**: http://localhost:5000
- **Purpose**: API server and database management
- **Features**: Authentication, data processing, file handling

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Token authentication
- **Multer**: File upload handling

### Additional Tools
- **Git**: Version control
- **GitHub Actions**: CI/CD automation
- **GitHub Pages**: Static site hosting

## 📊 Database Schema

### Collections
- **Users**: Customer and admin accounts
- **Workers**: Worker profiles and credentials
- **Bookings**: Appointment scheduling
- **Chat**: Messaging system
- **Feedback**: Customer reviews
- **PromoBanners**: Promotional content
- **PhoneVerification**: SMS verification

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-phone` - Phone verification

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Workers
- `GET /api/workers` - Get all workers
- `POST /api/workers` - Add new worker
- `PUT /api/workers/:id` - Update worker

### Chat
- `GET /api/chat` - Get chat messages
- `POST /api/chat` - Send message
- `POST /api/ai-chatbot` - AI chatbot responses

## 🚀 Deployment

### Production Setup
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Build all applications
4. Deploy to your preferred hosting service

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/swift-carwash

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=5000
NODE_ENV=production

# External Services
SMS_API_KEY=your-sms-service-key
PAYMENT_SECRET=your-payment-service-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Simeon Odhiambo**
- GitHub: [@simeon-code254](https://github.com/simeon-code254)
- Email: soonyango@usiu.ac.ke

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB team for the database solution
- Express.js team for the backend framework
- All contributors and testers

## 📞 Support

For support, email soonyango@usiu.ac.ke or create an issue in this repository.

---

**Made with ❤️ by Simeon Odhiambo** 