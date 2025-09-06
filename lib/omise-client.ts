import axios from 'axios';

export interface OmiseConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface OmisePaymentLinkData {
  amount: number;
  currency: string;
  description: string;
  reference: string;
  customerEmail: string;
  customerName: string;
  expiryHours?: number;
  returnUrl?: string;
}

export interface OmiseResponse {
  error: boolean;
  message?: string;
  paymentUrl?: string;
  chargeId?: string;
}

export class OmiseClient {
  private config: OmiseConfig;

  constructor(config: OmiseConfig) {
    this.config = config;
  }

  async createPaymentLink(data: OmisePaymentLinkData): Promise<OmiseResponse> {
    try {
      // Convert amount to smallest currency unit (e.g., cents for USD, yen for JPY)
      const amountInSmallestUnit = this.convertToSmallestUnit(data.amount, data.currency);
      
      // For Payment Links+, we need to use the external API with template_id and team_id
      const payload = {
        template_id: process.env.OMISE_TEMPLATE_ID || '3672', // Your Driver Japan template ID
        team_id: process.env.OMISE_TEAM_ID || '3388', // Your team ID
        name: data.description, // Payment link name
        currency: data.currency.toUpperCase(), // JPY
        amount: amountInSmallestUnit,
        multiple_usage: false, // Single payment
        returnUrl: data.returnUrl || process.env.OMISE_RETURN_URL || 'https://your-domain.com/payment-status'
      };

      console.log('[Omise] Creating payment link with data:', payload);

      // Make API call to Payment Links+ (external API)
      // Try sending as regular object instead of URLSearchParams
      // Truncate name to 45 characters as required by the API
      const truncatedName = payload.name.length > 45 ? payload.name.substring(0, 42) + '...' : payload.name;
      
      console.log('[Omise] Using Template ID:', payload.template_id);
      console.log('[Omise] Using Team ID:', payload.team_id);
      
      const requestData = {
        template_id: payload.template_id.toString(),
        team_id: payload.team_id.toString(),
        name: truncatedName,
        currency: payload.currency,
        amount: payload.amount.toString(),
        multiple_usage: payload.multiple_usage.toString(),
        returnUrl: payload.returnUrl
      };

      // Payment Links+ requires its own specific API key from the dashboard
      const paymentLinksApiKey = process.env.OMISE_PAYMENT_LINKS_API_KEY || this.config.secretKey;
      
      // Debug: Log what we're sending
      console.log('[Omise] Original name length:', payload.name.length);
      console.log('[Omise] Truncated name:', truncatedName);
      console.log('[Omise] Request data being sent:', JSON.stringify(requestData, null, 2));
      console.log('[Omise] Using Payment Links+ API key:', process.env.OMISE_PAYMENT_LINKS_API_KEY ? 'from env' : 'fallback to secret key');
      console.log('[Omise] API key length:', paymentLinksApiKey?.length || 0);
      console.log('[Omise] API key (first 10 chars):', paymentLinksApiKey?.substring(0, 10) + '...');
      
      const response = await axios.post(
        'https://linksplus-api.omise.co/external/links',
        requestData,
        {
          headers: {
            'Authorization': paymentLinksApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('[Omise] API response:', response.data);

      if (response.data.object === 'link' && response.data.transaction_url) {
        return {
          error: false,
          paymentUrl: response.data.transaction_url, // Payment Links+ uses transaction_url
          chargeId: response.data.id // This is the link ID
        };
      } else {
        console.error('[Omise] Invalid Payment Links+ response:', response.data);
        throw new Error(`Invalid Payment Links+ response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error('[Omise] Error creating payment link:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('[Omise] Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.data?.error) {
          return {
            error: true,
            message: `Omise API Error: ${error.response.data.error.message || 'Unknown error'}`
          };
        }
        
        if (error.response?.status === 400) {
          return {
            error: true,
            message: `Omise API Error (400): ${error.response.data?.message || error.response.data?.error || 'Bad Request'}`
          };
        }
        
        return {
          error: true,
          message: `Network Error: ${error.message}`
        };
      }

      return {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }



  private convertToSmallestUnit(amount: number, currency: string): number {
    // Convert to smallest currency unit
    switch (currency.toUpperCase()) {
      case 'USD':
      case 'EUR':
      case 'GBP':
      case 'CAD':
      case 'AUD':
        return Math.round(amount * 100); // Convert to cents
      case 'JPY':
      case 'KRW':
        return Math.round(amount); // Already in smallest unit
      case 'THB':
        return Math.round(amount); // Already in smallest unit
      default:
        return Math.round(amount * 100); // Default to cents
    }
  }

  async getChargeStatus(chargeId: string): Promise<OmiseResponse> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/charges/${chargeId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data.object === 'charge') {
        return {
          error: false,
          message: response.data.paid ? 'Payment successful' : 'Payment pending',
          chargeId: response.data.id
        };
      } else {
        throw new Error('Invalid charge response');
      }
    } catch (error) {
      console.error('[Omise] Error getting charge status:', error);
      return {
        error: true,
        message: 'Failed to get charge status'
      };
    }
  }
}
