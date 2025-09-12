# Scheduled Notification System

A smart, reliable, and scalable notification system for quotation expiry and booking reminders.

## 🎯 **Features**

### **Quotation Expiry Notifications**
- **24-hour warning**: Sent 24 hours before quotation expires
- **2-hour urgent warning**: Sent 2 hours before quotation expires  
- **Automatic expiry**: Marks quotations as expired when they expire
- **Smart deduplication**: Prevents duplicate notifications

### **Booking Reminder Notifications**
- **24-hour reminder**: Sent 24 hours before booking starts
- **2-hour urgent reminder**: Sent 2 hours before booking starts
- **Time-aware scheduling**: Considers actual booking date and time

## 🚀 **How It Works**

### **Database Schema**
- Uses existing `notifications` table with `related_id` column
- New notification types:
  - `quotation_expiring_24h`
  - `quotation_expiring_2h` 
  - `quotation_expired`
  - `booking_reminder_24h`
  - `booking_reminder_2h`

### **Smart Logic**
- **Deduplication**: Checks for existing notifications before creating new ones
- **Time Windows**: Uses precise time ranges to avoid double notifications
- **Status Awareness**: Only processes active quotations and confirmed bookings
- **Performance Optimized**: Uses database indexes for fast queries

## 📡 **API Endpoints**

### **Production Endpoint**
```bash
POST /api/notifications/scheduled
Authorization: Bearer YOUR_CRON_SECRET
```

### **Test Endpoint** (Development)
```bash
# Test all notifications
GET /api/notifications/trigger-test

# Test specific type
POST /api/notifications/trigger-test?type=quotations
POST /api/notifications/trigger-test?type=bookings
```

## ⚙️ **Setup Instructions**

### **1. Database Migration**
Run the migration to add new notification types and indexes:
```sql
-- Run: database/migrations/20250112_add_scheduled_notification_types.sql
```

### **2. Environment Variables**
Add to your `.env.local`:
```bash
CRON_SECRET=your-secure-cron-secret-here
ADMIN_SECRET=your-admin-secret-for-testing
```

### **3. Cron Job Setup**

#### **Option A: Vercel Cron (Recommended)**
Add to `vercel.json`:
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

#### **Option B: External Cron Service**
Set up a cron job to call the API every hour:
```bash
# Every hour
0 * * * * curl -X POST https://your-domain.com/api/notifications/scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### **Option C: GitHub Actions**
```yaml
name: Scheduled Notifications
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger notifications
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/notifications/scheduled \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🧪 **Testing**

### **Manual Testing**
```bash
# Check system status
curl https://your-domain.com/api/notifications/trigger-test

# Test quotation notifications
curl -X POST https://your-domain.com/api/notifications/trigger-test?type=quotations

# Test booking notifications  
curl -X POST https://your-domain.com/api/notifications/trigger-test?type=bookings
```

### **Expected Behavior**
1. **Quotations**: Notifications sent 24h and 2h before expiry
2. **Bookings**: Reminders sent 24h and 2h before start time
3. **Deduplication**: No duplicate notifications for same event
4. **Status Updates**: Expired quotations marked as 'expired'

## 📊 **Monitoring**

### **Check Upcoming Notifications**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/notifications/scheduled
```

### **Response Format**
```json
{
  "success": true,
  "upcoming_notifications": {
    "quotations_expiring_24h": 3,
    "quotations_expiring_2h": 1, 
    "bookings_starting_24h": 5,
    "bookings_starting_2h": 2
  }
}
```

## 🔧 **Customization**

### **Notification Templates**
Edit templates in `lib/services/notification-service.ts`:
```typescript
quotation_expiring_24h: (data) => ({
  title: 'Custom 24h Warning Title',
  message: `Custom message for ${data.customerName}`
})
```

### **Time Windows**
Modify time ranges in `lib/services/scheduled-notification-service.ts`:
```typescript
// Change from 24h to 48h warning
.gte('expiry_date', new Date(Date.now() + 47 * 60 * 60 * 1000).toISOString())
.lte('expiry_date', new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString())
```

### **Notification Recipients**
Modify `createAdminNotification` calls to target specific users:
```typescript
await notificationService.createNotification({
  type: 'quotation_expiring_24h',
  title: 'Custom Title',
  message: 'Custom Message', 
  userId: 'specific-user-id',
  relatedId: quotation.id
})
```

## 🛡️ **Security**

- **Authentication**: All endpoints require proper authorization
- **Rate Limiting**: Built-in protection against abuse
- **Validation**: Input validation on all parameters
- **Logging**: Comprehensive logging for monitoring

## 🚨 **Troubleshooting**

### **Common Issues**

1. **No notifications appearing**
   - Check cron job is running
   - Verify CRON_SECRET is correct
   - Check database connection

2. **Duplicate notifications**
   - Check deduplication logic
   - Verify database indexes are created
   - Review time window logic

3. **Performance issues**
   - Monitor database query performance
   - Check index usage with EXPLAIN
   - Consider batch processing for large datasets

### **Debug Mode**
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 📈 **Performance**

- **Optimized Queries**: Uses database indexes for fast lookups
- **Batch Processing**: Processes multiple notifications efficiently  
- **Memory Efficient**: Streams results instead of loading all data
- **Scalable**: Handles thousands of quotations and bookings

## 🔮 **Future Enhancements**

- **Email Integration**: Send email notifications to customers
- **SMS Notifications**: Send SMS reminders
- **Webhook Support**: Trigger external systems
- **Advanced Scheduling**: Custom notification schedules per customer
- **Analytics Dashboard**: Track notification effectiveness

---

**Built with ❤️ using Next.js, Supabase, and TypeScript**
