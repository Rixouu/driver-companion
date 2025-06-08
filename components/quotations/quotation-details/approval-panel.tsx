"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
  const [hoveredButton, setHoveredButton] = useState<'approve' | 'reject' | null>(null);
  
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
      className="transition-all duration-500 ease-in-out transform hover:scale-[1.01]"
      id="approval-panel-container"
    >
      <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-all duration-300 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-fit">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('quotations.details.approvalPanel.title') || 'Quotation Approval'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('quotations.details.approvalPanel.description') || 'Review this quotation and either approve to proceed or reject with detailed feedback.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Approve Button */}
            <Button 
              onClick={() => setShowApproveDialog(true)}
              onMouseEnter={() => setHoveredButton('approve')}
              onMouseLeave={() => setHoveredButton(null)}
              className={cn(
                "relative overflow-hidden group h-12 font-semibold transition-all duration-300",
                "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
                "text-white shadow-lg hover:shadow-xl transform hover:scale-105",
                "border-0 focus:ring-2 focus:ring-green-500/50",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
              disabled={isProcessing}
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[300%] transition-transform duration-700" />
              <div className="relative flex items-center justify-center gap-2">
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                {t('quotations.details.approvalPanel.approveButton') || 'Approve Quotation'}
              </div>
            </Button>
            
            {/* Reject Button */}
            <Button 
              onClick={() => setShowRejectDialog(true)}
              onMouseEnter={() => setHoveredButton('reject')}
              onMouseLeave={() => setHoveredButton(null)}
              className={cn(
                "relative overflow-hidden group h-12 font-semibold transition-all duration-300",
                "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                "text-white shadow-lg hover:shadow-xl transform hover:scale-105",
                "border-0 focus:ring-2 focus:ring-red-500/50",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
              disabled={isProcessing}
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[300%] transition-transform duration-700" />
              <div className="relative flex items-center justify-center gap-2">
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                {t('quotations.details.approvalPanel.rejectButton') || 'Reject Quotation'}
              </div>
            </Button>
          </div>
          
          {/* Info Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              💡 Your decision will be recorded and the customer will be notified automatically.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Enhanced Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-green-700 dark:text-green-300">
              {t('quotations.details.approvalPanel.approveConfirmation') || 'Approve Quotation'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('quotations.details.approvalPanel.approveDescription') || 'You are about to approve this quotation. The customer will be notified and can proceed with the booking.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes" className="text-sm font-medium">
                {t('quotations.details.approvalPanel.notesLabel') || 'Additional Notes (Optional)'}
              </Label>
              <Textarea
                id="approve-notes"
                placeholder={t('quotations.details.approvalPanel.notesPlaceholder') || 'Add any additional notes or instructions for the customer...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] focus:ring-2 focus:ring-green-500/50"
              />
            </div>
          </div>
          
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel 
              disabled={isProcessing}
              className="flex-1 hover:bg-muted/80"
            >
              {t('common.cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.processing') || 'Processing...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {t('quotations.details.approvalPanel.approveButton') || 'Approve'}
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-red-700 dark:text-red-300">
              {t('quotations.details.approvalPanel.rejectConfirmation') || 'Reject Quotation'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('quotations.details.approvalPanel.rejectDescription') || 'You are about to reject this quotation. Please provide a clear reason for the customer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm font-medium flex items-center gap-1">
                {t('quotations.details.approvalPanel.reasonLabel') || 'Rejection Reason'}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder={t('quotations.details.approvalPanel.reasonPlaceholder') || 'Please explain why this quotation is being rejected. This will help the customer understand and potentially resubmit with corrections.'}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] focus:ring-2 focus:ring-red-500/50"
                required
              />
              {rejectionReason.trim() && (
                <p className="text-xs text-green-600">
                  ✓ Reason provided ({rejectionReason.length} characters)
                </p>
              )}
            </div>
          </div>
          
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel 
              disabled={isProcessing}
              className="flex-1 hover:bg-muted/80"
            >
              {t('common.cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
              disabled={isProcessing || !rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.processing') || 'Processing...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {t('quotations.details.approvalPanel.rejectButton') || 'Reject'}
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 