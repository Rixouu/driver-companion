import axios from 'axios';

export interface IPPSConfig {
  baseUrl: string;
  accessToken: string;
  clientId?: string;
  clientSecret?: string;
}

export interface PaymentData {
  clientTransactionId: string;
  amount: number;
  ref1: string;
  ref2?: string;
  ref3?: string;
  expiredIn?: number;
  customerPaymentNo: string;
  customerPaymentDescription: string;
  sentPaylinkToCustomerEmail: string;
  sentPaylinkToCustomerMobile: string;
}

export interface IPPSResponse {
  error: boolean;
  message?: string;
  paymentUrl?: string;
}

export class IPPSClient {
  private config: IPPSConfig;
  
  constructor(config: IPPSConfig) {
    this.config = config;
  }
  
  async createPaylink(data: PaymentData): Promise<IPPSResponse> {
    try {
      // Format amount to ensure it meets minimum requirement (1.0)
      const amount = Math.max(1.0, parseFloat(data.amount.toFixed(2)));
      
      const payload = {
        client_transaction_id: data.clientTransactionId,
        amount: amount.toFixed(2),
        ref1: data.ref1,
        ref2: data.ref2 || 'N/A',
        ref3: data.ref3 || 'N/A',
        expired_in: data.expiredIn || 3600, // Default: 1 hour
        customer_payment_no: data.customerPaymentNo,
        customer_payment_description: data.customerPaymentDescription,
        sent_paylink_to_customer_email: data.sentPaylinkToCustomerEmail,
        sent_paylink_to_customer_mobile: data.sentPaylinkToCustomerMobile
      };
      
      console.log('[IPPS] Creating payment with data:', payload);
      
      const response = await axios.post(
        `${this.config.baseUrl}/merchant-api/v1.0/request-paylink`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );
      
      console.log('[IPPS] API response:', response.data);
      
      // Handle different response structures for payment URL
      let paymentUrl = null;
      if (response.data?.payment_url) {
        paymentUrl = response.data.payment_url;
      } else if (response.data?.data?.payment_url) {
        paymentUrl = response.data.data.payment_url;
      } else if (response.data?.paylink) {
        paymentUrl = response.data.paylink;
      }
      
      if (!paymentUrl) {
        throw new Error('Payment URL not found in response');
      }
      
      return {
        error: false,
        paymentUrl
      };
    } catch (error) {
      console.error('[IPPS] Error creating payment:', error);
      
      // Extract error message from response if available
      let errorMessage = 'Payment gateway error';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        error: true,
        message: errorMessage
      };
    }
  }
  
  // Optional: Implement token refresh functionality if needed
  async refreshToken() {
    // Implementation depends on your token refresh mechanism
    if (this.config.clientId && this.config.clientSecret) {
      try {
        const response = await axios.post(
          `${this.config.baseUrl}/oauth/token`,
          {
            grant_type: 'client_credentials',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data?.access_token) {
          this.config.accessToken = response.data.access_token;
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('[IPPS] Token refresh error:', error);
        return false;
      }
    }
    
    return false;
  }
} 