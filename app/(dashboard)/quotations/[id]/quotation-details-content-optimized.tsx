"use client";

import { Suspense, lazy, memo } from 'react';
import { Quotation, QuotationItem } from '@/types/quotations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  FileText,
  StickyNote,
  RefreshCw,
  Building,
  MapPin,
  CreditCard,
  Package,
  DollarSign
} from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';
import { QuotationDetailsSkeleton } from '@/components/quotations/quotation-details-skeleton';

// Lazy load heavy components
const QuotationShareButtons = lazy(() => import('@/components/quotations/quotation-share-buttons'));
const QuotationPdfButton = lazy(() => import('@/components/quotations/quotation-pdf-button'));
const QuotationInvoiceButton = lazy(() => import('@/components/quotations/quotation-invoice-button'));
const SendReminderDialog = lazy(() => import('@/components/quotations/send-reminder-dialog'));

interface QuotationDetailsContentOptimizedProps {
  quotation: Quotation;
  quotationItems: QuotationItem[];
  isOrganizationMember: boolean;
  onRefresh: () => void;
}

// Memoized components for better performance
const CustomerInfoCard = memo(({ quotation }: { quotation: Quotation }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Customer Information</CardTitle>
      <CardDescription>Contact details and preferences</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-start space-x-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="font-medium">{quotation.customer_name}</h3>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {quotation.customer_email}
              </span>
            </div>
            {quotation.customer_phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {quotation.customer_phone}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

const QuotationInfoCard = memo(({ quotation }: { quotation: Quotation }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">Quotation Information</CardTitle>
        <Badge variant="outline" className="text-sm">
          {quotation.status?.charAt(0).toUpperCase() + quotation.status?.slice(1)}
        </Badge>
      </div>
      <CardDescription>
        Quote #: {quotation.quote_number || quotation.id.substring(0, 8)}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Created Date</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateDDMMYYYY(quotation.created_at)}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Valid Until</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {quotation.valid_until ? formatDateDDMMYYYY(quotation.valid_until) : 'N/A'}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Company</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {quotation.company_name || 'N/A'}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Location</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {quotation.location || 'N/A'}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
));

const ServicesCard = memo(({ quotationItems }: { quotationItems: QuotationItem[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Services & Items</CardTitle>
      <CardDescription>Detailed breakdown of services and pricing</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {quotationItems.map((item, index) => (
        <div key={item.id || index} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{item.service_type_name || item.description}</h4>
            <Badge variant="outline">
              ¥{item.total_price?.toLocaleString()}
            </Badge>
          </div>
          
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <span className="ml-1 font-medium">{item.quantity}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Unit Price:</span>
              <span className="ml-1 font-medium">¥{item.unit_price?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-1 font-medium">¥{item.total_price?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
));

const PricingSummaryCard = memo(({ quotation }: { quotation: Quotation }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Pricing Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-sm font-medium">¥{quotation.subtotal?.toLocaleString() || '0'}</span>
        </div>
        
        {quotation.tax_amount && quotation.tax_amount > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tax</span>
            <span className="text-sm font-medium">¥{quotation.tax_amount.toLocaleString()}</span>
          </div>
        )}
        
        {quotation.discount_amount && quotation.discount_amount > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Discount</span>
            <span className="text-sm font-medium text-green-600">
              -¥{quotation.discount_amount.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-xl font-bold">¥{quotation.total_amount?.toLocaleString() || '0'}</span>
      </div>
    </CardContent>
  </Card>
));

const NotesCard = memo(({ quotation }: { quotation: Quotation }) => {
  if (!quotation.notes && !quotation.customer_notes && !quotation.internal_notes) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <StickyNote className="h-5 w-5" />
          <span>Notes & Comments</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quotation.notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">General Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {quotation.notes}
            </p>
          </div>
        )}
        
        {quotation.customer_notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">Customer Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {quotation.customer_notes}
            </p>
          </div>
        )}
        
        {quotation.internal_notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">Internal Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {quotation.internal_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const SidebarCard = memo(({ 
  quotation, 
  isOrganizationMember, 
  onRefresh 
}: { 
  quotation: Quotation; 
  isOrganizationMember: boolean;
  onRefresh: () => void;
}) => (
  <div className="space-y-6">
    {/* Status Card */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Quotation Status</p>
          <Badge 
            variant={quotation.status === 'approved' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {quotation.status?.charAt(0).toUpperCase() + quotation.status?.slice(1)}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment Status</p>
          <Badge 
            variant={quotation.payment_status === 'paid' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {quotation.payment_status?.charAt(0).toUpperCase() + quotation.payment_status?.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>

    {/* Actions Card */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        <Suspense fallback={<div className="h-9 bg-muted animate-pulse rounded" />}>
          <QuotationShareButtons quotationId={quotation.id} />
        </Suspense>
        
        <Suspense fallback={<div className="h-9 bg-muted animate-pulse rounded" />}>
          <QuotationPdfButton quotationId={quotation.id} />
        </Suspense>
        
        {isOrganizationMember && (
          <Suspense fallback={<div className="h-9 bg-muted animate-pulse rounded" />}>
            <QuotationInvoiceButton quotationId={quotation.id} />
          </Suspense>
        )}
        
        {isOrganizationMember && (
          <Suspense fallback={<div className="h-9 bg-muted animate-pulse rounded" />}>
            <SendReminderDialog quotationId={quotation.id} />
          </Suspense>
        )}
      </CardContent>
    </Card>
  </div>
));

export default function QuotationDetailsContentOptimized({ 
  quotation, 
  quotationItems,
  isOrganizationMember, 
  onRefresh 
}: QuotationDetailsContentOptimizedProps) {
  return (
    <div className="space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          <CustomerInfoCard quotation={quotation} />
          <QuotationInfoCard quotation={quotation} />
          <ServicesCard quotationItems={quotationItems} />
          <PricingSummaryCard quotation={quotation} />
          <NotesCard quotation={quotation} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <SidebarCard 
            quotation={quotation} 
            isOrganizationMember={isOrganizationMember}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
}
