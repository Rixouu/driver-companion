#!/bin/bash

# Deploy Supabase Edge Functions with Cron
# This script deploys the scheduled notifications function to Supabase

echo "🚀 Deploying Supabase Edge Functions with Cron..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo ""
    echo "Alternative deployment methods:"
    echo "1. Start Docker Desktop and run this script again"
    echo "2. Deploy manually via Supabase Dashboard:"
    echo "   - Go to Edge Functions in your Supabase Dashboard"
    echo "   - Create new function: scheduled-notifications"
    echo "   - Copy the code from supabase/functions/scheduled-notifications/index.ts"
    echo "   - Deploy the function"
    echo ""
    echo "3. Use Supabase CLI with remote deployment:"
    echo "   supabase functions deploy scheduled-notifications --no-verify-jwt"
    exit 1
fi

# Deploy the function
echo "📦 Deploying scheduled-notifications function..."
supabase functions deploy scheduled-notifications

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    
    # Note: Cron configuration needs to be set up in the Supabase Dashboard
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to your Supabase Dashboard"
    echo "2. Navigate to Database > Cron Jobs"
    echo "3. Create a new cron job with these settings:"
    echo "   - Function: scheduled-notifications"
    echo "   - Schedule: 0 * * * * (every hour)"
    echo "   - Timezone: UTC"
    echo ""
    echo "🔗 Supabase Dashboard: https://supabase.com/dashboard"
    
else
    echo "❌ Function deployment failed!"
    echo ""
    echo "Try deploying manually via Supabase Dashboard or ensure Docker is running."
    exit 1
fi
