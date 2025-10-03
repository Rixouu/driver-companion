# Quotation Workflow Cleanup & Testing Plan

## 🎯 Objective
Clean up all caches, test the complete quotation workflow, and verify that each step sends the correct email with the proper PDF template from the database.

## 📋 Pre-Testing Checklist

### 1. Cache Cleanup
- [ ] Clear browser cache (hard refresh)
- [ ] Clear Next.js build cache
- [ ] Clear any PDF generation cache
- [ ] Clear Supabase query cache
- [ ] Restart development server

### 2. Database Verification
- [ ] Verify PDF templates are active in database
- [ ] Check template configurations for all statuses
- [ ] Ensure proper status badge colors are set
- [ ] Verify both quotation and invoice templates exist

### 3. Code Verification
- [ ] Confirm payment completion email uses invoice PDF
- [ ] Verify all workflow steps use correct PDF generators
- [ ] Check status logic in workflow components
- [ ] Ensure proper status_label passing

## 🧪 Testing Workflow

### Test Quotation: [QUO-JPDR-000361]
**Current Status:** Approved (ready for payment)

### Step-by-Step Testing Plan

#### Step 1: Created ✅
- **Action:** View quotation details
- **Expected PDF:** Quotation PDF with "SENT" status (blue badge)
- **Email:** None (already created)

#### Step 2: Sent ✅
- **Action:** Click "Send Quotation" button
- **Expected PDF:** Quotation PDF with "SENT" status (blue badge)
- **Email:** Quotation email with quotation PDF attachment
- **Filename:** `QUO-JPDR-000361.pdf`

#### Step 3: Approval ✅
- **Action:** Click "Approve" button
- **Expected PDF:** Quotation PDF with "APPROVED" status (green badge)
- **Email:** Approval confirmation email with quotation PDF
- **Filename:** `QUO-JPDR-000361.pdf`

#### Step 4: Payment
- **Action:** Click "Send Payment Link" button
- **Expected PDF:** Invoice PDF with "UNPAID" status (red badge)
- **Email:** Payment link email with invoice PDF attachment
- **Filename:** `INV-JPDR-000361.pdf`

#### Step 5: Confirmed
- **Action:** Click "Mark As Paid" button
- **Expected PDF:** Invoice PDF with "PAID" status (green badge)
- **Email:** Payment completion email with invoice PDF
- **Filename:** `INV-JPDR-000361.pdf`

#### Step 6: Converted
- **Action:** Click "Convert to Booking" button
- **Expected PDF:** None (converts to booking)
- **Email:** Booking confirmation email

## 🔍 Verification Points

### PDF Content Verification
- [ ] Correct document type (QUOTATION vs INVOICE)
- [ ] Proper status badge color and text
- [ ] Correct filename format
- [ ] All payment information displayed
- [ ] Company branding and contact info

### Email Content Verification
- [ ] Correct subject line
- [ ] Proper email template
- [ ] Correct PDF attachment
- [ ] Payment information included
- [ ] Language settings respected

### Database Integration Verification
- [ ] PDF templates loaded from database
- [ ] Status configurations applied correctly
- [ ] No hardcoded overrides
- [ ] Template data properly formatted

## 🚨 Known Issues to Watch For

### Issue 1: PDF Type Mismatch
- **Problem:** Payment completion sending quotation instead of invoice
- **Status:** ✅ FIXED - Now uses invoice PDF generator

### Issue 2: Status Badge Colors
- **Problem:** Wrong colors or missing status badges
- **Status:** ✅ VERIFIED - Database has correct configurations

### Issue 3: Workflow Step Status Logic
- **Problem:** "Confirmed" step not showing as current
- **Status:** ✅ FIXED - Updated status logic

### Issue 4: Cache Issues
- **Problem:** Old PDFs being served from cache
- **Status:** ⚠️ NEEDS TESTING - Will clear all caches

## 📊 Test Results Log

### Test Run 1: [DATE]
- [ ] Step 1 (Created): PASS/FAIL
- [ ] Step 2 (Sent): PASS/FAIL
- [ ] Step 3 (Approval): PASS/FAIL
- [ ] Step 4 (Payment): PASS/FAIL
- [ ] Step 5 (Confirmed): PASS/FAIL
- [ ] Step 6 (Converted): PASS/FAIL

**Notes:**
- [Any issues encountered]
- [Any fixes applied]
- [Overall status]

## 🛠️ Commands to Run

### Cache Cleanup Commands
```bash
# Clear Next.js cache
rm -rf .next
rm -rf node_modules/.cache

# Clear any PDF cache
rm -rf /tmp/pdf-cache
rm -rf /tmp/quotation-pdfs

# Restart development server
npm run dev
# or
yarn dev
```

### Database Verification Query
```sql
SELECT 
  name, 
  type, 
  is_active,
  template_data->'statusConfigs' as status_configs
FROM pdf_templates 
WHERE is_active = true;
```

## 📝 Post-Testing Actions

### If All Tests Pass:
- [ ] Document successful test run
- [ ] Update any documentation
- [ ] Clean up test data
- [ ] Deploy to production

### If Issues Found:
- [ ] Document specific issues
- [ ] Create bug reports
- [ ] Apply additional fixes
- [ ] Re-test affected steps

## 🎯 Success Criteria

The workflow is considered successful when:
1. ✅ Each step generates the correct PDF type
2. ✅ All PDFs use database templates (not hardcoded)
3. ✅ Status badges display correct colors and text
4. ✅ Emails contain proper attachments
5. ✅ Filenames follow correct format
6. ✅ No cache-related issues
7. ✅ Complete workflow can be executed end-to-end

---

**Created:** [Current Date]
**Last Updated:** [Current Date]
**Status:** Ready for Testing
