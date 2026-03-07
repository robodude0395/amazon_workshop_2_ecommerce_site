# Deployment Guide

## Prerequisites

- Ubuntu/Debian server or EC2 instance
- MySQL 8.0+ installed and running
- Node.js 16+ installed
- Nginx installed

## Deployment Steps

### 1. Database Setup

```bash
# Create database and tables
mysql -u root -p < ../database/schema.sql
```

### 2. Backend Deployment

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Start backend (using PM2 for process management)
npm install -g pm2
pm2 start server.js --name smiths-backend
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

### 3. Frontend Deployment

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Copy build to web root
sudo mkdir -p /var/www/smiths-detection/frontend
sudo cp -r build/* /var/www/smiths-detection/frontend/
```

### 4. Nginx Configuration

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/smiths-detection

# Enable site
sudo ln -s /etc/nginx/sites-available/smiths-detection /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Configuration Details:**
- **Port 80**: HTTP access for remote clients
- **Frontend**: Serves React build files from `/var/www/smiths-detection/frontend/build`
- **API Proxy**: Routes `/api/*` requests to Node.js backend on port 5000
- **Health Check**: Proxies `/health` endpoint for monitoring
- **Compression**: Gzip enabled for static assets
- **Logging**: Access and error logs in `/var/log/nginx/`
- **Error Pages**: Custom 502/503/504 error handling

### 5. Verify Deployment

```bash
# Check backend is running
curl http://localhost:5000/health

# Check frontend is accessible
curl http://localhost/

# Check API proxy
curl http://localhost/api/products
```

## Production Environment Variables

Update `backend/.env` with production values:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=smiths_app
DB_PASSWORD=<secure_password>
DB_NAME=smiths_detection_ecommerce

PORT=5000
NODE_ENV=production

CSV_FILE_PATH=/path/to/product_list.csv
```

## Security Considerations

1. **Database**: Create dedicated MySQL user with limited privileges
2. **Firewall**: Only expose port 80 (and 443 for HTTPS)
3. **SSL/TLS**: Configure HTTPS with Let's Encrypt
4. **Environment**: Never commit `.env` files to version control
5. **Updates**: Keep dependencies updated for security patches

## Monitoring

```bash
# View backend logs
pm2 logs smiths-backend

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor backend process
pm2 status
pm2 monit
```

## Troubleshooting

### Backend won't start
- Check database connection in `.env`
- Verify MySQL is running: `sudo systemctl status mysql`
- Check logs: `pm2 logs smiths-backend`

### Frontend shows blank page
- Verify build was successful
- Check nginx configuration: `sudo nginx -t`
- Check file permissions in `/var/www/smiths-detection/frontend/`

### API requests fail
- Verify backend is running: `curl http://localhost:5000/health`
- Check nginx proxy configuration
- Review nginx error logs
