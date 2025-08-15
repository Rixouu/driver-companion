/**
 * Dynamic Currency Exchange Service
 * Fetches real-time exchange rates from multiple reliable sources
 */

export interface ExchangeRate {
  code: string;
  rate: number;
  name: string;
  symbol: string;
}

export interface CurrencyData {
  rates: Record<string, number>;
  lastUpdated: Date;
  source: string;
  baseCurrency: string;
}

class CurrencyService {
  private cache: CurrencyData | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  private readonly SUPPORTED_CURRENCIES = {
    JPY: { name: 'Japanese Yen', symbol: '¥' },
    USD: { name: 'US Dollar', symbol: '$' },
    EUR: { name: 'Euro', symbol: '€' },
    THB: { name: 'Thai Baht', symbol: '฿' },
    CNY: { name: 'Chinese Yuan', symbol: 'CN¥' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$' }
  };

  private readonly FALLBACK_RATES = {
    JPY: 1,
    USD: 0.0067,
    EUR: 0.0062,
    THB: 0.22,
    CNY: 0.048,
    SGD: 0.0091
  };

  /**
   * Get exchange rates with automatic caching and fallback
   */
  async getExchangeRates(baseCurrency: string = 'JPY'): Promise<CurrencyData> {
    // Check cache first
    if (this.cache && this.cacheExpiry && new Date() < this.cacheExpiry && this.cache.baseCurrency === baseCurrency) {
      return this.cache;
    }

    try {
      // Try primary source: exchangerate.host (free, reliable)
      const data = await this.fetchFromExchangeRateHost(baseCurrency);
      this.updateCache(data);
      return data;
    } catch (error) {
      console.warn('Primary currency service failed, trying backup sources:', error);
      
      try {
        // Try backup source: exchangerate-api.com
        const data = await this.fetchFromExchangeRateApi(baseCurrency);
        this.updateCache(data);
        return data;
      } catch (backupError) {
        console.warn('Backup currency service failed, using fallback rates:', backupError);
        
        // Use fallback rates
        return this.getFallbackData(baseCurrency);
      }
    }
  }

  /**
   * Primary source: exchangerate.host
   */
  private async fetchFromExchangeRateHost(baseCurrency: string): Promise<CurrencyData> {
    const response = await fetch(`https://api.exchangerate.host/latest?base=${baseCurrency}&symbols=${Object.keys(this.SUPPORTED_CURRENCIES).join(',')}`, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success && data.success !== undefined) {
      throw new Error(data.error?.info || 'API returned error');
    }

    // Filter to only supported currencies
    const filteredRates: Record<string, number> = {};
    Object.keys(this.SUPPORTED_CURRENCIES).forEach(code => {
      if (code === baseCurrency) {
        filteredRates[code] = 1;
      } else if (data.rates && typeof data.rates[code] === 'number') {
        filteredRates[code] = data.rates[code];
      }
    });

    return {
      rates: filteredRates,
      lastUpdated: new Date(data.date || Date.now()),
      source: 'exchangerate.host',
      baseCurrency
    };
  }

  /**
   * Backup source: exchangerate-api.com (free tier)
   */
  private async fetchFromExchangeRateApi(baseCurrency: string): Promise<CurrencyData> {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter to only supported currencies
    const filteredRates: Record<string, number> = {};
    Object.keys(this.SUPPORTED_CURRENCIES).forEach(code => {
      if (code === baseCurrency) {
        filteredRates[code] = 1;
      } else if (data.rates && typeof data.rates[code] === 'number') {
        filteredRates[code] = data.rates[code];
      }
    });

    return {
      rates: filteredRates,
      lastUpdated: new Date(data.date || Date.now()),
      source: 'exchangerate-api.com',
      baseCurrency
    };
  }

  /**
   * Fallback to static rates when APIs are unavailable
   */
  private getFallbackData(baseCurrency: string): CurrencyData {
    let rates = { ...this.FALLBACK_RATES };
    
    // If base currency is not JPY, convert all rates
    if (baseCurrency !== 'JPY') {
      const baseRate = this.FALLBACK_RATES[baseCurrency as keyof typeof this.FALLBACK_RATES];
      if (baseRate) {
        rates = {};
        Object.entries(this.FALLBACK_RATES).forEach(([code, rate]) => {
          rates[code] = rate / baseRate;
        });
      }
    }

    return {
      rates,
      lastUpdated: new Date(),
      source: 'fallback (static rates)',
      baseCurrency
    };
  }

  /**
   * Update cache with new data
   */
  private updateCache(data: CurrencyData): void {
    this.cache = data;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);
  }

  /**
   * Convert amount between currencies
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convert to base currency first, then to target currency
    return (amount / fromRate) * toRate;
  }

  /**
   * Format currency with proper symbols and locale
   */
  formatCurrency(amount: number, currencyCode: string): string {
    const currencyInfo = this.SUPPORTED_CURRENCIES[currencyCode as keyof typeof this.SUPPORTED_CURRENCIES];
    
    if (!currencyInfo) {
      return `${currencyCode} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Special formatting for certain currencies
    if (currencyCode === 'JPY' || currencyCode === 'CNY') {
      const rounded = Math.round(amount);
      return currencyCode === 'JPY' 
        ? `¥${rounded.toLocaleString()}`
        : `CN¥${rounded.toLocaleString()}`;
    } else if (currencyCode === 'THB') {
      return `฿${Math.round(amount).toLocaleString()}`;
    } else {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2
        }).format(amount);
      } catch (error) {
        // Fallback formatting
        return `${currencyInfo.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
  }

  /**
   * Get supported currencies info
   */
  getSupportedCurrencies(): Array<{code: string; name: string; symbol: string}> {
    return Object.entries(this.SUPPORTED_CURRENCIES).map(([code, info]) => ({
      code,
      name: info.name,
      symbol: info.symbol
    }));
  }

  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Export hook for React components
export function useCurrency(baseCurrency: string = 'JPY') {
  const [currencyData, setCurrencyData] = React.useState<CurrencyData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchRates() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await currencyService.getExchangeRates(baseCurrency);
        if (isMounted) {
          setCurrencyData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load exchange rates');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchRates();
    
    return () => {
      isMounted = false;
    };
  }, [baseCurrency]);

  const formatCurrency = React.useCallback((amount: number, currencyCode: string) => {
    return currencyService.formatCurrency(amount, currencyCode);
  }, []);

  const convertCurrency = React.useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    if (!currencyData) return amount;
    return currencyService.convertCurrency(amount, fromCurrency, toCurrency, currencyData.rates);
  }, [currencyData]);

  return {
    currencyData,
    isLoading,
    error,
    formatCurrency,
    convertCurrency,
    supportedCurrencies: currencyService.getSupportedCurrencies()
  };
}

// Add React import for the hook
import React from 'react';
