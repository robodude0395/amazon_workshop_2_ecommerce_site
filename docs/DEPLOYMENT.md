# Deployment Guide

## Overview

This guide covers deploying the Smiths Detection E-Commerce solution on a single server or EC2 instance with Nginx as a reverse proxy.

## Prerequisites

### System Requirements
- Ubuntu 20.04 LTS or later (or equivalent Linux distribution)
- Minimum 2GB RAM
- 20GB disk space
- Root or sudo access

### Software Requirements
- Node.js 18.x or later
- MySQL 8.0 or later
- Nginx 1.18 or later
- npm or yarn package manager

## Installation Steps

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install MySQL

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Verify installation
mysql --version
```

### 4. Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Verify installation
nginx -v

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Database Setup

### 1. Create Database and User

```bash
# Login to MySQL
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE smiths_ecommerce;

-- Create user
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON smiths_ecommerce.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 2. Create Database Schema

```sql
USE smiths_ecommerce;

-- Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_number VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_part_number (part_number)
);

-- Cart items table
CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
);
```

## Application Deployment

### 1. Clone or Upload Application Files

```bash
# Create application directory
sudo mkdir -p /var/www/smiths-ecommerce
cd /var/www/smiths-ecommerce

# Upload your application files here
# - backend/ (Node.js application)
# - frontend/ (React application)
# - product_list.csv
```

### 2. Backend Setup

```bash
cd /var/www/smiths-ecommerce/backend

# Install dependencies
npm install

# Create environment configuration
cat > .env << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=ecommerce_user
DB_PASSWORD=secure_password_here
DB_NAME=smiths_ecommerce
CSV_FILE_PATH=../product_list.csv
EOF

# Test backend
npm start
```

### 3. Frontend Setup

```bash
cd /var/www/smiths-ecommerce/frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in the 'build' or 'dist' directory
```

## Nginx Configuration

### 1. Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/smiths-ecommerce
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Frontend - serve React build
    location / {
        root /var/www/smiths-ecommerce/frontend/build;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/smiths-ecommerce-access.log;
    error_log /var/log/nginx/smiths-ecommerce-error.log;
}
```

### 2. Enable Site Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/smiths-ecommerce /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Process Management with PM2

### 1. Install PM2

```bash
sudo npm install -g pm2
```

### 2. Start Backend with PM2

```bash
cd /var/www/smiths-ecommerce/backend

# Start application
pm2 start npm --name "smiths-backend" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the instructions provided by the command
```

### 3. PM2 Management Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs smiths-backend

# Restart application
pm2 restart smiths-backend

# Stop application
pm2 stop smiths-backend

# Monitor resources
pm2 monit
```

## Firewall Configuration

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Allow HTTPS traffic (for future SSL setup)
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## SSL/TLS Configuration (Optional but Recommended)

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx for HTTPS
# Certificates auto-renew via cron job
```

## Verification

### 1. Check Services Status

```bash
# Check Nginx
sudo systemctl status nginx

# Check MySQL
sudo systemctl status mysql

# Check backend (PM2)
pm2 status
```

### 2. Test Endpoints

```bash
# Test frontend
curl http://your-domain.com

# Test backend API
curl http://your-domain.com/api/products

# Test from remote machine
curl http://<server-ip>/api/products
```

### 3. Check Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/smiths-ecommerce-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/smiths-ecommerce-error.log

# Backend logs (PM2)
pm2 logs smiths-backend

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

## Monitoring and Maintenance

### Log Rotation

Nginx logs are automatically rotated by logrotate. For application logs:

```bash
# Create PM2 log rotation config
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u ecommerce_user -p'secure_password_here' smiths_ecommerce > \
  $BACKUP_DIR/smiths_ecommerce_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db.sh") | crontab -
```

### System Updates

```bash
# Regular system updates
sudo apt update
sudo apt upgrade -y

# Update Node.js packages
cd /var/www/smiths-ecommerce/backend
npm update

# Restart services after updates
pm2 restart smiths-backend
sudo systemctl reload nginx
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs smiths-backend

# Check database connection
mysql -u ecommerce_user -p -h localhost smiths_ecommerce

# Verify environment variables
cat /var/www/smiths-ecommerce/backend/.env
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/smiths-ecommerce-error.log

# Verify proxy_pass port matches backend port
sudo nginx -t
```

### Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u ecommerce_user -p -h localhost

# Check MySQL error log
sudo tail -f /var/log/mysql/error.log
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/smiths-ecommerce/frontend/build
sudo chown -R $USER:$USER /var/www/smiths-ecommerce/backend

# Fix permissions
sudo chmod -R 755 /var/www/smiths-ecommerce
```

## Performance Optimization

### Nginx Caching

Add to Nginx configuration:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/products {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_pass http://localhost:5000;
}
```

### MySQL Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_created_at ON cart_items(created_at);

-- Optimize tables periodically
OPTIMIZE TABLE products;
OPTIMIZE TABLE cart_items;
```

### Node.js Clustering

Modify PM2 configuration to use cluster mode:

```bash
pm2 start npm --name "smiths-backend" -i max -- start
```

## Security Checklist

- [ ] MySQL root password set and secure
- [ ] Database user has minimal required privileges
- [ ] Firewall configured (only necessary ports open)
- [ ] SSL/TLS certificate installed
- [ ] Nginx security headers configured
- [ ] Application runs as non-root user
- [ ] Regular security updates applied
- [ ] Database backups automated
- [ ] Logs monitored regularly
- [ ] Environment variables secured (not in version control)

## Rollback Procedure

```bash
# Stop current version
pm2 stop smiths-backend

# Restore previous version
cd /var/www/smiths-ecommerce/backend
git checkout <previous-commit>
npm install

# Restore database backup if needed
mysql -u ecommerce_user -p smiths_ecommerce < /var/backups/mysql/backup.sql

# Restart
pm2 restart smiths-backend
```

## Support and Resources

- **Nginx Documentation**: https://nginx.org/en/docs/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **MySQL Documentation**: https://dev.mysql.com/doc/
- **Node.js Documentation**: https://nodejs.org/docs/

## Next Steps

After successful deployment:
1. Configure monitoring (e.g., Prometheus, Grafana)
2. Set up alerting for critical errors
3. Implement automated testing in CI/CD pipeline
4. Plan for horizontal scaling if needed
5. Consider implementing authentication and user accounts
