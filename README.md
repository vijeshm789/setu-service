# SETU KYC Service

A comprehensive KYC (Know Your Customer) verification service built with Node.js, Express, TypeScript, and MongoDB, integrated with SETU DigiLocker API for document verification.

## Features

- 🔐 **User Authentication**: JWT-based authentication with secure password hashing and token generation on registration
- 👤 **Multi-tenant Support**: Each user has their own SETU credentials stored securely
- 📄 **KYC Verification**: Complete KYC flow using SETU DigiLocker API with user-specific credentials
- 🗂️ **Document Management**: Fetch and store multiple document types (Aadhaar, PAN, DL, etc.)
- 🔔 **Webhook Support**: Real-time updates via SETU webhooks with signature verification
- 🛡️ **Security**: Rate limiting, helmet protection, and CORS support
- ✅ **Validation**: Request validation using Joi
- 📊 **Status Tracking**: Track KYC verification status in real-time
- 🔄 **Auto-refresh**: Manually refresh KYC status from SETU

## Supported Documents

- **AADHAAR**: Aadhaar card
- **PAN**: Permanent Account Number
- **DL**: Driving License
- **VOTERID**: Voter ID card
- **PASSPORT**: Passport

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**: Helmet, CORS, bcryptjs
- **API Client**: Axios
- **Rate Limiting**: express-rate-limit

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- SETU DigiLocker API credentials

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd setu-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/setu-kyc-service

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
```

**Note**: SETU credentials are now provided during user registration and stored per user in the database.

4. **Build the project**
```bash
npm run build
```

5. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### 1. Register User (Get Token)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phoneNumber": "9876543210",
  "setuCredentials": {
    "clientId": "your-setu-client-id",
    "clientSecret": "your-setu-client-secret",
    "productInstanceId": "your-product-instance-id",
    "webhookSecret": "your-webhook-secret",
    "baseUrl": "https://dg-sandbox.setu.co",
    "redirectUrl": "https://yourapp.com/kyc/callback"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Use the token for authentication.",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "phoneNumber": "9876543210",
      "createdAt": "2024-01-08T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Important**: Save the `token` from the response. You'll need to pass this token in the `Authorization` header for all subsequent API requests.

#### 2. Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "phoneNumber": "9876543210",
      "createdAt": "2024-01-08T..."
    }
  }
}
```

### KYC Endpoints

#### 1. Initiate KYC Verification
```http
POST /api/kyc/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "documents": ["AADHAAR", "PAN"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC verification initiated successfully",
  "data": {
    "kycId": "...",
    "setuRequestId": "...",
    "url": "https://dg.setu.co/...",
    "status": "pending",
    "requestedDocuments": ["AADHAAR", "PAN"],
    "validUpto": "2024-01-15T...",
    "createdAt": "2024-01-08T..."
  }
}
```

**Important:** Redirect the user to the `url` provided in the response to complete DigiLocker authentication.

#### 2. Get All KYC Verifications
```http
GET /api/kyc
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "KYC verifications fetched successfully",
  "data": {
    "count": 2,
    "verifications": [
      {
        "kycId": "...",
        "setuRequestId": "...",
        "status": "completed",
        "requestedDocuments": ["AADHAAR", "PAN"],
        "documentsCount": 2,
        "validUpto": "2024-01-15T...",
        "completedAt": "2024-01-08T...",
        "createdAt": "2024-01-08T..."
      }
    ]
  }
}
```

#### 3. Get KYC by ID
```http
GET /api/kyc/:kycId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "KYC verification fetched successfully",
  "data": {
    "kycId": "...",
    "setuRequestId": "...",
    "status": "completed",
    "requestedDocuments": ["AADHAAR", "PAN"],
    "documents": [
      {
        "type": "AADHAAR",
        "data": {
          "name": "John Doe",
          "dob": "01-01-1990",
          "gender": "M",
          "address": "...",
          "uid": "XXXX-XXXX-1234"
        },
        "fetchedAt": "2024-01-08T..."
      }
    ],
    "validUpto": "2024-01-15T...",
    "completedAt": "2024-01-08T...",
    "createdAt": "2024-01-08T...",
    "updatedAt": "2024-01-08T..."
  }
}
```

#### 4. Refresh KYC Status
```http
PUT /api/kyc/:kycId/refresh
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "KYC status updated successfully",
  "data": {
    "kycId": "...",
    "status": "completed",
    "documents": [...],
    "completedAt": "2024-01-08T...",
    "updatedAt": "2024-01-08T..."
  }
}
```

#### 5. Fetch Specific Document
```http
POST /api/kyc/:kycId/document
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentType": "AADHAAR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document fetched successfully",
  "data": {
    "document": {
      "type": "AADHAAR",
      "data": {
        "name": "John Doe",
        "dob": "01-01-1990",
        "gender": "M",
        "address": "...",
        "uid": "XXXX-XXXX-1234"
      },
      "documentUrl": "https://..."
    }
  }
}
```

#### 6. Webhook Endpoint
```http
POST /api/kyc/webhook
Content-Type: application/json
X-Setu-Signature: <signature>

{
  "id": "...",
  "traceId": "...",
  "status": "completed",
  "documents": [...]
}
```

This endpoint is called by SETU when the KYC status changes.

## KYC Flow

1. **User Registration**: User creates an account with their SETU credentials and receives an authentication token
2. **Token Storage**: Save the token to use in all subsequent API requests
3. **Initiate KYC**: User initiates KYC with required document types (using the token in Authorization header)
4. **DigiLocker Authentication**: User is redirected to SETU DigiLocker URL (specific to their SETU credentials)
5. **Document Consent**: User authenticates with DigiLocker and grants consent
6. **Webhook Notification**: SETU sends webhook when documents are fetched (verified using user's webhook secret)
7. **Document Retrieval**: Documents are automatically stored in the database
8. **Status Check**: User can check KYC status and view documents using their token

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet**: Security headers
- **CORS**: Configurable CORS policy
- **Input Validation**: Joi schema validation
- **Webhook Verification**: HMAC signature verification

## Database Schema

### User
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  name: string (required)
  phoneNumber: string (optional)
  createdAt: Date
  updatedAt: Date
}
```

### KYC Verification
```typescript
{
  userId: ObjectId (ref: User, required)
  setuRequestId: string (unique, required)
  setuUrl: string
  status: enum (pending, in_progress, completed, failed, expired)
  requestedDocuments: DocumentType[]
  documents: [{
    type: DocumentType
    data: object
    documentUrl: string
    fetchedAt: Date
  }]
  validUpto: Date
  completedAt: Date
  errorMessage: string
  errorCode: string
  metadata: object
  createdAt: Date
  updatedAt: Date
}
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/setu-kyc-service` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `SETU_BASE_URL` | SETU API base URL | `https://dg-sandbox.setu.co` |
| `SETU_CLIENT_ID` | SETU client ID | Required |
| `SETU_CLIENT_SECRET` | SETU client secret | Required |
| `SETU_PRODUCT_INSTANCE_ID` | SETU product instance ID | Required |
| `SETU_REDIRECT_URL` | Redirect URL after DigiLocker auth | Required |
| `SETU_WEBHOOK_SECRET` | Webhook signature secret | Required |

## SETU API Integration

This service integrates with SETU DigiLocker API v2. You need to:

1. Sign up for SETU account
2. Create a DigiLocker product instance
3. Get your credentials (client ID, client secret, product instance ID)
4. Configure webhook URL in SETU dashboard
5. Update environment variables

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure MongoDB with replica sets
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)
6. Enable MongoDB authentication
7. Set up monitoring and logging
8. Configure firewall rules
9. Use environment-specific SETU credentials

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string format
- Verify network access

### SETU API Errors
- Verify credentials are correct
- Check if you're using correct environment (sandbox/production)
- Ensure webhook URL is accessible
- Verify webhook secret matches

### JWT Errors
- Check if token is expired
- Verify JWT_SECRET is set correctly
- Ensure Authorization header format: `Bearer <token>`

## License

MIT

## Support

For issues and questions, please open an issue on the repository or contact the development team.

## Contributors

- Your Name

---

Built with ❤️ using Node.js, Express, TypeScript, and MongoDB
