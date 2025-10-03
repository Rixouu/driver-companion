"use client";

import { Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BccDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailSettings: {
    email: string;
    language: 'en' | 'ja';
    bccEmails: string;
  };
  onEmailSettingsChange: (settings: { email: string; language: 'en' | 'ja'; bccEmails: string }) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function BccDialog({
  open,
  onOpenChange,
  emailSettings,
  onEmailSettingsChange,
  onSubmit,
  loading
}: BccDialogProps) {
  const handleEmailChange = (email: string) => {
    onEmailSettingsChange({ ...emailSettings, email });
  };

  const handleLanguageChange = (language: 'en' | 'ja') => {
    onEmailSettingsChange({ ...emailSettings, language });
  };

  const handleBccChange = (bccEmails: string) => {
    onEmailSettingsChange({ ...emailSettings, bccEmails });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Quotation to Customer
          </DialogTitle>
          <DialogDescription>
            Configure email settings before sending this quotation to the customer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer-email">Customer Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={emailSettings.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="customer@example.com"
              className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email will be sent to the customer's registered email address
            </p>
          </div>
          
          <div>
            <Label htmlFor="bcc-emails">BCC Emails</Label>
            <Input
              id="bcc-emails"
              value={emailSettings.bccEmails}
              onChange={(e) => handleBccChange(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: booking@japandriver.com. Add more emails separated by commas.
            </p>
          </div>
          
          <div>
            <Label>Language</Label>
            <Select value={emailSettings.language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
              📧 What's included in the email:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Complete quotation details and service information</li>
              <li>• Customer information and contact details</li>
              <li>• Service breakdown and pricing</li>
              <li>• Quotation PDF attachment</li>
              <li>• Magic link for customer access</li>
              <li>• Company branding and contact information</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={loading}
            className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Quotation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
