# Notification System Monitoring

## 🎯 **What the System Currently Monitors**

### **1. Quotation Expiry Notifications**

#### **24-Hour Warning** (`quotation_expiring_24h`)
- **When**: 23-25 hours before quotation expires
- **Conditions**:
  - Quotation status = `'sent'`
  - Expiry date is between 23-25 hours from now
  - Not converted to booking (`converted_to_booking_id` is null)
- **Notification**: Sent to all admin users
- **Deduplication**: Checks if notification already exists

#### **2-Hour Urgent Warning** (`quotation_expiring_2h`)
- **When**: 1.5-2.5 hours before quotation expires
- **Conditions**:
  - Quotation status = `'sent'`
  - Expiry date is between 1.5-2.5 hours from now
  - Not converted to booking
- **Notification**: Sent to all admin users
- **Deduplication**: Checks if notification already exists

#### **Expired Quotations** (`quotation_expired`)
- **When**: Quotation has passed its expiry date
- **Actions**:
  - Updates quotation status to `'expired'`
  - Sends notification to all admin users
- **Deduplication**: Checks if notification already exists

### **2. Booking Reminder Notifications**

#### **24-Hour Reminder** (`booking_reminder_24h`)
- **When**: 24 hours before booking starts
- **Conditions**:
  - Booking status = `'confirmed'` or `'pending'`
  - Booking date is tomorrow
- **Notification**: Sent to all admin users
- **Deduplication**: Checks if notification already exists

#### **2-Hour Urgent Reminder** (`booking_reminder_2h`)
- **When**: 1.5-2.5 hours before booking starts
- **Conditions**:
  - Booking status = `'confirmed'` or `'pending'`
  - Booking is today
  - Time difference is between 1.5-2.5 hours
- **Notification**: Sent to all admin users
- **Deduplication**: Checks if notification already exists

## ⏰ **Cron Schedule**

- **Frequency**: Every 5 minutes (`*/5 * * * *`)
- **Endpoint**: `/api/notifications/cron`
- **Authentication**: None required (Vercel cron jobs are inherently secure)

## 👥 **Notification Recipients**

- **Admin Users**: All users in the `admin_users` table
- **Current Count**: 12 admin users (mix of ADMIN and USER roles)
- **Service Client**: Uses service role key to bypass RLS policies

## 🔍 **Current Monitoring Status**

Based on the debug script output:

### **✅ Working Components**
- Database connections working
- Admin users found (12 users)
- Notification creation working
- Recent notifications exist in system

### **📊 Current Data**
- **Quotations expiring in 24h**: 0
- **Bookings starting tomorrow**: 0
- **Recent notifications**: 1 (booking_reminder_2h from 4 days ago)

## 🛠️ **Recent Fixes Applied**

1. **Fixed API Parameter Mismatch**: Corrected `createAdminNotification` calls to use proper data structure
2. **Updated Cron Schedule**: Changed from hourly to every 5 minutes
3. **Fixed Admin User Fetching**: Uses service client to bypass RLS policies
4. **Improved Error Handling**: Better logging and error reporting

## 🧪 **Testing**

### **Manual Test**
```bash
# Test the cron endpoint
curl -X POST https://my.japandriver.com/api/notifications/cron

# Test locally
curl -X POST http://localhost:3000/api/notifications/cron
```

### **Debug Script**
```bash
# Run comprehensive debug
node scripts/debug-notifications.js
```

## 📈 **Expected Behavior**

1. **Every 5 minutes**: System checks for expiring quotations and upcoming bookings
2. **Notifications appear**: In the notification bell icon in the UI
3. **Admin users receive**: All relevant notifications based on their role
4. **Deduplication**: No duplicate notifications for the same event
5. **Status updates**: Expired quotations automatically marked as expired

## 🔧 **Monitoring**

- **Vercel Dashboard**: Check Functions tab for cron executions
- **Logs**: Console logs show processing details
- **Database**: Check `notifications` table for created notifications
- **UI**: Notification bell icon shows recent notifications
