"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { FileIcon, SendIcon, CopyIcon, DownloadIcon, RotateCwIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface InvoiceData {
  id: string;
  status: "pending" | "sent" | "paid" | "created";
  created_at?: Date;
  sent_at?: Date;
  paid_at?: Date;
  payment_url?: string;
}

interface BookingData {
  id: string;
  status: "pending" | "confirmed" | "created";
  service_date?: string;
  pickup_time?: string;
  vehicle?: string;
  duration?: string;
}

interface InvoiceManagementProps {
  quotationId: string;
  customerId: string; 
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  invoiceData?: InvoiceData;
  bookingData?: BookingData;
}

export function InvoiceManagement({
  quotationId,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  amount,
  invoiceData,
  bookingData
}: InvoiceManagementProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>(invoiceData?.id ? "invoice" : "booking");
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentLinkCopied, setPaymentLinkCopied] = useState<boolean>(false);

  // Generate invoice ID with INV prefix and quotation ID
  const invoiceId = invoiceData?.id || `INV-${quotationId}`;
  const bookingId = bookingData?.id || `BK-${quotationId}`;

  const handleCreateInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quotations/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationId,
          customerId,
          customerName,
          customerEmail,
          customerPhone,
          amount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create invoice");
      }

      const data = await response.json();
      toast.success(t("invoices.messages.createSuccess"));
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : t("invoices.messages.createError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quotations/send-invoice-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationId,
          invoiceId: invoiceData?.id,
          customerEmail,
          customerName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send invoice");
      }

      toast.success(t("invoices.messages.sendSuccess"));
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : t("invoices.messages.sendError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quotations/mark-invoice-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationId,
          invoiceId: invoiceData?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark invoice as paid");
      }

      toast.success(t("invoices.messages.markPaidSuccess"));
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : t("invoices.messages.markPaidError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quotations/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationId,
          customerId,
          customerName,
          customerEmail,
          customerPhone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      toast.success(t("bookings.messages.createSuccess"));
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : t("bookings.messages.createError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quotations/confirm-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationId,
          bookingId: bookingData?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to confirm booking");
      }

      toast.success(t("bookings.messages.confirmSuccess"));
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : t("bookings.messages.confirmError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePaymentLink = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoiceData?.id,
          quotationId,
          customerEmail,
          customerPhone,
          amount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to regenerate payment link");
      }

      const data = await response.json();
      toast.success(t("payments.messages.regenerateSuccess"));
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : t("payments.messages.regenerateError")
      );
    } finally {
      setLoading(false);
    }
  };

  const copyPaymentLink = () => {
    if (invoiceData?.payment_url) {
      navigator.clipboard.writeText(invoiceData.payment_url);
      setPaymentLinkCopied(true);
      toast.success(t("common.copySuccess"));
      
      setTimeout(() => {
        setPaymentLinkCopied(false);
      }, 3000);
    }
  };

  const renderNoInvoiceState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">{t("invoices.noInvoiceCreatedYet")}</h3>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        {t("invoices.createInvoiceToSendPayment")}
      </p>
      <Button 
        onClick={handleCreateInvoice} 
        disabled={loading}
        className="min-w-[200px]"
      >
        {loading ? t("common.processing") : t("invoices.createInvoice")}
      </Button>
    </div>
  );

  const renderInvoiceCreated = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{invoiceId}</h3>
          <p className="text-sm text-gray-500">
            {invoiceData?.status === 'sent' 
              ? t("common.sentOn", { date: invoiceData?.sent_at?.toLocaleDateString() || '-' })
              : t("common.createdOn", { date: invoiceData?.created_at?.toLocaleDateString() || '-' })
            }
          </p>
        </div>
        <Badge variant={
          invoiceData?.status === 'paid' 
            ? 'success' 
            : invoiceData?.status === 'sent' 
              ? 'default' 
              : 'secondary'
        }>
          {invoiceData?.status === 'paid' 
            ? t("invoices.status.paid")
            : invoiceData?.status === 'sent'
              ? t("invoices.status.sent")
              : t("invoices.status.created")
          }
        </Badge>
      </div>

      {invoiceData?.payment_url && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">{t("payments.paymentLinkGenerated")}</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {t("payments.shareWithCustomer")}
            </p>
            <div className="flex gap-2">
              <Input 
                value={invoiceData.payment_url}
                readOnly
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyPaymentLink}
                className="flex-shrink-0"
              >
                {paymentLinkCopied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {invoiceData?.status !== 'sent' && (
          <Button 
            onClick={handleSendInvoice}
            disabled={loading || !invoiceData?.payment_url}
            className="flex-1"
          >
            <SendIcon className="h-4 w-4 mr-2" />
            {t("invoices.sendInvoiceWithPaymentLink")}
          </Button>
        )}
        
        <Button 
          variant="outline"
          onClick={() => window.open(`/api/quotations/download-invoice-pdf?invoiceId=${invoiceData?.id}`)}
          className="flex-1"
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          {t("invoices.downloadPDF")}
        </Button>
        
        {invoiceData?.status !== 'paid' && (
          <Button 
            variant="outline" 
            onClick={handleRegeneratePaymentLink}
            disabled={loading}
            className="flex-1"
          >
            <RotateCwIcon className="h-4 w-4 mr-2" />
            {t("payments.regeneratePaymentLink")}
          </Button>
        )}

        {invoiceData?.status !== 'paid' && (
          <Button 
            variant="default"
            onClick={handleMarkAsPaid}
            disabled={loading}
            className="flex-1"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {t("invoices.markAsPaid")}
          </Button>
        )}
      </div>
    </div>
  );

  const renderPaymentConfirmed = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-green-100 rounded-full p-3 mb-4">
        <CheckIcon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{t("payments.paymentConfirmed")}</h3>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        {t("bookings.youCanNowCreateBooking")}
      </p>
      <Button 
        onClick={handleCreateBooking} 
        disabled={loading || !!bookingData}
        className="min-w-[200px]"
      >
        {loading ? t("common.processing") : t("bookings.createBooking")}
      </Button>
    </div>
  );

  const renderBookingCreated = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{bookingId}</h3>
          <p className="text-sm text-gray-500">
            {bookingData?.status === 'confirmed' 
              ? t("bookings.confirmedOn", { date: new Date().toLocaleDateString() })
              : t("bookings.createdOn", { date: new Date().toLocaleDateString() })
            }
          </p>
        </div>
        <Badge variant={
          bookingData?.status === 'confirmed' 
            ? 'success' 
            : 'secondary'
        }>
          {bookingData?.status === 'confirmed' 
            ? t("bookings.status.confirmed")
            : t("bookings.status.created")
          }
        </Badge>
      </div>

      {bookingData && (
        <Card className="overflow-hidden border">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-6 p-6">
              <div>
                <p className="text-sm text-gray-500">{t("bookings.serviceDate")}</p>
                <p className="font-medium">{bookingData.service_date || "May 22nd, 2025"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("bookings.pickupTime")}</p>
                <p className="font-medium">{bookingData.pickup_time || "00:02:00"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("bookings.vehicle")}</p>
                <p className="font-medium">{bookingData.vehicle || "Mercedes Benz V Class - Black Suite"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("bookings.duration")}</p>
                <p className="font-medium">{bookingData.duration || "10 hours"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {bookingData?.status !== 'confirmed' && (
          <Button 
            onClick={handleConfirmBooking}
            disabled={loading}
            className="flex-1"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {t("bookings.confirmBooking")}
          </Button>
        )}
        
        <Button 
          variant="outline"
          className="flex-1"
        >
          <MessageSquareIcon className="h-4 w-4 mr-2" />
          {t("bookings.messageCustomer")}
        </Button>
      </div>
    </div>
  );

  const renderPaymentRequired = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-yellow-100 rounded-full p-3 mb-4">
        <ClockIcon className="h-8 w-8 text-yellow-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{t("payments.paymentRequired")}</h3>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        {t("bookings.invoiceMustBePaidBeforeCreatingBooking")}
      </p>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger 
              value="invoice" 
              className="flex-1"
              data-state={activeTab === "invoice" ? "active" : "inactive"}
            >
              {t("invoices.invoiceManagement")}
            </TabsTrigger>
            <TabsTrigger 
              value="booking" 
              className="flex-1"
              data-state={activeTab === "booking" ? "active" : "inactive"}
            >
              {t("bookings.bookingManagement")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="mt-6">
            {!invoiceData?.id ? (
              renderNoInvoiceState()
            ) : (
              renderInvoiceCreated()
            )}
          </TabsContent>

          <TabsContent value="booking" className="mt-6">
            {!invoiceData?.id ? (
              renderNoInvoiceState()
            ) : invoiceData?.status !== 'paid' ? (
              renderPaymentRequired()
            ) : !bookingData?.id ? (
              renderPaymentConfirmed()
            ) : (
              renderBookingCreated()
            )}
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}

// Additional icons needed for this component
function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
} 