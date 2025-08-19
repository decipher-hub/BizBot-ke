# 🚀 BizBot Kenya - Quick Start Guide

Get up and running with BizBot Kenya in under 10 minutes!

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 13+** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## 🎯 Quick Setup (5 minutes)

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/your-org/bizbot-kenya.git
cd bizbot-kenya

# Run the automated setup
npm run setup
```

The setup script will:
- ✅ Check Node.js version
- ✅ Create .env file from template
- ✅ Install all dependencies
- ✅ Check PostgreSQL installation
- ✅ Create database
- ✅ Run migrations
- ✅ Create necessary directories
- ✅ Test database connection

### 2. Configure Environment
Edit the `.env` file with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=bizbot_user
DB_PASSWORD=your_password
DB_NAME=bizbot_kenya_dev

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application
- **Landing Page**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 🧪 Test the API

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "business_name": "Test Business",
    "phone_number": "254700123456",
    "business_type": "retail",
    "location": "Nairobi, Kenya"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Process MPESA SMS
```bash
curl -X POST http://localhost:3000/api/transactions/process-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sms_content": "MPESA received Ksh1,000 from 254700123456 John Doe 15/3/2024 14:30 ABC123 New MPESA balance is Ksh5,000"
  }'
```

## 📁 Project Structure

```
bizbot-kenya/
├── src/                    # Backend source code
│   ├── app.js             # Main application
│   ├── server.js          # Server entry point
│   ├── config/            # Configuration files
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── public/                # Static files (landing page)
├── client/                # React frontend (future)
├── migrations/            # Database migrations
├── scripts/               # Setup and utility scripts
├── docs/                  # Documentation
└── tests/                 # Test files
```

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start development server
npm run start            # Start production server

# Database
npm run migrate          # Run migrations
npm run migrate:rollback # Rollback migrations
npm run seed             # Seed database
npm run db:reset         # Reset database

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

# Setup
npm run setup            # Run complete setup
```

## 🔧 Development Workflow

### 1. Start Development
```bash
npm run dev
```

### 2. Make Changes
- Edit files in `src/` for backend changes
- Edit files in `public/` for landing page changes
- Add new routes in `src/routes/`
- Add new services in `src/services/`

### 3. Database Changes
```bash
# Create new migration
npx knex migrate:make migration_name

# Run migrations
npm run migrate

# Rollback if needed
npm run migrate:rollback
```

### 4. Testing
```bash
# Run all tests
npm run test

# Run specific test file
npm test -- --testPathPattern=transactions

# Run tests in watch mode
npm run test:watch
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/process-sms` - Process MPESA SMS
- `GET /api/transactions/stats/summary` - Get transaction stats

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/revenue` - Get revenue analytics
- `GET /api/dashboard/trends` - Get transaction trends
- `GET /api/dashboard/insights` - Get business insights

### Analytics
- `GET /api/analytics/comprehensive` - Get comprehensive analytics
- `GET /api/analytics/predictions` - Get AI predictions
- `GET /api/analytics/export` - Export analytics data

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/notifications` - Get user notifications

## 🧪 Testing the MPESA Parser

The MPESA SMS parser supports various formats:

### Money Received
```
MPESA received Ksh1,000 from 254700123456 John Doe 15/3/2024 14:30 ABC123 New MPESA balance is Ksh5,000
```

### Money Sent
```
MPESA Ksh500 sent to 254700123456 Jane Smith 15/3/2024 14:30 ABC123 New MPESA balance is Ksh4,500
```

### Payment to Business
```
MPESA Ksh2,000 paid to 123456 Shop Name 15/3/2024 14:30 ABC123 New MPESA balance is Ksh3,000
```

### Withdrawal
```
MPESA Ksh1,000 withdrawn from 254700123456 Agent Name 15/3/2024 14:30 ABC123 New MPESA balance is Ksh2,000
```

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Create database manually
createdb bizbot_kenya_dev

# Check connection
psql -d bizbot_kenya_dev -c "SELECT 1;"
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Permission Issues
```bash
# Make setup script executable
chmod +x scripts/setup.js

# Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
```

## 📚 Next Steps

1. **Explore the Codebase**
   - Read `README.md` for detailed documentation
   - Check `PROJECT_MANAGEMENT.md` for development roadmap
   - Review API documentation at `/api/docs`

2. **Build Features**
   - Add new API endpoints in `src/routes/`
   - Implement business logic in `src/services/`
   - Add tests in `tests/` directory

3. **Deploy**
   - Set up production environment
   - Configure environment variables
   - Deploy to your preferred platform

## 🆘 Need Help?

- **Documentation**: Check `README.md` and `docs/` folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Email**: hello@bizbot.co.ke

---

**Happy coding! 🇰🇪🚀**

*Empowering Kenyan businesses, one transaction at a time.*
