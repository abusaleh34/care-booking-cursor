# CARE SERVICES PLATFORM - TESTING FIXES DOCUMENTATION

## 🛠️ Issues Fixed

### 1. **Port Management**
- **Issue**: Port 3000 conflicts when multiple instances try to run
- **Fix**: Created `scripts/cleanup-port.sh` to kill processes on port 3000
- **Usage**: Run automatically with `./scripts/start-dev.sh`

### 2. **Phone Number Validation**
- **Issue**: `@IsPhoneNumber(null)` validation was failing
- **Fix**: Changed to regex validation for E.164 format: `/^\+?[1-9]\d{1,14}$/`
- **File**: `src/auth/dto/register.dto.ts`

### 3. **Express Slow Down Warning**
- **Issue**: DelayMs configuration warning in console
- **Fix**: Updated to use function format with validation disabled
- **File**: `src/main.ts` (line 168)

### 4. **JWT Token Duration**
- **Issue**: Tokens expired in 15 minutes, inconvenient for testing
- **Fix**: Extended to 24 hours for development
- **File**: `.env` - Set `JWT_EXPIRES_IN=24h`

### 5. **Customer Availability Endpoint**
- **Issue**: 500 error due to incorrect `Between` usage with enums
- **Fix**: Changed to `In([...statuses])` operator
- **File**: `src/customer/services/booking.service.ts` (line 209)

### 6. **User Profiles Missing**
- **Issue**: Seed script didn't create user profiles, causing login errors
- **Fix**: Updated seed script to create profiles for all users
- **Files**: `scripts/seed-test-data.ts`

### 7. **Logging Configuration**
- **Issue**: No file logging for debugging
- **Fix**: Added Winston logger with daily rotate files
- **Files**: 
  - `src/common/logger/winston.config.ts` (new)
  - `src/app.module.ts` (updated)
  - Created `logs/` directory

## 📝 New Scripts

### 1. **start-dev.sh**
Complete startup script that:
- Cleans port conflicts
- Checks database/Redis
- Runs migrations
- Seeds data (with --seed flag)
- Creates logs directory
- Starts application

Usage:
```bash
./scripts/start-dev.sh        # Start without seeding
./scripts/start-dev.sh --seed # Start with fresh seed data
```

### 2. **cleanup-port.sh**
Port cleanup utility:
```bash
./scripts/cleanup-port.sh      # Clean port 3000
./scripts/cleanup-port.sh 4000 # Clean specific port
```

### 3. **test-api.sh**
Comprehensive API testing script:
```bash
./scripts/test-api.sh
```

## 🧪 Testing Workflow

### Quick Start
```bash
# One command to start everything
./scripts/start-dev.sh --seed
```

### Test Authentication
```bash
# Register new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+12345678901"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer1@test.com","password":"Customer@123"}' | jq
```

### Test Availability
```bash
# Get provider availability
curl -X GET "http://localhost:3000/api/v1/customer/availability?providerId=<ID>&serviceId=<ID>&date=2025-06-25" | jq
```

## 📊 Logs

Application logs are now written to:
- `logs/app-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

Logs rotate daily and are kept for 14 days.

## ✅ Verification Checklist

After applying fixes:
- [ ] Application starts without port conflicts
- [ ] No express-slow-down warnings in console
- [ ] Registration accepts phone numbers like "+12345678901"
- [ ] Login works for all test users (admin, provider, customer)
- [ ] JWT tokens last 24 hours
- [ ] Customer availability endpoint returns data
- [ ] Logs are written to files
- [ ] Booking creation works

## 🔧 Environment Variables

Updated `.env` for testing:
```env
# Extended for testing
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# Add for production
# JWT_EXPIRES_IN=15m
# JWT_REFRESH_EXPIRES_IN=7d
```

## 📚 API Documentation

Access Swagger documentation:
```
http://localhost:3000/api/docs
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
./scripts/cleanup-port.sh
```

### Database Connection Failed
```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432

# Check Redis
redis-cli ping
```

### Seed Data Issues
```bash
# Clear and reseed
npm run seed
```

### Login Returns 500 Error
This usually means user profiles are missing. Run:
```bash
npm run seed
```