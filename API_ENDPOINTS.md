# Care Services Platform - API Endpoints Documentation

## Base URL
- Development: `http://localhost:3000/api/v1`
- API Documentation: `http://localhost:3000/api/docs` (Swagger UI)

## Important Note
The API documentation is available at `/api/docs` NOT `/api-docs`

## Customer API Endpoints

### Service Discovery (Public Endpoints)

#### Get Service Categories
- **GET** `/api/v1/customer/categories`
- Public endpoint - no authentication required
- Returns all active service categories

#### Search Service Providers
- **GET** `/api/v1/customer/search`
- Public endpoint - no authentication required
- Query parameters:
  - `query`: Text search
  - `categoryId`: Filter by category
  - `latitude`, `longitude`, `radius`: Location-based search
  - `minRating`: Minimum provider rating
  - `minPrice`, `maxPrice`: Price range
  - `isHomeService`: Filter home service providers
  - `verifiedOnly`: Only verified providers
  - `sortBy`: rating|reviews|price|newest|distance
  - `sortOrder`: asc|desc
  - `limit`, `offset`: Pagination

#### Get Provider Details
- **GET** `/api/v1/customer/providers/:providerId`
- Public endpoint - no authentication required
- Returns detailed information about a specific provider

#### Check Provider Availability
- **GET** `/api/v1/customer/availability`
- Public endpoint - no authentication required
- Query parameters:
  - `providerId`: Provider ID
  - `serviceId`: Service ID
  - `date`: Date to check availability

### Booking Management (Authenticated - Customer Role)

#### Create Booking
- **POST** `/api/v1/customer/bookings`
- Requires authentication
- Body: CreateBookingDto

#### Get User Bookings
- **GET** `/api/v1/customer/bookings`
- Requires authentication
- Returns all bookings for the authenticated customer

#### Get Booking Details
- **GET** `/api/v1/customer/bookings/:bookingId`
- Requires authentication

#### Reschedule Booking
- **PUT** `/api/v1/customer/bookings/:bookingId/reschedule`
- Requires authentication

#### Cancel Booking
- **DELETE** `/api/v1/customer/bookings/:bookingId`
- Requires authentication

### Customer Profile

#### Get Customer Profile
- **GET** `/api/v1/customer/profile`
- Requires authentication

### Payment Processing

#### Process Payment
- **POST** `/api/v1/customer/payments/process`
- Requires authentication

#### Confirm Payment
- **POST** `/api/v1/customer/payments/:paymentIntentId/confirm`
- Requires authentication

#### Process Refund
- **POST** `/api/v1/customer/payments/refund`
- Requires authentication

#### Stripe Webhook
- **POST** `/api/v1/customer/payments/webhook`
- Public endpoint for Stripe webhooks

### Additional Features

#### Get Recommendations
- **GET** `/api/v1/customer/recommendations`
- Requires authentication
- Returns top-rated providers near the user

#### Get Search Suggestions
- **GET** `/api/v1/customer/suggestions`
- Public endpoint
- Query parameter: `q` (search query)

## Provider API Endpoints

All provider endpoints require authentication and SERVICE_PROVIDER role.

### Dashboard

#### Get Dashboard Overview
- **GET** `/api/v1/provider/dashboard`

#### Get Analytics
- **GET** `/api/v1/provider/analytics`

#### Get Earnings
- **GET** `/api/v1/provider/earnings`

### Business Profile

#### Get Business Profile
- **GET** `/api/v1/provider/profile`

#### Update Business Profile
- **PUT** `/api/v1/provider/profile`

### Service Management

#### Get Provider Services
- **GET** `/api/v1/provider/services`

#### Create New Service
- **POST** `/api/v1/provider/services`

#### Update Service
- **PUT** `/api/v1/provider/services/:serviceId`

#### Delete Service
- **DELETE** `/api/v1/provider/services/:serviceId`

#### Get Service Performance
- **GET** `/api/v1/provider/services/performance`

### Availability Management

#### Get Availability
- **GET** `/api/v1/provider/availability`

#### Set Availability
- **PUT** `/api/v1/provider/availability`

#### Get Blocked Times
- **GET** `/api/v1/provider/blocked-times`

#### Block Time
- **POST** `/api/v1/provider/blocked-times`

#### Unblock Time
- **DELETE** `/api/v1/provider/blocked-times/:blockedTimeId`

### Booking Management

#### Get All Bookings
- **GET** `/api/v1/provider/bookings`
- Query parameters: status, startDate, endDate, page, limit

#### Get Today's Bookings
- **GET** `/api/v1/provider/bookings/today`

#### Get Upcoming Bookings
- **GET** `/api/v1/provider/bookings/upcoming`

#### Get Booking Details
- **GET** `/api/v1/provider/bookings/:bookingId`

#### Handle Booking Action
- **POST** `/api/v1/provider/bookings/:bookingId/action`
- Actions: accept, decline, complete

#### Start Service
- **POST** `/api/v1/provider/bookings/:bookingId/start`

#### Request Reschedule
- **POST** `/api/v1/provider/bookings/reschedule`

#### Get Calendar View
- **GET** `/api/v1/provider/calendar`

### Messaging

#### Get Conversations
- **GET** `/api/v1/provider/conversations`

#### Create Conversation
- **POST** `/api/v1/provider/conversations`

#### Get Conversation Details
- **GET** `/api/v1/provider/conversations/:conversationId`

#### Get Messages
- **GET** `/api/v1/provider/conversations/:conversationId/messages`

#### Send Message
- **POST** `/api/v1/provider/conversations/:conversationId/messages`

#### Mark Messages as Read
- **PUT** `/api/v1/provider/conversations/:conversationId/read`

#### Get Conversation Stats
- **GET** `/api/v1/provider/conversations/stats`

#### Search Conversations
- **GET** `/api/v1/provider/conversations/search`

### Portfolio Management

#### Upload Portfolio Image
- **POST** `/api/v1/provider/portfolio/images`

#### Delete Portfolio Image
- **DELETE** `/api/v1/provider/portfolio/images`

## Authentication Endpoints

### Register
- **POST** `/api/v1/auth/register`

### Login
- **POST** `/api/v1/auth/login`

### Logout
- **POST** `/api/v1/auth/logout`

### Refresh Token
- **POST** `/api/v1/auth/refresh`

### Mock Authentication (Development Only)
- **POST** `/api/v1/mock-auth/login`

## System Endpoints

### Health Check
- **GET** `/health`
- Returns system health status

### Metrics (Prometheus)
- **GET** `/metrics`
- Available when PROMETHEUS_ENABLED=true

## Customer Journey - Correct Flow

1. **Browse Services**: Use `/api/v1/customer/categories` to get categories, then `/api/v1/customer/search` to find providers
2. **View Provider Details**: Use `/api/v1/customer/providers/:providerId` for specific provider info
3. **Check Availability**: Use `/api/v1/customer/availability` to check available time slots
4. **Create Booking**: Use `/api/v1/customer/bookings` to create a booking
5. **Process Payment**: Use `/api/v1/customer/payments/process` to pay for the booking
6. **Track Booking**: Use `/api/v1/customer/bookings` to view booking status

## Why `/api/v1/services` Returns 404

There is no direct `/api/v1/services` endpoint. Services are accessed through:
- `/api/v1/customer/search` - Search for providers and their services
- `/api/v1/customer/providers/:providerId` - Get services offered by a specific provider
- `/api/v1/provider/services` - Provider manages their own services (requires provider authentication)

Services are always associated with providers in this platform architecture.