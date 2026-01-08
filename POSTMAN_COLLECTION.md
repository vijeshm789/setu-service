# Postman Collection Guide

## Quick Start

1. Import this collection into Postman
2. Set up environment variables
3. Start with Authentication endpoints
4. Use the token for KYC endpoints

## Environment Variables

Create a Postman environment with these variables:

```
base_url: http://localhost:3000/api
token: (will be set automatically after login)
kycId: (will be set automatically after KYC initiation)
```

## API Request Examples

### 1. Health Check

```
GET {{base_url}}/health
```

### 2. Register User

```
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "phoneNumber": "9876543210"
}
```

**Save the token from response to environment variable**

### 3. Login

```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.token).to.exist;
    pm.environment.set("token", jsonData.data.token);
});
```

### 4. Get Profile

```
GET {{base_url}}/auth/profile
Authorization: Bearer {{token}}
```

### 5. Initiate KYC

```
POST {{base_url}}/kyc/initiate
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "documents": ["AADHAAR", "PAN"]
}
```

**Tests Script:**
```javascript
pm.test("KYC initiated successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.environment.set("kycId", jsonData.data.kycId);
});
```

### 6. Get All KYC Verifications

```
GET {{base_url}}/kyc
Authorization: Bearer {{token}}
```

### 7. Get KYC by ID

```
GET {{base_url}}/kyc/{{kycId}}
Authorization: Bearer {{token}}
```

### 8. Refresh KYC Status

```
PUT {{base_url}}/kyc/{{kycId}}/refresh
Authorization: Bearer {{token}}
```

### 9. Fetch Specific Document

```
POST {{base_url}}/kyc/{{kycId}}/document
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "documentType": "AADHAAR"
}
```

## Test Scenarios

### Complete KYC Flow

1. Register a new user
2. Login to get token
3. Initiate KYC with document types
4. Open the DigiLocker URL in browser
5. Complete authentication
6. Wait for webhook or refresh status
7. Fetch specific documents
8. View all KYC verifications

## Common Response Codes

- 200: Success
- 201: Created
- 400: Bad Request (check request body)
- 401: Unauthorized (check token)
- 404: Not Found
- 409: Conflict (duplicate entry)
- 429: Rate Limit Exceeded
- 500: Server Error

## Tips

1. Always set the token after login
2. Save kycId from initiate KYC response
3. Use Pre-request Scripts to automate token refresh
4. Check Console for detailed error messages
5. Enable "SSL certificate verification" off for local development

## Pre-request Script (Optional)

Add this to collection-level pre-request scripts for automatic token handling:

```javascript
// Check if token exists and is not expired
const token = pm.environment.get("token");
if (!token) {
    console.log("No token found. Please login first.");
}
```

## Webhook Testing

For local webhook testing, use ngrok:

```bash
ngrok http 3000
```

Update SETU webhook URL with ngrok URL:
```
https://your-ngrok-url.ngrok.io/api/kyc/webhook
```
