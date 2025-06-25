# 🚀 Fresh Deployment Guide - ARCIS System

## 🎯 **Why Fresh Deployments?**
- **Clean slate**: No cached builds or configuration conflicts
- **Latest code**: Ensures all recent updates are included
- **Better debugging**: Easier to troubleshoot from scratch
- **Performance**: Fresh deployments often perform better

## 📋 **Pre-Deployment Checklist**

### ✅ **Code Status**
- [x] Backend updated with binary JPEG support
- [x] Frontend configured for production API URL
- [x] Database schema deployed to Supabase
- [x] Security policies enabled (RLS)
- [x] All changes committed to Git

### 🔧 **Environment Variables Ready**

#### **Railway Backend Environment Variables:**
```bash
# Database (Supabase)
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PASSWORD=[your-supabase-password]
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PORT=6543

# API Security
API_KEY_JETSON=your-jetson-api-key
API_KEY_RASPBERRY=your-raspberry-api-key

# Node Environment
NODE_ENV=production
```

#### **Vercel Frontend Environment Variables:**
```bash
# API Configuration
VITE_API_URL=https://[your-new-railway-url]/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyADmJmV2ZEEgrkV5YBcvBiVYBhVhzkvgBM
VITE_FIREBASE_AUTH_DOMAIN=arcis-dev-a536c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=arcis-dev-a536c
VITE_FIREBASE_STORAGE_BUCKET=arcis-dev-a536c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=103762488919
VITE_FIREBASE_APP_ID=1:103762488919:web:42a4fe2644b1266a7e3d12
```

## 🚂 **Railway Backend Deployment**

### **Step 1: Create New Railway Project**
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your ARCIS repository
5. Set root directory to `backend/server`

### **Step 2: Configure Railway Settings**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install --legacy-peer-deps"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

### **Step 3: Set Environment Variables**
Add all the backend environment variables listed above.

### **Step 4: Deploy**
Railway will automatically deploy. The new URL will be something like:
`https://your-project-name.up.railway.app`

## 🌐 **Vercel Frontend Deployment**

### **Step 1: Create New Vercel Project**
1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your ARCIS repository
4. Set root directory to `frontend`
5. Framework preset: Vite

### **Step 2: Configure Build Settings**
```bash
Build Command: npm run build
Output Directory: dist
Install Command: npm install --legacy-peer-deps
```

### **Step 3: Set Environment Variables**
Add all the frontend environment variables, making sure to update `VITE_API_URL` with your new Railway URL.

### **Step 4: Deploy**
Vercel will automatically deploy. The new URL will be something like:
`https://your-project-name.vercel.app`

## 🔧 **Post-Deployment Configuration**

### **Update Frontend API URL**
After Railway deployment, update the frontend environment variable:
```bash
VITE_API_URL=https://[your-new-railway-url]/api
```

### **Test Endpoints**
1. **Health Check**: `GET https://[railway-url]/api/health`
2. **Threats**: `GET https://[railway-url]/api/detections/threats`
3. **Binary JPEG**: `GET https://[railway-url]/api/detections/2/jpeg`

## ✅ **Verification Steps**

### **1. Backend Verification**
```bash
# Health check should return version 2.1.0
curl https://[railway-url]/api/health

# Threats should include has_binary_jpeg and jpeg_endpoint
curl https://[railway-url]/api/detections/threats

# Binary JPEG endpoint should work
curl -I https://[railway-url]/api/detections/2/jpeg
```

### **2. Frontend Verification**
1. Open `https://[vercel-url]/dashboard`
2. Click "Expand Threat" on a detection
3. Verify that the detection frame image displays correctly

## 🎯 **Expected Results**

### **Working API Response:**
```json
{
  "active_weapon_threats": [
    {
      "id": 2,
      "detection_id": 2,
      "weapon_type": "weapon",
      "has_binary_jpeg": true,
      "jpeg_endpoint": "/api/detections/2/jpeg",
      "confidence": 0.85
    }
  ]
}
```

### **Working Image Display:**
- Detection frames should load instantly
- Images should be crisp and clear
- No "Frame captured at..." placeholder text

## 🚨 **Troubleshooting**

### **If Binary JPEG Still Missing:**
1. Check Railway logs for deployment errors
2. Verify all environment variables are set
3. Ensure the correct Git branch is deployed
4. Try a manual redeploy in Railway dashboard

### **If Frontend Can't Connect:**
1. Check CORS settings in backend
2. Verify VITE_API_URL is correct
3. Check browser network tab for API calls
4. Ensure Railway backend is responding

## 📝 **Notes**
- Keep old deployments running until new ones are verified
- Update any external services (Postman, documentation) with new URLs
- Consider setting up custom domains for production use 