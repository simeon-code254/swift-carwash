# 🚀 Deployment Guide

This guide will help you deploy the Swift Carwash application to production.

## 📋 Prerequisites

- GitHub account with repository access
- MongoDB Atlas account (or local MongoDB)
- Node.js hosting service (Heroku, Vercel, Railway, etc.)
- Domain name (optional)

## 🔧 Environment Variables Setup

### 1. Local Development

Create `.env` files in each app directory:

#### Server Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/swift-carwash
# or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/swift-carwash

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# External Services
SMS_API_KEY=your-sms-service-api-key
SMS_SERVICE_URL=https://api.sms-service.com

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Email Service (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# WhatsApp API (optional)
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_PHONE_NUMBER=+1234567890
```

#### Client App Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_WHATSAPP_NUMBER=+1234567890
```

#### Admin App Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ADMIN_TOKEN=your-admin-token
```

#### Workers App Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WORKER_TOKEN=your-worker-token
```

### 2. Production Environment Variables

For production deployment, set these environment variables in your hosting platform:

#### Required Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Set to "production"
- `PORT` - Server port (usually 5000 or provided by hosting)

#### Optional Variables
- `SMS_API_KEY` - For SMS notifications
- `STRIPE_SECRET_KEY` - For payment processing
- `EMAIL_SERVICE` - For email notifications
- `WHATSAPP_API_KEY` - For WhatsApp integration

## 🔐 GitHub Secrets Setup

### 1. Go to Your Repository Settings

1. Navigate to your GitHub repository
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"

### 2. Add the Following Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-key-here` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `SMS_API_KEY` | SMS service API key | `your-sms-api-key` |
| `EMAIL_PASSWORD` | Email service password | `your-app-password` |
| `WHATSAPP_API_KEY` | WhatsApp API key | `your-whatsapp-key` |

### 3. How to Add Secrets

1. Click "New repository secret"
2. Enter the secret name (e.g., `MONGODB_URI`)
3. Enter the secret value
4. Click "Add secret"

## 🌐 GitHub Pages Setup

### 1. Enable GitHub Pages

1. Go to repository "Settings"
2. Scroll down to "Pages" section
3. Under "Source", select "GitHub Actions"
4. This will allow the CI/CD pipeline to deploy automatically

### 2. Access Your Deployed Apps

After deployment, your apps will be available at:

- **Client App**: `https://simeon-code254.github.io/swift-carwash/client/`
- **Admin App**: `https://simeon-code254.github.io/swift-carwash/admin/`
- **Workers App**: `https://simeon-code254.github.io/swift-carwash/workers/`

## 🚀 Backend Deployment

### Option 1: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   cd server
   heroku create your-app-name
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on push

### Option 3: Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Vercel will automatically deploy on push

## 🔄 CI/CD Pipeline

The GitHub Actions workflow will automatically:

1. **Test** - Run tests on multiple Node.js versions
2. **Build** - Build all React applications
3. **Deploy** - Deploy to GitHub Pages
4. **Security** - Run security audits
5. **Lint** - Check code quality

### Manual Trigger

To manually trigger the pipeline:

1. Go to "Actions" tab in your repository
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## 📊 Monitoring and Logs

### GitHub Actions Logs

1. Go to "Actions" tab
2. Click on any workflow run
3. View detailed logs for each step

### Application Logs

For production applications, check your hosting platform's log system:

- **Heroku**: `heroku logs --tail`
- **Railway**: Dashboard → Logs
- **Vercel**: Dashboard → Functions → Logs

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to Git
- Use strong, unique secrets
- Rotate secrets regularly

### 2. Database Security
- Use MongoDB Atlas with network access restrictions
- Enable database authentication
- Use connection string with username/password

### 3. API Security
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use CORS properly

### 4. JWT Security
- Use strong JWT secrets
- Set appropriate expiration times
- Implement token refresh

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Deployment Failures**
   - Verify environment variables are set
   - Check MongoDB connection
   - Review GitHub Actions logs

3. **Runtime Errors**
   - Check application logs
   - Verify API endpoints are accessible
   - Test database connectivity

### Getting Help

1. Check the GitHub Actions logs
2. Review the application logs
3. Test locally with production environment variables
4. Create an issue in the repository

## 📞 Support

For deployment support:
- Email: soonyango@usiu.ac.ke
- GitHub Issues: Create an issue in the repository
- Documentation: Check the main README.md

---

**Happy Deploying! 🚀** 