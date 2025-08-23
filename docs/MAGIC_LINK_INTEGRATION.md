# Magic Link Integration for Quote Access

This document describes the magic link system that allows customers to access their quotes without creating an account.

## 🎯 **Overview**

The magic link system provides secure, time-limited access to quotations for customers. It eliminates the need for account creation while maintaining security through unique tokens and expiration dates.

## 🏗️ **Architecture**

### **Components:**

1. **Magic Link Generator** - Admin interface to create magic links
2. **Magic Link API** - Backend endpoints for generation and validation
3. **Quote Access Page** - Customer-facing page to view quotes
4. **Database Table** - Stores magic link tokens and metadata

### **Flow:**

1. Admin generates magic link for a specific quotation
2. System creates unique token and sets expiration
3. Admin shares link with customer
4. Customer clicks link to access quote
5. System validates token and displays quote
6. Link is marked as used (optional)

## 🔧 **Setup**

### **Environment Variables:**

```bash
# Add to your .env.local
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### **Database Migration:**

Run the migration to create the required table:

```sql
-- Run the migration file:
-- database/migrations/20250111_create_quotation_magic_links.sql
```

## 📱 **Usage**

### **For Admins:**

1. Go to any quotation detail page
2. Find the "Magic Link Generator" in the sidebar
3. Choose expiration time (default: 7 days)
4. Click "Generate Magic Link"
5. Copy the link or send via email

### **For Customers:**

1. Click the magic link received from admin
2. View quote details without login
3. Link expires automatically after set time

## 🛡️ **Security Features**

- **Unique Tokens**: Each link has a cryptographically secure UUID
- **Time Expiration**: Links automatically expire (configurable: 1-30 days)
- **Single Use**: Links can be marked as used (configurable)
- **Email Verification**: Links are tied to specific customer emails
- **RLS Policies**: Database-level security with Supabase

## 🔌 **API Endpoints**

### **Generate Magic Link:**
```
POST /api/quotations/generate-magic-link
Body: { quotation_id, customer_email, expires_in_hours }
```

### **Validate Magic Link:**
```
POST /api/quotations/validate-magic-link
Body: { token }
```

## 🎨 **Customization**

### **Expiration Times:**
- 24 hours (1 day)
- 72 hours (3 days)
- 168 hours (7 days) - **Default**
- 336 hours (14 days)
- 720 hours (30 days)

### **Link Format:**
```
https://your-domain.com/quote-access/{token}
```

## 📊 **Database Schema**

### **quotation_magic_links Table:**
```sql
- id: UUID (Primary Key)
- quotation_id: UUID (References quotations)
- customer_email: TEXT
- token: TEXT (Unique)
- expires_at: TIMESTAMP
- is_used: BOOLEAN
- used_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### **quotations Table (New Columns):**
```sql
- magic_link_generated_at: TIMESTAMP
- magic_link_expires_at: TIMESTAMP
```

## 🚀 **Benefits**

1. **No Account Required** - Customers can view quotes immediately
2. **Secure Access** - Unique tokens prevent unauthorized access
3. **Time-Limited** - Links expire automatically for security
4. **Easy Sharing** - Simple URL sharing via email or messaging
5. **Professional** - Clean, branded quote viewing experience
6. **Trackable** - Monitor link generation and usage

## 🔍 **Monitoring**

### **Track Magic Link Usage:**
- When links are generated
- When links are accessed
- Expiration dates
- Usage statistics

### **Security Monitoring:**
- Invalid token attempts
- Expired link access attempts
- Multiple access attempts

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Link Not Working:**
   - Check if link has expired
   - Verify token exists in database
   - Check customer email matches

2. **Permission Errors:**
   - Ensure RLS policies are correct
   - Verify service role permissions
   - Check database connection

3. **Expired Links:**
   - Generate new link for customer
   - Adjust expiration time if needed
   - Check timezone settings

## 🔮 **Future Enhancements**

- **Multiple Use Links** - Allow links to be used multiple times
- **Link Analytics** - Track views, downloads, and interactions
- **Custom Expiration** - Allow admins to set custom expiration times
- **Bulk Generation** - Generate multiple links at once
- **Link Templates** - Customize email templates for magic links
- **Integration** - Connect with email marketing platforms

## 📝 **Notes**

- Magic links are stored securely in the database
- Each link is tied to a specific quotation and customer
- Links can be regenerated if needed
- The system automatically handles expiration
- No customer data is stored beyond the magic link metadata
