# Care Services Platform - Production Deployment Guide

## 🚀 PRODUCTION DEPLOYMENT CHECKLIST

### Prerequisites

#### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or higher / CentOS 8+
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14 or higher
- **Redis**: v6.x or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **CPU**: 2 cores minimum (4 cores recommended)

#### Required Services
- [x] PostgreSQL Database Server
- [x] Redis Cache Server
- [x] SMTP Email Service
- [x] Stripe Payment Account
- [x] AWS S3 (or equivalent) for file storage
- [x] SSL Certificate
- [x] Domain Name

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx
```

### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database and user
CREATE DATABASE care_services_production;
CREATE USER care_services_prod WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE care_services_production TO care_services_prod;

# Exit PostgreSQL
\q
```

### Step 3: Application Deployment

```bash
# Clone the repository
git clone https://github.com/your-repo/care-services-backend.git
cd care-services-backend

# Install dependencies
npm ci --only=production

# Copy production environment
cp env.production .env

# Edit environment variables
nano .env
```

### Step 4: Environment Configuration

Edit `.env` file with your production values:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=care_services_prod
DB_PASSWORD=your_actual_secure_password
DB_DATABASE=care_services_production

# JWT Secrets (generate strong secrets)
JWT_SECRET=generate_64_character_random_string_here
JWT_REFRESH_SECRET=generate_another_64_character_random_string_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASS=your_app_specific_password
EMAIL_FROM=noreply@yourcompany.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-production-bucket
```

### Step 5: Build and Database Migration

```bash
# Build the application
npm run build

# Run database migrations
npm run migration:run

# Optimize database with indexes
npm run db:optimize

# Seed initial data (if needed)
npm run seed:production
```

### Step 6: SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt SSL
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 7: Nginx Configuration

Create `/etc/nginx/sites-available/care-services`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css application/xml;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support for real-time features
    location /realtime {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        # ... same proxy settings as above
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/care-services /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: PM2 Process Management

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'care-services-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/care-services/error.log',
    out_file: '/var/log/care-services/out.log',
    log_file: '/var/log/care-services/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 1000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/care-services
sudo chown $USER:$USER /var/log/care-services

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Monitor the application
pm2 monit
```

### Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5432  # PostgreSQL (only if external access needed)
sudo ufw allow 6379  # Redis (only if external access needed)
sudo ufw enable
```

### Step 10: Backup Setup

Create backup script `/home/deploy/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/care-services"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U care_services_prod -h localhost care_services_production | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Redis backup
redis-cli --rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/care-services

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable and add to crontab
chmod +x /home/deploy/backup.sh
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/deploy/backup.sh
```

---

## 🔒 SECURITY CONFIGURATION

### 1. Database Security

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Set listen_addresses = 'localhost'
# Enable SSL: ssl = on

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ensure only localhost connections allowed
```

### 2. Redis Security

```bash
sudo nano /etc/redis/redis.conf

# Set strong password
requirepass your_very_strong_redis_password

# Bind to localhost only
bind 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""
```

### 3. Application Security

All security features are built into the application:
- ✅ Helmet.js security headers
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ JWT token security
- ✅ Password hashing (bcrypt)

---

## 📊 MONITORING SETUP

### 1. Health Checks

The application includes built-in health checks at:
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed system status

### 2. Log Monitoring

```bash
# View application logs
pm2 logs care-services-api

# View system logs
sudo journalctl -u nginx
sudo journalctl -u postgresql
sudo journalctl -u redis
```

### 3. Performance Monitoring

The application includes:
- Prometheus metrics endpoint: `/api/v1/metrics`
- Performance monitoring service
- Cache optimization tracking
- Database query performance monitoring

---

## 🧪 TESTING IN PRODUCTION

### 1. Health Check Tests

```bash
# Test basic connectivity
curl https://yourdomain.com/api/v1/health

# Test WebSocket connection
curl -H "Upgrade: websocket" -H "Connection: Upgrade" https://yourdomain.com/realtime

# Test API endpoints
curl -X POST https://yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

### 2. Load Testing

```bash
# Install Artillery globally
npm install -g artillery

# Run load tests
artillery run test/load/load-test.yml
```

### 3. Performance Validation

Check the following metrics:
- [ ] API response times < 200ms (P95)
- [ ] Database query times < 100ms
- [ ] Cache hit rate > 80%
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%

---

## 🔧 TROUBLESHOOTING

### Common Issues

1. **Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U care_services_prod -h localhost -d care_services_production
```

2. **Redis Connection Failed**
```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping
```

3. **Application Won't Start**
```bash
# Check PM2 logs
pm2 logs care-services-api

# Check environment variables
cat .env | grep -v PASSWORD
```

4. **SSL Certificate Issues**
```bash
# Renew certificate
sudo certbot renew

# Test SSL
curl -I https://yourdomain.com
```

### Performance Issues

1. **High Memory Usage**
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart care-services-api
```

2. **Database Slow Queries**
```bash
# Enable query logging
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set log_min_duration_statement = 1000

# Check slow queries
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

3. **Cache Issues**
```bash
# Check Redis memory
redis-cli info memory

# Clear cache if needed
redis-cli flushdb
```

---

## 📈 SUCCESS CRITERIA

Your production deployment is successful when:

- [x] Application starts without errors
- [x] Database connections are working
- [x] Redis cache is functioning
- [x] SSL certificate is valid
- [x] All API endpoints respond correctly
- [x] WebSocket connections work
- [x] Payment processing works with test transactions
- [x] Email notifications are being sent
- [x] SMS notifications are working (if configured)
- [x] File uploads work correctly
- [x] Performance metrics meet targets
- [x] Monitoring and logging are active
- [x] Backup system is working

## 🎉 DEPLOYMENT COMPLETE!

Your Care Services Platform is now live and ready for production use!

### Next Steps:
1. Set up monitoring dashboards
2. Configure alerting for critical issues
3. Create user documentation
4. Perform user acceptance testing
5. Launch marketing campaigns

### Support:
- Monitor application logs regularly
- Review performance metrics weekly
- Update dependencies monthly
- Review security settings quarterly

**Platform Status: ✅ PRODUCTION READY** 