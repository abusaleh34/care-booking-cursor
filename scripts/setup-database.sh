#!/bin/bash

# Database setup script for Care Services Platform

echo "🔧 Setting up PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql"
    exit 1
fi

# Get current user
CURRENT_USER=$(whoami)

echo "📋 Current system user: $CURRENT_USER"

# Create database and user
echo "Creating database and user..."

# Create the postgres user if it doesn't exist (for macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS, setting up PostgreSQL..."
    
    # Start PostgreSQL if not running
    brew services start postgresql 2>/dev/null || true
    
    # Create database with current user as superuser
    createdb -U $CURRENT_USER care_services_db 2>/dev/null || echo "Database might already exist"
    
    # Create postgres role
    psql -U $CURRENT_USER -d postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres123';" 2>/dev/null || echo "Role postgres might already exist"
    
    # Grant permissions
    psql -U $CURRENT_USER -d care_services_db -c "GRANT ALL PRIVILEGES ON DATABASE care_services_db TO postgres;" 2>/dev/null || true
else
    # Linux setup
    sudo -u postgres createdb care_services_db 2>/dev/null || echo "Database might already exist"
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres123';" 2>/dev/null || true
fi

echo "✅ Database setup complete!"

# Update .env file
echo ""
echo "📝 Updating .env file..."

cat > .env << EOL
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=${CURRENT_USER}
DATABASE_PASSWORD=
DATABASE_NAME=care_services_db

# Alternative connection (if using postgres user)
# DATABASE_USER=postgres
# DATABASE_PASSWORD=postgres123

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
EOL

echo "✅ Environment file created!"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npm run migration:run || echo "⚠️  Migrations might have issues, check the error above"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Start Redis: redis-server"
echo "2. Run the application: npm run start:dev"
echo "3. Seed test data: npm run seed:full"
echo ""
echo "📋 Database connection info:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: care_services_db"
echo "   User: $CURRENT_USER (no password)"
echo "   Alternative User: postgres (password: postgres123)"