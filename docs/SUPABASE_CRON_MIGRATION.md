# Supabase Cron Migration Guide

This guide explains how to migrate from Vercel cron jobs to Supabase Edge Functions with built-in cron scheduling.

## Why Supabase Cron?

### Benefits over Vercel Cron:
- ✅ **Everything in one place** - Database + Functions + Scheduling
- ✅ **Better performance** - Functions run closer to your database
- ✅ **More reliable** - No external dependencies or API limits
- ✅ **More frequent execution** - No 1-hour minimum like Vercel Hobby
- ✅ **Better monitoring** - Built-in logs and metrics
- ✅ **Cost effective** - Included in Pro plan

## Migration Steps

### 1. Deploy Edge Function

```bash
# Deploy the scheduled notifications function
./deploy-supabase-cron.sh
```

### 2. Configure Cron in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Database > Cron Jobs**
4. Click **Create a new cron job**
5. Configure:
   - **Function**: `scheduled-notifications`
   - **Schedule**: `0 * * * *` (every hour)
   - **Timezone**: `UTC`
   - **Enabled**: `true`

### 3. Test the Function

```bash
# Test the function manually
curl -X POST https://your-project.supabase.co/functions/v1/scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 4. Remove Vercel Cron Configuration

Remove these files/endpoints:
- `app/api/notifications/scheduled/route.ts` (optional - keep for manual testing)
- Vercel cron configuration in `vercel.json`

## Function Details

### What it does:
- **Quotation Expiry Notifications**:
  - 24 hours before expiry
  - 2 hours before expiry
  - Mark as expired when past due

- **Booking Reminder Notifications**:
  - 24 hours before booking
  - 2 hours before booking

### Schedule Options:
- `0 * * * *` - Every hour (recommended)
- `0 */2 * * *` - Every 2 hours
- `0 9,17 * * *` - Twice daily (9 AM and 5 PM)
- `0 9 * * *` - Once daily at 9 AM

## Monitoring

### View Logs:
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions > scheduled-notifications**
3. Click **Logs** tab

### Monitor Performance:
- Function execution time
- Success/failure rates
- Error messages

## Environment Variables

The function uses these environment variables (automatically available):
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

## Troubleshooting

### Common Issues:

1. **Function not running**:
   - Check cron job is enabled in dashboard
   - Verify function deployment was successful
   - Check function logs for errors

2. **Database connection errors**:
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Check database permissions

3. **Notifications not created**:
   - Check function logs for specific errors
   - Verify notification types exist in database
   - Check quotation/booking data exists

### Debug Mode:

Add this to test locally:
```bash
# Start local Supabase
supabase start

# Test function locally
supabase functions serve scheduled-notifications
```

## Cost Comparison

### Vercel Hobby:
- ❌ 1-hour minimum cron interval
- ❌ Limited to 100GB-hours/month
- ❌ External API dependency

### Supabase Pro:
- ✅ No minimum interval
- ✅ 500,000 function invocations/month
- ✅ Direct database access
- ✅ Built-in monitoring

## Migration Checklist

- [ ] Deploy Edge Function
- [ ] Configure cron job in Supabase Dashboard
- [ ] Test function manually
- [ ] Verify notifications are created
- [ ] Remove Vercel cron configuration
- [ ] Update documentation
- [ ] Monitor for 24-48 hours

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Review function code in `supabase/functions/scheduled-notifications/`
3. Test with manual function invocation
4. Check database permissions and data
