"use client";

import { useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { toast } from '@/components/ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { DeleteConfirmationModal } from '@/components/shared/delete-confirmation-modal';
import QuotationList from '@/components/quotations/quotation-list';
import { useQuotationService } from "@/lib/hooks/useQuotationService";
import { Quotation, QuotationStatus } from "@/types/quotations";
import { SendReminderDialog } from '@/components/quotations/send-reminder-dialog';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Filter, Edit, Eye, Copy, Trash, Send, FileText, RefreshCw, Download, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

interface QuotationsTableClientProps {
  initialQuotations: Quotation[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isOrganizationMember?: boolean;
  filterParams: {
    query?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
  };
}

export default function QuotationsTableClient({ 
  initialQuotations, 
  totalCount, 
  totalPages,
  currentPage,
  isOrganizationMember = true,
  filterParams
}: QuotationsTableClientProps) {
  const { t } = useI18n();
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [quotationsToDelete, setQuotationsToDelete] = useState<string[]>([]);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  
  const { 
    deleteQuotation, 
    sendQuotation
  } = useQuotationService();



  // Delete a quotation
  const handleDelete = useCallback((id: string) => {
    setQuotationToDelete(id);
    setQuotationsToDelete([]);
    setDeleteDialogOpen(true);
  }, []);

  // Delete multiple quotations
  const handleBulkDelete = useCallback((ids: string[]) => {
    setQuotationToDelete(null);
    setQuotationsToDelete(ids);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm and execute deletion
  const confirmDelete = useCallback(async () => {
    const idsToDelete = quotationToDelete ? [quotationToDelete] : quotationsToDelete;
    if (idsToDelete.length === 0) return;
    
    setIsLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Delete quotations one by one
      for (const id of idsToDelete) {
        try {
          const success = await deleteQuotation(id);
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error deleting quotation ${id}:`, error);
          errorCount++;
        }
      }
      
      // Update the quotations list
      setQuotations((prev) => prev.filter((q) => !idsToDelete.includes(q.id)));
      
      // Show appropriate toast message
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: t('quotations.notifications.deleteSuccess'),
          description: successCount === 1 
            ? 'Quotation deleted successfully' 
            : `${successCount} quotations deleted successfully`,
          variant: 'default',
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: 'Partial Success',
          description: `${successCount} quotations deleted, ${errorCount} failed`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('quotations.notifications.error'),
          description: 'Failed to delete quotations',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting quotations:', error);
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to delete quotations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
      setQuotationsToDelete([]);
    }
  }, [quotationToDelete, quotationsToDelete, deleteQuotation, t]);

  // Send a quotation to a customer
  const handleSend = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const success = await sendQuotation(id);
      if (success) {
        // Update the local state to reflect the change
        setQuotations((prev) => 
          prev.map((q) => (q.id === id ? { ...q, status: 'sent' } : q))
        );
        toast({
          title: t('quotations.notifications.sendSuccess'),
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to send quotation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [sendQuotation, t]);

  // Handle reminder click - open dialog instead of sending immediately
  const handleRemind = useCallback((id: string) => {
    const quotation = quotations.find(q => q.id === id);
    if (quotation) {
      setSelectedQuotation(quotation);
      setReminderDialogOpen(true);
    }
  }, [quotations]);

  return (
    <>
      <QuotationList
        quotations={quotations}
        isLoading={isLoading}
        onDelete={isOrganizationMember ? handleDelete : undefined}
        onBulkDelete={isOrganizationMember ? handleBulkDelete : undefined}
        onSend={isOrganizationMember ? handleSend : undefined}
        onRemind={isOrganizationMember ? handleRemind : undefined}
        isOrganizationMember={isOrganizationMember}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={currentPage}
        filterParams={filterParams}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationModal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isLoading}
        title={quotationToDelete ? "Delete Quotation" : "Delete Quotations"}
        description={
          quotationToDelete 
            ? "Are you sure you want to delete this quotation? This action cannot be undone."
            : `Are you sure you want to delete ${quotationsToDelete.length} quotations? This action cannot be undone.`
        }
        itemName="Quotation"
        itemCount={quotationToDelete ? 1 : quotationsToDelete.length}
        warningItems={[
          quotationToDelete 
            ? "This will permanently delete the selected quotation"
            : "This will permanently delete all selected quotations",
          "All associated data will be removed",
          "This action cannot be undone"
        ]}
      />
      
      {/* Reminder Dialog */}
      {selectedQuotation && (
        <SendReminderDialog
          quotation={selectedQuotation}
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
        />
      )}
    </>
  );
} 