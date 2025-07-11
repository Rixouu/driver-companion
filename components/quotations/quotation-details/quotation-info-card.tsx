"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Timer,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format, parseISO, differenceInDays, isAfter, addDays } from 'date-fns';
import { QuotationStatus } from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';

interface QuotationInfoCardProps {
  quotation: {
    id: string;
    status: QuotationStatus;
    quote_number?: string;
    created_at: string;
    expiry_date: string;
    last_sent_at?: string;
    reminder_sent_at?: string;
  };
  onRefresh?: () => void;
}

export function QuotationInfoCard({ quotation, onRefresh }: QuotationInfoCardProps) {
  const { t } = useI18n();
  
  // Calculate expiry status properly - quotation is valid for 2 days from creation
  const now = new Date();
  const createdDate = new Date(quotation.created_at);
  // Calculate proper expiry date: 2 days from creation
  const properExpiryDate = addDays(createdDate, 2);
  const daysUntilExpiry = differenceInDays(properExpiryDate, now);
  const isExpired = isAfter(now, properExpiryDate);
  const isExpiringSoon = !isExpired && daysUntilExpiry <= 1;
  
  // Get status configuration
  const getStatusConfig = () => {
    if (isExpired && (quotation.status === 'draft' || quotation.status === 'sent')) {
      return {
        variant: 'destructive' as const,
        label: 'Expired',
        icon: XCircle,
        color: 'text-red-500'
      };
    }

    switch (quotation.status) {
      case 'draft':
        return {
          variant: 'secondary' as const,
          label: 'Draft',
          icon: Clock,
          color: 'text-gray-500'
        };
      case 'sent':
        return {
          variant: 'default' as const,
          label: 'Sent',
          icon: CheckCircle,
          color: 'text-blue-500'
        };
      case 'approved':
        return {
          variant: 'success' as const,
          label: 'Approved',
          icon: CheckCircle,
          color: 'text-green-500'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          label: 'Rejected',
          icon: XCircle,
          color: 'text-red-500'
        };
      case 'converted':
        return {
          variant: 'default' as const,
          label: 'Converted',
          icon: CheckCircle,
          color: 'text-purple-500'
        };
      default:
        return {
          variant: 'secondary' as const,
          label: quotation.status,
          icon: Clock,
          color: 'text-gray-500'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Quotation Status
          </CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
            <Badge variant={statusConfig.variant} className="font-medium">
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Validity - Only show for draft/sent quotations */}
        {(quotation.status === 'draft' || quotation.status === 'sent') && (
          <div className={`p-3 rounded-lg border ${
            isExpired 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : isExpiringSoon
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isExpired ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : isExpiringSoon ? (
                <Timer className="h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${
                isExpired 
                  ? 'text-red-700 dark:text-red-300' 
                  : isExpiringSoon
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-green-700 dark:text-green-300'
              }`}>
                {isExpired 
                  ? 'Expired' 
                  : isExpiringSoon
                  ? 'Expiring Soon'
                  : 'Valid'
                }
              </span>
            </div>
            <div className={`text-xs ${
              isExpired 
                ? 'text-red-600 dark:text-red-400' 
                : isExpiringSoon
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {isExpired 
                ? `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago`
                : isExpiringSoon
                ? `Expires ${daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}`
                : `Valid for ${daysUntilExpiry} more day${daysUntilExpiry !== 1 ? 's' : ''}`
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 inline mr-1" />
              Valid until {format(properExpiryDate, 'MMM d, yyyy')} at {format(properExpiryDate, 'h:mm a')}
            </div>
          </div>
        )}

        {/* Summary for completed quotations */}
        {(quotation.status === 'approved' || quotation.status === 'rejected' || quotation.status === 'converted') && (
          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created {format(createdDate, 'MMM d, yyyy')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 