# 🧪 PHASE 2 TESTING GUIDE

## Prerequisites

### 1. Database Setup
Make sure PostgreSQL is running and the database exists:
```bash
# Start PostgreSQL (if not running)
brew services start postgresql  # macOS
# or
sudo service postgresql start  # Ubuntu

# Create database (if it doesn't exist)
createdb care_services
```

### 2. Redis Setup (Optional for caching tests)
```bash
# Install Redis
brew install redis  # macOS
# or
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server
```

### 3. Environment Setup
The `.env` file is already configured with test values. For real Stripe testing, you'll need to:
1. Sign up for a Stripe account
2. Get your test API keys from the dashboard
3. Replace the dummy Stripe keys in `.env`

---

## 🚀 STARTING THE APPLICATION

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application
```bash
npm run start:dev
```

**Expected Output:**
```
[Nest] LOG [InstanceLoader] ... dependencies initialized
[Nest] LOG [RoutesResolver] CustomerController {/api/v1/customer}
[Nest] LOG [RoutesResolver] AdminController {/api/v1/admin}
[Nest] LOG [NestApplication] Nest application successfully started
Application is running on: http://localhost:3000/api/v1
```

### Step 3: Verify Application is Running
```bash
curl http://localhost:3000
```

---

## 🧪 TESTING FEATURES

### 1. Test Admin Dashboard (Pre-existing Feature)
**URL**: http://localhost:3000/admin

**What to test:**
- Admin login with `admin@careservices.com` / `admin123`
- View and manage service categories
- View and manage service providers
- View and manage user accounts

**Expected Result**: Fully functional admin interface

### 2. Test Service Discovery API

#### Search Providers
```bash
curl "http://localhost:3000/api/v1/customer/search?query=massage&latitude=40.7128&longitude=-74.0060"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "providers": [...],
    "total": 4,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

#### Get Categories (With Caching)
```bash
# First request - hits database
curl "http://localhost:3000/api/v1/customer/categories"

# Second request - should hit cache (check logs for "Cache hit")
curl "http://localhost:3000/api/v1/customer/categories"
```

#### Get Provider Details
```bash
curl "http://localhost:3000/api/v1/customer/providers/76e59e97-d16a-4f87-811f-99cddc99b608"
```

### 3. Test Availability System

#### Check Availability (With Caching)
```bash
# Replace with actual provider and service IDs from your database
curl "http://localhost:3000/api/v1/customer/availability?providerId=76e59e97-d16a-4f87-811f-99cddc99b608&serviceId=f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f&date=2024-01-15"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "startTime": "09:00",
      "endTime": "09:30",
      "available": true
    },
    {
      "startTime": "09:30",
      "endTime": "10:00",
      "available": true
    }
    // ... more time slots
  ]
}
```

### 4. Test Authentication System

#### Create Customer Account
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "Customer",
    "phone": "+1234567890"
  }'
```

#### Login and Get JWT Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "Test123!@#"
  }'
```

**Save the JWT token** from the response for authenticated requests.

### 5. Test Booking System

#### Create a Booking
```bash
# Replace JWT_TOKEN with your actual token
curl -X POST http://localhost:3000/api/v1/customer/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "providerId": "76e59e97-d16a-4f87-811f-99cddc99b608",
    "serviceId": "f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f",
    "bookingDate": "2024-01-15",
    "startTime": "10:00",
    "notes": "Test booking"
  }'
```

#### Test Conflict Prevention
```bash
# Try to book the same slot immediately after
curl -X POST http://localhost:3000/api/v1/customer/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "providerId": "76e59e97-d16a-4f87-811f-99cddc99b608",
    "serviceId": "f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f",
    "bookingDate": "2024-01-15",
    "startTime": "10:00",
    "notes": "Conflicting booking"
  }'
```

**Expected Result**: Second request should return a conflict error.

#### Get User Bookings
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  http://localhost:3000/api/v1/customer/bookings
```

### 6. Test Payment System (With Dummy Keys)

#### Process Payment
```bash
# This will fail with dummy keys, but tests the endpoint structure
curl -X POST http://localhost:3000/api/v1/customer/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "bookingId": "BOOKING_ID_FROM_PREVIOUS_STEP",
    "paymentMethodId": "pm_card_visa",
    "tipAmount": 5.00
  }'
```

**Expected Result**: Error about invalid Stripe key (expected with dummy keys)

### 7. Test WebSocket Real-time Updates

#### Using Browser Console
Open http://localhost:3000 and in the browser console:

```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000/realtime', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Subscribe to provider availability
socket.emit('subscribe-provider-availability', {
  providerId: '76e59e97-d16a-4f87-811f-99cddc99b608',
  date: '2024-01-15'
});

// Listen for availability updates
socket.on('availability-updated', (data) => {
  console.log('Availability updated:', data);
});
```

#### Using Node.js Client
```bash
npm install socket.io-client
```

```javascript
// test-websocket.js
const io = require('socket.io-client');

const socket = io('ws://localhost:3000/realtime', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.emit('subscribe-provider-availability', {
  providerId: '76e59e97-d16a-4f87-811f-99cddc99b608',
  date: '2024-01-15'
});

socket.on('availability-updated', (data) => {
  console.log('Availability updated:', data);
});
```

### 8. Test Rate Limiting

#### Test Search Rate Limiting
```bash
# Make multiple rapid requests to trigger rate limiting
for i in {1..60}; do
  curl -s "http://localhost:3000/api/v1/customer/search?query=test" > /dev/null
  echo "Request $i completed"
done
```

**Expected Result**: After 50 requests per minute, you should get rate limit errors.

---

## 🔍 TESTING REDIS CACHING

### Monitor Cache Performance
```bash
# Start Redis CLI to monitor cache operations
redis-cli monitor
```

### Test Cache Hits
1. Make a search request
2. Make the same search request again
3. Check application logs for "Cache hit" messages
4. Check Redis monitor for GET/SET operations

---

## 📊 PERFORMANCE TESTING

### Before Cache (First Request)
```bash
time curl -s "http://localhost:3000/api/v1/customer/search?query=massage" > /dev/null
```

### After Cache (Second Request)
```bash
time curl -s "http://localhost:3000/api/v1/customer/search?query=massage" > /dev/null
```

**Expected Result**: Second request should be significantly faster.

---

## 🚨 TESTING ERROR HANDLING

### Test Invalid Booking Date
```bash
curl -X POST http://localhost:3000/api/v1/customer/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "providerId": "76e59e97-d16a-4f87-811f-99cddc99b608",
    "serviceId": "f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f",
    "bookingDate": "2020-01-15",
    "startTime": "10:00"
  }'
```

**Expected Result**: Error about booking date being in the past.

### Test Invalid Time Format
```bash
curl -X POST http://localhost:3000/api/v1/customer/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "providerId": "76e59e97-d16a-4f87-811f-99cddc99b608",
    "serviceId": "f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f",
    "bookingDate": "2024-01-15",
    "startTime": "25:00"
  }'
```

**Expected Result**: Validation error about invalid time format.

---

## ✅ SUCCESS CRITERIA

### Phase 2 is working correctly if:

1. **Service Discovery**: Search returns results with caching
2. **Booking Engine**: Can create bookings, check availability, prevent conflicts
3. **Real-time Updates**: WebSocket connections work and send live updates
4. **Caching**: Second requests are faster (check logs for cache hits)
5. **Payment Structure**: Payment endpoints exist and validate properly
6. **Error Handling**: Invalid requests return appropriate error messages
7. **Rate Limiting**: Too many requests trigger rate limiting
8. **Admin Dashboard**: Can manage all resources

---

## 🔧 TROUBLESHOOTING

### Application Won't Start
- Check `.env` file exists and has required variables
- Ensure PostgreSQL is running
- Check for port conflicts (another app using port 3000)

### Database Errors
- Verify PostgreSQL connection settings in `.env`
- Ensure database `care_services` exists
- Check if seed data was loaded

### Cache Not Working
- Redis doesn't need to be running for the app to start
- Cache will fallback to memory if Redis is unavailable
- Check logs for cache hit/miss messages

### WebSocket Connection Issues
- Ensure valid JWT token
- Check browser console for WebSocket errors
- Verify WebSocket namespace `/realtime`

---

## 🎯 NEXT STEPS

1. **Replace Dummy Stripe Keys**: Get real Stripe test keys for payment testing
2. **Set Up Redis**: For production-level caching performance
3. **Load Test**: Use tools like Apache Bench or Artillery for stress testing
4. **Monitor Performance**: Set up logging and monitoring for production

**🎉 You now have a fully functional Phase 2 Care Services Platform!** 