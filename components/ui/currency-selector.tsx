"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCurrency } from '@/lib/services/currency-service';
import { cn } from '@/lib/utils';
import { 
  RefreshCw, 
  Info, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  baseCurrency?: string;
  className?: string;
  showRefreshButton?: boolean;
  showRateInfo?: boolean;
  compact?: boolean;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  baseCurrency = 'JPY',
  className,
  showRefreshButton = true,
  showRateInfo = true,
  compact = false
}: CurrencySelectorProps) {
  const { currencyData, isLoading, error, supportedCurrencies } = useCurrency(baseCurrency);
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

  const handleRefresh = () => {
    // Force refresh by clearing cache
    window.location.reload();
  };

  const getSourceInfo = () => {
    if (!currencyData) return null;
    
    return {
      source: currencyData.source,
      lastUpdated: currencyData.lastUpdated,
      isFallback: currencyData.source.includes('fallback'),
      isStale: new Date().getTime() - currencyData.lastUpdated.getTime() > 60 * 60 * 1000 // 1 hour
    };
  };

  const sourceInfo = getSourceInfo();

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (error || sourceInfo?.isFallback) return <AlertCircle className="h-3 w-3 text-orange-500" />;
    if (sourceInfo?.isStale) return <Clock className="h-3 w-3 text-yellow-500" />;
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  };

      const getTooltipContent = () => {
      if (!currencyData || !sourceInfo) {
        return (
          <div className="space-y-2">
            <p className="font-medium">Currency Rates</p>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading exchange rates...' : 'Failed to load exchange rates'}
            </p>
          </div>
        );
      }

      const selectedRate = currencyData.rates[selectedCurrency];
      const reverseRate = selectedRate ? 1 / selectedRate : null;
      
      return (
        <div className="space-y-3 max-w-xs">
          <div>
            <p className="font-medium">Exchange Rate Information</p>
            {selectedCurrency !== baseCurrency && selectedRate && (
              <div className="space-y-1 mt-2">
                <p className="text-sm font-medium text-blue-600">
                  1 {baseCurrency} = {selectedRate.toFixed(selectedCurrency === 'JPY' ? 0 : 4)} {selectedCurrency}
                </p>
                {reverseRate && (
                  <p className="text-sm font-medium text-blue-600">
                    1 {selectedCurrency} = {reverseRate.toFixed(baseCurrency === 'JPY' ? 0 : 4)} {baseCurrency}
                  </p>
                )}
              </div>
            )}
          </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source:</span>
            <span className={cn(
              "font-medium",
              sourceInfo.isFallback ? "text-orange-600" : "text-green-600"
            )}>
              {sourceInfo.source}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Updated:</span>
            <span className={cn(
              "font-medium",
              sourceInfo.isStale ? "text-yellow-600" : "text-green-600"
            )}>
              {format(sourceInfo.lastUpdated, 'MMM dd, HH:mm')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Base:</span>
            <span className="font-medium">{baseCurrency}</span>
          </div>
        </div>

        {/* Show all available exchange rates */}
        {Object.keys(currencyData.rates).length > 1 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">All Rates (1 {baseCurrency}):</p>
            <div className="space-y-1">
              {Object.entries(currencyData.rates)
                .filter(([code]) => code !== baseCurrency)
                .map(([code, rate]) => (
                  <div key={code} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{code}:</span>
                    <span className="font-mono font-medium">
                      {rate.toFixed(code === 'JPY' ? 0 : 4)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {sourceInfo.isFallback && (
          <div className="pt-2 border-t">
            <p className="text-xs text-orange-600">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Using fallback rates - live data unavailable
            </p>
          </div>
        )}

        {sourceInfo.isStale && !sourceInfo.isFallback && (
          <div className="pt-2 border-t">
            <p className="text-xs text-yellow-600">
              <Clock className="h-3 w-3 inline mr-1" />
              Rates may be outdated
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Rates are for reference only and may not reflect real-time market conditions.
          </p>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code} className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono">{currency.code}</span>
                  <span className="text-muted-foreground">{currency.symbol}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {showRateInfo && (
          <TooltipProvider>
            <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                >
                  {getStatusIcon()}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="w-auto">
                {getTooltipContent()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Currency:
        </label>
        <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{currency.code}</span>
                  <span className="text-muted-foreground">{currency.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {currency.name}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showRateInfo && (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 gap-1"
                  onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                >
                  {getStatusIcon()}
                  <Info className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="w-auto">
                {getTooltipContent()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {showRefreshButton && !isLoading && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="h-8 px-2 gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="text-xs">Refresh</span>
            </Button>
          )}
        </div>
      )}

      {/* Status badge for errors or fallback */}
      {(error || sourceInfo?.isFallback) && (
        <Badge variant="outline" className="text-xs">
          {error ? 'Error' : 'Offline'}
        </Badge>
      )}
    </div>
  );
}
