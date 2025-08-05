const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftwash', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample booking data
const sampleBookings = [
  {
    customerName: 'John Doe',
    customerPhone: '+254700123456',
    customerLocation: 'Westlands, Nairobi',
    carType: 'saloon',
    serviceType: 'body_wash',
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: '09:00',
    price: 200,
    status: 'confirmed',
    carDetails: {
      make: 'Toyota',
      model: 'Corolla',
      color: 'White',
      plateNumber: 'KCA 123A'
    },
    specialInstructions: 'Please be gentle with the paint',
    smsNotifications: {
      confirmed: true,
      started: false,
      completed: false,
      delivered: false
    }
  },
  {
    customerName: 'Jane Smith',
    customerPhone: '+254700123456',
    customerLocation: 'Kilimani, Nairobi',
    carType: 'suv',
    serviceType: 'full_service',
    scheduledDate: new Date('2024-01-16'),
    scheduledTime: '14:00',
    price: 1500,
    status: 'started_cleaning',
    carDetails: {
      make: 'Land Rover',
      model: 'Discovery',
      color: 'Black',
      plateNumber: 'KDB 456B'
    },
    specialInstructions: 'Include interior sanitization',
    smsNotifications: {
      confirmed: true,
      started: true,
      completed: false,
      delivered: false
    }
  },
  {
    customerName: 'Mike Johnson',
    customerPhone: '+254700789012',
    customerLocation: 'Lavington, Nairobi',
    carType: 'saloon',
    serviceType: 'interior_exterior',
    scheduledDate: new Date('2024-01-14'),
    scheduledTime: '11:00',
    price: 300,
    status: 'done',
    carDetails: {
      make: 'Honda',
      model: 'Civic',
      color: 'Blue',
      plateNumber: 'KCC 789C'
    },
    specialInstructions: 'Focus on removing coffee stains from seats',
    smsNotifications: {
      confirmed: true,
      started: true,
      completed: true,
      delivered: false
    },
    completedAt: new Date('2024-01-14T12:30:00Z')
  },
  {
    customerName: 'Sarah Wilson',
    customerPhone: '+254700789012',
    customerLocation: 'Karen, Nairobi',
    carType: 'suv',
    serviceType: 'engine',
    scheduledDate: new Date('2024-01-13'),
    scheduledTime: '16:00',
    price: 250,
    status: 'delivered',
    carDetails: {
      make: 'BMW',
      model: 'X5',
      color: 'Silver',
      plateNumber: 'KCD 012D'
    },
    specialInstructions: 'Engine bay needs thorough cleaning',
    smsNotifications: {
      confirmed: true,
      started: true,
      completed: true,
      delivered: true
    },
    completedAt: new Date('2024-01-13T17:30:00Z'),
    deliveredAt: new Date('2024-01-13T18:00:00Z')
  },
  {
    customerName: 'David Brown',
    customerPhone: '+254700345678',
    customerLocation: 'Muthaiga, Nairobi',
    carType: 'saloon',
    serviceType: 'vacuum',
    scheduledDate: new Date('2024-01-17'),
    scheduledTime: '10:00',
    price: 200,
    status: 'pending',
    carDetails: {
      make: 'Mercedes',
      model: 'C-Class',
      color: 'Red',
      plateNumber: 'KCE 345E'
    },
    specialInstructions: 'Remove all pet hair from interior',
    smsNotifications: {
      confirmed: false,
      started: false,
      completed: false,
      delivered: false
    }
  },
  {
    customerName: 'Lisa Davis',
    customerPhone: '+254700345678',
    customerLocation: 'Runda, Nairobi',
    carType: 'suv',
    serviceType: 'interior_exterior',
    scheduledDate: new Date('2024-01-18'),
    scheduledTime: '13:00',
    price: 400,
    status: 'confirmed',
    carDetails: {
      make: 'Range Rover',
      model: 'Sport',
      color: 'White',
      plateNumber: 'KCF 678F'
    },
    specialInstructions: 'Use eco-friendly cleaning products',
    smsNotifications: {
      confirmed: true,
      started: false,
      completed: false,
      delivered: false
    }
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing bookings
    await Booking.deleteMany({});
    console.log('Cleared existing bookings');

    // Insert sample bookings
    const insertedBookings = await Booking.insertMany(sampleBookings);
    console.log(`Successfully inserted ${insertedBookings.length} sample bookings`);

    // Display the inserted bookings
    console.log('\nSample bookings created:');
    insertedBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.customerName} - ${booking.serviceType} - ${booking.status}`);
    });

    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 