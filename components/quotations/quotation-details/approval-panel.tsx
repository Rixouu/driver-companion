"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QuotationDetailsApprovalPanelProps {
  quotationId: string;
  onApprove: (notes: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  isProcessing: boolean;
}

export function QuotationDetailsApprovalPanel({
  quotationId,
  onApprove,
  onReject,
  isProcessing
}: QuotationDetailsApprovalPanelProps) {
  const { t } = useI18n();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const handleApprove = async () => {
    await onApprove(notes);
    setShowApproveDialog(false);
  };
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    await onReject(rejectionReason);
    setShowRejectDialog(false);
  };
  
  return (
    <div 
      className="transition-all duration-300"
      id="approval-panel-container"
    >
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {t('quotations.details.approvalPanel.title')}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 pb-2">
            {t('quotations.details.approvalPanel.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setShowApproveDialog(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-10 sm:h-10 text-xs font-medium"
              disabled={isProcessing}
            >
             
              {t('quotations.details.approvalPanel.approveButton')}
            </Button>
            <Button 
              onClick={() => setShowRejectDialog(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-10 sm:h-10 text-xs font-medium"
              disabled={isProcessing}
            >
              
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
    </div>
  );
} 