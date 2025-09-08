// @ts-ignore - bull and ioredis might not be installed yet  
import Queue from 'bull';
// @ts-ignore
import Redis from 'ioredis';

/**
 * Professional Email Queue System using Bull
 * Replaces in-memory array with proper queue management
 */

export interface EmailJob {
  id: string;
  type: 'quotation' | 'approval' | 'rejection' | 'reminder' | 'invoice';
  quotationId: string;
  email: string;
  language: string;
  priority: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
  retryCount?: number;
  maxRetries?: number;
}

class EmailQueueManager {
  private queue: Queue.Queue<EmailJob> | null = null;
  private redis: Redis | null = null;

  constructor() {
    try {
      // Initialize Redis connection
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      
      if (redisUrl) {
        if (redisUrl.includes('upstash.io')) {
          this.redis = new Redis(redisUrl, {
            family: 6,
            connectTimeout: 10000,
            maxRetriesPerRequest: 3
          });
        } else {
          this.redis = new Redis(redisUrl);
        }
      } else if (process.env.REDIS_HOST) {
        this.redis = new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0')
        });
      }

      if (this.redis) {
        // Initialize Bull queue with Redis
        this.queue = new Queue('email processing', {
          redis: {
            host: this.redis.options.host,
            port: this.redis.options.port,
            password: this.redis.options.password,
            db: this.redis.options.db
          },
          defaultJobOptions: {
            removeOnComplete: 50, // Keep last 50 completed jobs
            removeOnFail: 100,    // Keep last 100 failed jobs
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        });

        this.setupQueueProcessors();
        this.setupQueueEvents();

        console.log('✅ Email queue initialized with Redis');
      } else {
        console.log('⚠️  Redis not configured, email queue disabled');
      }
    } catch (error) {
      console.error('Failed to initialize email queue:', error);
    }
  }

  /**
   * Setup queue processors for different email types
   */
  private setupQueueProcessors(): void {
    if (!this.queue) return;

    // Process quotation emails
    this.queue.process('quotation', 5, async (job) => {
      return this.processQuotationEmail(job.data);
    });

    // Process approval emails
    this.queue.process('approval', 5, async (job) => {
      return this.processApprovalEmail(job.data);
    });

    // Process rejection emails
    this.queue.process('rejection', 5, async (job) => {
      return this.processRejectionEmail(job.data);
    });

    // Process reminder emails
    this.queue.process('reminder', 3, async (job) => {
      return this.processReminderEmail(job.data);
    });

    // Process invoice emails
    this.queue.process('invoice', 5, async (job) => {
      return this.processInvoiceEmail(job.data);
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupQueueEvents(): void {
    if (!this.queue) return;

    this.queue.on('completed', (job, result) => {
      console.log(`✅ Email job ${job.id} completed:`, result);
    });

    this.queue.on('failed', (job, error) => {
      console.error(`❌ Email job ${job.id} failed:`, error.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`⚠️  Email job ${job.id} stalled`);
    });

    this.queue.on('progress', (job, progress) => {
      console.log(`📧 Email job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Add email job to queue
   */
  async addEmailJob(emailJob: EmailJob): Promise<Queue.Job<EmailJob> | null> {
    if (!this.queue) {
      console.warn('Email queue not available, processing immediately');
      return null;
    }

    try {
      const priority = this.getPriorityValue(emailJob.priority);
      
      const job = await this.queue.add(emailJob.type, emailJob, {
        priority,
        delay: 0,
        attempts: emailJob.maxRetries || 3,
        jobId: emailJob.id
      });

      console.log(`📬 Email job queued: ${job.id} (type: ${emailJob.type}, priority: ${emailJob.priority})`);
      return job;
    } catch (error) {
      console.error('Failed to add email job to queue:', error);
      return null;
    }
  }

  /**
   * Get numeric priority value for Bull queue
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'high': return 1;
      case 'normal': return 5;
      case 'low': return 10;
      default: return 5;
    }
  }

  /**
   * Process quotation email
   */
  private async processQuotationEmail(emailJob: EmailJob): Promise<any> {
    try {
      console.log(`📧 Processing quotation email for ${emailJob.quotationId}`);
      
      // Call the optimized send-email API
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotations/send-email-optimized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailJob.email,
          quotation_id: emailJob.quotationId,
          language: emailJob.language
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send quotation email: ${error}`);
      }

      const result = await response.json();
      return { success: true, emailId: result.emailId };
    } catch (error) {
      console.error('Error processing quotation email:', error);
      throw error;
    }
  }

  /**
   * Process approval email
   */
  private async processApprovalEmail(emailJob: EmailJob): Promise<any> {
    try {
      console.log(`📧 Processing approval email for ${emailJob.quotationId}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotations/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: emailJob.quotationId,
          skipStatusCheck: true,
          notes: emailJob.metadata?.notes
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send approval email: ${error}`);
      }

      const result = await response.json();
      return { success: true, emailId: result.emailId };
    } catch (error) {
      console.error('Error processing approval email:', error);
      throw error;
    }
  }

  /**
   * Process rejection email
   */
  private async processRejectionEmail(emailJob: EmailJob): Promise<any> {
    try {
      console.log(`📧 Processing rejection email for ${emailJob.quotationId}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotations/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: emailJob.quotationId,
          skipStatusCheck: true,
          reason: emailJob.metadata?.reason
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send rejection email: ${error}`);
      }

      const result = await response.json();
      return { success: true, emailId: result.emailId };
    } catch (error) {
      console.error('Error processing rejection email:', error);
      throw error;
    }
  }

  /**
   * Process reminder email
   */
  private async processReminderEmail(emailJob: EmailJob): Promise<any> {
    try {
      console.log(`📧 Processing reminder email for ${emailJob.quotationId}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotations/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: emailJob.quotationId,
          language: emailJob.language
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send reminder email: ${error}`);
      }

      const result = await response.json();
      return { success: true, emailId: result.emailId };
    } catch (error) {
      console.error('Error processing reminder email:', error);
      throw error;
    }
  }

  /**
   * Process invoice email
   */
  private async processInvoiceEmail(emailJob: EmailJob): Promise<any> {
    try {
      console.log(`📧 Processing invoice email for ${emailJob.quotationId}`);
      
      // Implementation would depend on your invoice email API
      // For now, return success
      return { success: true, message: 'Invoice email processed' };
    } catch (error) {
      console.error('Error processing invoice email:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.queue) {
      return {
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
        available: false
      };
    }

    try {
      const [active, waiting, completed, failed] = await Promise.all([
        this.queue.getActive(),
        this.queue.getWaiting(),
        this.queue.getCompleted(),
        this.queue.getFailed()
      ]);

      return {
        active: active.length,
        waiting: waiting.length,
        completed: completed.length,
        failed: failed.length,
        available: true
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return {
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
        available: false
      };
    }
  }

  /**
   * Pause queue processing
   */
  async pauseQueue(): Promise<void> {
    if (this.queue) {
      await this.queue.pause();
      console.log('📧 Email queue paused');
    }
  }

  /**
   * Resume queue processing
   */
  async resumeQueue(): Promise<void> {
    if (this.queue) {
      await this.queue.resume();
      console.log('📧 Email queue resumed');
    }
  }

  /**
   * Clear all jobs from queue
   */
  async clearQueue(): Promise<void> {
    if (this.queue) {
      await this.queue.empty();
      console.log('🧹 Email queue cleared');
    }
  }

  /**
   * Close queue and Redis connection
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const emailQueue = new EmailQueueManager();
