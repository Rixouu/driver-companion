'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { useI18n } from '@/lib/i18n/context';

// Dynamically import NewVehiclePageContent
const NewVehiclePageContent = dynamic(() => 
  import('@/components/vehicles/new-vehicle-page-content').then(mod => mod.NewVehiclePageContent),
  {
    ssr: false, // NewVehiclePageContent is a client component
    loading: () => {
      const { t } = useI18n(); // Assuming useI18n can be used here, might need context setup if not.
      return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <p>{t("common.loading")}</p>
        </div>
      );
    }
  }
);

export function NewVehicleLoader() {
  return <NewVehiclePageContent />;
} 