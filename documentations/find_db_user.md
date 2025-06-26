# 🔍 Finding Your Supabase DB_USER

## 📋 **From Your Current Configuration**

Your Supabase URL: `https://emjcotfxcqewhhvhjjof.supabase.co`

### **✅ Your DB_USER is:**
```
DB_USER=postgres.emjcotfxcqewhhvhjjof
```

## 🔧 **How This Works**
The DB_USER format for Supabase is: `postgres.{project-ref}`

Where `{project-ref}` is extracted from your Supabase URL:
- **URL**: `https://emjcotfxcqewhhvhjjof.supabase.co`
- **Project Ref**: `emjcotfxcqewhhvhjjof`
- **DB_USER**: `postgres.emjcotfxcqewhhvhjjof`

## 🔐 **Complete Railway Environment Variables**

```bash
# Database (Supabase)
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PASSWORD=YOUR_SUPABASE_PASSWORD_HERE
DB_NAME=postgres
DB_USER=postgres.emjcotfxcqewhhvhjjof
DB_PORT=6543

# API Security
API_KEY_JETSON=test-jetson-key
API_KEY_RASPBERRY=test-raspberry-pi-key

# Node Environment
NODE_ENV=production
```

## 📍 **Where to Find Your DB_PASSWORD**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `emjcotfxcqewhhvhjjof`
3. Go to **Settings** → **Database**
4. Look for **Connection pooling** section
5. The password will be shown there (or you can reset it)

## ✅ **Alternative Method - Via Supabase Dashboard**

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection pooling** section will show:
   - **Host**: `aws-0-us-west-1.pooler.supabase.com`
   - **Database**: `postgres`
   - **Username**: `postgres.emjcotfxcqewhhvhjjof`
   - **Port**: `6543`
   - **Password**: [Your password]

## 🎯 **Ready for Railway Deployment**

You can now use these environment variables in your new Railway project:

```bash
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PASSWORD=[Get from Supabase Dashboard]
DB_NAME=postgres
DB_USER=postgres.emjcotfxcqewhhvhjjof
DB_PORT=6543
API_KEY_JETSON=test-jetson-key
API_KEY_RASPBERRY=test-raspberry-pi-key
NODE_ENV=production
``` 