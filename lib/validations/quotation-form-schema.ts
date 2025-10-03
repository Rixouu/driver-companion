import * as z from 'zod';

export const quotationFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  customer_name: z.string().optional(),
  customer_email: z.string().email({ message: 'Valid email is required' }),
  customer_phone: z.string().optional(),
  billing_company_name: z.string().optional(),
  billing_tax_number: z.string().optional(),
  billing_street_name: z.string().optional(),
  billing_street_number: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_postal_code: z.string().optional(),
  billing_country: z.string().optional(),
  service_type: z.string().optional(),
  vehicle_category: z.string().optional(),
  vehicle_type: z.union([
    z.string(),
    z.object({
      id: z.string(),
      brand: z.string(),
      model: z.string(),
      name: z.string().optional(),
      year: z.string().optional(),
      status: z.string().optional(),
      category_id: z.string().optional()
    })
  ]).optional(),
  pickup_date: z.date().optional(),
  pickup_time: z.string().optional(),
  pickup_location: z.string().optional(),
  dropoff_location: z.string().optional(),
  flight_number: z.string().optional(),
  terminal: z.string().optional(),
  number_of_passengers: z.union([
    z.coerce.number().min(1).max(50),
    z.literal('').transform(() => null)
  ]).optional().nullable(),
  number_of_bags: z.union([
    z.coerce.number().min(0).max(20),
    z.literal('').transform(() => null)
  ]).optional().nullable(),
  duration_hours: z.union([
    z.coerce.number().min(1).max(24),
    z.literal('none').transform(() => 1),
    z.literal('').transform(() => 1)
  ]).optional().default(1),
  service_days: z.union([
    z.coerce.number().min(1).max(30),
    z.literal('none').transform(() => 1),
    z.literal('').transform(() => 1)
  ]).optional().default(1),
  hours_per_day: z.union([
    z.coerce.number().min(1).max(24),
    z.literal('none').transform(() => null),
    z.literal('').transform(() => null)
  ]).optional().nullable(),
  discount_percentage: z.union([
    z.coerce.number().min(0).max(100),
    z.literal('none').transform(() => 0),
    z.literal('').transform(() => 0)
  ]).optional().default(0),
  tax_percentage: z.union([
    z.coerce.number().min(0).max(100),
    z.literal('none').transform(() => 0),
    z.literal('').transform(() => 0)
  ]).optional().default(0),
  merchant_notes: z.string().optional(),
  customer_notes: z.string().optional(),
  internal_notes: z.string().optional(),
  general_notes: z.string().optional(),
  passenger_count: z.union([
    z.coerce.number().int().nullable(),
    z.literal('none').transform(() => null),
    z.literal('undefined').transform(() => null)
  ]).optional().nullable(),
  display_currency: z.string().optional().default('JPY'),
  team_location: z.enum(['japan', 'thailand']).default('thailand'),
});

export type QuotationFormData = z.infer<typeof quotationFormSchema>;
