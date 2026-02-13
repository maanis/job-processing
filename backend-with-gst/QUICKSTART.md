# 🚀 Quick Start - Production Deployment

Follow these steps to get your backend running in production:

## ✅ Pre-Deployment Checklist

### 1️⃣ Install Dependencies

```bash
cd backend-with-gst
pnpm install
# or npm install
```

### 2️⃣ Configure Environment

- [ ] Edit `.env` file with your production values:
  - [ ] Set `MONGO_URI` (MongoDB Atlas recommended)
  - [ ] Set secure `JWT_SECRET` (minimum 32 characters)
  - [ ] Set `REDIS_HOST` and `REDIS_PORT`
  - [ ] Set `FRONTEND_URL` (your frontend domain)
  - [ ] Set API credentials (`ONGRID_API_KEY`, `DIGITAP_USERNAME`, etc.)
  - [ ] Set `NODE_ENV=production`

### 3️⃣ Setup Services

- [ ] MongoDB is running and accessible
- [ ] Redis is running and accessible
- [ ] Python virtual environment is set up
- [ ] LibreOffice is installed (for PDF generation)

### 4️⃣ Create Required Directories

```bash
mkdir -p logs uploads data/processedRows data/failedRows
```

## 🎯 Quick Deploy

### Option 1: Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start both API server and worker
pnpm run pm2:start

# View logs
pnpm run pm2:logs

# Monitor
pnpm run pm2:monit
```

### Option 2: Manual Start

```bash
# Terminal 1 - Start API server
pnpm start

# Terminal 2 - Start worker
pnpm start:worker
```

## 🔍 Verify Deployment

```bash
# Check if processes are running
pm2 status

# Test API health
curl http://localhost:5000/api/health

# View logs
pm2 logs
```

## 📚 Next Steps

1. **Set up reverse proxy** (Nginx) - See DEPLOYMENT.md
2. **Configure SSL/TLS** (Let's Encrypt) - See DEPLOYMENT.md
3. **Set up monitoring** - PM2 monitoring dashboard
4. **Configure backups** - MongoDB and file backups
5. **Set up PM2 startup** - Auto-start on server reboot:
   ```bash
   pm2 save
   pm2 startup
   ```

## 🆘 Troubleshooting

- **Can't connect to MongoDB?** Check `MONGO_URI` in `.env`
- **Redis errors?** Verify Redis is running: `redis-cli ping`
- **PM2 process crashes?** Check logs: `pm2 logs`
- **CORS issues?** Set correct `FRONTEND_URL` in `.env`

## 📖 Full Documentation

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔐 Security Reminders

- ✅ Strong JWT secret (already prompted in .env)
- ✅ CORS configured for production origin only
- ✅ Rate limiting enabled
- ✅ Helmet security headers enabled
- ✅ Error handling with graceful shutdown
- ⚠️ Remember to configure firewall
- ⚠️ Set up SSL/TLS certificates
- ⚠️ Enable MongoDB authentication

---

**Ready to deploy?** Start with step 1️⃣ above!
