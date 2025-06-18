# 🚀 ARCIS Backend Deployment Guide (Railway)

## **FREE Railway Deployment - Step by Step**

### **Step 1: Prepare Your Code**
✅ Already done! Your app is ready for deployment.

### **Step 2: Get Your Supabase Keys**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: **emjcotfxcqewhhvhjjof**
3. Go to **Settings** → **API**
4. Copy your **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **Step 3: Deploy to Railway**

#### **Option A: Deploy via Railway Website (Easiest)**
1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub (free)
3. Click **"New Project"**
4. Choose **"Deploy from GitHub repo"**
5. Connect your GitHub account
6. Select your ARCIS repository
7. Choose the `backend/server` folder as root directory

#### **Option B: Deploy via CLI**
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### **Step 4: Set Environment Variables**
In Railway dashboard, go to **Variables** tab and add:

```
NODE_ENV=production
SUPABASE_URL=https://emjcotfxcqewhhvhjjof.supabase.co
SUPABASE_ANON_KEY=YOUR_ACTUAL_SUPABASE_KEY_HERE
DB_USER=postgres.emjcotfxcqewhhvhjjof
DB_HOST=aws-0-eu-central-2.pooler.supabase.com
DB_NAME=postgres
DB_PASSWORD=8m7iELUYQ@lk19b%
DB_PORT=5432
JWT_SECRET=arcis-super-secure-jwt-key-2024
ARCJET_KEY=test-key
```

### **Step 5: Test Your Deployment**
After deployment, Railway will give you a URL like:
`https://your-app-name.up.railway.app`

Test endpoints:
- Health: `https://your-app.up.railway.app/api/health`
- Detections: `https://your-app.up.railway.app/api/detections/all`

### **Step 6: Update Your Devices**
Update Jetson/Pi code to use your new URL:
```python
# OLD
API_URL = "http://localhost:5000/api/detections/jetson-detection"

# NEW
API_URL = "https://your-app.up.railway.app/api/detections/jetson-detection"
```

## **💰 Cost Breakdown**
- **Railway Free Credits**: $5/month
- **Estimated Usage**: $1-3/month
- **Your Cost**: **$0/month** (effectively free!)

## **🔧 Troubleshooting**
- **Build fails**: Check that `package.json` has `"start": "node index.js"`
- **Database connection fails**: Verify environment variables
- **Health check fails**: Ensure `/api/health` endpoint exists

## **📱 Frontend Update**
Don't forget to update your React frontend's API URL:
```typescript
// frontend/src/api/axios.ts
const API_BASE_URL = 'https://your-app.up.railway.app/api';
```

## **🎯 Next Steps**
1. Deploy backend to Railway
2. Update frontend API URL
3. Deploy frontend to Vercel/Netlify (also free)
4. Update device configurations
5. Test end-to-end functionality

**Your ARCIS system will be globally accessible!** 🌐 