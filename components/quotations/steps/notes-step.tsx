"use client";

import { UseFormReturn } from 'react-hook-form';
import { FileText, StickyNote } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface NotesStepProps {
  form: UseFormReturn<any>;
}

export function NotesStep({ form }: NotesStepProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" /> 
        {t('quotations.form.notesSection')}
      </h2>
      
      <FormField
        control={form.control}
        name="merchant_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              <StickyNote className="h-4 w-4 text-muted-foreground" /> 
              {t('quotations.form.merchantNotes')}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('quotations.form.placeholders.merchantNotes')}
                className="min-h-[120px] max-h-[400px] resize-y font-mono text-sm leading-relaxed"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              {t('quotations.form.descriptions.merchantNotes')}
            </FormDescription>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Tip: Press Enter to create new lines. Line breaks will be preserved internally.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="customer_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              <StickyNote className="h-4 w-4 text-muted-foreground" /> 
              {t('quotations.form.customerNotes')}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('quotations.form.placeholders.customerNotes')}
                className="min-h-[120px] max-h-[400px] resize-y font-mono text-sm leading-relaxed"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              {t('quotations.form.descriptions.customerNotes')}
            </FormDescription>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Tip: Press Enter to create new lines. Line breaks will be preserved in the quotation.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 