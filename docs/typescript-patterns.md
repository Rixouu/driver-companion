# TypeScript Type Patterns

This document outlines common TypeScript patterns, best practices, and important type definitions used in the Vehicle Inspection System project.

## 1. Supabase Data Types

When interacting with Supabase, aim to use the types generated by Supabase for your database schema. These are typically found in `types/supabase.ts` (after running `npx supabase gen types typescript ...`).

- **Generated Types**: Use these for raw data fetched from or sent to Supabase tables. For example, `Database['public']['Tables']['vehicles']['Row']` for a vehicle row.
- **Custom Interfaces for Views/Joins**: If you have complex queries that join tables or select specific columns, define custom interfaces for the expected shape of the returned data. These interfaces can often extend or compose the base generated types.
- **Service Layer Typing**: Functions in the `lib/services/` directory that encapsulate Supabase calls should have explicit parameter and return types, using either the generated Supabase types or custom interfaces. This creates a type-safe layer for your data interactions.

Example (`types/index.ts` or a specific feature's type file):
```typescript
import type { Database } from './supabase';

export type DbVehicle = Database['public']['Tables']['vehicles']['Row'];
export type DbInspection = Database['public']['Tables']['inspections']['Row'];

// Custom type for an inspection that includes vehicle details
export interface ExtendedInspection extends DbInspection {
  vehicle: DbVehicle | null;
  // other extended properties
}
```

## 2. Generic Components and Hooks

For reusable UI components or utility hooks that can operate on different data types while maintaining type safety, use generics.

- **Hooks**: Utility hooks like `useDebounce<T>(value: T, delay: number): T` or `useAsync<T, Args extends any[]>(asyncFn: (...args: Args) => Promise<T>)` are good examples. They allow the hook to work with any data type `T` while preserving type information.
- **Components**: Components that render lists of items, or wrappers around form elements, can often benefit from generics. For example, a custom select component might be `CustomSelect<TValue, TOption extends { value: TValue; label: string }> `.

When creating generic functions or components:
- Provide meaningful names for type parameters (e.g., `TData`, `TValue`, `TError`).
- Use constraints (`extends`) on type parameters if the generic type needs to have a certain shape (e.g., `TItem extends { id: string }`).

## 3. Typed Translation Keys

To ensure type safety when using translation keys with the `useI18n` hook, we use a generated type for translation keys.

- **`TranslationPaths<T>`**: This utility type is defined in `lib/i18n/types.ts`. It takes a nested object type (like our English translation object `en`) and generates a union of all possible dot-notation string paths (e.g., `"common.save"`, `"vehicles.fields.plateNumber"`).
- **`AppTranslationKey`**: Defined in `lib/i18n/context.tsx` as `TranslationPaths<typeof en>`. This is the type that should be used for the `key` parameter of the `t` function.

**Usage**:
```typescript
import { useI18n } from '@/lib/i18n/context';

function MyComponent() {
  const { t } = useI18n();

  // Autocomplete and type checking for 'common.save'!
  return <button>{t('common.save')}</button>;
}
```
This prevents typos in translation keys and ensures that only valid, existing keys are used, catching errors at compile time.

## 4. Forms (React Hook Form)

When using `react-hook-form`:
- Define an interface or type for your form data structure.
- Pass this type to `useForm<MyFormData>()`.
- This provides type safety for default values, validation schema (if using Zod, for example), and form submission handlers.

Example:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const vehicleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  plateNumber: z.string().optional(),
  // ... other fields
});

export type VehicleFormData = z.infer<typeof vehicleFormSchema>;

function VehicleForm() {
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      name: "",
      plateNumber: "",
    },
  });

  function onSubmit(data: VehicleFormData) {
    console.log(data);
  }

  // ... form JSX ...
}
```

## 5. `interface` vs `type`

Follow the project's established conventions. Generally:
- **`interface`**: Prefer for defining the shape of objects, especially for public APIs or when declaration merging might be beneficial (though less common in functional React projects).
- **`type`**: Use for utility types, unions, intersections, or when defining types for primitives or more complex non-object shapes.

The custom instructions for this project state: "Use TypeScript for all code; prefer interfaces over types." Adhere to this where applicable, particularly for object shapes and component props.

---

_This document should be updated as new type patterns emerge or best practices evolve within the project._ 