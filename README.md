# Tink Banking Application

A comprehensive banking application built with Node.js and React that integrates with Tink's API to provide real-time bank account management and transaction syncing.

## Features

- **User Authentication**: Secure signup and signin with JWT tokens
- **Bank Account Linking**: Connect multiple bank accounts and credit cards via Tink
- **Real-time Transaction Syncing**: Automatic syncing every 5 minutes with real-time updates
- **Transaction Management**: View, filter, and analyze transactions with date ranges
- **Balance Tracking**: Running balance calculations for filtered date ranges
- **Modern UI**: Beautiful Material-UI interface with responsive design
- **Multi-Account Support**: Manage multiple bank accounts from different institutions

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Tink API** for banking data integration
- **Socket.IO** for real-time updates
- **JWT** for authentication
- **bcryptjs** for password hashing
- **node-cron** for scheduled syncing

### Frontend
- **React** with hooks and context
- **Material-UI (MUI)** for components and styling
- **React Router** for navigation
- **Axios** for API communication
- **Socket.IO Client** for real-time updates
- **Day.js** for date handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Tink Developer Account with API credentials

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tink-banking-app
```

### 2. Backend Setup

```bash
# Install backend dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configurations
# The Tink credentials are already set up for you
```

### 3. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# The environment is already configured
```

### 4. Database Setup

Make sure MongoDB is running locally or update the `MONGODB_URI` in `.env` to point to your MongoDB instance.

## Configuration

### Environment Variables

The application is pre-configured with your Tink credentials:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tink-banking-app
JWT_SECRET=tink-banking-app-super-secret-jwt-key-2024

# Tink API Configuration (Already configured)
TINK_CLIENT_ID=dd7ae5ec0d3d405aaf2e814430a47309
TINK_CLIENT_SECRET=dec17a82273e4b7ab59ab03a40af12e5
TINK_BASE_URL=https://api.tink.com

# Frontend URL for CORS
CLIENT_URL=http://localhost:3000
```

## Running the Application

### Development Mode

1. **Start MongoDB** (if running locally)

2. **Start the Backend Server**:
```bash
npm run dev
```
This starts the server on `http://localhost:5000`

3. **Start the Frontend** (in a new terminal):
```bash
cd client
npm start
```
This starts the React app on `http://localhost:3000`

### Production Mode

```bash
# Build the frontend
cd client
npm run build

# Start the backend
cd ..
npm start
```

## Usage

### 1. User Registration/Login

1. Navigate to `http://localhost:3000`
2. Sign up with your email and create a password
3. Or sign in if you already have an account

### 2. Linking Bank Accounts

1. Click "Link Account" on the dashboard
2. This opens Tink Link in a popup window
3. Select your bank and provide credentials
4. Once linked, accounts will appear on your dashboard

### 3. Transaction Syncing

- **Automatic**: Transactions sync every 5 minutes automatically
- **Manual**: Click the "Sync" button for immediate syncing
- **Real-time**: New transactions appear instantly via WebSocket

### 4. Viewing Transactions

- **Dashboard**: Shows recent transactions
- **All Transactions**: Click "View All" for complete transaction history
- **Filtering**: Filter by date range, account, type, or category
- **Balance Tracking**: See running balance for any date range

### 5. Account Management

- **View Balances**: See current and available balances
- **Unlink Accounts**: Remove accounts you no longer want to track
- **Account Types**: Supports checking, savings, credit cards, and more

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - Get user's accounts
- `POST /api/accounts/link-url` - Generate Tink Link URL
- `POST /api/accounts/sync` - Manual sync accounts and transactions
- `DELETE /api/accounts/:id` - Unlink account

### Transactions
- `GET /api/transactions` - Get transactions with filtering
- `GET /api/transactions/summary` - Get transaction summary
- `GET /api/transactions/categories` - Get available categories

### Sync
- `POST /api/sync/manual` - Trigger manual sync

## Real-time Features

The application uses Socket.IO for real-time updates:

- **New Transaction Notifications**: Instant alerts when new transactions are synced
- **Sync Status Updates**: Real-time feedback on sync operations
- **Balance Updates**: Live balance updates across all components

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express.js

## Database Schema

### Users
- Personal information and authentication
- Tink user ID for API integration
- Referenced accounts array

### Accounts
- Bank account details from Tink
- Balance and account type information
- Active status for soft deletion

### Transactions
- Complete transaction data from Tink
- Categorization and merchant information
- Running balance calculations
- Indexed for efficient querying

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in `.env`

2. **Tink API Errors**
   - Verify your Tink credentials
   - Check Tink API status
   - Ensure proper scopes are configured

3. **Socket Connection Issues**
   - Check that both frontend and backend are running
   - Verify CORS configuration

4. **Transaction Sync Problems**
   - Check Tink user creation
   - Verify account linking was successful
   - Review server logs for API errors

### Development Tips

- Use `npm run dev` for backend development (nodemon)
- Frontend hot-reloads automatically
- Check browser console for client-side errors
- Monitor server console for API issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions:
- Check the troubleshooting section
- Review server and client logs
- Ensure all dependencies are installed correctly

---

**Note**: This application is configured with your specific Tink credentials and is ready to use. Make sure to keep your API credentials secure and never commit them to public repositories.