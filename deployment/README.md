# Deployment Guide

This guide covers both local nginx setup (for testing production configuration) and production deployment.

## Prerequisites

- MySQL 8.0+ installed and running
- Node.js 16+ installed
- Nginx installed

## Local Nginx Setup (macOS)

For testing the production nginx configuration locally:

### 1. Install Nginx

```bash
# Install via Homebrew
brew install nginx

# Verify installation
nginx -v
```

### 2. Build Frontend

```bash
cd frontend
npm install
npm run build
```

### 3. Configure Local Paths

Update the nginx configuration to use your local project path:

```bash
# Edit deployment/nginx.conf
# Change: root /var/www/smiths-detection/frontend/build;
# To: root /absolute/path/to/your/project/frontend/build;
```

### 4. Set Up Nginx Configuration

```bash
# Copy configuration to nginx
sudo cp deployment/nginx.conf /usr/local/etc/nginx/servers/smiths-detection.conf

# Test configuration
sudo nginx -t

# Start or reload nginx
brew services start nginx
# OR if already running:
brew services restart nginx
```

### 5. Start Backend

```bash
cd backend
npm install
npm start  # Runs on port 5000
```

### 6. Access Application

Open browser to `http://localhost` (nginx serves on port 8080 by default on macOS, or port 80 if configured)

**Note**: If port 80 requires sudo, you can modify the nginx config to use port 8080 instead:
```nginx
listen 8080;
```

### 7. Stop Nginx

```bash
brew services stop nginx
```

## Production Deployment

For Ubuntu/Debian servers or EC2 instances:

### Prerequisites

Before starting, ensure:
- EC2 instance is running Ubuntu 20.04+ or Debian 10+
- Security group allows inbound traffic on port 80 (HTTP)
- MySQL 8.0+ is installed and running
- Node.js 16+ is installed
- Nginx is installed

### 1. Database Setup

```bash
# Connect to MySQL and create database
mysql -u root -p

# In MySQL prompt, run:
CREATE DATABASE IF NOT EXISTS smiths_detection_ecommerce;
EXIT;

# Initialize schema
cd ~/Desktop/amazon_workshop_2_ecommerce_site
mysql -u root -p smiths_detection_ecommerce < database/schema.sql
```

### 2. Backend Deployment

```bash
# Navigate to backend directory
cd ~/Desktop/amazon_workshop_2_ecommerce_site/backend

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
nano .env  # Edit with your database credentials

# Example .env configuration:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_NAME=smiths_detection_ecommerce
# PORT=5000
# NODE_ENV=production
# CSV_FILE_PATH=../product_list.csv

# Install PM2 globally for process management
sudo npm install -g pm2

# Kill any processes using port 5000
sudo lsof -ti:5000 | xargs sudo kill -9 2>/dev/null || true

# Start backend with PM2
pm2 start server.js --name smiths-backend

# Save PM2 process list
pm2 save

# Enable PM2 to start on system boot
pm2 startup
# Copy and run the command that PM2 outputs
```

### 3. Chatbot Service Deployment

```bash
# Navigate to chatbot directory
cd ~/Desktop/amazon_workshop_2_ecommerce_site/chatbot

# Install Python 3.9+ if not already installed
python3 --version  # Should be 3.9 or higher

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit with your AWS credentials and backend URL

# Example .env configuration:
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1
# BACKEND_API_URL=http://localhost:5000
# CHATBOT_PORT=8000
# LOG_LEVEL=INFO

# Kill any processes using port 8000
sudo lsof -ti:8000 | xargs sudo kill -9 2>/dev/null || true

# Start chatbot with PM2
pm2 start main.py --name smiths-chatbot --interpreter python3

# Save PM2 process list
pm2 save
```

**Important:** The chatbot requires:
- AWS credentials with Bedrock access
- Backend API running on port 5000
- Python 3.9+ with virtual environment

### 4. Frontend Deployment

```bash
# Navigate to frontend directory
cd ~/Desktop/amazon_workshop_2_ecommerce_site/frontend

# Install dependencies
npm install

# Verify production environment configuration
cat .env.production
# Should show: REACT_APP_API_URL=/api
# This tells the frontend to use relative URLs through the Nginx proxy

# Build production bundle
npm run build

# Verify the build doesn't reference localhost:5000
grep -r "localhost:5000" build/ && echo "ERROR: Build has localhost references!" || echo "✓ Build is correct"

# Create web root directory
sudo mkdir -p /var/www/smiths-detection/frontend

# Copy build to web root
sudo cp -r build /var/www/smiths-detection/frontend/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/smiths-detection/
sudo chmod -R 755 /var/www/smiths-detection/
```

**Important:** The `.env.production` file must have `REACT_APP_API_URL=/api` before building. This is already configured in the repository, but verify it if you encounter connection issues.

### 4. Nginx Configuration

```bash
# Navigate to deployment directory
cd ~/Desktop/amazon_workshop_2_ecommerce_site/deployment

# Disable default nginx site
sudo rm /etc/nginx/sites-enabled/default

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
- **Chatbot Proxy**: Routes `/api/chat` requests to Python chatbot on port 8000
- **Health Checks**:
  - `/health` → Backend health check
  - `/chatbot/health` → Chatbot health check
- **Compression**: Gzip enabled for static assets
- **Logging**: Access and error logs in `/var/log/nginx/`
- **Error Pages**: Custom 502/503/504 error handling

**Important:** The `/api/chat` location must come BEFORE `/api/` in the nginx config to match correctly.

### 5. Verify Deployment

```bash
# Check backend is running
pm2 list
curl http://localhost:5000/health

# Check chatbot is running
curl http://localhost:8000/health

# Check frontend is accessible
curl http://localhost/

# Check API proxy is working
curl http://localhost/api/products

# Check chatbot proxy is working
curl -X POST http://localhost/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-123","message":"Hello"}'

# View logs if needed
pm2 logs smiths-backend
pm2 logs smiths-chatbot
sudo tail -f /var/log/nginx/smiths-detection-access.log
sudo tail -f /var/log/nginx/smiths-detection-error.log
```

**Expected Results:**
- `pm2 list` shows both smiths-backend and smiths-chatbot as "online"
- Backend health check returns: `{"status":"ok","message":"Server is running"}`
- Chatbot health check returns: `{"status":"healthy","version":"1.0.0",...}`
- Frontend returns HTML with React app
- API returns JSON with product list
- Chatbot returns conversational response

**Access Your Site:**
- Find your EC2 public IP in AWS Console
- Open browser to `http://your-ec2-public-ip`
- Site should load with product catalog and chat interface

### 6. Troubleshooting

**Backend won't start:**
```bash
# Check if port 5000 is in use
sudo lsof -ti:5000

# Kill any conflicting processes
sudo lsof -ti:5000 | xargs sudo kill -9

# Check backend logs
pm2 logs smiths-backend --lines 50
```

**Chatbot won't start:**
```bash
# Check if port 8000 is in use
sudo lsof -ti:8000

# Kill any conflicting processes
sudo lsof -ti:8000 | xargs sudo kill -9

# Check chatbot logs
pm2 logs smiths-chatbot --lines 50

# Verify AWS credentials
cd ~/Desktop/amazon_workshop_2_ecommerce_site/chatbot
cat .env | grep AWS

# Test AWS Bedrock access
source .venv/bin/activate
python -c "import boto3; client = boto3.client('bedrock-runtime', region_name='us-east-1'); print('AWS connection OK')"
```

**Database connection errors:**
```bash
# Verify MySQL is running
sudo systemctl status mysql

# Test database connection
mysql -u root -p smiths_detection_ecommerce -e "SELECT COUNT(*) FROM products;"

# Check .env file has correct credentials
cat ~/Desktop/amazon_workshop_2_ecommerce_site/backend/.env
```

**Frontend shows but products don't load:**
```bash
# Check browser console for errors (F12 in browser)
# Common issue: API URL misconfigured

# Verify .env.production has correct API URL
cat ~/Desktop/amazon_workshop_2_ecommerce_site/frontend/.env.production
# Should contain: REACT_APP_API_URL=/api

# Rebuild frontend if needed
cd ~/Desktop/amazon_workshop_2_ecommerce_site/frontend
npm run build
sudo cp -r build /var/www/smiths-detection/frontend/
sudo systemctl reload nginx
```

**Nginx errors:**
```bash
# Check nginx configuration
sudo nginx -t

# View error logs
sudo tail -50 /var/log/nginx/smiths-detection-error.log

# Verify permissions
ls -la /var/www/smiths-detection/frontend/build/
# Should be owned by www-data

# Fix permissions if needed
sudo chown -R www-data:www-data /var/www/smiths-detection/
sudo chmod -R 755 /var/www/smiths-detection/
```

**Port 5000 already in use:**
```bash
# Find what's using the port
sudo lsof -ti:5000

# Kill the process
sudo lsof -ti:5000 | xargs sudo kill -9

# Restart backend
pm2 restart smiths-backend
```

**Chatbot returns 503 errors:**
```bash
# Check chatbot health
curl http://localhost:8000/health

# Common issues:
# 1. AWS credentials not configured
# 2. Backend API not reachable
# 3. Python dependencies not installed

# Verify backend is accessible from chatbot
curl http://localhost:5000/api/products

# Check chatbot logs for specific errors
pm2 logs smiths-chatbot --lines 100
```

## Production Environment Variables

Update `backend/.env` with production values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=smiths_detection_ecommerce

# Server Configuration
PORT=5000
NODE_ENV=production

# Data Source
CSV_FILE_PATH=../product_list.csv
```

**Important:** Never commit `.env` files to version control. The `.env.example` file serves as a template.

## Security Considerations

1. **Database Security**
   - Create a dedicated MySQL user instead of using root:
   ```bash
   mysql -u root -p
   CREATE USER 'smiths_app'@'localhost' IDENTIFIED BY 'secure_password_here';
   GRANT ALL PRIVILEGES ON smiths_detection_ecommerce.* TO 'smiths_app'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```
   - Update `backend/.env` with the new credentials

2. **Firewall Configuration**
   - Only expose port 80 (HTTP) and 22 (SSH) in EC2 security group
   - Port 5000 (backend) and 3306 (MySQL) should NOT be publicly accessible

3. **SSL/TLS (HTTPS)**
   - For production, configure HTTPS with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

4. **Environment Variables**
   - Never commit `.env` files to git
   - Use strong passwords for database
   - Restrict file permissions: `chmod 600 backend/.env`

5. **System Updates**
   - Keep dependencies updated: `npm audit fix`
   - Update system packages: `sudo apt update && sudo apt upgrade`

## Monitoring and Maintenance

### Process Management

```bash
# View all PM2 processes
pm2 list

# View backend logs (live)
pm2 logs smiths-backend

# View last 100 lines of logs
pm2 logs smiths-backend --lines 100

# Restart backend
pm2 restart smiths-backend

# Stop backend
pm2 stop smiths-backend

# View process details
pm2 show smiths-backend

# Monitor CPU/memory usage
pm2 monit
```

### Nginx Logs

```bash
# View access logs (live)
sudo tail -f /var/log/nginx/smiths-detection-access.log

# View error logs (live)
sudo tail -f /var/log/nginx/smiths-detection-error.log

# View last 50 lines
sudo tail -50 /var/log/nginx/smiths-detection-access.log
```

### System Health

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check MySQL status
sudo systemctl status mysql

# Check Nginx status
sudo systemctl status nginx

# Check backend health endpoint
curl http://localhost:5000/health
```

### Updating the Application

**Backend updates:**
```bash
cd ~/Desktop/amazon_workshop_2_ecommerce_site/backend
git pull  # or copy new files
npm install
pm2 restart smiths-backend
```

**Frontend updates:**
```bash
cd ~/Desktop/amazon_workshop_2_ecommerce_site/frontend
git pull  # or copy new files
npm install
npm run build
sudo cp -r build /var/www/smiths-detection/frontend/
sudo systemctl reload nginx
```
