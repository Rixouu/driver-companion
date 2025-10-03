# 📧 Email Route Migration Guide - Complete Reference

## 🎯 **Overview**

This guide provides a comprehensive reference for migrating all email-related API routes from the old hardcoded system to the new unified email system. Currently, only **3 out of 90 email routes** are using the unified system.

## 📊 **Current Migration Status**

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ **Unified Routes** | 3 | 3% |
| ⚠️ **Old Routes** | 87 | 97% |
| **Total** | 90 | 100% |

## 🚀 **Unified Routes (Already Migrated)**

### ✅ **Working Routes**
| Route | Purpose | Status |
|-------|---------|--------|
| `POST /api/quotations/send-email-unified` | Send quotation emails | ✅ Active |
| `POST /api/bookings/send-email-unified` | Send booking emails | ✅ Active |
| `GET/POST /api/admin/email-templates` | Template management | ✅ Active |

## ⚠️ **Routes Needing Migration**

### 🔴 **HIGH PRIORITY - Core Email Routes**

#### **Quotation Emails**
| Old Route | New Route | Migration Status | Priority |
|-----------|-----------|------------------|----------|
| `POST /api/quotations/send-email-optimized` | `POST /api/quotations/send-email-unified` | ✅ **DONE** | High |
| `POST /api/quotations/send-email` | `POST /api/quotations/send-email-unified` | ❌ Pending | High |
| `POST /api/quotations/send-reminder` | `POST /api/quotations/send-email-unified` | ❌ Pending | High |
| `POST /api/quotations/send-payment-link-email` | `POST /api/quotations/send-email-unified` | ❌ Pending | High |
| `POST /api/quotations/send-payment-complete-email` | `POST /api/quotations/send-email-unified` | ❌ Pending | High |
| `POST /api/quotations/send-magic-link-email` | `POST /api/quotations/send-email-unified` | ❌ Pending | High |
| `POST /api/quotations/send-invoice-email` | `POST /api/quotations/send-email-unified` | ❌ Pending | High |

#### **Booking Emails**
| Old Route | New Route | Migration Status | Priority |
|-----------|-----------|------------------|----------|
| `POST /api/bookings/send-email-unified` | `POST /api/bookings/send-email-unified` | ✅ **DONE** | High |
| `POST /api/bookings/send-booking-details` | `POST /api/bookings/send-email-unified` | ❌ Pending | High |
| `POST /api/bookings/send-booking-invoice` | `POST /api/bookings/send-email-unified` | ❌ Pending | High |
| `POST /api/bookings/send-payment-complete-email` | `POST /api/bookings/send-email-unified` | ❌ Pending | High |

### 🟡 **MEDIUM PRIORITY - Payment & Notification Routes**

#### **Payment Emails**
| Old Route | New Route | Migration Status | Priority |
|-----------|-----------|------------------|----------|
| `POST /api/send-invoice-email` | `POST /api/quotations/send-email-unified` | ❌ Pending | Medium |
| `POST /api/bookings/generate-payment-link` | `POST /api/bookings/send-email-unified` | ❌ Pending | Medium |
| `POST /api/bookings/regenerate-payment-link` | `POST /api/bookings/send-email-unified` | ❌ Pending | Medium |

#### **System Notifications**
| Old Route | New Route | Migration Status | Priority |
|-----------|-----------|------------------|----------|
| `POST /api/email/send-template` | `POST /api/admin/email-templates` | ❌ Pending | Medium |
| `POST /api/notifications/trigger-test` | `POST /api/admin/email-templates` | ❌ Pending | Medium |

### 🟢 **LOW PRIORITY - Utility & Debug Routes**

#### **Debug & Test Routes**
| Old Route | New Route | Migration Status | Priority |
|-----------|-----------|------------------|----------|
| `POST /api/quotations/send-test` | `POST /api/quotations/send-email-unified` | ❌ Pending | Low |
| `POST /api/trip-reminders/test` | `POST /api/admin/email-templates` | ❌ Pending | Low |

## 🔧 **Migration Process**

### **Step 1: Update Route Handler**

#### **Before (Old System)**
```typescript
// Old hardcoded email sending
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  
  // Hardcoded email template
  const htmlContent = `
    <html>
      <body>
        <h1>Your Quotation</h1>
        <p>Dear ${customerName},</p>
        <!-- Hardcoded HTML -->
      </body>
    </html>
  `
  
  // Direct Resend API call
  const result = await resend.emails.send({
    from: 'booking@japandriver.com',
    to: email,
    subject: 'Your Quotation',
    html: htmlContent
  })
  
  return NextResponse.json({ success: true, messageId: result.data?.id })
}
```

#### **After (Unified System)**
```typescript
// New unified email system
import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const quotationId = formData.get('quotation_id') as string
  const email = formData.get('email') as string
  const language = formData.get('language') as 'en' | 'ja'
  
  // Get quotation data
  const { data: quotation } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single()
  
  // Use unified email service
  const result = await EmailAPIWrapper.sendQuotationEmail({
    quotation: quotation,
    language: language,
    bccEmails: 'booking@japandriver.com'
  })
  
  return NextResponse.json(result)
}
```

### **Step 2: Update Frontend Components**

#### **Before (Old System)**
```typescript
// Old API call
const response = await fetch('/api/quotations/send-email-optimized', {
  method: 'POST',
  body: formData
})
```

#### **After (Unified System)**
```typescript
// New API call
const response = await fetch('/api/quotations/send-email-unified', {
  method: 'POST',
  body: formData
})
```

### **Step 3: Test Migration**

1. **Test the new route** with the enhanced testing page
2. **Verify email delivery** to test email address
3. **Check template rendering** with real data
4. **Validate error handling** with invalid data

## 📋 **Migration Checklist**

### **For Each Route:**

- [ ] **Backup existing route** (rename to `.old`)
- [ ] **Create new unified route** using EmailAPIWrapper
- [ ] **Update frontend calls** to use new endpoint
- [ ] **Test with real data** using enhanced testing page
- [ ] **Verify email delivery** and template rendering
- [ ] **Update documentation** and comments
- [ ] **Remove old route** after successful migration

### **Global Updates:**

- [ ] **Update all frontend components** to use new endpoints
- [ ] **Remove hardcoded email templates** from codebase
- [ ] **Update error handling** to use unified error responses
- [ ] **Test all email types** (quotation, booking, payment, etc.)
- [ ] **Update API documentation** with new endpoints

## 🎯 **Migration Priority Order**

### **Phase 1: Core Quotation Emails (Week 1)**
1. `POST /api/quotations/send-email` → `POST /api/quotations/send-email-unified`
2. `POST /api/quotations/send-reminder` → `POST /api/quotations/send-email-unified`
3. `POST /api/quotations/send-payment-link-email` → `POST /api/quotations/send-email-unified`

### **Phase 2: Core Booking Emails (Week 2)**
1. `POST /api/bookings/send-booking-details` → `POST /api/bookings/send-email-unified`
2. `POST /api/bookings/send-booking-invoice` → `POST /api/bookings/send-email-unified`
3. `POST /api/bookings/send-payment-complete-email` → `POST /api/bookings/send-email-unified`

### **Phase 3: Payment & System Emails (Week 3)**
1. `POST /api/send-invoice-email` → `POST /api/quotations/send-email-unified`
2. `POST /api/email/send-template` → `POST /api/admin/email-templates`
3. `POST /api/notifications/trigger-test` → `POST /api/admin/email-templates`

### **Phase 4: Cleanup (Week 4)**
1. Remove all old hardcoded email routes
2. Update all frontend components
3. Clean up unused email template files
4. Update documentation

## 🧪 **Testing Strategy**

### **Before Migration:**
```bash
# Test current functionality
node testing/scripts/run-email-tests.js
```

### **After Migration:**
```bash
# Test new unified system
node testing/scripts/run-email-tests.js

# Check migration status
node testing/scripts/check-email-migration.js
```

### **Manual Testing:**
1. Visit `/testing` page in your app
2. Select real quotations/bookings from dropdown
3. Test different email types and languages
4. Verify email delivery and template rendering

## 📊 **Success Metrics**

### **Migration Complete When:**
- ✅ All 87 old routes migrated to unified system
- ✅ 100% of email routes use database templates
- ✅ All frontend components updated
- ✅ All tests passing
- ✅ No hardcoded email templates in codebase

### **Performance Targets:**
- 📧 **Email Delivery**: < 2 seconds
- 🎨 **Template Rendering**: < 100ms
- 💾 **Cache Hit Rate**: > 90%
- 🚀 **API Response**: < 500ms

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Template Not Found**
   - Solution: Run template population first
   - Command: `POST /api/admin/email-templates/populate-unified`

2. **Email Sending Failed**
   - Check: Resend API key configuration
   - Verify: Email address format

3. **Template Rendering Error**
   - Check: Variable mapping in EmailVariableMapper
   - Verify: Template syntax in database

4. **Frontend Integration Issues**
   - Update: API endpoint URLs
   - Check: Request/response format

### **Debug Commands:**
```bash
# Check system health
node testing/scripts/run-all-tests.js

# Check migration status
node testing/scripts/check-email-migration.js

# Clear caches
POST /api/admin/email-templates (action: 'clear_cache')
```

## 🎉 **Benefits After Migration**

### **For Developers:**
- ✅ **Centralized email management** - All templates in database
- ✅ **Consistent branding** - Unified design across all emails
- ✅ **Easy updates** - Change templates without code deployment
- ✅ **Better testing** - Comprehensive test suite
- ✅ **Performance optimization** - Caching and batch operations

### **For Users:**
- ✅ **Consistent experience** - All emails look and feel the same
- ✅ **Multi-language support** - Easy language switching
- ✅ **Professional appearance** - Unified branding and styling
- ✅ **Reliable delivery** - Robust error handling and retry logic

---

**Ready to start migrating?** Begin with Phase 1 (Core Quotation Emails) and use the enhanced testing page to validate each migration! 🚀
