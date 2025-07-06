# Care Services Platform

A comprehensive marketplace platform connecting care service providers with customers. Built with NestJS, TypeORM, PostgreSQL, and modern cloud-native technologies.

## 🚀 Features

- **Multi-role Authentication**: Secure JWT-based authentication with role-based access control (Customer, Provider, Admin)
- **Service Marketplace**: Browse, search, and book various care services
- **Provider Management**: Service provider profiles, availability management, and verification
- **Booking System**: Real-time booking with scheduling, payments, and notifications
- **Admin Dashboard**: Comprehensive administrative tools for platform management
- **Real-time Updates**: WebSocket-based notifications and updates
- **Payment Integration**: Secure payment processing with Stripe
- **Email & SMS**: Automated notifications via email and SMS

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## 🏗️ Architecture Overview

```
care-services-platform/
├── src/
│   ├── admin/          # Administrative module
│   ├── auth/           # Authentication & authorization
│   ├── booking/        # Booking management
│   ├── common/         # Shared utilities & services
│   ├── customer/       # Customer module
│   ├── database/       # Database entities & migrations
│   ├── provider/       # Service provider module
│   └── websocket/      # Real-time communication
├── test/               # E2E tests
├── scripts/            # Utility scripts
├── public/             # Static files
└── docker/             # Docker configurations
```

### Technology Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Queue**: RabbitMQ/Bull
- **Storage**: MinIO (S3-compatible)
- **Email**: Nodemailer with SMTP
- **Monitoring**: Sentry, Prometheus, New Relic
- **Documentation**: Swagger/OpenAPI

## 📦 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/care-services-platform.git
   cd care-services-platform
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the services**
   - API: http://localhost:3000
   - API Documentation: http://localhost:3000/api/docs
   - pgAdmin: http://localhost:5050
   - Mailhog: http://localhost:8025
   - RabbitMQ Management: http://localhost:15672

## 💻 Development Setup

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up the database**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis

   # Run migrations
   npm run migration:run
   ```

3. **Seed the database (optional)**
   ```bash
   npm run seed:customer
   npm run seed:performance
   ```

4. **Start the development server**
   ```bash
   npm run start:dev
   ```

### Database Management

```bash
# Generate a new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Optimize database
npm run db:optimize
```

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- auth.e2e-spec.ts
```

### Load Testing
```bash
# Run load tests
npm run test:load

# Security testing
npm run test:security
```

### Test Coverage Requirements
- Unit Tests: 90% coverage minimum
- Critical paths must have E2E tests
- All API endpoints must be tested

## 📚 API Documentation

### Swagger/OpenAPI

API documentation is automatically generated and available at:
- Development: http://localhost:3000/api/docs
- Production: https://api.careservices.com/api/docs

### Authentication

All API requests require authentication except public endpoints. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Example API Calls

**Register a new user**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

## 🚀 Deployment

### Docker Deployment

1. **Build the production image**
   ```bash
   docker build -t care-services:latest .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Kubernetes Deployment

1. **Apply Kubernetes manifests**
   ```bash
   kubectl apply -f k8s/
   ```

2. **Check deployment status**
   ```bash
   kubectl get pods -n care-services
   ```

### CI/CD Pipeline

The project includes GitHub Actions workflows for:
- Automated testing on pull requests
- Building and pushing Docker images
- Deploying to staging/production environments

## 🔧 Environment Variables

Key environment variables (see `.env.example` for full list):

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Application port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `STRIPE_SECRET_KEY` | Stripe API key | - |

## 🛡️ Security

- All passwords are hashed using bcrypt
- JWT tokens expire after 1 hour
- Rate limiting enabled on all endpoints
- SQL injection protection via TypeORM
- XSS protection with helmet
- CORS configured for specific origins
- Input validation on all endpoints

## 📊 Monitoring

- **Health Check**: GET `/health`
- **Metrics**: GET `/metrics` (Prometheus format)
- **Logging**: Winston with daily rotation
- **Error Tracking**: Sentry integration
- **APM**: New Relic support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write unit tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs.careservices.com](https://docs.careservices.com)
- Issues: [GitHub Issues](https://github.com/your-org/care-services-platform/issues)
- Email: support@careservices.com

---

Built with ❤️ by the Care Services Team 