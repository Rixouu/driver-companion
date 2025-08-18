"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePad, SignaturePadHandle } from '@/components/ui/signature-pad';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface QuotationDetailsApprovalPanelProps {
  onApprove: (notes: string, signature?: string) => Promise<void>;
  onReject: (reason: string, signature?: string) => Promise<void>;
  isProcessing: boolean;
  customerName?: string;
  quotation?: { quote_number?: string };
}

export function QuotationDetailsApprovalPanel({
  onApprove,
  onReject,
  isProcessing,
  customerName,
  quotation
}: QuotationDetailsApprovalPanelProps) {
  const { t } = useI18n();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [hoveredButton, setHoveredButton] = useState<'approve' | 'reject' | null>(null);
  const [approveSignature, setApproveSignature] = useState<string | null>(null);
  const [rejectSignature, setRejectSignature] = useState<string | null>(null);
  const approvePadRef = useRef<SignaturePadHandle>(null);
  const rejectPadRef = useRef<SignaturePadHandle>(null);
  
  const handleApprove = async () => {
    await onApprove(notes, approveSignature || undefined);
    setShowApproveDialog(false);
    setApproveSignature(null);
    setNotes('');
  };
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    await onReject(rejectionReason, rejectSignature || undefined);
    setShowRejectDialog(false);
    setRejectSignature(null);
    setRejectionReason('');
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
                {t('quotations.details.approvalPanel.approveButton') || 'Approve'}
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
                {t('quotations.details.approvalPanel.rejectButton') || 'Reject'}
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
        <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold">
                  Approve Quotation #{quotation?.quote_number || 'N/A'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground">
                  Review and approve to proceed with the booking.
                </AlertDialogDescription>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or comments about your decision"
                className="w-full h-20 text-sm"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Label className="text-sm font-medium">Approval Signature *</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto"
                    onClick={() => approvePadRef.current?.clear()}>
                    {t('common.clearSignature') || 'Clear'}
                  </Button>
                  {customerName && (
                    <Button type="button" variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto"
                      onClick={() => approvePadRef.current?.togglePresets()}>
                      {t('common.showPresets') || 'Show Presets'}
                    </Button>
                  )}
                </div>
              </div>
              <SignaturePad
                ref={approvePadRef as any}
                onSignatureChange={setApproveSignature}
                required={true}
                className="w-full bg-white rounded border"
                customerName={customerName}
                showHeader={false}
                showActions={false}
                canvasHeight={180}
              />
            </div>
          </div>
          
          <AlertDialogFooter className="flex gap-3 pt-4">
            <AlertDialogCancel 
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={isProcessing || !approveSignature}
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
        <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold">
                  Reject Quotation #{quotation?.quote_number || 'N/A'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground">
                  Are you sure you want to reject this quotation?
                </AlertDialogDescription>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-red-500">*</span>
                <Label className="text-sm font-medium">Reason for Rejection</Label>
              </div>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this quotation"
                className="w-full h-20 text-sm"
                required
              />
              {rejectionReason.trim() && (
                <p className="text-xs text-green-500 mt-1">
                  ✓ Reason provided ({rejectionReason.length} characters)
                </p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Label className="text-sm font-medium">Rejection Signature *</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto"
                    onClick={() => rejectPadRef.current?.clear()}>
                    {t('common.clearSignature') || 'Clear'}
                  </Button>
                  {customerName && (
                    <Button type="button" variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto"
                      onClick={() => rejectPadRef.current?.togglePresets()}>
                      {t('common.showPresets') || 'Show Presets'}
                    </Button>
                  )}
                </div>
              </div>
              <SignaturePad
                ref={rejectPadRef as any}
                onSignatureChange={setRejectSignature}
                required={true}
                className="w-full bg-white rounded border"
                customerName={customerName}
                showHeader={false}
                showActions={false}
                canvasHeight={180}
              />
            </div>
          </div>
          
          <AlertDialogFooter className="flex gap-3 pt-4">
            <AlertDialogCancel 
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
              disabled={isProcessing || !rejectionReason.trim() || !rejectSignature}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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