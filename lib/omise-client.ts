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

  constructor(publicKey?: string, secretKey?: string) {
    this.config = {
      publicKey: publicKey || process.env.OMISE_PUBLIC_KEY || '',
      secretKey: secretKey || process.env.OMISE_SECRET_KEY || '',
      baseUrl: process.env.NODE_ENV === 'development' || process.env.OMISE_TEST_MODE === 'true' 
        ? 'https://api.omise.co' 
        : 'https://api.omise.co'
    };
  }

  // Omise Links API methods
  get links() {
    return {
      list: async (params?: { limit?: number; offset?: number; order?: 'chronological' | 'reverse_chronological' }) => {
        try {
          const queryParams = new URLSearchParams();
          if (params?.limit) queryParams.append('limit', params.limit.toString());
          if (params?.offset) queryParams.append('offset', params.offset.toString());
          if (params?.order) queryParams.append('order', params.order);

          const teamId = process.env.OMISE_TEAM_ID || '2156';
          const url = `https://linksplus-api.omise.co/external/${teamId}/links?${queryParams.toString()}`;

          console.log('[Omise] Fetching links from Payment Links+ API:', {
            url,
            teamId,
            usingApiKey: !!process.env.OMISE_PAYMENT_LINKS_API_KEY
          });

          const response = await axios.get(url, {
            headers: {
              'Authorization': process.env.OMISE_PAYMENT_LINKS_API_KEY || this.config.secretKey,
              'Accept': 'application/json'
            },
            timeout: 15000
          });

          console.log('[Omise] Received Payment Links+ response:', {
            hasData: !!response.data.data,
            dataLength: response.data.data?.length || 0,
            total: response.data.total,
            firstLink: response.data.data?.[0] ? {
              id: response.data.data[0].id,
              amount: response.data.data[0].amount,
              currency: response.data.data[0].currency,
              name: response.data.data[0].name
            } : null
          });

          return response.data;
        } catch (error) {
          console.error('[Omise] Error listing Payment Links+ links:', error);
          throw error;
        }
      },

      create: async (data: {
        amount: number;
        currency: string;
        title: string;
        description?: string;
        multiple?: boolean;
        returnUrl?: string;
      }) => {
        try {
          // Convert amount to smallest unit for Payment Links+
          const amountInSmallestUnit = this.convertToSmallestUnit(data.amount, data.currency);
          
          // Truncate title to 45 characters as required by Payment Links+ API
          const truncatedTitle = data.title.length > 45 ? data.title.substring(0, 42) + '...' : data.title;
          
          const requestData = {
            template_id: process.env.OMISE_TEMPLATE_ID || '3672',
            team_id: process.env.OMISE_TEAM_ID || '3388',
            name: truncatedTitle,
            currency: data.currency.toUpperCase(),
            amount: amountInSmallestUnit.toString(),
            multiple_usage: data.multiple ? 'true' : 'false',
            returnUrl: data.returnUrl || process.env.OMISE_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'https://my.japandriver.com'}/payment-status`
          };

          console.log('[Omise] Creating Payment Links+ link with data:', requestData);

          const response = await axios.post(
            'https://linksplus-api.omise.co/external/links',
            requestData,
            {
              headers: {
                'Authorization': process.env.OMISE_PAYMENT_LINKS_API_KEY || this.config.secretKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              timeout: 15000
            }
          );

          console.log('[Omise] Payment Links+ response:', response.data);

          if (response.data.object === 'link' && response.data.transaction_url) {
            return {
              id: response.data.id,
              object: 'link',
              livemode: response.data.livemode || false,
              location: response.data.location || '',
              amount: amountInSmallestUnit,
              currency: data.currency.toUpperCase(),
              title: data.title,
              description: data.description || '',
              multiple: data.multiple || false,
              used: response.data.used || false,
              created_at: response.data.created_at || new Date().toISOString(),
              deleted: response.data.deleted || false,
              deleted_at: response.data.deleted_at || null,
              payment_uri: response.data.transaction_url,
              charges: {
                data: response.data.charges || []
              }
            };
          } else {
            throw new Error(`Invalid Payment Links+ response: ${JSON.stringify(response.data)}`);
          }
        } catch (error) {
          console.error('[Omise] Error creating Payment Links+ link:', error);
          throw error;
        }
      },

      retrieve: async (id: string) => {
        try {
          const response = await axios.get(
            `https://linksplus-api.omise.co/external/links/${id}`,
            {
              headers: {
                'Authorization': process.env.OMISE_PAYMENT_LINKS_API_KEY || this.config.secretKey,
                'Accept': 'application/json'
              },
              timeout: 15000
            }
          );

          return response.data;
        } catch (error) {
          console.error('[Omise] Error retrieving Payment Links+ link:', error);
          throw error;
        }
      },

      destroy: async (id: string) => {
        try {
          // Try standard Omise Links API first for deletion
          const standardUrl = `${this.config.baseUrl}/links/${id}`;
          
          console.log('[Omise] Attempting to delete link via standard Omise API:', {
            url: standardUrl,
            linkId: id
          });

          const response = await axios.delete(standardUrl, {
            headers: {
              'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
              'Accept': 'application/json'
            },
            timeout: 15000
          });

          console.log('[Omise] Standard Omise API delete response:', response.data);
          return response.data;
        } catch (error) {
          console.error('[Omise] Standard API delete failed, trying Payment Links+ API:', error);
          
          try {
            // Fallback to Payment Links+ API
            const teamId = process.env.OMISE_TEAM_ID || '2156';
            const url = `https://linksplus-api.omise.co/external/${teamId}/links/${id}`;

            console.log('[Omise] Destroying Payment Links+ link:', {
              url,
              teamId,
              linkId: id,
              usingApiKey: !!process.env.OMISE_PAYMENT_LINKS_API_KEY
            });

            const response = await axios.delete(url, {
              headers: {
                'Authorization': process.env.OMISE_PAYMENT_LINKS_API_KEY || this.config.secretKey,
                'Accept': 'application/json'
              },
              timeout: 15000
            });

            console.log('[Omise] Payment Links+ destroy response:', response.data);
            return response.data;
          } catch (fallbackError) {
            console.error('[Omise] Both delete methods failed:', { standardError: error, fallbackError });
            throw new Error('Unable to delete payment link. Payment Links+ may not support deletion.');
          }
        }
      }
    };
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

  async getPaymentLink(linkId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://linksplus-api.omise.co/external/links/${linkId}`,
        {
          headers: {
            'Authorization': process.env.OMISE_PAYMENT_LINKS_API_KEY || this.config.secretKey,
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      return response.data;
    } catch (error) {
      console.error('[Omise] Error getting payment link:', error);
      return {
        error: true,
        message: 'Failed to get payment link'
      };
    }
  }

  async getCharge(chargeId: string): Promise<any> {
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

      return response.data;
    } catch (error) {
      console.error('[Omise] Error getting charge:', error);
      return {
        error: true,
        message: 'Failed to get charge details'
      };
    }
  }

  async getReceipt(chargeId: string): Promise<any> {
    try {
      // First get the charge to find the receipt ID
      const charge = await this.getCharge(chargeId);
      if (charge.error) {
        return charge;
      }

      // Get receipts for the charge
      const response = await axios.get(
        `${this.config.baseUrl}/receipts`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
            'Accept': 'application/json'
          },
          params: {
            charge: chargeId
          },
          timeout: 15000
        }
      );

      // Return the first receipt if available
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      } else {
        return {
          error: true,
          message: 'No receipt found for this charge'
        };
      }
    } catch (error) {
      console.error('[Omise] Error getting receipt:', error);
      return {
        error: true,
        message: 'Failed to get receipt'
      };
    }
  }
}
