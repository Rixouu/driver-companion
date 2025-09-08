"use client";

import { UseFormReturn } from 'react-hook-form';
import { FileText, StickyNote, Lock, Eye, Users, User } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500" />
                {t('quotations.form.merchantNotes')}
              </FormLabel>
              <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20">
                <Lock className="h-3 w-3 mr-1" />
                {t('quotations.form.notes.private')}
              </Badge>
            </div>
            <FormControl>
              <div className="relative">
                <AutoExpandingTextarea
                  placeholder={t('quotations.form.placeholders.merchantNotes')}
                  className="font-mono text-sm leading-relaxed border-l-4 border-l-orange-500 focus:border-l-orange-600 bg-orange-50/30 dark:bg-orange-900/10"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
                <div className="absolute top-2 right-2">
                  <Lock className="h-4 w-4 text-orange-500/60" />
                </div>
              </div>
            </FormControl>
            <FormDescription className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <User className="h-3 w-3" />
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
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                {t('quotations.form.customerNotes')}
              </FormLabel>
              <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                <Eye className="h-3 w-3 mr-1" />
                {t('quotations.form.notes.public')}
              </Badge>
            </div>
            <FormControl>
              <div className="relative">
                <AutoExpandingTextarea
                  placeholder={t('quotations.form.placeholders.customerNotes')}
                  className="font-mono text-sm leading-relaxed border-l-4 border-l-blue-500 focus:border-l-blue-600 bg-blue-50/30 dark:bg-blue-900/10"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
                <div className="absolute top-2 right-2">
                  <Eye className="h-4 w-4 text-blue-500/60" />
                </div>
              </div>
            </FormControl>
            <FormDescription className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Users className="h-3 w-3" />
              {t('quotations.form.descriptions.customerNotes')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 