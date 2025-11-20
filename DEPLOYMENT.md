# Deployment Guide - THE RESSEY TOURS CRMS

## Quick Start (Development)

### 1. Start Backend Server
```bash
npm run dev
```
Backend runs on: http://localhost:5000

### 2. Start Frontend (New Terminal)
```bash
npm run client
```
Frontend runs on: http://localhost:3000

### 3. Access the System
- Open browser: http://localhost:3000
- Login with:
  - Email: admin@ressytours.com
  - Password: admin123

## Production Deployment

### Option 1: Simple Deployment (PM2)

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Build frontend:**
```bash
cd frontend
npm run build
cd ..
```

3. **Start backend with PM2:**
```bash
pm2 start backend/server.js --name ressey-crms
pm2 save
pm2 startup
```

4. **Serve frontend (using serve or nginx):**
```bash
npm install -g serve
serve -s frontend/build -l 3000
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "backend/server.js"]
```

Build and run:
```bash
docker build -t ressey-crms .
docker run -p 5000:5000 ressey-crms
```

### Option 3: Cloud Deployment (Heroku/Railway/Render)

1. **Prepare for deployment:**
   - Update `.env` with production MongoDB URI
   - Set environment variables in cloud platform
   - Build frontend: `cd frontend && npm run build`

2. **Deploy to Heroku:**
```bash
heroku create ressey-tours-crms
heroku config:set MONGODB_URI=your-mongodb-uri
git push heroku main
```

3. **Deploy to Railway:**
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

## Environment Variables for Production

Update these in your hosting platform:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-secure-random-secret
MPESA_CONSUMER_KEY=your-production-key
MPESA_CONSUMER_SECRET=your-production-secret
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

## MongoDB Setup

### Local MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update MONGODB_URI in .env

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS in production
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules
- [ ] Regular backups

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs ressey-crms
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network access if using cloud MongoDB

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill
```

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Support

For deployment issues, check:
- Server logs
- MongoDB connection
- Environment variables
- Port availability

