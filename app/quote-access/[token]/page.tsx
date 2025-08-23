'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  CreditCard,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';


interface QuotationData {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  billing_company_name?: string;
  billing_tax_number?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  status: string;
  quote_number: number;
  created_at: string;
  expiry_date: string;
  amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  quotation_items: QuotationItem[];
}

interface QuotationItem {
  id: string;
  service_type: string;
  service_type_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function QuoteAccessPage() {
  const params = useParams();
  const token = params.token as string;
  
  // Simple currency formatter
  const formatCurrency = (amount: number, currency: string = 'JPY') => {
    if (currency === 'JPY') {
      return `¥${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };
  
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const validateTokenAndLoadQuotation = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/quotations/validate-magic-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 410) {
            setIsExpired(true);
            setError('This magic link has expired.');
          } else {
            setError(errorData.error || 'Invalid or expired magic link');
          }
          return;
        }

        const data = await response.json();
        setQuotation(data.quotation);
        
      } catch (error) {
        console.error('Error loading quotation:', error);
        setError('Failed to load quotation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      validateTokenAndLoadQuotation();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="p-6">
            {isExpired ? (
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold mb-2">
              {isExpired ? 'Magic Link Expired' : 'Access Denied'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || 'Unable to access this quotation'}
            </p>
            {isExpired && (
              <p className="text-sm text-muted-foreground">
                Magic links are valid for 7 days. Please contact us for a new link.
              </p>
            )}
            <Button 
              onClick={() => window.history.back()} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary', text: 'Draft' },
      sent: { variant: 'default', text: 'Sent' },
      approved: { variant: 'default', text: 'Approved' },
      rejected: { variant: 'destructive', text: 'Rejected' },
      converted: { variant: 'default', text: 'Converted to Booking' },
      paid: { variant: 'default', text: 'Paid' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline', text: status };
    
    return (
      <Badge variant={config.variant as any}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Your Quotation</h1>
            <p className="text-xl text-muted-foreground">
              Quote #{quotation.quote_number} • {quotation.customer_name}
            </p>
            <div className="flex items-center justify-center gap-2">
              {getStatusBadge(quotation.status)}
              <span className="text-sm text-muted-foreground">
                Created {formatDate(quotation.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Customer Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">Name</span>
                      <div className="font-semibold">{quotation.customer_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">Email</span>
                      <div className="font-semibold">{quotation.customer_email}</div>
                    </div>
                  </div>
                  {quotation.customer_phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Phone</span>
                        <div className="font-semibold">{quotation.customer_phone}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {quotation.billing_company_name && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Company</span>
                        <div className="font-semibold">{quotation.billing_company_name}</div>
                      </div>
                    </div>
                    {quotation.billing_tax_number && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">Tax ID</span>
                          <div className="font-semibold">{quotation.billing_tax_number}</div>
                        </div>
                      </div>
                    )}
                    {quotation.billing_address && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">Address</span>
                          <div className="text-sm">
                            {quotation.billing_address}
                            {quotation.billing_city && `, ${quotation.billing_city}`}
                            {quotation.billing_state && `, ${quotation.billing_state}`}
                            {quotation.billing_postal_code && ` ${quotation.billing_postal_code}`}
                            {quotation.billing_country && `, ${quotation.billing_country}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Services */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-primary" />
                <CardTitle>Services ({quotation.quotation_items.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotation.quotation_items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.service_type_name}</h3>
                      <span className="font-medium text-primary">
                        {formatCurrency(item.total_price, quotation.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Qty: {item.quantity}</span>
                      <span>Unit: {formatCurrency(item.unit_price, quotation.currency)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t flex justify-between items-center font-medium">
                  <span>Total Amount:</span>
                  <span className="text-lg text-primary">
                    {formatCurrency(quotation.total_amount, quotation.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(quotation.notes || quotation.terms) && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle>Additional Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {quotation.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                      <div className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                        {quotation.notes}
                      </div>
                    </div>
                  )}
                  
                  {quotation.terms && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Terms & Conditions</h3>
                      <div className="text-sm whitespace-pre-wrap">
                        {quotation.terms}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              This magic link will expire on {formatDate(quotation.expiry_date)}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Secure access via magic link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
