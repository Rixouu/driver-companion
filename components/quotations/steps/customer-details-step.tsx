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
const getAddressConfig = (country: string, t: any) => {
  switch (country) {
    case 'Japan':
      return {
        postalCodeLabel: t('quotations.form.billing.postalCode'),
        postalCodePlaceholder: '100-0001',
        stateLabel: t('quotations.form.billing.prefecture'),
        statePlaceholder: 'Tokyo',
        cityLabel: t('quotations.form.billing.cityWard'),
        cityPlaceholder: 'Chiyoda-ku',
        streetLabel: t('quotations.form.billing.streetName'),
        streetNumberLabel: t('quotations.form.billing.buildingNumber'),
        addressOrder: ['postal', 'state', 'city', 'street', 'number']
      };
    case 'United States':
    case 'Canada':
      return {
        postalCodeLabel: country === 'United States' ? t('quotations.form.billing.zipCode') : t('quotations.form.billing.postalCode'),
        postalCodePlaceholder: country === 'United States' ? '90210' : 'K1A 0A6',
        stateLabel: country === 'United States' ? t('quotations.form.billing.provinceState') : t('quotations.form.billing.provinceState'),
        statePlaceholder: country === 'United States' ? 'California' : 'Ontario',
        cityLabel: t('quotations.form.billing.districtCity'),
        cityPlaceholder: 'Los Angeles',
        streetLabel: t('quotations.form.billing.streetName'),
        streetNumberLabel: t('quotations.form.billing.unitApt'),
        addressOrder: ['street', 'number', 'city', 'state', 'postal']
      };
    case 'United Kingdom':
      return {
        postalCodeLabel: t('quotations.form.billing.postalCode'),
        postalCodePlaceholder: 'SW1A 1AA',
        stateLabel: t('quotations.form.billing.county'),
        statePlaceholder: 'London',
        cityLabel: t('quotations.form.billing.cityTown'),
        cityPlaceholder: 'Westminster',
        streetLabel: t('quotations.form.billing.streetName'),
        streetNumberLabel: t('quotations.form.billing.buildingNumber'),
        addressOrder: ['number', 'street', 'city', 'state', 'postal']
      };
    case 'Germany':
      return {
        postalCodeLabel: t('quotations.form.billing.postleitzahl'),
        postalCodePlaceholder: '10115',
        stateLabel: t('quotations.form.billing.stateBundesland'),
        statePlaceholder: 'Berlin',
        cityLabel: t('quotations.form.billing.districtCity'),
        cityPlaceholder: 'Berlin',
        streetLabel: t('quotations.form.billing.streetName'),
        streetNumberLabel: t('quotations.form.billing.houseNumber'),
        addressOrder: ['street', 'number', 'postal', 'city', 'state']
      };
    case 'Hong Kong':
      return {
        postalCodeLabel: t('quotations.form.billing.postalCode'),
        postalCodePlaceholder: '000000',
        stateLabel: t('quotations.form.billing.district'),
        statePlaceholder: 'Central and Western',
        cityLabel: t('quotations.form.billing.area'),
        cityPlaceholder: 'Central',
        streetLabel: t('quotations.form.billing.streetName'),
        streetNumberLabel: t('quotations.form.billing.building'),
        addressOrder: ['street', 'number', 'city', 'state', 'postal']
      };
    case 'China':
      return {
        postalCodeLabel: t('quotations.form.billing.postalCodeChinese'),
        postalCodePlaceholder: '100000',
        stateLabel: t('quotations.form.billing.provinceChinese'),
        statePlaceholder: 'Beijing',
        cityLabel: t('quotations.form.billing.cityChinese'),
        cityPlaceholder: 'Beijing',
        streetLabel: t('quotations.form.billing.streetChinese'),
        streetNumberLabel: t('quotations.form.billing.buildingChinese'),
        addressOrder: ['state', 'city', 'street', 'number', 'postal']
      };
    case 'Australia':
      return {
        postalCodeLabel: t('quotations.form.billing.postalCode'),
        postalCodePlaceholder: '2000',
        stateLabel: t('quotations.form.billing.stateTerritory'),
        statePlaceholder: 'NSW',
        cityLabel: t('quotations.form.billing.suburb'),
        cityPlaceholder: 'Sydney',
        streetLabel: t('quotations.form.billing.streetName'),
        streetNumberLabel: t('quotations.form.billing.unitApt'),
        addressOrder: ['number', 'street', 'city', 'state', 'postal']
      };
    default: // Thailand and others
      return {
        postalCodeLabel: t('quotations.form.billing.postalCode'),
        postalCodePlaceholder: '10100',
        stateLabel: t('quotations.form.billing.provinceState'),
        statePlaceholder: 'Bangkok',
        cityLabel: t('quotations.form.billing.districtCity'),
        cityPlaceholder: 'Pathumwan',
        streetLabel: t('quotations.form.billing.streetName'),
        streetNumberLabel: t('quotations.form.billing.houseBuildingNumber'),
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
  const addressConfig = getAddressConfig(selectedCountry, t);

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
                      {field.value ? `${getCountryFlag(field.value)} ${field.value}` : t('quotations.form.billing.selectCountry')}
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
                      placeholder={t('quotations.form.billing.searchCountries')} 
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
                          {t('quotations.form.billing.noCountryFound')}
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
                          {t('quotations.form.billing.useCustomCountry', { country: searchValue.trim() || t('quotations.form.billing.customCountry') })}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('quotations.form.billing.customCountrySaved')}
                        </p>
                      </div>
                    </CommandEmpty>
                    
                    {/* Recently used countries */}
                    {!searchValue && (
                      <CommandGroup heading={t('quotations.form.billing.recentlyUsed')}>
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
                    <CommandGroup heading={searchValue ? t('quotations.form.billing.searchResults') : t('quotations.form.billing.allCountries')}>
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