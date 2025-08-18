/**
 * Email Webhooks System
 * Implement email status webhooks for better tracking
 */

export interface EmailWebhookEvent {
  id: string;
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'complained';
  timestamp: string;
  email: string;
  quotationId?: string;
  emailId: string;
  provider: 'resend' | 'sendgrid' | 'mailgun';
  metadata?: Record<string, any>;
}

export interface EmailStatus {
  quotationId: string;
  email: string;
  emailId: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failedAt?: string;
  bouncedAt?: string;
  lastUpdated: string;
  attempts: number;
  provider: string;
  metadata?: Record<string, any>;
}

class EmailWebhookManager {
  private webhookSecret: string;
  
  constructor() {
    this.webhookSecret = process.env.EMAIL_WEBHOOK_SECRET || '';
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, provider: 'resend' | 'sendgrid' | 'mailgun'): boolean {
    if (!this.webhookSecret) {
      console.warn('Email webhook secret not configured');
      return true; // Allow in development
    }

    try {
      const crypto = require('crypto');
      let expectedSignature: string;

      switch (provider) {
        case 'resend':
          expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');
          return signature === expectedSignature;

        case 'sendgrid':
          const publicKey = crypto.createPublicKey(this.webhookSecret);
          return crypto.verify(
            'sha256',
            Buffer.from(payload),
            publicKey,
            Buffer.from(signature, 'base64')
          );

        case 'mailgun':
          const timestamp = Math.floor(Date.now() / 1000);
          const token = crypto.randomBytes(16).toString('hex');
          const data = `${timestamp}${token}`;
          expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(data)
            .digest('hex');
          return signature === expectedSignature;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: EmailWebhookEvent): Promise<void> {
    try {
      console.log(`📧 Processing webhook event: ${event.type} for ${event.email}`);

      // Update email status in database
      await this.updateEmailStatus(event);

      // Send notifications if needed
      await this.handleEventNotifications(event);

      // Update quotation status if applicable
      if (event.quotationId) {
        await this.updateQuotationEmailStatus(event);
      }

      console.log(`✅ Webhook event processed: ${event.id}`);
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }

  /**
   * Update email status in database
   */
  private async updateEmailStatus(event: EmailWebhookEvent): Promise<void> {
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();

      const statusUpdate: Partial<EmailStatus> = {
        status: this.mapEventTypeToStatus(event.type),
        lastUpdated: event.timestamp,
        provider: event.provider,
        metadata: {
          ...event.metadata,
          lastEvent: {
            type: event.type,
            timestamp: event.timestamp
          }
        }
      };

      // Set specific timestamp based on event type
      switch (event.type) {
        case 'sent':
          statusUpdate.sentAt = event.timestamp;
          break;
        case 'delivered':
          statusUpdate.deliveredAt = event.timestamp;
          break;
        case 'opened':
          statusUpdate.openedAt = event.timestamp;
          break;
        case 'clicked':
          statusUpdate.clickedAt = event.timestamp;
          break;
        case 'failed':
          statusUpdate.failedAt = event.timestamp;
          break;
        case 'bounced':
          statusUpdate.bouncedAt = event.timestamp;
          break;
      }

      // Upsert email status
      const { error } = await supabase
        .from('email_statuses')
        .upsert({
          email_id: event.emailId,
          quotation_id: event.quotationId,
          email: event.email,
          ...statusUpdate
        }, {
          onConflict: 'email_id'
        });

      if (error) {
        console.error('Error updating email status:', error);
      }
    } catch (error) {
      console.error('Error in updateEmailStatus:', error);
    }
  }

  /**
   * Map webhook event type to status
   */
  private mapEventTypeToStatus(eventType: string): EmailStatus['status'] {
    switch (eventType) {
      case 'sent': return 'sent';
      case 'delivered': return 'delivered';
      case 'opened': return 'opened';
      case 'clicked': return 'clicked';
      case 'failed': return 'failed';
      case 'bounced': return 'bounced';
      case 'complained': return 'failed';
      default: return 'pending';
    }
  }

  /**
   * Handle event notifications
   */
  private async handleEventNotifications(event: EmailWebhookEvent): Promise<void> {
    // Send alerts for failures or bounces
    if (event.type === 'failed' || event.type === 'bounced') {
      await this.sendFailureNotification(event);
    }

    // Track opens and clicks for analytics
    if (event.type === 'opened' || event.type === 'clicked') {
      await this.trackEngagementEvent(event);
    }
  }

  /**
   * Send failure notification to admin
   */
  private async sendFailureNotification(event: EmailWebhookEvent): Promise<void> {
    try {
      // You could send to Slack, Discord, or email here
      const message = `🚨 Email ${event.type}: ${event.email} (Quotation: ${event.quotationId || 'N/A'})`;
      
      // Log for now, implement actual notification later
      console.error(message, event.metadata);
      
      // Could implement Slack webhook here:
      // await fetch(process.env.SLACK_WEBHOOK_URL, {
      //   method: 'POST',
      //   body: JSON.stringify({ text: message })
      // });
    } catch (error) {
      console.error('Error sending failure notification:', error);
    }
  }

  /**
   * Track engagement events for analytics
   */
  private async trackEngagementEvent(event: EmailWebhookEvent): Promise<void> {
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();

      await supabase
        .from('email_engagement_events')
        .insert({
          email_id: event.emailId,
          quotation_id: event.quotationId,
          email: event.email,
          event_type: event.type,
          timestamp: event.timestamp,
          provider: event.provider,
          metadata: event.metadata
        });
    } catch (error) {
      console.error('Error tracking engagement event:', error);
    }
  }

  /**
   * Update quotation email status
   */
  private async updateQuotationEmailStatus(event: EmailWebhookEvent): Promise<void> {
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();

      let updateData: any = {};

      switch (event.type) {
        case 'delivered':
          updateData.email_delivered_at = event.timestamp;
          break;
        case 'opened':
          updateData.email_opened_at = event.timestamp;
          break;
        case 'clicked':
          updateData.email_clicked_at = event.timestamp;
          break;
        case 'failed':
        case 'bounced':
          updateData.email_failed_at = event.timestamp;
          break;
      }

      if (Object.keys(updateData).length > 0 && event.quotationId) {
        await supabase
          .from('quotations')
          .update(updateData)
          .eq('id', event.quotationId);
      }
    } catch (error) {
      console.error('Error updating quotation email status:', error);
    }
  }

  /**
   * Get email status for quotation
   */
  async getEmailStatus(quotationId: string): Promise<EmailStatus[]> {
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();

      const { data, error } = await supabase
        .from('email_statuses')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error fetching email status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmailStatus:', error);
      return [];
    }
  }

  /**
   * Get email engagement analytics
   */
  async getEngagementAnalytics(quotationId?: string, dateRange?: { start: string; end: string }) {
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();

      let query = supabase
        .from('email_statuses')
        .select('status, provider, sent_at, delivered_at, opened_at, clicked_at');

      if (quotationId) {
        query = query.eq('quotation_id', quotationId);
      }

      if (dateRange) {
        query = query
          .gte('sent_at', dateRange.start)
          .lte('sent_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching engagement analytics:', error);
        return null;
      }

      // Calculate metrics
      const total = data?.length || 0;
      const sent = data?.filter(d => d.status !== 'pending').length || 0;
      const delivered = data?.filter(d => d.delivered_at).length || 0;
      const opened = data?.filter(d => d.opened_at).length || 0;
      const clicked = data?.filter(d => d.clicked_at).length || 0;

      return {
        total,
        sent,
        delivered,
        opened,
        clicked,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0
      };
    } catch (error) {
      console.error('Error in getEngagementAnalytics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const emailWebhooks = new EmailWebhookManager();
