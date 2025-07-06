# Care Services Platform - Production Deployment Guide

## 🎯 Overview

This guide provides comprehensive instructions for deploying the Care Services Platform to production. The platform is now enterprise-ready with advanced optimization, monitoring, and security features.

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements

#### Minimum Production Requirements
```bash
# Server Specifications
CPU: 2 cores (4 cores recommended)
RAM: 4GB (8GB recommended)
Storage: 50GB SSD (100GB recommended)
Network: 1Gbps connection
OS: Ubuntu 20.04+ or Amazon Linux 2
```

#### Database Requirements
```bash
# PostgreSQL 13+
Connection Pool: 20 connections
Storage: 50GB+ with auto-scaling
Backup: Daily automated backups
High Availability: Multi-AZ deployment
```

#### Cache Requirements
```bash
# Redis 6+
Memory: 2GB+ with persistence
Clustering: Enabled for high availability
Backup: Daily snapshots
```

### Environment Setup

#### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

#### 2. Clone and Setup Application
```bash
# Clone repository
git clone https://github.com/your-org/care-services-platform.git
cd care-services-platform

# Install dependencies
npm ci --production

# Build application
npm run build
```

#### 3. Database Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE care_services_db;
CREATE USER care_services_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE care_services_db TO care_services_user;
\q

# Run migrations
npm run migration:run

# Optimize database
npm run db:optimize
```

## 🔧 Configuration

### Environment Variables
```bash
# Copy and configure environment file
cp env.example .env

# Edit production configuration
nano .env
```

### Critical Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=care_services_user
DATABASE_PASSWORD=your_secure_database_password
DATABASE_NAME=care_services_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password

# Security
JWT_SECRET=your_very_secure_jwt_secret_32_chars_min
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Monitoring
MONITORING_ENABLED=true
PROMETHEUS_ENABLED=true
SENTRY_DSN=your_sentry_dsn_for_error_tracking

# Performance
COMPRESSION_ENABLED=true
RATE_LIMIT_MAX=100
```

### SSL/TLS Setup
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/care-services
upstream app {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001 backup;
}

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
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://app;
        access_log off;
    }

    # Metrics endpoint (restrict access)
    location /metrics {
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        proxy_pass http://app;
    }

    # Static assets
    location /static/ {
        alias /var/www/care-services/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🚀 Deployment Process

### 1. PM2 Ecosystem Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'care-services-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Performance monitoring
      monitoring: true,
      pmx: true,
      
      // Auto-restart configuration
      max_restarts: 5,
      min_uptime: '10s',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ]
};
```

### 2. Deploy Application
```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Enable Nginx
sudo ln -s /etc/nginx/sites-available/care-services /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Verify Deployment
```bash
# Check application status
pm2 status
pm2 logs care-services-api

# Test health endpoint
curl -k https://yourdomain.com/health

# Test API endpoint
curl -k https://yourdomain.com/api/v1/customer/categories

# Check SSL grade
curl -I https://yourdomain.com

# Monitor performance
pm2 monit
```

## 📊 Monitoring Setup

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g @datadog/datadog-ci

# Setup Prometheus monitoring
docker run -d -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Setup Grafana dashboard
docker run -d -p 3001:3000 grafana/grafana
```

### 2. Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/care-services

# Add configuration:
/home/ubuntu/care-services-platform/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    copytruncate
    notifempty
    missingok
}
```

### 3. Health Monitoring
```bash
# Setup health check cron job
crontab -e

# Add health check every 5 minutes:
*/5 * * * * curl -f https://yourdomain.com/health || echo "Health check failed" | mail -s "Care Services Health Check Failed" admin@yourdomain.com
```

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2. Security Hardening
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Setup fail2ban
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.local

# Add configuration:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

### 3. Database Security
```bash
# Secure PostgreSQL
sudo -u postgres psql
ALTER USER postgres PASSWORD 'secure_postgres_password';
\q

# Configure PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Change: local all postgres peer
# To:     local all postgres md5

sudo systemctl restart postgresql
```

## 📈 Performance Optimization

### 1. Database Performance
```bash
# Run database optimization
npm run db:optimize

# Monitor database performance
sudo -u postgres psql -d care_services_db
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

### 2. Cache Optimization
```bash
# Configure Redis for production
sudo nano /etc/redis/redis.conf

# Key settings:
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

sudo systemctl restart redis
```

### 3. Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load tests
artillery run test/load/load-test.yml --environment production

# Monitor during load test
pm2 monit
```

## 🔄 Backup and Recovery

### 1. Database Backup
```bash
# Create backup script
nano ~/backup-db.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U care_services_user care_services_db > /backups/db_backup_$DATE.sql
gzip /backups/db_backup_$DATE.sql

# Keep only last 7 days
find /backups -name "db_backup_*.sql.gz" -mtime +7 -delete

chmod +x ~/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

### 2. Application Backup
```bash
# Create application backup script
nano ~/backup-app.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/app_backup_$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=logs \
  --exclude=.git \
  /home/ubuntu/care-services-platform

# Keep only last 7 days
find /backups -name "app_backup_*.tar.gz" -mtime +7 -delete

chmod +x ~/backup-app.sh

# Schedule weekly backups
crontab -e
# Add: 0 3 * * 0 /home/ubuntu/backup-app.sh
```

## 🔄 Deployment Automation

### 1. Zero-Downtime Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Run database migrations
npm run migration:run

# Reload PM2 with zero downtime
pm2 reload care-services-api

# Wait for health check
sleep 10
curl -f https://yourdomain.com/health

echo "Deployment completed successfully!"
```

### 2. CI/CD Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run security scan
        run: npm audit
        
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.2
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /home/ubuntu/care-services-platform
            ./deploy.sh
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Application Won't Start
```bash
# Check logs
pm2 logs care-services-api

# Check environment variables
pm2 env 0

# Restart application
pm2 restart care-services-api
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U care_services_user -d care_services_db

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### High Memory Usage
```bash
# Check application memory
pm2 monit

# Restart application instances
pm2 reload care-services-api

# Check for memory leaks
pm2 show care-services-api
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

## 📞 Support and Maintenance

### Monitoring Alerts
- Set up alerts for CPU > 80%
- Set up alerts for memory > 85%
- Set up alerts for disk space > 90%
- Set up alerts for error rate > 1%
- Set up alerts for response time > 500ms

### Regular Maintenance Tasks
- **Daily**: Check application logs and health status
- **Weekly**: Review performance metrics and optimize
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full security audit and penetration testing

### Emergency Contacts
- **Technical Lead**: technical@yourcompany.com
- **DevOps Team**: devops@yourcompany.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX

---

## ✅ Post-Deployment Verification

### Final Checklist
- [ ] Application starts successfully
- [ ] Health endpoint returns 200
- [ ] SSL certificate is valid
- [ ] Database connections are working
- [ ] Redis cache is operational
- [ ] API endpoints respond correctly
- [ ] Authentication system works
- [ ] Payment processing is functional
- [ ] Monitoring and alerts are active
- [ ] Backups are configured and tested
- [ ] Security measures are in place

### Performance Validation
- [ ] Response times < 200ms (P95)
- [ ] Error rate < 1%
- [ ] Cache hit rate > 80%
- [ ] Database query time < 100ms (P95)
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%

🎉 **Congratulations! Your Care Services Platform is now live in production!**

For additional support, refer to the [technical documentation](./PHASE5_INTEGRATION_OPTIMIZATION_DOCUMENTATION.md) or contact the development team. 