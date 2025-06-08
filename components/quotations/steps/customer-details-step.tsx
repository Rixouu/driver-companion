"use client";

import { UseFormReturn } from 'react-hook-form';
import { User, Mail, Phone, Home, Building, Receipt } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface CustomerDetailsStepProps {
  form: UseFormReturn<any>;
}

export function CustomerDetailsStep({ form }: CustomerDetailsStepProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <User className="h-5 w-5" /> 
        {t('quotations.form.customerSection')}
      </h2>
      
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('quotations.form.title')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('quotations.form.placeholders.title')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" /> 
                {t('quotations.form.customerName')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.placeholders.customerName')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {t('quotations.form.customerEmail')}
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('quotations.form.placeholders.customerEmail')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="customer_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {t('quotations.form.customerPhone')}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t('quotations.form.placeholders.customerPhone')}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <Separator className="my-4" />
      
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Home className="h-5 w-5" /> 
        {t('quotations.form.billing.title')} ({t('quotations.form.billing.optional')})
      </h3>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <FormField
          control={form.control}
          name="billing_company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                {t('quotations.form.billing.companyName')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.billing.companyName')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="billing_tax_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                {t('quotations.form.billing.taxNumber')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.billing.taxNumber')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <FormField
          control={form.control}
          name="billing_street_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('quotations.form.billing.streetName')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.billing.streetName')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="billing_street_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('quotations.form.billing.streetNumber')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.billing.streetNumber')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <FormField
          control={form.control}
          name="billing_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('quotations.form.billing.city')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.billing.city')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="billing_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('quotations.form.billing.state')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.billing.state')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="billing_postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('quotations.form.billing.postalCode')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('quotations.form.billing.postalCode')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="billing_country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('quotations.form.billing.country')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('quotations.form.billing.country')}
                {...field}
                value={field.value || 'Thailand'}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 