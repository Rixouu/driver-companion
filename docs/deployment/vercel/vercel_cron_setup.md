# Vercel Cron Setup Guide

This guide explains how to use Vercel Pro cron jobs for scheduled notifications.

## Overview

Vercel Pro provides reliable cron job functionality that runs every hour to process:
- Quotation expiry notifications (24h and 2h before expiry)
- Booking reminder notifications (24h and 2h before start)
- Mark expired quotations as 'expired'

## Configuration

### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/notifications/scheduled",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule Options:**
- `0 * * * *` - Every hour (recommended)
- `0 */2 * * *` - Every 2 hours
- `0 9,17 * * *` - Twice daily (9 AM and 5 PM)
- `0 9 * * *` - Once daily at 9 AM

## Testing

### 1. Setup Test Data
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run test data setup
node scripts/setup-test-notifications.js
```

### 2. Manual Testing
```bash
# Test the cron job manually
curl -X POST https://my.japandriver.com/api/notifications/test-cron

# Check upcoming notifications
curl https://my.japandriver.com/api/notifications/test-cron

# Check production cron (requires auth)
curl -X POST https://my.japandriver.com/api/notifications/scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Monitor Vercel Cron
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Functions** tab
4. Look for cron job executions
5. Check logs for any errors

## Environment Variables

Required for cron jobs:
```bash
CRON_SECRET=your-secure-cron-secret-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Monitoring

### Check Notifications
```sql
-- Check recent notifications
SELECT * FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check notification types
SELECT type, COUNT(*) as count
FROM notifications 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY type;
```

### Vercel Logs
1. Go to Vercel Dashboard → Functions
2. Click on your cron function
3. View execution logs and metrics
4. Check for any errors or timeouts

## Troubleshooting

### Common Issues

1. **Cron not running**:
   - Check Vercel Pro subscription
   - Verify cron configuration in vercel.json
   - Check function logs in Vercel dashboard

2. **Notifications not created**:
   - Verify database connection
   - Check service role key permissions
   - Review notification service logs

3. **Duplicate notifications**:
   - Check deduplication logic in notification service
   - Verify notification table constraints

### Debug Steps

1. **Test API endpoint**:
   ```bash
   curl -X POST https://my.japandriver.com/api/notifications/test-cron
   ```

2. **Check database**:
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
   ```

3. **Review logs**:
   - Vercel function logs
   - Application console logs
   - Database query logs

## Benefits of Vercel Pro Cron

- ✅ **Reliable**: Built on Vercel's infrastructure
- ✅ **Monitored**: Full dashboard with execution logs
- ✅ **Integrated**: Native Next.js API routes
- ✅ **Cost-effective**: Included in Vercel Pro ($20/month)
- ✅ **Flexible**: Easy to modify schedules and logic
- ✅ **Debuggable**: Clear error messages and logs
