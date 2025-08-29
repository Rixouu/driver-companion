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
import { useEffect, useRef } from 'react';

interface NotesStepProps {
  form: UseFormReturn<any>;
}

// Auto-expanding textarea component
function AutoExpandingTextarea({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  ...props 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`min-h-[120px] max-h-[400px] overflow-hidden ${className}`}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }}
      {...props}
    />
  );
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
              <AutoExpandingTextarea
                placeholder={t('quotations.form.placeholders.merchantNotes')}
                className="font-mono text-sm leading-relaxed"
                value={field.value || ''}
                onChange={field.onChange}
              />
            </FormControl>
            <FormDescription>
              {t('quotations.form.descriptions.merchantNotes')}
            </FormDescription>
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
              <AutoExpandingTextarea
                placeholder={t('quotations.form.placeholders.customerNotes')}
                className="font-mono text-sm leading-relaxed"
                value={field.value || ''}
                onChange={field.onChange}
              />
            </FormControl>
            <FormDescription>
              {t('quotations.form.descriptions.customerNotes')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 