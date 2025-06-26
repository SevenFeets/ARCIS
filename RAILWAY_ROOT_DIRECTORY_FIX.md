# 🚂 Railway Root Directory Fix

## 🔍 **Problem Identified**
Your Railway deployment is failing because it's trying to build from the project root instead of `backend/server`.

## 🛠️ **Solution: Set Root Directory**

### **Method 1: Railway Dashboard (RECOMMENDED)**
1. Go to your Railway project
2. Click **Settings** (gear icon)
3. Scroll down to **Service Settings**
4. Find **Root Directory** field
5. Enter: `backend/server`
6. Click **Save**
7. Redeploy

### **Method 2: Via Source Settings**
1. In your Railway project
2. Go to **Settings** → **Source**
3. Look for **Root Directory** or **Source Directory**
4. Set to: `backend/server`

## 📋 **Expected File Structure**
Railway should see this structure after setting root directory:
```
backend/server/          ← This becomes the root
├── package.json         ← Railway will find this
├── index.js            ← Entry point
├── railway.json        ← Configuration
├── routes/
├── middleware/
└── config/
```

## ✅ **Verification Steps**
After setting the root directory:

1. **Redeploy** the service
2. Check **Build Logs** - should show:
   ```
   Found package.json in root
   Installing dependencies...
   npm install --legacy-peer-deps
   ```
3. **Deploy Logs** - should show:
   ```
   Starting with: npm start
   🚀 ARCIS Backend v2.1 - Binary JPEG Support Enabled
   ```

## 🚨 **If Root Directory Option is Missing**
Some Railway interfaces might not show this option clearly:

### **Alternative: Create New Service**
1. Delete current service
2. Create new service
3. **During setup**, select:
   - Repository: SevenFeets/ARCIS
   - **Root Directory**: `backend/server`
   - Branch: main

### **Alternative: Use Monorepo Setup**
1. Go to project settings
2. Look for **Monorepo** or **Build Settings**
3. Set working directory to `backend/server`

## 🎯 **What Should Happen After Fix**
- ✅ Build should find `package.json`
- ✅ Dependencies install correctly
- ✅ Health check at `/api/health` responds
- ✅ Deployment succeeds

## 📞 **If Still Failing**
Check these in order:
1. Root directory is set to `backend/server`
2. All environment variables are present
3. Build logs show correct package.json found
4. Health check endpoint is responding 