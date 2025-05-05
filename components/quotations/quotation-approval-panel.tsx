"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n/context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { useQuotationService } from '@/hooks/useQuotationService';
import { QuotationStatus } from '@/types/quotations';

interface QuotationApprovalPanelProps {
  quotationId: string;
  status: QuotationStatus;
  onSuccess?: () => void;
}

export function QuotationApprovalPanel({ 
  quotationId, 
  status,
  onSuccess
}: QuotationApprovalPanelProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { approveQuotation, rejectQuotation } = useQuotationService();

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const success = await approveQuotation({
        quotation_id: quotationId,
        notes: notes
      });
      
      if (success) {
        setShowApproveDialog(false);
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    
    setIsProcessing(true);
    try {
      const success = await rejectQuotation({
        quotation_id: quotationId,
        rejected_reason: rejectionReason
      });
      
      if (success) {
        setShowRejectDialog(false);
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Only show for quotations that can be approved or rejected
  if (!['draft', 'sent'].includes(status)) {
    return null;
  }

  return (
    <>
      <Card className="mb-6 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {t('quotations.details.approvalPanel.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => setShowApproveDialog(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 h-auto"
              disabled={isProcessing}
            >
              <Check className="mr-1 h-3 w-3" />
              {t('quotations.details.approvalPanel.approveButton')}
            </Button>
            <Button 
              onClick={() => setShowRejectDialog(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 h-auto"
              disabled={isProcessing}
            >
              <X className="mr-1 h-3 w-3" />
              {t('quotations.details.approvalPanel.rejectButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('quotations.details.approvalPanel.approveConfirmation')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('quotations.details.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">
                {t('quotations.details.approvalPanel.notesLabel')}
              </Label>
              <Textarea
                id="approve-notes"
                placeholder={t('quotations.details.approvalPanel.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? t('common.processing') : t('quotations.details.approvalPanel.approveButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('quotations.details.approvalPanel.rejectConfirmation')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('quotations.details.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="required">
                {t('quotations.details.approvalPanel.reasonLabel')}
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder={t('quotations.details.approvalPanel.reasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? t('common.processing') : t('quotations.details.approvalPanel.rejectButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 