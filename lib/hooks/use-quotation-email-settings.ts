import { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface EmailSettings {
  email: string;
  language: 'en' | 'ja';
  bccEmails: string;
}

export function useQuotationEmailSettings(form: UseFormReturn<any>) {
  const [isBccDialogOpen, setIsBccDialogOpen] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    email: form.getValues('customer_email') || '',
    language: 'en',
    bccEmails: 'booking@japandriver.com'
  });

  const updateEmailSettings = useCallback((settings: Partial<EmailSettings>) => {
    setEmailSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const openBccDialog = useCallback(() => {
    // Update email from form data
    const currentEmail = form.getValues('customer_email') || '';
    setEmailSettings(prev => ({ ...prev, email: currentEmail }));
    setIsBccDialogOpen(true);
  }, [form]);

  const closeBccDialog = useCallback(() => {
    setIsBccDialogOpen(false);
  }, []);

  const resetEmailSettings = useCallback(() => {
    setEmailSettings({
      email: form.getValues('customer_email') || '',
      language: 'en',
      bccEmails: 'booking@japandriver.com'
    });
  }, [form]);

  return {
    isBccDialogOpen,
    emailSettings,
    updateEmailSettings,
    openBccDialog,
    closeBccDialog,
    resetEmailSettings
  };
}
