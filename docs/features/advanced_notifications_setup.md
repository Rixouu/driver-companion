# Advanced Notifications & Branding Setup Guide

## 🚀 **Complete Setup Instructions**

### **Step 1: Run the Database Migration**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire contents of:**
   ```
   database/migrations/20241224000002_advanced_notifications_and_branding.sql
   ```
4. **Execute the migration**

This will create:
- ✅ `notification_templates` table
- ✅ `notification_preferences` table  
- ✅ `notification_schedules` table
- ✅ `company_branding` table
- ✅ `email_branding` table
- ✅ `document_branding` table
- ✅ `client_portal_branding` table
- ✅ `notification_logs` table
- ✅ All necessary indexes and functions
- ✅ Default data and templates

### **Step 2: Verify Database Tables**

Run this query in Supabase SQL Editor to verify everything was created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'notification_templates',
  'notification_preferences', 
  'notification_schedules',
  'company_branding',
  'email_branding',
  'document_branding',
  'client_portal_branding',
  'notification_logs'
)
ORDER BY table_name;
```

### **Step 3: Check Default Data**

Verify default data was inserted:

```sql
-- Check notification templates
SELECT name, type, category, is_default FROM notification_templates;

-- Check company branding
SELECT company_name, primary_color FROM company_branding;

-- Check email branding  
SELECT email_signature FROM email_branding;
```

### **Step 4: File Structure Verification**

Ensure all these files exist in your project:

```
📁 app/api/admin/
├── notification-templates/route.ts ✅
├── branding/route.ts ✅
├── notification-preferences/route.ts ✅
└── fix-customer-notes/route.ts ✅

📁 lib/hooks/
├── use-notification-templates.ts ✅
├── use-branding.ts ✅
└── use-notification-preferences.ts ✅

📁 components/settings/
├── notification-management.tsx ✅
├── branding-management.tsx ✅
└── user-management.tsx ✅

📁 database/migrations/
└── 20241224000002_advanced_notifications_and_branding.sql ✅
```

### **Step 5: Integration into Settings Page**

Add the new components to your settings page:

```tsx
// In your settings page component
import { NotificationManagement } from '@/components/settings/notification-management'
import { BrandingManagement } from '@/components/settings/branding-management'

// Add new tabs to your settings
<TabsContent value="notifications">
  <NotificationManagement />
</TabsContent>

<TabsContent value="branding">
  <BrandingManagement />
</TabsContent>
```

### **Step 6: Test the System**

1. **Test API Endpoints:**
   ```bash
   # Test notification templates
   curl http://localhost:3000/api/admin/notification-templates
   
   # Test branding
   curl http://localhost:3000/api/admin/branding
   ```

2. **Test UI Components:**
   - Navigate to Settings → Notifications
   - Create a new email template
   - Test template preview
   - Navigate to Settings → Branding
   - Update company colors
   - Test live preview

### **Step 7: Environment Variables (Optional)**

If you want to add email sending capabilities, add these to your `.env.local`:

```env
# Email service (Resend recommended)
RESEND_API_KEY=your_resend_api_key

# File upload (for logo uploads)
UPLOAD_DIR=./public/uploads
```

## 🎯 **Features Available After Setup**

### **Notification Management**
- ✅ Create/edit email templates with HTML and text versions
- ✅ Template variables system (`{{booking_id}}`, `{{customer_name}}`, etc.)
- ✅ Template preview and test sending
- ✅ Category filtering (booking, quotation, maintenance, system)
- ✅ Active/inactive template toggling
- ✅ Default template management

### **Branding & White-Labeling**
- ✅ Company logo upload (main, dark, favicon)
- ✅ Color scheme management with presets
- ✅ Typography settings (font family, size, border radius)
- ✅ Email branding (headers, footers, signatures)
- ✅ Document branding (PDF templates, watermarks)
- ✅ Client portal customization (CSS, welcome messages)
- ✅ Live preview functionality

### **User Preferences**
- ✅ Per-user notification preferences
- ✅ Quiet hours configuration
- ✅ Frequency settings (immediate, daily, weekly, never)
- ✅ Timezone support

## 🔧 **Troubleshooting**

### **If Migration Fails:**
1. Check for existing tables with same names
2. Verify you have proper permissions in Supabase
3. Check the Supabase logs for specific error messages

### **If API Endpoints Don't Work:**
1. Verify the files are in the correct locations
2. Check your Supabase service client configuration
3. Ensure the database tables exist

### **If UI Components Don't Load:**
1. Check browser console for errors
2. Verify all imports are correct
3. Ensure the components are properly integrated into your settings page

## 📞 **Support**

If you encounter any issues:
1. Check the Supabase logs
2. Verify all files are in place
3. Test the API endpoints individually
4. Check browser console for JavaScript errors

The system is designed to be robust and handle errors gracefully with proper user feedback.
