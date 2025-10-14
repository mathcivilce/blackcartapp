#!/bin/bash

# Supabase Edge Function Deployment Script
# Run this to deploy the order sync edge function

echo "🚀 Deploying Supabase Edge Function..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Supabase login..."
supabase projects list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Link project if not already linked
echo "🔗 Linking to project ezzpivxxdxcdnmerrcbt..."
supabase link --project-ref ezzpivxxdxcdnmerrcbt
echo ""

# Deploy edge function
echo "📦 Deploying sync-orders edge function..."
supabase functions deploy sync-orders --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Edge function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables:"
    echo "   supabase secrets set SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co"
    echo "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "2. Run the SQL migrations in Supabase SQL Editor:"
    echo "   - supabase/migrations/setup_cron_job.sql"
    echo ""
    echo "3. Test the function:"
    echo "   curl -X POST https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders \\"
    echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
    echo "     -d '{\"days_back\": 7}'"
else
    echo ""
    echo "❌ Deployment failed"
    exit 1
fi

