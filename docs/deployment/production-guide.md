# 🚀 Production Deployment Guide

Complete guide for deploying the Vehicle Inspection System to production.

## Prerequisites

Before deploying to production, ensure you have:

- **Vercel Account**: For hosting and deployment
- **Supabase Project**: Production database and authentication
- **Domain Name**: Custom domain for your application
- **SSL Certificate**: Automatic with Vercel
- **Environment Variables**: All production secrets configured

## Pre-Deployment Checklist

### 1. Environment Configuration

Create production environment variables in Vercel:

```bash
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Email Service
RESEND_API_KEY=your-resend-api-key

# Redis (Optional)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Other Services
NEXT_PUBLIC_AERODATABOX_API_KEY=your-aerodatabox-key
OMISE_PUBLIC_KEY=your-omise-public-key
OMISE_SECRET_KEY=your-omise-secret-key
```

### 2. Database Setup

1. **Create Production Supabase Project**
2. **Run Database Migrations**:
   ```bash
   npm run migrate:production
   ```
3. **Seed Production Data** (if needed):
   ```bash
   npm run seed:production
   ```
4. **Configure RLS Policies**
5. **Set up Database Backups**

### 3. Domain Configuration

1. **Purchase Domain** (if not already owned)
2. **Configure DNS**:
   - Add CNAME record pointing to Vercel
   - Configure subdomains if needed
3. **SSL Certificate**: Automatic with Vercel

### 4. Third-Party Services

#### Email Service (Resend)
1. **Create Resend Account**
2. **Verify Domain** for email sending
3. **Configure Webhooks** for email tracking
4. **Set up Email Templates**

#### Payment Processing (Omise)
1. **Create Omise Account**
2. **Complete Business Verification**
3. **Configure Webhook Endpoints**
4. **Test Payment Flows**

#### Redis Cache (Upstash)
1. **Create Upstash Account**
2. **Create Redis Database**
3. **Configure Connection Settings**
4. **Test Cache Functionality**

## Deployment Process

### 1. Vercel Deployment

#### Option A: Git Integration (Recommended)
1. **Connect Repository** to Vercel
2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
3. **Set Environment Variables**
4. **Deploy from Main Branch**

#### Option B: CLI Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 2. Database Migration

```bash
# Run production migrations
NODE_ENV=production npm run migrate

# Verify migration status
NODE_ENV=production npm run migrate:status
```

### 3. Environment Verification

```bash
# Test production environment
curl https://your-domain.com/api/health

# Verify database connection
curl https://your-domain.com/api/database/status

# Test authentication
curl https://your-domain.com/api/auth/status
```

## Post-Deployment Configuration

### 1. Supabase Configuration

#### Authentication
1. **Configure Auth Providers**:
   - Email/Password
   - Social providers (if needed)
2. **Set up Email Templates**:
   - Welcome email
   - Password reset
   - Email verification
3. **Configure Redirect URLs**:
   - Success: `https://your-domain.com/dashboard`
   - Error: `https://your-domain.com/auth/error`

#### Database
1. **Enable Row Level Security** on all tables
2. **Configure RLS Policies** for data access
3. **Set up Database Backups**:
   - Daily automated backups
   - Point-in-time recovery
4. **Monitor Database Performance**

### 2. Email Configuration

#### Resend Setup
1. **Verify Domain** for email sending
2. **Configure DNS Records**:
   - SPF record
   - DKIM record
   - DMARC record
3. **Test Email Delivery**:
   ```bash
   curl -X POST https://your-domain.com/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"to": "test@example.com", "template": "test"}'
   ```

### 3. Payment Configuration

#### Omise Setup
1. **Configure Webhook Endpoints**:
   - Payment success: `https://your-domain.com/api/webhooks/omise/success`
   - Payment failure: `https://your-domain.com/api/webhooks/omise/failure`
2. **Test Payment Flows**:
   - Test payments with Omise test keys
   - Verify webhook delivery
   - Test refund processes

### 4. Monitoring Setup

#### Error Tracking (Sentry)
1. **Create Sentry Project**
2. **Configure DSN** in environment variables
3. **Set up Alerts** for critical errors
4. **Configure Release Tracking**

#### Performance Monitoring
1. **Set up Vercel Analytics**
2. **Configure Web Vitals** monitoring
3. **Set up Uptime Monitoring**
4. **Configure Performance Alerts**

## Security Configuration

### 1. Environment Security

```bash
# Secure environment variables
- Use strong, unique passwords
- Rotate API keys regularly
- Use different keys for different environments
- Never commit secrets to version control
```

### 2. Database Security

1. **Enable SSL** for database connections
2. **Configure IP Restrictions** (if needed)
3. **Set up Database Firewall**
4. **Enable Audit Logging**

### 3. Application Security

1. **Enable HTTPS** (automatic with Vercel)
2. **Configure Security Headers**:
   ```javascript
   // next.config.mjs
   const securityHeaders = [
     {
       key: 'X-DNS-Prefetch-Control',
       value: 'on'
     },
     {
       key: 'Strict-Transport-Security',
       value: 'max-age=63072000; includeSubDomains; preload'
     },
     {
       key: 'X-XSS-Protection',
       value: '1; mode=block'
     },
     {
       key: 'X-Frame-Options',
       value: 'SAMEORIGIN'
     },
     {
       key: 'X-Content-Type-Options',
       value: 'nosniff'
     }
   ];
   ```

### 4. API Security

1. **Rate Limiting**: Configure API rate limits
2. **CORS Configuration**: Set appropriate CORS policies
3. **Input Validation**: Validate all API inputs
4. **Authentication**: Secure all protected endpoints

## Performance Optimization

### 1. Build Optimization

```bash
# Optimize build
npm run build

# Analyze bundle size
npm run analyze

# Check for performance issues
npm run lighthouse
```

### 2. Database Optimization

1. **Add Database Indexes**:
   ```sql
   -- Example indexes
   CREATE INDEX idx_bookings_status ON bookings(status);
   CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
   CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
   ```

2. **Configure Connection Pooling**
3. **Set up Query Monitoring**
4. **Optimize Slow Queries**

### 3. Caching Strategy

1. **Enable Redis Caching**:
   ```bash
   # Configure Redis
   UPSTASH_REDIS_REST_URL=your-redis-url
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

2. **Configure CDN** (Vercel Edge Network)
3. **Set up Image Optimization**
4. **Configure Static Asset Caching**

## Monitoring and Maintenance

### 1. Health Checks

Create health check endpoints:

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    email: await checkEmailService(),
    timestamp: new Date().toISOString()
  };
  
  const isHealthy = Object.values(checks).every(check => check === true);
  
  return NextResponse.json(checks, { 
    status: isHealthy ? 200 : 503 
  });
}
```

### 2. Logging

1. **Set up Structured Logging**
2. **Configure Log Aggregation**
3. **Set up Log Rotation**
4. **Monitor Error Rates**

### 3. Backup Strategy

1. **Database Backups**:
   - Daily automated backups
   - Point-in-time recovery
   - Cross-region backup storage

2. **Application Backups**:
   - Code repository backups
   - Environment configuration backups
   - Static asset backups

### 4. Update Strategy

1. **Staging Environment**: Test updates in staging first
2. **Blue-Green Deployment**: Zero-downtime deployments
3. **Rollback Plan**: Quick rollback procedures
4. **Feature Flags**: Gradual feature rollouts

## Troubleshooting

### Common Issues

#### Deployment Failures
1. **Check Build Logs** in Vercel dashboard
2. **Verify Environment Variables**
3. **Check Dependencies** and versions
4. **Review Build Configuration**

#### Database Connection Issues
1. **Verify Supabase Configuration**
2. **Check Network Connectivity**
3. **Review RLS Policies**
4. **Check Database Status**

#### Email Delivery Issues
1. **Verify Resend Configuration**
2. **Check Domain Verification**
3. **Review Email Templates**
4. **Check Spam Filters**

#### Performance Issues
1. **Monitor Database Queries**
2. **Check Cache Hit Rates**
3. **Review Bundle Size**
4. **Analyze Core Web Vitals**

### Debug Commands

```bash
# Check application status
curl https://your-domain.com/api/health

# Test database connection
curl https://your-domain.com/api/database/status

# Check email service
curl https://your-domain.com/api/email/status

# Verify Redis connection
curl https://your-domain.com/api/cache/status
```

## Scaling Considerations

### 1. Horizontal Scaling

1. **Vercel Edge Functions**: Global distribution
2. **Database Read Replicas**: Read scaling
3. **CDN Configuration**: Static asset distribution
4. **Load Balancing**: Traffic distribution

### 2. Vertical Scaling

1. **Database Upgrades**: Increase resources
2. **Redis Scaling**: Increase cache capacity
3. **Function Scaling**: Increase compute resources
4. **Storage Scaling**: Increase storage capacity

### 3. Performance Monitoring

1. **Set up APM** (Application Performance Monitoring)
2. **Monitor Key Metrics**:
   - Response times
   - Error rates
   - Throughput
   - Resource utilization
3. **Set up Alerts** for performance degradation

## Maintenance Schedule

### Daily
- Monitor error rates and performance
- Check backup status
- Review security logs

### Weekly
- Update dependencies
- Review performance metrics
- Check database performance

### Monthly
- Security audit
- Performance optimization review
- Backup restoration testing

### Quarterly
- Full security assessment
- Disaster recovery testing
- Capacity planning review

---

## Support

For production issues:

1. **Check Monitoring Dashboards**
2. **Review Application Logs**
3. **Contact Support Team**
4. **Escalate Critical Issues**

---

*Production Deployment Guide - Last Updated: January 30, 2025*
