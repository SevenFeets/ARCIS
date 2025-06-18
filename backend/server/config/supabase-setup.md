# 🚀 ARCIS + Supabase PostgreSQL Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project:
   - **Project Name**: `arcis-weapon-detection`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your deployment

## Step 2: Get Connection Details

From your Supabase dashboard:
```bash
# Database Settings → Connection string
DATABASE_URL=postgresql://postgres:[SUPABASE-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**⚠️ IMPORTANT**: 
- `[SUPABASE-PASSWORD]` = The password you created when setting up your Supabase project
- `[PROJECT-REF]` = Your unique project reference (e.g., `abcdefghijklmnop`)
- This is **NOT** your local PostgreSQL password (`4wrdjz67` from your `.env` file)

## Step 3: Update Environment Variables

Create/update `backend/server/.env`:
```env
# Supabase PostgreSQL Configuration  
DB_HOST=db.abcdefghijklmnop.supabase.co  # Replace with your PROJECT-REF
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-password      # The NEW password from Supabase (NOT 4wrdjz67)
DB_PORT=5432

# Connection string format (alternative)
DATABASE_URL=postgresql://postgres:your-supabase-password@db.abcdefghijklmnop.supabase.co:5432/postgres

# Server Configuration
PORT=5000
JWT_SECRET=your-jwt-secret-key

# Rate limiting (optional)
ARCJET_KEY=test-key
```

**🔄 Two Different Passwords:**
- **Local PostgreSQL**: `DB_PASSWORD=4wrdjz67` (your current local setup)
- **Supabase**: `DB_PASSWORD=your-supabase-password` (the new cloud database)

## Step 4: Initialize ARCIS Schema

Run the initialization:
```bash
cd backend/server
npm install
node test/initializeOnly.js
```

Expected output:
```
✅ Database connected successfully
✅ ARCIS database schema initialized successfully
```

## Step 5: Test the Setup

```bash
# Test database connection
node test/checkDatabase.js

# Test weapon detection endpoints
node test/testWeaponDetection.js

# Start the server
npm run dev
```

## Step 6: Configure Supabase Policies (Optional)

In Supabase SQL Editor, run:
```sql
-- Enable Row Level Security for production
ALTER TABLE arcis.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcis.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcis.users ENABLE ROW LEVEL SECURITY;

-- Allow service key access (for your backend)
CREATE POLICY "Allow service key access" ON arcis.detections
FOR ALL USING (true);

CREATE POLICY "Allow service key access" ON arcis.alerts  
FOR ALL USING (true);

CREATE POLICY "Allow service key access" ON arcis.users
FOR ALL USING (true);
```

## 🎯 Supabase Advantages for ARCIS

### Real-time Capabilities
```javascript
// Optional: Add real-time detection alerts
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Listen for new weapon detections
supabase
    .channel('detections')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'arcis',
        table: 'detections'
    }, (payload) => {
        console.log('🚨 New weapon detection:', payload.new);
        // Trigger alerts, notifications, etc.
    })
    .subscribe();
```

### Built-in Authentication Integration
```javascript
// Easy integration with your existing auth
const authUser = await supabase.auth.getUser();
const dbUser = await dbUtils.users.findById(authUser.id);
```

## 📊 Monitoring and Scaling

### Database Monitoring
- **Dashboard**: Monitor query performance
- **Logs**: Track detection API calls
- **Metrics**: Watch connection usage

### When to Upgrade
- If you exceed 500MB (detection images add up)
- Need more than 2 concurrent connections
- Require connection pooling for high traffic

### Migration Path
```bash
# Export data before scaling
pg_dump $DATABASE_URL > arcis_backup.sql

# Import to larger tier
psql $NEW_DATABASE_URL < arcis_backup.sql
```

## 🔒 Security Best Practices

1. **Use Connection String**: More secure than individual credentials
2. **Enable SSL**: Always use SSL in production
3. **Row Level Security**: Enable for sensitive data
4. **API Keys**: Use Supabase service key for backend
5. **Environment Variables**: Never commit credentials

## 🚀 Next Steps

1. **Set up Supabase project** ✅
2. **Update environment variables** ✅  
3. **Initialize ARCIS schema** ✅
4. **Test weapon detection endpoints** ✅
5. **Deploy your detection devices** 🎯
6. **Monitor real-time detections** 📊

---

**Need help?** Check the troubleshooting section or contact support. 