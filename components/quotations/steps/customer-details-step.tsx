"use client";

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerDetailsStepProps {
  form: UseFormReturn<any>;
}

// Recently used countries (you could also store this in localStorage)
const recentlyUsedCountries = ['Thailand', 'Japan', 'United States', 'Hong Kong', 'Singapore'];

// Helper function to get country flag emoji
const getCountryFlag = (countryName: string) => {
  const flagMap: Record<string, string> = {
    'Thailand': '🇹🇭',
    'Japan': '🇯🇵',
    'United States': '🇺🇸',
    'Hong Kong': '🇭🇰',
    'Singapore': '🇸🇬',
    'China': '🇨🇳',
    'South Korea': '🇰🇷',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Switzerland': '🇨🇭',
    'Belgium': '🇧🇪',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Taiwan': '🇹🇼',
    'India': '🇮🇳',
    'Bangladesh': '🇧🇩',
    'Myanmar': '🇲🇲',
    'Cambodia': '🇰🇭',
    'Laos': '🇱🇦',
    'Philippines': '🇵🇭',
    'Vietnam': '🇻🇳',
    'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾'
  };
  return flagMap[countryName] || '🌍';
};

// Common countries for the dropdown
const countries = [
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Japan', label: 'Japan' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'China', label: 'China' },
  { value: 'Hong Kong', label: 'Hong Kong' },
  { value: 'Taiwan', label: 'Taiwan' },
  { value: 'India', label: 'India' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Myanmar', label: 'Myanmar' },
  { value: 'Cambodia', label: 'Cambodia' },
  { value: 'Laos', label: 'Laos' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Other', label: 'Other' },
];

// Address field configurations based on country
const getAddressConfig = (country: string) => {
  switch (country) {
    case 'Japan':
      return {
        postalCodeLabel: 'Postal Code (〒)',
        postalCodePlaceholder: '100-0001',
        stateLabel: 'Prefecture',
        statePlaceholder: 'Tokyo',
        cityLabel: 'City/Ward',
        cityPlaceholder: 'Chiyoda-ku',
        streetLabel: 'Street Address',
        streetNumberLabel: 'Building/Apartment',
        addressOrder: ['postal', 'state', 'city', 'street', 'number']
      };
    case 'United States':
    case 'Canada':
      return {
        postalCodeLabel: country === 'United States' ? 'ZIP Code' : 'Postal Code',
        postalCodePlaceholder: country === 'United States' ? '90210' : 'K1A 0A6',
        stateLabel: country === 'United States' ? 'State' : 'Province',
        statePlaceholder: country === 'United States' ? 'California' : 'Ontario',
        cityLabel: 'City',
        cityPlaceholder: 'Los Angeles',
        streetLabel: 'Street Address',
        streetNumberLabel: 'Apt/Suite',
        addressOrder: ['street', 'number', 'city', 'state', 'postal']
      };
    case 'United Kingdom':
      return {
        postalCodeLabel: 'Postcode',
        postalCodePlaceholder: 'SW1A 1AA',
        stateLabel: 'County',
        statePlaceholder: 'London',
        cityLabel: 'City/Town',
        cityPlaceholder: 'Westminster',
        streetLabel: 'Street Address',
        streetNumberLabel: 'Building Number',
        addressOrder: ['number', 'street', 'city', 'state', 'postal']
      };
    case 'Germany':
      return {
        postalCodeLabel: 'Postleitzahl (PLZ)',
        postalCodePlaceholder: '10115',
        stateLabel: 'State (Bundesland)',
        statePlaceholder: 'Berlin',
        cityLabel: 'City',
        cityPlaceholder: 'Berlin',
        streetLabel: 'Street',
        streetNumberLabel: 'House Number',
        addressOrder: ['street', 'number', 'postal', 'city', 'state']
      };
    case 'Hong Kong':
      return {
        postalCodeLabel: 'Postal Code',
        postalCodePlaceholder: '000000',
        stateLabel: 'District',
        statePlaceholder: 'Central and Western',
        cityLabel: 'Area',
        cityPlaceholder: 'Central',
        streetLabel: 'Street',
        streetNumberLabel: 'Building',
        addressOrder: ['street', 'number', 'city', 'state', 'postal']
      };
    case 'China':
      return {
        postalCodeLabel: 'Postal Code (邮编)',
        postalCodePlaceholder: '100000',
        stateLabel: 'Province (省)',
        statePlaceholder: 'Beijing',
        cityLabel: 'City (市)',
        cityPlaceholder: 'Beijing',
        streetLabel: 'Street (街道)',
        streetNumberLabel: 'Building (楼)',
        addressOrder: ['state', 'city', 'street', 'number', 'postal']
      };
    case 'Australia':
      return {
        postalCodeLabel: 'Postcode',
        postalCodePlaceholder: '2000',
        stateLabel: 'State/Territory',
        statePlaceholder: 'NSW',
        cityLabel: 'Suburb',
        cityPlaceholder: 'Sydney',
        streetLabel: 'Street Address',
        streetNumberLabel: 'Unit/Apt',
        addressOrder: ['number', 'street', 'city', 'state', 'postal']
      };
    default: // Thailand and others
      return {
        postalCodeLabel: 'Postal Code',
        postalCodePlaceholder: '10100',
        stateLabel: 'Province/State',
        statePlaceholder: 'Bangkok',
        cityLabel: 'District/City',
        cityPlaceholder: 'Pathumwan',
        streetLabel: 'Street Name',
        streetNumberLabel: 'House/Building Number',
        addressOrder: ['number', 'street', 'city', 'state', 'postal']
      };
  }
};

export function CustomerDetailsStep({ form }: CustomerDetailsStepProps) {
  const { t } = useI18n();
  
  // Add state for country selection
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Watch the selected country to adapt address fields
  const selectedCountry = form.watch('billing_country') || 'Thailand';
  const addressConfig = getAddressConfig(selectedCountry);

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
              <FormLabel>{addressConfig.streetLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={addressConfig.streetLabel}
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
              <FormLabel>{addressConfig.streetNumberLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={addressConfig.streetNumberLabel}
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
              <FormLabel>{addressConfig.cityLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={addressConfig.cityPlaceholder}
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
              <FormLabel>{addressConfig.stateLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={addressConfig.statePlaceholder}
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
              <FormLabel>{addressConfig.postalCodeLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={addressConfig.postalCodePlaceholder}
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
            <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryPopoverOpen}
                    className="w-full justify-between"
                  >
                    <span className={field.value ? 'font-medium' : 'text-muted-foreground'}>
                      {field.value ? `${getCountryFlag(field.value)} ${field.value}` : 'Select country...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <CommandInput 
                      placeholder="Search countries or type custom name..." 
                      value={searchValue}
                      onValueChange={setSearchValue}
                      className="border-0 focus:ring-0 px-0"
                    />
                    {searchValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setSearchValue('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          No country found. You can type a custom country name.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const customCountry = searchValue.trim();
                            if (customCountry) {
                              field.onChange(customCountry);
                              setCountryPopoverOpen(false);
                              setSearchValue('');
                            }
                          }}
                          disabled={!searchValue.trim()}
                        >
                          Use "{searchValue.trim() || 'Custom Country'}"
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          This will be saved as a custom country entry.
                        </p>
                      </div>
                    </CommandEmpty>
                    
                    {/* Recently used countries */}
                    {!searchValue && (
                      <CommandGroup heading="Recently Used">
                        {recentlyUsedCountries
                          .filter(country => countries.some(c => c.value === country))
                          .map((countryValue) => {
                            const country = countries.find(c => c.value === countryValue);
                            if (!country) return null;
                            return (
                              <CommandItem
                                key={country.value}
                                value={country.value}
                                onSelect={() => {
                                  field.onChange(country.value);
                                  setCountryPopoverOpen(false);
                                  setSearchValue('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === country.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="mr-2">{getCountryFlag(country.value)}</span>
                                {country.label}
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    )}
                    
                    {/* All countries */}
                    <CommandGroup heading={searchValue ? "Search Results" : "All Countries"}>
                      {countries
                        .filter(country => 
                          country.label.toLowerCase().includes(searchValue.toLowerCase()) ||
                          country.value.toLowerCase().includes(searchValue.toLowerCase())
                        )
                        .map((country) => (
                          <CommandItem
                            key={country.value}
                            value={country.value}
                            onSelect={() => {
                              field.onChange(country.value);
                              setCountryPopoverOpen(false);
                              setSearchValue('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === country.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="mr-2">{getCountryFlag(country.value)}</span>
                            {country.label}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 