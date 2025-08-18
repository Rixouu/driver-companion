import { NextRequest, NextResponse } from 'next/server';
import { emailWebhooks, EmailWebhookEvent } from '@/lib/email-webhooks';

/**
 * Email webhook endpoint
 * Handles webhooks from various email providers
 */

export async function POST(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') as 'resend' | 'sendgrid' | 'mailgun';
    
    if (!provider || !['resend', 'sendgrid', 'mailgun'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid or missing provider parameter' },
        { status: 400 }
      );
    }

    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('webhook-signature') || 
                     request.headers.get('x-resend-signature') ||
                     request.headers.get('x-mailgun-signature') ||
                     request.headers.get('x-twilio-email-event-webhook-signature') ||
                     '';

    // Verify webhook signature
    if (!emailWebhooks.verifySignature(body, signature, provider)) {
      console.warn('Invalid webhook signature from', provider);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload based on provider
    const events = parseWebhookPayload(JSON.parse(body), provider);

    // Process each event
    for (const event of events) {
      try {
        await emailWebhooks.processWebhookEvent(event);
      } catch (error) {
        console.error('Error processing webhook event:', error);
        // Continue processing other events
      }
    }

    console.log(`✅ Processed ${events.length} webhook events from ${provider}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${events.length} events` 
    });

  } catch (error) {
    console.error('Error processing email webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Parse webhook payload based on provider format
 */
function parseWebhookPayload(payload: any, provider: string): EmailWebhookEvent[] {
  const events: EmailWebhookEvent[] = [];

  try {
    switch (provider) {
      case 'resend':
        // Resend webhook format
        if (payload.type && payload.data) {
          events.push({
            id: payload.data.id || `webhook_${Date.now()}`,
            type: mapResendEventType(payload.type),
            timestamp: payload.data.created_at || new Date().toISOString(),
            email: payload.data.to?.[0] || payload.data.email || '',
            emailId: payload.data.id || '',
            provider: 'resend',
            quotationId: extractQuotationIdFromSubject(payload.data.subject),
            metadata: {
              messageId: payload.data.id,
              subject: payload.data.subject,
              from: payload.data.from,
              originalEvent: payload
            }
          });
        }
        break;

      case 'sendgrid':
        // SendGrid webhook format (array of events)
        if (Array.isArray(payload)) {
          payload.forEach((event: any) => {
            events.push({
              id: event.sg_message_id || `webhook_${Date.now()}_${Math.random()}`,
              type: mapSendGridEventType(event.event),
              timestamp: new Date(event.timestamp * 1000).toISOString(),
              email: event.email || '',
              emailId: event.sg_message_id || '',
              provider: 'sendgrid',
              quotationId: extractQuotationIdFromSubject(event.subject),
              metadata: {
                messageId: event.sg_message_id,
                subject: event.subject,
                reason: event.reason,
                originalEvent: event
              }
            });
          });
        }
        break;

      case 'mailgun':
        // Mailgun webhook format
        if (payload['event-data']) {
          const eventData = payload['event-data'];
          events.push({
            id: eventData.id || `webhook_${Date.now()}`,
            type: mapMailgunEventType(eventData.event),
            timestamp: new Date(eventData.timestamp * 1000).toISOString(),
            email: eventData.recipient || '',
            emailId: eventData.message?.headers?.['message-id'] || eventData.id || '',
            provider: 'mailgun',
            quotationId: extractQuotationIdFromSubject(eventData.message?.headers?.subject),
            metadata: {
              messageId: eventData.message?.headers?.['message-id'],
              subject: eventData.message?.headers?.subject,
              reason: eventData.reason,
              originalEvent: eventData
            }
          });
        }
        break;
    }
  } catch (error) {
    console.error('Error parsing webhook payload:', error);
  }

  return events;
}

/**
 * Map Resend event types to our standard types
 */
function mapResendEventType(resendType: string): EmailWebhookEvent['type'] {
  switch (resendType) {
    case 'email.sent': return 'sent';
    case 'email.delivered': return 'delivered';
    case 'email.delivery_delayed': return 'sent';
    case 'email.complained': return 'complained';
    case 'email.bounced': return 'bounced';
    case 'email.opened': return 'opened';
    case 'email.clicked': return 'clicked';
    default: return 'sent';
  }
}

/**
 * Map SendGrid event types to our standard types
 */
function mapSendGridEventType(sendGridType: string): EmailWebhookEvent['type'] {
  switch (sendGridType) {
    case 'processed':
    case 'delivered': return 'delivered';
    case 'open': return 'opened';
    case 'click': return 'clicked';
    case 'bounce': return 'bounced';
    case 'dropped':
    case 'blocked':
    case 'deferred': return 'failed';
    case 'spamreport': return 'complained';
    default: return 'sent';
  }
}

/**
 * Map Mailgun event types to our standard types
 */
function mapMailgunEventType(mailgunType: string): EmailWebhookEvent['type'] {
  switch (mailgunType) {
    case 'delivered': return 'delivered';
    case 'opened': return 'opened';
    case 'clicked': return 'clicked';
    case 'permanent_fail':
    case 'temporary_fail': return 'failed';
    case 'complained': return 'complained';
    default: return 'sent';
  }
}

/**
 * Extract quotation ID from email subject
 */
function extractQuotationIdFromSubject(subject?: string): string | undefined {
  if (!subject) return undefined;
  
  // Look for patterns like "QUO-JPDR-123456" in subject
  const match = subject.match(/QUO-JPDR-(\d+)/i);
  if (match) {
    // Convert quote number back to UUID (you'd need to query database)
    // For now, return the quote number
    return match[1];
  }
  
  // Look for UUID patterns
  const uuidMatch = subject.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  
  return undefined;
}
