import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const baseCurrency = searchParams.get('base') || 'JPY';
    
    // In production, you would fetch from a real currency API like:
    // - https://api.exchangerate-api.com/v4/latest/JPY
    // - https://api.fixer.io/latest?base=JPY
    // - https://api.currencylayer.com/live
    
    // For now, using static rates (you can replace with real API calls)
    const exchangeRates = {
      'JPY': 1,
      'USD': 0.0067,  // 1 JPY = 0.0067 USD (1 USD = ~149.25 JPY)
      'EUR': 0.0062,  // 1 JPY = 0.0062 EUR (1 EUR = ~161.29 JPY)
      'THB': 0.24,    // 1 JPY = 0.24 THB (1 THB = ~4.17 JPY)
      'CNY': 0.048,   // 1 JPY = 0.048 CNY (1 CNY = ~20.83 JPY)
      'SGD': 0.0091,  // 1 JPY = 0.0091 SGD (1 SGD = ~109.89 JPY)
      'GBP': 0.0053,  // 1 JPY = 0.0053 GBP (1 GBP = ~188.68 JPY)
      'AUD': 0.0101,  // 1 JPY = 0.0101 AUD (1 AUD = ~99.01 JPY)
      'CAD': 0.0091,  // 1 JPY = 0.0091 CAD (1 CAD = ~109.89 JPY)
      'CHF': 0.0059   // 1 JPY = 0.0059 CHF (1 CHF = ~169.49 JPY)
    };
    
    // Calculate rates relative to base currency
    const baseRate = exchangeRates[baseCurrency as keyof typeof exchangeRates] || 1;
    const rates: Record<string, number> = {};
    
    Object.entries(exchangeRates).forEach(([currency, rate]) => {
      rates[currency] = rate / baseRate;
    });
    
    return NextResponse.json({
      success: true,
      base: baseCurrency,
      rates,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Currency API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
