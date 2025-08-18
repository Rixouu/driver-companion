import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Async Email Sending Route
 * 
 * This route queues email sending for background processing to avoid timeouts.
 * It immediately returns a response to the client while processing the email in the background.
 */

interface EmailQueueItem {
  id: string;
  type: 'quotation' | 'approval' | 'rejection' | 'reminder';
  quotationId: string;
  email: string;
  language: string;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  scheduledFor?: string;
  metadata?: Record<string, any>;
}

// In-memory queue for demonstration (in production, use Redis or a proper queue system)
const emailQueue: EmailQueueItem[] = [];
let isProcessing = false;

/**
 * Process email queue in background
 */
async function processEmailQueue() {
  if (isProcessing || emailQueue.length === 0) {
    return;
  }

  isProcessing = true;
  console.log(`📬 Processing ${emailQueue.length} emails in queue`);

  while (emailQueue.length > 0) {
    const emailItem = emailQueue.shift();
    if (!emailItem) continue;

    try {
      console.log(`📧 Processing email: ${emailItem.type} for quotation ${emailItem.quotationId}`);
      
      // Process the email based on type
      await processEmailItem(emailItem);
      
      console.log(`✅ Email processed successfully: ${emailItem.id}`);
    } catch (error) {
      console.error(`❌ Failed to process email ${emailItem.id}:`, error);
      
      // In production, you might want to:
      // 1. Retry with exponential backoff
      // 2. Move to dead letter queue after max retries
      // 3. Send notification about failed emails
    }

    // Small delay between processing emails to prevent overwhelming services
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  isProcessing = false;
  console.log('📬 Email queue processing completed');
}

/**
 * Process individual email item
 */
async function processEmailItem(emailItem: EmailQueueItem) {
  const supabase = await getSupabaseServerClient();
  
  // Authenticate using a service account or system user
  // For now, we'll skip auth since this is background processing
  
  // Fetch quotation data
  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*, customers (*), quotation_items (*)')
    .eq('id', emailItem.quotationId)
    .single();

  if (error || !quotation) {
    throw new Error(`Failed to fetch quotation ${emailItem.quotationId}: ${error?.message}`);
  }

  // Import email sending functions dynamically to avoid circular dependencies
  const emailModule = await import('../send-email/route');
  
  // Create a mock request for the email sending function
  const mockRequest = new Request('http://localhost/api/quotations/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: emailItem.email,
      quotation_id: emailItem.quotationId,
      language: emailItem.language
    })
  });

  // Process the email
  const response = await emailModule.POST(mockRequest as NextRequest);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Email sending failed: ${errorData.error}`);
  }

  return response;
}

/**
 * Queue email for async processing
 */
export async function POST(request: NextRequest) {
  console.log('🔄 [ASYNC EMAIL API] Received async email request');
  
  try {
    const { quotationId, email, type = 'quotation', language = 'en', priority = 'normal', metadata } = await request.json();
    
    if (!quotationId || !email) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: quotationId and email',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Create queue item
    const emailItem: EmailQueueItem = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      quotationId,
      email,
      language,
      priority,
      createdAt: new Date().toISOString(),
      metadata
    };

    // Add to queue (sort by priority)
    emailQueue.push(emailItem);
    emailQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    console.log(`📬 Email queued: ${emailItem.id} (${emailQueue.length} items in queue)`);

    // Start processing queue in background (non-blocking)
    setImmediate(() => processEmailQueue());

    return NextResponse.json({
      success: true,
      message: 'Email queued for processing',
      emailId: emailItem.id,
      queuePosition: emailQueue.findIndex(item => item.id === emailItem.id) + 1,
      estimatedProcessingTime: emailQueue.length * 2 // Rough estimate in seconds
    });

  } catch (error) {
    console.error('❌ [ASYNC EMAIL API] Error queuing email:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to queue email',
        code: 'QUEUE_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Get queue status
 */
export async function GET() {
  return NextResponse.json({
    queueSize: emailQueue.length,
    isProcessing,
    items: emailQueue.map(item => ({
      id: item.id,
      type: item.type,
      quotationId: item.quotationId,
      priority: item.priority,
      createdAt: item.createdAt
    }))
  });
}
