# Production Deployment Guide

This guide will help you deploy the job processing backend to production.

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or MongoDB Atlas)
- Redis server
- Python 3.x (for report generation)
- LibreOffice (for PDF generation in Python scripts)
- PM2 (for process management)

## Step 1: Environment Setup

### 1.1 Install Dependencies

```bash
cd backend-with-gst
pnpm install
# or
npm install
```

### 1.2 Configure Environment Variables

Edit the `.env` file and set all required values:

```bash
# MongoDB - Use MongoDB Atlas for production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/job-processing

# Server
PORT=5000
NODE_ENV=production

# JWT Secret - Generate a strong secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password_if_needed

# API Keys
ONGRID_API_KEY="your_ongrid_api_key"
ONGRID_AUTH_TYPE="API-Key"
ONGRID_REFERENCE_ID="your_reference_id"

DIGITAP_USERNAME="your_digitap_username"
DIGITAP_PASSWORD="your_digitap_password"

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com
```

**Important Security Notes:**

- Never commit `.env` file to git
- Use strong, randomly generated JWT_SECRET (at least 32 characters)
- Use environment-specific values for production
- Store sensitive credentials securely (consider using secrets management tools)

## Step 2: Database Setup

### 2.1 MongoDB Setup

**Option A: MongoDB Atlas (Recommended for Production)**

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Add a database user
4. Whitelist your server IP address
5. Copy the connection string to `MONGO_URI` in `.env`

**Option B: Self-hosted MongoDB**

1. Install MongoDB on your server
2. Configure authentication
3. Set up regular backups
4. Use connection string: `mongodb://username:password@localhost:27017/job-processing`

### 2.2 Redis Setup

**Option A: Redis Cloud (Recommended for Production)**

1. Sign up at https://redis.com/try-free/
2. Create a new database
3. Copy connection details to `.env`

**Option B: Self-hosted Redis**

```bash
# Install Redis on Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should respond with "PONG"
```

## Step 3: Python Environment Setup

```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install Python dependencies
pip install -r python/requirements.txt
```

**Note:** Make sure LibreOffice is installed for PDF generation:

```bash
# Ubuntu/Debian
sudo apt-get install libreoffice

# Windows
# Download from: https://www.libreoffice.org/download/download/
```

## Step 4: Create Required Directories

```bash
mkdir -p logs
mkdir -p uploads
mkdir -p data/processedRows
mkdir -p data/failedRows
```

## Step 5: Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Or install as dev dependency (already added to package.json)
pnpm install
```

## Step 6: Start the Application

### Development Mode

```bash
# Start API server
pnpm run dev

# In another terminal, start worker
pnpm run dev:worker
```

### Production Mode with PM2

```bash
# Start both API and worker
pnpm run pm2:start

# Other PM2 commands:
pnpm run pm2:logs      # View logs
pnpm run pm2:monit     # Monitor processes
pnpm run pm2:restart   # Restart all processes
pnpm run pm2:stop      # Stop all processes
pnpm run pm2:delete    # Delete all processes
```

### Manual PM2 Commands

```bash
# Start processes
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart processes
pm2 restart all

# Stop processes
pm2 stop all

# Save PM2 process list (for restart after reboot)
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown

# Delete processes
pm2 delete all
```

## Step 7: Nginx Reverse Proxy (Optional but Recommended)

Create an Nginx configuration file:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 20M;

    location / {
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
}
```

## Step 8: SSL/TLS Configuration

Use Let's Encrypt for free SSL certificates:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is enabled by default
# Test renewal:
sudo certbot renew --dry-run
```

## Step 9: Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

## Step 10: Monitoring and Logs

### View Application Logs

```bash
# PM2 logs
pm2 logs

# Specific logs
pm2 logs job-api
pm2 logs job-worker

# Log files (if configured)
tail -f logs/api-out.log
tail -f logs/api-error.log
tail -f logs/worker-out.log
tail -f logs/worker-error.log
```

### Monitor Resources

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

## Step 11: Database Backups

### MongoDB Backup Script

Create a backup script `backup-mongo.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H-%M)
BACKUP_DIR="/path/to/backups"
DB_NAME="job-processing"

mongodump --uri="your_mongodb_uri" --db=$DB_NAME --out=$BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

Set up daily cron job:

```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-mongo.sh
```

## Step 12: Health Checks

Test your deployment:

```bash
# Check API health
curl http://your-domain/api/health

# Check if both processes are running
pm2 status
```

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**

- Verify MongoDB is running
- Check connection string in `.env`
- Ensure IP is whitelisted (MongoDB Atlas)
- Verify credentials

**2. Redis Connection Failed**

- Verify Redis is running: `redis-cli ping`
- Check Redis host and port in `.env`
- Verify firewall rules

**3. Python Script Errors**

- Activate virtual environment
- Install Python dependencies
- Verify LibreOffice is installed

**4. PM2 Processes Crashing**

- Check logs: `pm2 logs`
- Verify environment variables
- Check file permissions

**5. CORS Errors**

- Verify `FRONTEND_URL` in `.env`
- Check that `NODE_ENV=production` is set

### Useful Commands

```bash
# Restart server after .env changes
pm2 restart all --update-env

# Clear PM2 logs
pm2 flush

# View PM2 process details
pm2 show job-api
pm2 show job-worker
```

## Security Checklist

- [ ] Strong JWT_SECRET set
- [ ] MongoDB authentication enabled
- [ ] Redis password set (if exposed)
- [ ] Firewall configured
- [ ] SSL/TLS enabled
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload size limits set
- [ ] Regular backups configured
- [ ] Logs rotation configured
- [ ] Security headers enabled (Helmet)
- [ ] PM2 startup script enabled

## Performance Optimization

1. **Enable Redis Persistence**
   - Configure Redis AOF or RDB snapshots

2. **MongoDB Indexes**
   - Add indexes on frequently queried fields

3. **PM2 Cluster Mode** (optional)
   - Edit `ecosystem.config.js`:

   ```javascript
   instances: 'max',
   exec_mode: 'cluster'
   ```

4. **Enable Compression**
   - Add compression middleware to Express

## Maintenance

### Regular Tasks

- Monitor disk space
- Review logs for errors
- Check PM2 process health
- Verify backups are working
- Update dependencies regularly
- Monitor Redis memory usage
- Review MongoDB performance

### Updates

```bash
# Update dependencies
pnpm update

# Restart after updates
pnpm run pm2:restart
```

## Support

For issues or questions, contact your development team or refer to:

- Express.js Documentation: https://expressjs.com/
- PM2 Documentation: https://pm2.keymetrics.io/
- MongoDB Documentation: https://docs.mongodb.com/
- Redis Documentation: https://redis.io/documentation
