/**
 * Robust Email Client - Uses async processing to avoid timeouts
 */

export interface EmailStatus {
  quotationId: string;
  quotationStatus: string;
  emailStatus: string;
  lastActivity: {
    type: string;
    description: string;
    timestamp: string;
    metadata: any;
  } | null;
  timestamps: {
    sentAt: string | null;
    rejectedAt: string | null;
    lastEmailSent: string | null;
  };
}

export class RobustEmailClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send email asynchronously - returns immediately with processing status
   */
  async sendEmail(params: {
    quotationId: string;
    email: string;
    subject?: string;
    message?: string;
    skipStatusCheck?: boolean;
  }): Promise<{ message: string; quotationId: string; status: string; estimatedTime: string }> {
    const response = await fetch(`${this.baseUrl}/api/quotations/send-email-robust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Email processing failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Reject quotation asynchronously - returns immediately with processing status
   */
  async rejectQuotation(params: {
    id: string;
    reason: string;
    customerId?: string | null;
    skipStatusCheck?: boolean;
    skipEmail?: boolean;
  }): Promise<{ message: string; quotationId: string; status: string; estimatedTime: string }> {
    const response = await fetch(`${this.baseUrl}/api/quotations/reject-robust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Rejection processing failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check email processing status
   */
  async checkEmailStatus(quotationId: string): Promise<EmailStatus> {
    const response = await fetch(`${this.baseUrl}/api/quotations/email-status/${quotationId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Poll email status until completion
   */
  async waitForEmailCompletion(
    quotationId: string, 
    maxWaitTime: number = 60000, // 60 seconds
    pollInterval: number = 2000  // 2 seconds
  ): Promise<EmailStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkEmailStatus(quotationId);
      
      if (status.emailStatus === 'sent' || status.emailStatus === 'rejected' || status.emailStatus === 'failed') {
        return status;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Email processing timeout - check status manually');
  }

  /**
   * Send email and wait for completion
   */
  async sendEmailAndWait(params: {
    quotationId: string;
    email: string;
    subject?: string;
    message?: string;
    skipStatusCheck?: boolean;
    maxWaitTime?: number;
  }): Promise<EmailStatus> {
    // Start email processing
    await this.sendEmail(params);
    
    // Wait for completion
    return this.waitForEmailCompletion(params.quotationId, params.maxWaitTime);
  }

  /**
   * Reject quotation and wait for completion
   */
  async rejectQuotationAndWait(params: {
    id: string;
    reason: string;
    customerId?: string | null;
    skipStatusCheck?: boolean;
    skipEmail?: boolean;
    maxWaitTime?: number;
  }): Promise<EmailStatus> {
    // Start rejection processing
    await this.rejectQuotation(params);
    
    // Wait for completion
    return this.waitForEmailCompletion(params.id, params.maxWaitTime);
  }
}

// Export default instance
export const robustEmailClient = new RobustEmailClient();
