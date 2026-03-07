# Deployment Checklist

Use this checklist to ensure a smooth deployment of the Smiths Detection E-Commerce platform.

## Pre-Deployment

### Infrastructure Setup
- [ ] Server/EC2 instance provisioned (minimum 2GB RAM, 20GB disk)
- [ ] Ubuntu 20.04 LTS or later installed
- [ ] Root or sudo access confirmed
- [ ] SSH access configured
- [ ] Domain name configured (if applicable)

### Software Installation
- [ ] Node.js 18.x or later installed
- [ ] MySQL 8.0 or later installed
- [ ] Nginx 1.18 or later installed
- [ ] PM2 process manager installed globally

### Database Setup
- [ ] MySQL root password set
- [ ] Database created (`smiths_detection_ecommerce`)
- [ ] Database user created with appropriate privileges
- [ ] Database schema applied (products and cart_items tables)
- [ ] Database connection tested

## Application Deployment

### File Upload
- [ ] Application files uploaded to `/var/www/smiths-ecommerce/`
- [ ] `product_list.csv` file present in root directory
- [ ] File permissions set correctly
- [ ] Directory ownership configured

### Backend Configuration
- [ ] Navigate to `backend/` directory
- [ ] Run `npm install --production`
- [ ] Create `.env` file from `.env.example`
- [ ] Configure database credentials in `.env`
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Set secure `DB_PASSWORD` in `.env`
- [ ] Verify CSV_FILE_PATH points to correct location
- [ ] Test backend startup: `npm start`
- [ ] Verify product import successful (check logs)
- [ ] Stop test server (Ctrl+C)

### Frontend Build
- [ ] Navigate to `frontend/` directory
- [ ] Run `npm install`
- [ ] Verify `.env.production` has empty `REACT_APP_API_URL`
- [ ] Run `npm run build`
- [ ] Verify `build/` directory created
- [ ] Check `build/static/` contains JS and CSS files
- [ ] Verify `build/index.html` exists

### Nginx Configuration
- [ ] Create Nginx config file: `/etc/nginx/sites-available/smiths-ecommerce`
- [ ] Configure frontend serving (root: `/var/www/smiths-ecommerce/frontend/build`)
- [ ] Configure API proxy (`/api/*` → `http://localhost:5000`)
- [ ] Set server_name (domain or IP)
- [ ] Add security headers
- [ ] Configure logging paths
- [ ] Create symbolic link: `/etc/nginx/sites-enabled/smiths-ecommerce`
- [ ] Test Nginx config: `sudo nginx -t`
- [ ] Reload Nginx: `sudo systemctl reload nginx`

### Process Management
- [ ] Navigate to `backend/` directory
- [ ] Start backend with PM2: `pm2 start npm --name "smiths-backend" -- start`
- [ ] Verify process running: `pm2 list`
- [ ] Check logs: `pm2 logs smiths-backend`
- [ ] Save PM2 config: `pm2 save`
- [ ] Setup PM2 startup: `pm2 startup systemd`
- [ ] Run the command provided by PM2 startup

### Firewall Configuration
- [ ] Allow HTTP: `sudo ufw allow 80/tcp`
- [ ] Allow HTTPS: `sudo ufw allow 443/tcp` (for future SSL)
- [ ] Allow SSH: `sudo ufw allow 22/tcp`
- [ ] Enable firewall: `sudo ufw enable`
- [ ] Verify rules: `sudo ufw status`

## Verification

### Service Status
- [ ] Check Nginx: `sudo systemctl status nginx`
- [ ] Check MySQL: `sudo systemctl status mysql`
- [ ] Check backend: `pm2 status`
- [ ] All services showing as active/running

### Endpoint Testing
- [ ] Test frontend: `curl http://your-domain.com`
- [ ] Test API: `curl http://your-domain.com/api/products`
- [ ] Verify products returned (should see JSON array)
- [ ] Test from remote machine
- [ ] Open browser and navigate to domain
- [ ] Verify home page loads with products
- [ ] Click on a product, verify detail page loads
- [ ] Add product to cart, verify success message
- [ ] Navigate to cart page, verify item appears
- [ ] Update quantity, verify cart updates
- [ ] Remove item, verify cart updates

### Log Verification
- [ ] Check Nginx access logs: `sudo tail -f /var/log/nginx/smiths-ecommerce-access.log`
- [ ] Check Nginx error logs: `sudo tail -f /var/log/nginx/smiths-ecommerce-error.log`
- [ ] Check backend logs: `pm2 logs smiths-backend`
- [ ] Verify no critical errors
- [ ] Verify product import logged successfully

## Post-Deployment

### Monitoring Setup
- [ ] Configure log rotation for PM2: `pm2 install pm2-logrotate`
- [ ] Set log rotation size: `pm2 set pm2-logrotate:max_size 10M`
- [ ] Set log retention: `pm2 set pm2-logrotate:retain 7`

### Backup Configuration
- [ ] Create database backup script
- [ ] Test backup script execution
- [ ] Add backup script to crontab (daily at 2 AM)
- [ ] Verify backup directory created
- [ ] Test backup restoration process

### Security Hardening
- [ ] MySQL root password is strong and documented securely
- [ ] Database user has minimal required privileges
- [ ] `.env` file permissions set to 600
- [ ] Application runs as non-root user
- [ ] Firewall configured (only necessary ports open)
- [ ] Nginx security headers configured
- [ ] Consider SSL/TLS certificate installation

### Documentation
- [ ] Document server IP/domain
- [ ] Document database credentials (in secure location)
- [ ] Document PM2 process names
- [ ] Document any custom configurations
- [ ] Update team on deployment status

## Optional Enhancements

### SSL/TLS Setup
- [ ] Install Certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Obtain certificate: `sudo certbot --nginx -d your-domain.com`
- [ ] Verify auto-renewal: `sudo certbot renew --dry-run`
- [ ] Test HTTPS access

### Performance Optimization
- [ ] Configure Nginx caching for static assets
- [ ] Configure Nginx caching for API responses
- [ ] Enable Gzip compression in Nginx
- [ ] Consider PM2 cluster mode: `pm2 start npm --name "smiths-backend" -i max -- start`
- [ ] Add database indexes if needed
- [ ] Run MySQL OPTIMIZE TABLE

### Monitoring and Alerting
- [ ] Set up application monitoring (e.g., PM2 Plus, New Relic)
- [ ] Configure error alerting
- [ ] Set up uptime monitoring
- [ ] Configure disk space alerts
- [ ] Set up database monitoring

## Rollback Plan

If deployment fails, follow these steps:

1. **Stop current version:**
   ```bash
   pm2 stop smiths-backend
   ```

2. **Restore previous version:**
   ```bash
   cd /var/www/smiths-ecommerce/backend
   # Restore from backup or previous git commit
   npm install
   ```

3. **Restore database (if needed):**
   ```bash
   mysql -u ecommerce_user -p smiths_detection_ecommerce < /var/backups/mysql/backup.sql
   ```

4. **Restart services:**
   ```bash
   pm2 restart smiths-backend
   sudo systemctl reload nginx
   ```

5. **Verify rollback:**
   - Test endpoints
   - Check logs
   - Verify functionality

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check PM2 logs: `pm2 logs smiths-backend`
- Verify `.env` file exists and is configured
- Test database connection: `mysql -u ecommerce_user -p -h localhost`
- Check port 5000 is not in use: `sudo lsof -i :5000`

**Nginx 502 Bad Gateway:**
- Verify backend is running: `pm2 status`
- Check Nginx error logs
- Verify proxy_pass port matches backend port
- Test Nginx config: `sudo nginx -t`

**Products not loading:**
- Check backend logs for CSV import errors
- Verify `product_list.csv` exists and is readable
- Check database: `mysql -u ecommerce_user -p -e "SELECT COUNT(*) FROM smiths_detection_ecommerce.products;"`
- Verify API endpoint: `curl http://localhost:5000/api/products`

**Frontend not loading:**
- Verify Nginx is serving from correct directory
- Check `frontend/build/` directory exists
- Verify Nginx config: `sudo nginx -t`
- Check Nginx error logs
- Verify file permissions: `ls -la /var/www/smiths-ecommerce/frontend/build/`

## Sign-Off

- [ ] Deployment completed successfully
- [ ] All verification tests passed
- [ ] Monitoring and backups configured
- [ ] Documentation updated
- [ ] Team notified

**Deployed by:** _______________
**Date:** _______________
**Environment:** Production / Staging / Development
**Version/Commit:** _______________

## Support Contacts

- **System Administrator:** _______________
- **Database Administrator:** _______________
- **Development Team:** _______________
- **Emergency Contact:** _______________
