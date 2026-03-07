# Configuration Summary

Quick reference for all configuration files in the Smiths Detection E-Commerce platform.

## Configuration Files Overview

### Backend Configuration

| File | Purpose | Committed to Git | Required |
|------|---------|------------------|----------|
| `backend/.env.example` | Template for environment variables | ✅ Yes | No (template only) |
| `backend/.env` | Actual environment configuration | ❌ No | ✅ Yes |
| `backend/package.json` | Dependencies and scripts | ✅ Yes | ✅ Yes |

### Frontend Configuration

| File | Purpose | Committed to Git | Required |
|------|---------|------------------|----------|
| `frontend/.env.example` | Template for environment variables | ✅ Yes | No (template only) |
| `frontend/.env.development` | Development environment config | ✅ Yes | ✅ Yes (dev) |
| `frontend/.env.production` | Production environment config | ✅ Yes | ✅ Yes (prod) |
| `frontend/.env.local` | Local overrides (optional) | ❌ No | No (optional) |
| `frontend/package.json` | Dependencies and scripts | ✅ Yes | ✅ Yes |

### Deployment Configuration

| File | Purpose | Committed to Git |
|------|---------|------------------|
| `nginx.conf` (in deployment) | Nginx reverse proxy config | No (server-specific) |
| `docs/DEPLOYMENT.md` | Deployment guide | ✅ Yes |
| `docs/DEPLOYMENT-CHECKLIST.md` | Deployment checklist | ✅ Yes |
| `docs/ENVIRONMENT-SETUP.md` | Environment setup guide | ✅ Yes |

## Quick Setup Guide

### For Development

1. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with local database credentials
   npm install
   npm run dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

   The `.env.development` file is already configured to point to `http://localhost:5000`.

### For Production

1. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with production database credentials
   # Set NODE_ENV=production
   npm install --production
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

   The `.env.production` file is already configured for production (empty API URL for same-origin requests).

3. **Deploy:**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions
   - Use [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) to track progress

## Environment Variables Reference

### Backend Variables

```env
# Database Configuration
DB_HOST=localhost              # MySQL server hostname
DB_PORT=3306                   # MySQL server port
DB_USER=root                   # Database username
DB_PASSWORD=your_password      # Database password
DB_NAME=smiths_detection_ecommerce  # Database name

# Server Configuration
PORT=5000                      # Backend server port
NODE_ENV=development           # Environment mode (development/production)

# CSV File Path
CSV_FILE_PATH=../product_list.csv  # Path to product CSV file
```

### Frontend Variables

```env
# Development (.env.development)
REACT_APP_API_URL=http://localhost:5000

# Production (.env.production)
REACT_APP_API_URL=
# Empty in production - uses relative URLs via Nginx proxy
```

## Configuration Validation

### Backend Validation

```bash
# Test environment variables are loaded
cd backend
node -e "require('dotenv').config(); console.log('DB:', process.env.DB_NAME, 'Port:', process.env.PORT)"

# Test database connection
npm start
# Should see: "Database connected successfully"
```

### Frontend Validation

```bash
# Development mode
cd frontend
npm start
# Check browser console for API_BASE_URL

# Production build
npm run build
# Should create build/ directory with optimized assets
```

## Common Configuration Scenarios

### Scenario 1: Local Development
- Backend: Use `.env` with local MySQL credentials
- Frontend: Use `.env.development` (default)
- Both services run on localhost

### Scenario 2: Remote Backend Development
- Backend: Deployed on remote server
- Frontend: Local development pointing to remote backend
- Create `frontend/.env.local`:
  ```env
  REACT_APP_API_URL=http://remote-server-ip:5000
  ```

### Scenario 3: Production Deployment
- Backend: Use `.env` with production credentials
- Frontend: Use `.env.production` (default for `npm run build`)
- Nginx proxies API requests to backend

### Scenario 4: Staging Environment
- Backend: Use `.env` with staging database
- Frontend: Create `.env.staging`:
  ```env
  REACT_APP_API_URL=http://staging-server.com
  ```
- Build with: `REACT_APP_ENV=staging npm run build`

## Security Considerations

### What to Commit
✅ **DO commit:**
- `.env.example` files (templates without sensitive data)
- `.env.development` (localhost URLs only)
- `.env.production` (no sensitive data, just empty API URL)
- Documentation files

❌ **DO NOT commit:**
- `.env` files with actual credentials
- `.env.local` files with personal overrides
- Any file containing passwords or API keys

### Password Security
- Use strong, randomly generated passwords
- Different passwords for each environment
- Store production credentials in secure password manager
- Rotate credentials regularly
- Use environment variable management tools in production (AWS Secrets Manager, HashiCorp Vault)

### File Permissions
```bash
# Backend .env should be readable only by application user
chmod 600 backend/.env

# Verify permissions
ls -la backend/.env
# Should show: -rw------- (600)
```

## Troubleshooting

### Issue: Environment variables not loading

**Backend:**
```bash
# Check .env file exists
ls -la backend/.env

# Check dotenv is installed
cd backend && npm list dotenv

# Verify file format (no spaces around =)
cat backend/.env
```

**Frontend:**
```bash
# Restart development server (required after .env changes)
# Ctrl+C, then npm start

# Check variable name starts with REACT_APP_
# Only REACT_APP_* variables are accessible
```

### Issue: Database connection failed

```bash
# Test MySQL connection manually
mysql -u root -p -h localhost

# Check credentials in .env match MySQL user
# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"

# Check MySQL is running
sudo systemctl status mysql
```

### Issue: CORS errors in development

```bash
# Verify backend CORS is configured for frontend origin
# Check backend/server.js or middleware

# Verify REACT_APP_API_URL in .env.development
cat frontend/.env.development

# Should be: REACT_APP_API_URL=http://localhost:5000
```

## Additional Resources

- [Environment Setup Guide](./ENVIRONMENT-SETUP.md) - Detailed configuration instructions
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment walkthrough
- [Deployment Checklist](./DEPLOYMENT-CHECKLIST.md) - Step-by-step deployment checklist
- [API Documentation](./API.md) - API endpoint specifications
- [Architecture Documentation](./ARCHITECTURE.md) - System architecture details

## Configuration Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2024-01-XX | Initial configuration files created | Project setup |
| 2024-01-XX | Added .env.production for frontend | Production deployment support |
| 2024-01-XX | Created configuration documentation | Deployment preparation |

---

**Note:** Always test configuration changes in a development environment before applying to production.
