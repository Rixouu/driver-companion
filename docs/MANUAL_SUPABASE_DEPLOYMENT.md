# Manual Supabase Edge Function Deployment

Since Docker is not available, here's how to deploy the scheduled notifications function manually via the Supabase Dashboard.

## Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Driver Japan Fleet Management**
3. Navigate to **Edge Functions**

## Step 2: Create New Function

1. Click **Create a new function**
2. Set function name: `scheduled-notifications`
3. Click **Create function**

## Step 3: Add Function Code

Copy the entire contents of `supabase/functions/scheduled-notifications/index.ts` and paste it into the function editor.

## Step 4: Deploy Function

1. Click **Deploy** button
2. Wait for deployment to complete
3. Note the function URL (you'll need this for cron setup)

## Step 5: Configure Cron Job

1. Go to **Database > Cron Jobs** in your Supabase Dashboard
2. Click **Create a new cron job**
3. Configure:
   - **Function**: `scheduled-notifications`
   - **Schedule**: `0 * * * *` (every hour)
   - **Timezone**: `UTC`
   - **Enabled**: `true`
4. Click **Create cron job**

## Step 6: Test the Function

### Manual Test:
```bash
curl -X POST https://oxahlhhddnatkiymemgz.supabase.co/functions/v1/scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Check Logs:
1. Go to **Edge Functions > scheduled-notifications**
2. Click **Logs** tab
3. Look for execution logs and any errors

## Step 7: Verify Notifications

1. Check your notifications table in the database
2. Look for new notifications created by the function
3. Verify the notification types:
   - `quotation_expiring_24h`
   - `quotation_expiring_2h`
   - `quotation_expired`
   - `booking_reminder_24h`
   - `booking_reminder_2h`

## Troubleshooting

### Common Issues:

1. **Function not executing**:
   - Check cron job is enabled
   - Verify function deployment was successful
   - Check function logs for errors

2. **Database connection errors**:
   - Function uses service role key automatically
   - Check if database is accessible

3. **No notifications created**:
   - Check if there are quotations/bookings in the database
   - Verify the date/time logic in the function
   - Check function logs for specific errors

### Debug Steps:

1. **Check Function Logs**:
   - Go to Edge Functions > scheduled-notifications > Logs
   - Look for error messages or execution details

2. **Test with Sample Data**:
   - Create a test quotation with expiry date in 1 hour
   - Run the function manually
   - Check if notification is created

3. **Verify Database Schema**:
   - Ensure `notifications` table exists
   - Check required columns are present
   - Verify data types match function expectations

## Function Code Reference

The function handles:
- **Quotation expiry notifications** (24h, 2h, expired)
- **Booking reminder notifications** (24h, 2h)
- **Duplicate prevention** (checks existing notifications)
- **Error handling** and logging

## Monitoring

After deployment, monitor:
- Function execution frequency
- Success/failure rates
- Database performance impact
- Notification creation accuracy

## Next Steps

Once the function is working:
1. Remove Vercel cron configuration
2. Update documentation
3. Monitor for 24-48 hours
4. Adjust schedule if needed
