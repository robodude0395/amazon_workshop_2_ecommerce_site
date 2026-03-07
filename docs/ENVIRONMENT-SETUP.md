# Environment Configuration Guide

## Overview

This guide explains how to configure environment variables for both development and production environments.

## Backend Configuration

### Environment Variables

The backend uses a `.env` file for configuration. Create this file in the `backend/` directory.

#### Development Setup

1. Copy the example file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` with your local settings:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=smiths_detection_ecommerce

# Server Configuration
PORT=5000
NODE_ENV=development

# CSV File Path
CSV_FILE_PATH=../product_list.csv
```

#### Production Setup

For production deployment, use secure credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=ecommerce_user
DB_PASSWORD=secure_random_password_here
DB_NAME=smiths_detection_ecommerce

# Server Configuration
PORT=5000
NODE_ENV=production

# CSV File Path
CSV_FILE_PATH=../product_list.csv
```

**Security Notes:**
- Never commit `.env` files to version control
- Use strong, randomly generated passwords for production
- Restrict database user privileges to only what's needed
- Consider using environment variable management tools (e.g., AWS Secrets Manager, HashiCorp Vault)

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | - | MySQL server hostname |
| `DB_PORT` | Yes | 3306 | MySQL server port |
| `DB_USER` | Yes | - | Database username |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_NAME` | Yes | - | Database name |
| `PORT` | No | 5000 | Backend server port |
| `NODE_ENV` | No | development | Environment mode (development/production) |
| `CSV_FILE_PATH` | No | ../product_list.csv | Path to product CSV file |

## Frontend Configuration

### Environment Variables

The frontend uses environment-specific `.env` files that are processed by Create React App.

#### Development Setup

The `.env.development` file is automatically used when running `npm start`:

```env
# Development API Configuration
# Points to local backend server
REACT_APP_API_URL=http://localhost:5000
```

#### Production Setup

The `.env.production` file is automatically used when running `npm run build`:

```env
# Production API Configuration
# Leave empty to use relative URLs (same origin as frontend)
# The Nginx reverse proxy will route /api/* requests to the backend
REACT_APP_API_URL=
```

**Why empty in production?**
- The frontend is served from the same domain as the backend via Nginx
- Nginx reverse proxy routes `/api/*` requests to the backend
- Using relative URLs avoids CORS issues and simplifies deployment

#### Custom Environment Setup

You can create a `.env.local` file for local overrides (not committed to git):

```env
# Local development overrides
REACT_APP_API_URL=http://192.168.1.100:5000
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | No | http://localhost:5000 | Backend API base URL |

**Note:** Only variables prefixed with `REACT_APP_` are accessible in React code.

## Build Scripts

### Backend

The backend doesn't require a build step. Scripts are defined in `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --runInBand"
  }
}
```

**Usage:**
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run test suite

### Frontend

The frontend uses Create React App build scripts defined in `frontend/package.json`:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --watchAll=false"
  }
}
```

**Usage:**
- `npm start` - Start development server (port 3000)
- `npm run build` - Create production build in `build/` directory
- `npm test` - Run test suite

### Production Build Process

To create a production-ready deployment:

```bash
# 1. Build frontend
cd frontend
npm install
npm run build

# 2. Setup backend
cd ../backend
npm install --production

# 3. Configure environment
cp .env.example .env
# Edit .env with production credentials

# 4. Verify build
ls -la ../frontend/build/
```

The `frontend/build/` directory will contain:
- Optimized JavaScript bundles
- Minified CSS files
- Static assets (images, fonts)
- `index.html` entry point

## Environment-Specific Behavior

### Development Mode

**Backend (`NODE_ENV=development`):**
- Detailed error messages with stack traces
- CORS enabled for `http://localhost:3000`
- Verbose logging
- Auto-reload with nodemon

**Frontend:**
- Hot module replacement
- Source maps for debugging
- Development warnings enabled
- API calls to `http://localhost:5000`

### Production Mode

**Backend (`NODE_ENV=production`):**
- Sanitized error messages
- CORS configured for production domain
- Minimal logging
- Performance optimizations

**Frontend:**
- Minified and optimized bundles
- No source maps (smaller size)
- Production warnings disabled
- API calls via relative URLs (proxied by Nginx)

## Verification

### Backend Verification

```bash
cd backend

# Check environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.DB_NAME)"

# Test database connection
npm start
# Should see: "Database connected successfully"
# Should see: "Imported X products successfully"
```

### Frontend Verification

```bash
cd frontend

# Development mode
npm start
# Should open browser at http://localhost:3000
# Check browser console for API_BASE_URL

# Production build
npm run build
# Should create build/ directory
# Check build/static/ for optimized assets
```

### Integration Verification

```bash
# Start backend
cd backend
npm start &

# Start frontend (development)
cd ../frontend
npm start

# Test in browser
# Navigate to http://localhost:3000
# Check Network tab - API calls should go to http://localhost:5000/api/*
```

## Troubleshooting

### Backend Issues

**Problem:** Database connection failed
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
- Verify MySQL is running: `sudo systemctl status mysql`
- Check DB_HOST and DB_PORT in `.env`
- Test connection: `mysql -u root -p -h localhost`

**Problem:** CSV file not found
```
Error: ENOENT: no such file or directory, open '../product_list.csv'
```

**Solution:**
- Verify CSV_FILE_PATH in `.env`
- Check file exists: `ls -la ../product_list.csv`
- Use absolute path if needed

### Frontend Issues

**Problem:** API calls failing with CORS error
```
Access to fetch at 'http://localhost:5000/api/products' has been blocked by CORS policy
```

**Solution:**
- Verify backend CORS is configured for `http://localhost:3000`
- Check REACT_APP_API_URL in `.env.development`
- Restart both frontend and backend

**Problem:** Environment variable not updating
```
console.log(process.env.REACT_APP_API_URL) // Shows old value
```

**Solution:**
- Restart development server (Ctrl+C, then `npm start`)
- Clear browser cache
- Check variable name starts with `REACT_APP_`

## Security Best Practices

1. **Never commit sensitive data:**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template
   - Document required variables without values

2. **Use strong credentials:**
   - Generate random passwords: `openssl rand -base64 32`
   - Rotate credentials regularly
   - Use different credentials per environment

3. **Restrict access:**
   - Database user should have minimal privileges
   - Use firewall rules to limit database access
   - Don't expose backend port directly in production

4. **Validate configuration:**
   - Check for required variables on startup
   - Fail fast if configuration is invalid
   - Log configuration errors clearly

## Additional Resources

- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Node.js Best Practices - Configuration](https://github.com/goldbergyoni/nodebestpractices#1-project-structure-practices)
- [Twelve-Factor App - Config](https://12factor.net/config)
