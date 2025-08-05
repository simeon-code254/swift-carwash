# MongoDB Atlas Setup Guide

## 🔗 How to Connect to MongoDB Atlas

### Step 1: Get Your MongoDB Atlas Connection String

1. **Log into MongoDB Atlas** (https://cloud.mongodb.com)
2. **Select your cluster**
3. **Click "Connect"**
4. **Choose "Connect your application"**
5. **Copy the connection string**

Your connection string will look like this:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Step 2: Create .env File

Create a file called `.env` in your `server` folder with this content:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/swiftwash?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Step 3: Replace Placeholder Values

1. **Replace `your_username`** with your MongoDB Atlas username
2. **Replace `your_password`** with your MongoDB Atlas password
3. **Replace `your_cluster`** with your actual cluster name
4. **Replace `swiftwash`** with your database name (or keep it as is)

### Step 4: Test Connection

Run this command to test your connection:
```bash
cd server
node seedData.js
```

## 📊 How to View Data in MongoDB Atlas

### Method 1: MongoDB Atlas Web Interface

1. **Log into MongoDB Atlas**
2. **Click on your cluster**
3. **Click "Browse Collections"**
4. **Navigate to your database (swiftwash)**
5. **Click on the "bookings" collection**
6. **You'll see all your booking data**

### Method 2: Add More Data via API

You can add more bookings by making POST requests to your API:

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "+254700000000",
    "customerLocation": "Nairobi, Kenya",
    "carType": "saloon",
    "serviceType": "body_wash",
    "scheduledDate": "2024-01-15",
    "scheduledTime": "10:00",
    "carDetails": {
      "make": "Toyota",
      "model": "Corolla",
      "color": "White"
    },
    "specialInstructions": "Please be extra careful with the paint"
  }'
```

### Method 3: Use the Seed Script

The `seedData.js` script will add sample data to your database:

```bash
cd server
node seedData.js
```

## 🔍 Troubleshooting

### If you can't connect:

1. **Check your connection string** - make sure it's correct
2. **Verify your IP address** - add your IP to MongoDB Atlas whitelist
3. **Check credentials** - ensure username/password are correct
4. **Test connection** - try connecting with MongoDB Compass

### If you can't see data:

1. **Check database name** - make sure it matches in your connection string
2. **Check collection name** - data is stored in "bookings" collection
3. **Refresh the page** - sometimes Atlas needs a refresh
4. **Check for errors** - look at your server console for connection errors

## 📝 Sample Data Structure

Your bookings will have this structure:
```json
{
  "_id": "ObjectId",
  "customerName": "John Doe",
  "customerPhone": "+254700000000",
  "customerLocation": "Nairobi, Kenya",
  "carType": "saloon",
  "serviceType": "body_wash",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "10:00",
  "price": 200,
  "status": "pending",
  "carDetails": {
    "make": "Toyota",
    "model": "Corolla",
    "color": "White"
  },
  "specialInstructions": "Please be extra careful",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

## 🚀 Quick Start

1. **Create the .env file** with your MongoDB Atlas connection string
2. **Restart your server**: `npm start`
3. **Run seed script**: `node seedData.js`
4. **Check MongoDB Atlas** to see your data
5. **Add more bookings** via the admin dashboard or API

Need help? Check the server console for connection errors! 