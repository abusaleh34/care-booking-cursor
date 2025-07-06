# CARE SERVICES PLATFORM - PERSONAL TESTING GUIDE

## 🚀 SETUP INSTRUCTIONS

### 1. LOCAL ENVIRONMENT SETUP

#### Required Dependencies
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Redis**: v6.0 or higher
- **Docker & Docker Compose**: (Optional but recommended)

#### Installation Commands

**Option A: Using Docker (Recommended)**
```bash
# Clone the repository
git clone [repository-url]
cd care-services-cursor

# Copy environment files
cp .env.example .env
cp .env.production .env.local

# Start all services with Docker
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
sleep 30

# Run database migrations
docker-compose exec app npm run migration:run

# Seed the database with test data
docker-compose exec app npm run seed
```

**Option B: Manual Installation**
```bash
# Install Node.js dependencies
npm install

# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Install Redis (macOS)
brew install redis
brew services start redis

# Create database
createdb care_services_db

# Run database migrations
npm run migration:run

# Seed test data
npm run seed
```

#### Environment Variables Configuration
Create `.env` file with these values:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=care_services_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=test_jwt_secret_key_12345
JWT_REFRESH_SECRET=test_refresh_secret_key_67890

# Application
PORT=3000
NODE_ENV=development

# Email (using Ethereal for testing)
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_USER=test@ethereal.email
MAIL_PASS=testpassword
MAIL_FROM=noreply@careservices.test

# SMS (Twilio Test Credentials)
TWILIO_ACCOUNT_SID=ACtest1234567890
TWILIO_AUTH_TOKEN=test_auth_token
TWILIO_PHONE_NUMBER=+15005550006

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
STRIPE_WEBHOOK_SECRET=whsec_test123456789

# MinIO (Local S3)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=care-services

# Frontend URLs
FRONTEND_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
```

#### Starting All Services

**1. Start Backend Services:**
```bash
# Terminal 1: Start PostgreSQL
postgres -D /usr/local/var/postgres

# Terminal 2: Start Redis
redis-server

# Terminal 3: Start MinIO (Optional)
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Terminal 4: Start NestJS Backend
npm run start:dev
```

**2. Start Frontend Services:**
```bash
# Terminal 5: Start Login Page
cd login-page
npm install
npm start

# The main backend serves the customer and provider interfaces
```

### 2. TEST DATA SEEDING

Run the comprehensive seeding script:
```bash
npm run seed:full
```

This creates:
- 1 Admin user
- 10 Service providers (verified)
- 20 Customers
- 6 Service categories
- 50+ Services
- Sample bookings and reviews

### 3. ACCESS CREDENTIALS

#### Admin User
- **Email**: admin@careservices.test
- **Password**: Admin@123456
- **Access**: Full platform administration

#### Test Service Provider
- **Email**: provider1@test.com
- **Password**: Provider@123
- **Business**: "Serenity Spa & Wellness"

#### Test Customer
- **Email**: customer1@test.com
- **Password**: Customer@123
- **Name**: John Smith

---

## 🧪 TESTING SCENARIOS

### A. CUSTOMER JOURNEY TEST

**1. Customer Registration**
```
1. Navigate to http://localhost:3000/register
2. Fill in:
   - Name: Jane Doe
   - Email: jane.doe@test.com
   - Password: Test@12345
   - Phone: +1234567890
3. Click "Register"
4. Check email for verification code (console logs in dev mode)
5. Enter verification code
```

**2. Browse Services**
```
1. Login at http://localhost:3000/login
2. Navigate to "Find Services"
3. Use filters:
   - Location: Enter "San Francisco" or use geolocation
   - Category: Select "Beauty & Wellness"
   - Price Range: $50-$200
4. View search results with provider ratings
```

**3. Book Appointment**
```
1. Click on "Serenity Spa & Wellness"
2. Select "Swedish Massage - 60 min" ($120)
3. Click "Check Availability"
4. Select tomorrow's date and 2:00 PM slot
5. Click "Book Now"
6. Review booking details
7. Enter payment info:
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVC: 123
8. Confirm booking
```

**Note: Important Booking API Changes**
- Use `bookingDate` instead of `date`
- Use `startTime` instead of `time`
- Example:
```json
{
  "providerId": "5d7ee339-100e-4913-aec8-b7a3e08ab22e",
  "serviceId": "702e6a4c-8f9f-463f-856d-e8ff7b4e6d67",
  "bookingDate": "2025-07-15",
  "startTime": "14:00",
  "notes": "First time customer"
}
```

**4. Messaging**
```
1. Go to "My Bookings"
2. Find the recent booking
3. Click "Message Provider"
4. Send: "Hi, looking forward to my appointment!"
5. Watch for real-time response
```

**5. Post-Service Review**
```
1. After appointment time passes
2. Go to "My Bookings" → "Completed"
3. Click "Leave Review"
4. Rate: 5 stars
5. Comment: "Excellent service!"
6. Submit review
```

### B. SERVICE PROVIDER JOURNEY TEST

**1. Provider Registration**
```
1. Navigate to http://localhost:3000/provider/register
2. Fill business details:
   - Business Name: "Healing Hands Therapy"
   - Category: "Massage Therapy"
   - Email: healinghands@test.com
   - Password: Provider@456
3. Upload certifications (use any image)
4. Submit application
```

**2. Profile Setup**
```
1. Login to provider dashboard
2. Complete profile:
   - Add profile photo
   - Business description
   - Operating hours: Mon-Fri 9AM-6PM
   - Service area: 10 mile radius
3. Save profile
```

**3. Add Services**
```
1. Go to "Services" → "Add New"
2. Create service:
   - Name: "Deep Tissue Massage"
   - Duration: 90 minutes
   - Price: $150
   - Description: "Professional deep tissue therapy"
3. Add another service
4. Set availability for each
```

**4. Manage Bookings**
```
1. Wait for booking notification
2. Go to "Bookings" → "Pending"
3. Review booking details
4. Click "Accept Booking"
5. Send welcome message to customer
```

**5. Complete Service**
```
1. On appointment day/time
2. Mark service as "In Progress"
3. After completion, mark "Completed"
4. Request payment release
```

**6. View Earnings**
```
1. Navigate to "Earnings"
2. View transaction history
3. Check pending payouts
4. Request withdrawal (min $50)
```

### C. ADMIN MANAGEMENT TEST

**1. Admin Dashboard**
```
1. Login at http://localhost:3000/admin
2. Use admin credentials above
3. View dashboard metrics:
   - Total users
   - Active bookings
   - Revenue today
   - Pending verifications
```

**2. Provider Verification**
```
1. Go to "Providers" → "Pending Verification"
2. Click on "Healing Hands Therapy"
3. Review submitted documents
4. Check business details
5. Click "Approve" or "Request More Info"
```

**3. Platform Configuration**
```
1. Navigate to "Settings"
2. Adjust:
   - Commission Rate: 10%
   - Cancellation Policy: 24 hours
   - Minimum Booking Amount: $30
3. Save changes
```

**4. Reports Generation**
```
1. Go to "Reports"
2. Select "Monthly Revenue Report"
3. Choose date range
4. Export as CSV/PDF
```

---

## 🔧 TECHNICAL VALIDATION

### D. REAL-TIME FEATURES TEST

**1. WebSocket Messaging**
```bash
# Open two browser windows
# Window 1: Login as customer
# Window 2: Login as provider
# Send messages and verify instant delivery
```

**2. Live Notifications**
```javascript
// Browser Console Test
// Check WebSocket connection
console.log(window.socket.connected);

// Listen for events
window.socket.on('booking-update', (data) => {
  console.log('Booking updated:', data);
});
```

### E. PAYMENT SYSTEM TEST

**Test Cards:**
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

**Commission Verification:**
```sql
-- Check commission calculations
SELECT 
  b.id,
  b.total_amount,
  b.platform_fee,
  b.provider_earnings
FROM bookings b
WHERE b.payment_status = 'completed';
```

### F. MOBILE RESPONSIVENESS TEST

**1. Browser Testing**
```
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on:
   - iPhone 12 Pro
   - iPad
   - Galaxy S21
4. Verify all features work on touch
```

---

## 📊 STRESS TESTING

### G. PERFORMANCE VALIDATION

**1. Load Testing**
```bash
# Run Artillery load test
npm run test:load

# Monitor results
# Target: 100 concurrent users
# Success rate: >95%
# Response time: <500ms
```

**2. Database Performance**
```bash
# Check slow queries
npm run db:analyze

# View query performance
psql -d care_services_db -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## 📋 DELIVERABLES

### API Documentation
Access Swagger UI at: `http://localhost:3000/api-docs`

### Postman Collection
```bash
# Import collection
curl http://localhost:3000/api/postman-collection > care-services-api.json
```

### Log File Locations
- **Application Logs**: `./logs/app.log`
- **Error Logs**: `./logs/error.log`
- **Access Logs**: `./logs/access.log`

### Performance Monitoring
```bash
# Start monitoring dashboard
npm run monitor

# Access at http://localhost:3003
# Metrics include:
# - API response times
# - Database query performance
# - Redis cache hit rates
# - WebSocket connections
```

---

## 🛠️ TROUBLESHOOTING

### Common Issues

**1. Database Connection Error**
```bash
# Check PostgreSQL status
pg_isready

# Reset database
npm run db:reset
npm run migration:run
npm run seed
```

**2. Redis Connection Failed**
```bash
# Check Redis status
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL
```

**3. Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 [PID]
```

**4. Migration Errors**
```bash
# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n FixIssue
```

### Reset for Fresh Testing
```bash
# Complete reset script
npm run test:reset

# This will:
# 1. Drop and recreate database
# 2. Clear Redis cache
# 3. Delete uploaded files
# 4. Run fresh migrations
# 5. Seed new test data
```

---

## ✅ SUCCESS CRITERIA CHECKLIST

- [ ] All services start without errors
- [ ] Can register and login as all user types
- [ ] Search and filtering works correctly
- [ ] Booking flow completes successfully
- [ ] Payments process in test mode
- [ ] Real-time messaging delivers instantly
- [ ] Provider can manage availability
- [ ] Admin can access all controls
- [ ] Mobile interface is fully functional
- [ ] Performance meets targets (<500ms response)

---

## 🎯 QUICK START COMMANDS

```bash
# One-command setup (Docker)
./scripts/quick-start.sh

# One-command setup (Manual)
npm run setup:local

# Start everything
npm run dev:all

# Run all tests
npm run test:all
```

---

## 📞 SUPPORT

For testing issues:
1. Check logs in `./logs/` directory
2. Run diagnostic script: `npm run diagnose`
3. View system health: `http://localhost:3000/health`

## 📡 API TESTING WITH CURL

### Complete Booking Flow Example

```bash
# 1. Login as customer
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer1@test.com", "password": "Customer@123"}' | jq -r .accessToken)

# 2. Search for providers (no auth required)
curl -X GET "http://localhost:3000/api/v1/customer/search" \
  -H "Content-Type: application/json"

# 3. Check availability (no auth required)
curl -X GET "http://localhost:3000/api/v1/customer/availability?providerId=5d7ee339-100e-4913-aec8-b7a3e08ab22e&serviceId=702e6a4c-8f9f-463f-856d-e8ff7b4e6d67&date=2025-07-15" \
  -H "Content-Type: application/json"

# 4. Create booking (auth required)
curl -X POST http://localhost:3000/api/v1/customer/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "providerId": "5d7ee339-100e-4913-aec8-b7a3e08ab22e",
    "serviceId": "702e6a4c-8f9f-463f-856d-e8ff7b4e6d67",
    "bookingDate": "2025-07-15",
    "startTime": "10:00",
    "notes": "First time customer"
  }'

# 5. View my bookings
curl -X GET http://localhost:3000/api/v1/customer/bookings \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### Provider Dashboard Testing

```bash
# 1. Login as provider
PROVIDER_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "provider1@test.com", "password": "Provider@123"}' | jq -r .accessToken)

# 2. Get dashboard data
curl -X GET http://localhost:3000/api/v1/provider/dashboard \
  -H "Authorization: Bearer $PROVIDER_TOKEN"

# 3. View provider bookings
curl -X GET http://localhost:3000/api/v1/provider/bookings \
  -H "Authorization: Bearer $PROVIDER_TOKEN"
```

Happy Testing! 🚀