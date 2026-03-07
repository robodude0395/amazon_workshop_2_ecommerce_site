# Deployment Quick Start

Quick reference for deploying the Smiths Detection E-Commerce platform.

## Prerequisites

- Ubuntu 20.04+ server with 2GB RAM, 20GB disk
- Node.js 18+, MySQL 8.0+, Nginx installed
- Database created and schema applied

## 5-Minute Deployment

### 1. Upload Files
```bash
# Upload application to server
scp -r . user@server:/var/www/smiths-ecommerce/
```

### 2. Configure Backend
```bash
cd /var/www/smiths-ecommerce/backend
npm install --production
cp .env.example .env
nano .env  # Edit with production credentials
```

Required `.env` settings:
```env
DB_HOST=localhost
DB_USER=ecommerce_user
DB_PASSWORD=your_secure_password
DB_NAME=smiths_detection_ecommerce
NODE_ENV=production
PORT=5000
```

### 3. Build Frontend
```bash
cd /var/www/smiths-ecommerce/frontend
npm install
npm run build
```

### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/smiths-ecommerce
```

Minimal config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/smiths-ecommerce/frontend/build;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/smiths-ecommerce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Start Backend
```bash
cd /var/www/smiths-ecommerce/backend
npm install -g pm2
pm2 start npm --name "smiths-backend" -- start
pm2 save
pm2 startup
```

### 6. Verify
```bash
# Test API
curl http://localhost/api/products

# Open browser
# Navigate to http://your-domain.com
```

## Detailed Documentation

- **Full Guide**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **Checklist**: [docs/DEPLOYMENT-CHECKLIST.md](./docs/DEPLOYMENT-CHECKLIST.md)
- **Environment Setup**: [docs/ENVIRONMENT-SETUP.md](./docs/ENVIRONMENT-SETUP.md)
- **Configuration Summary**: [docs/CONFIGURATION-SUMMARY.md](./docs/CONFIGURATION-SUMMARY.md)

## Troubleshooting

**Backend won't start:**
```bash
pm2 logs smiths-backend
```

**502 Bad Gateway:**
```bash
pm2 status  # Verify backend is running
sudo tail -f /var/log/nginx/error.log
```

**Products not loading:**
```bash
# Check CSV import
pm2 logs smiths-backend | grep "Imported"

# Verify database
mysql -u ecommerce_user -p -e "SELECT COUNT(*) FROM smiths_detection_ecommerce.products;"
```

## Security Checklist

- [ ] Strong database password set
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] `.env` file permissions: `chmod 600 backend/.env`
- [ ] SSL certificate installed (optional but recommended)
- [ ] Database backups configured

## Next Steps

1. Configure SSL/TLS with Let's Encrypt
2. Set up monitoring and alerting
3. Configure automated backups
4. Review security hardening checklist

---

**Need help?** See full documentation in `docs/` directory.
