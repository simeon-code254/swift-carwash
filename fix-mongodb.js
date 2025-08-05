const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

console.log('🔧 MongoDB Connection Fix Tool\n');

// Check if .env file exists
const envPath = path.join(__dirname, 'server', '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ No .env file found in server directory');
  console.log('📝 Creating .env file...');
  
  const envContent = `# MongoDB Atlas Connection String
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/swiftwash?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URLs
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# JWT Secret
JWT_SECRET=swiftwash-super-secret-jwt-key-2024

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file in server directory');
  console.log('📝 Please edit the .env file with your MongoDB Atlas connection string');
} else {
  console.log('✅ .env file exists');
}

// Test connection with fallback
const testConnection = async () => {
  console.log('\n🔗 Testing MongoDB connection...');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: envPath });
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftwash';
    console.log('📡 Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    // Check for bookings collection
    const hasBookings = collections.some(col => col.name === 'bookings');
    if (hasBookings) {
      console.log('✅ Found "bookings" collection');
      
      // Count documents
      const Booking = require('./server/models/Booking');
      const count = await Booking.countDocuments();
      console.log(`📈 Total bookings: ${count}`);
      
      if (count === 0) {
        console.log('💡 No bookings found. Run "node server/seedData.js" to add sample data');
      }
    } else {
      console.log('📭 No "bookings" collection found');
      console.log('💡 Run "node server/seedData.js" to create collection and add data');
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if MongoDB Atlas connection string is correct');
      console.log('2. Verify username and password in connection string');
      console.log('3. Add your IP address to MongoDB Atlas whitelist');
      console.log('4. Check if MongoDB Atlas cluster is running');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Authentication Error:');
      console.log('1. Check username and password in connection string');
      console.log('2. Verify database user has correct permissions');
    } else {
      console.log('\n🔧 General Error:');
      console.log('1. Check connection string format');
      console.log('2. Verify network connectivity');
      console.log('3. Check MongoDB Atlas cluster status');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
};

// Run the test
testConnection().then(() => {
  console.log('\n🎯 Next Steps:');
  console.log('1. Edit server/.env file with your MongoDB Atlas connection string');
  console.log('2. Run "node server/seedData.js" to add sample data');
  console.log('3. Start server: "cd server && npm start"');
  console.log('4. Start client: "cd client && npm start"');
  console.log('5. Start admin: "cd admin-app && npm run start:admin"');
  console.log('\n🚀 Your SwiftWash app is ready for testing and production!');
}); 