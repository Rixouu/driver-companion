import { useMemo } from 'react';
import { ServiceTypeInfo } from '@/types/quotations';

interface ThemeColors {
  primary: string;
  primaryBg: string;
  primaryBorder: string;
  primaryHover: string;
  primaryText: string;
  primaryButton: string;
  primaryIcon: string;
  primaryBadge: string;
  primaryCard: string;
  primaryCardBorder: string;
}

interface UseServiceThemeReturn {
  currentTheme: string;
  themeColors: ThemeColors;
  getServiceTheme: (serviceTypeId: string | null) => string;
  getThemeColors: (theme: string) => ThemeColors;
}

export function useServiceTheme(
  serviceType: string | null,
  allServiceTypes: ServiceTypeInfo[]
): UseServiceThemeReturn {
  // Determine color theme based on service type
  const getServiceTheme = (serviceTypeId: string | null): string => {
    if (!serviceTypeId) return 'default';
    const serviceTypeName = allServiceTypes.find(st => st.id === serviceTypeId)?.name?.toLowerCase() || '';
    
    if (serviceTypeName.includes('airport') || serviceTypeName.includes('haneda') || serviceTypeName.includes('narita')) {
      return 'airport'; // Green theme
    } else if (serviceTypeName.includes('charter')) {
      return 'charter'; // Blue theme
    }
    return 'default'; // Default theme
  };

  // Get theme colors based on current theme
  const getThemeColors = (theme: string): ThemeColors => {
    switch (theme) {
      case 'airport':
        return {
          primary: 'green',
          primaryBg: 'bg-green-50/30 dark:bg-green-900/10',
          primaryBorder: 'border-green-500',
          primaryHover: 'hover:border-green-300',
          primaryText: 'text-green-600 dark:text-green-400',
          primaryButton: 'bg-green-600 hover:bg-green-700',
          primaryIcon: 'text-green-600 dark:text-green-400',
          primaryBadge: 'bg-green-100 text-green-700',
          primaryCard: 'bg-green-50/50 dark:bg-green-900/20',
          primaryCardBorder: 'border-green-200 dark:border-green-800'
        };
      case 'charter':
        return {
          primary: 'blue',
          primaryBg: 'bg-blue-50/30 dark:bg-blue-900/10',
          primaryBorder: 'border-blue-500',
          primaryHover: 'hover:border-blue-300',
          primaryText: 'text-blue-600 dark:text-blue-400',
          primaryButton: 'bg-blue-600 hover:bg-blue-700',
          primaryIcon: 'text-blue-600 dark:text-blue-400',
          primaryBadge: 'bg-blue-100 text-blue-700',
          primaryCard: 'bg-blue-50/50 dark:bg-blue-900/20',
          primaryCardBorder: 'border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          primary: 'gray',
          primaryBg: 'bg-gray-50/30 dark:bg-gray-900/10',
          primaryBorder: 'border-gray-500',
          primaryHover: 'hover:border-gray-300',
          primaryText: 'text-gray-600 dark:text-gray-400',
          primaryButton: 'bg-gray-600 hover:bg-gray-700',
          primaryIcon: 'text-gray-600 dark:text-gray-400',
          primaryBadge: 'bg-gray-100 text-gray-700',
          primaryCard: 'bg-gray-50/50 dark:bg-gray-900/20',
          primaryCardBorder: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  const currentTheme = useMemo(() => getServiceTheme(serviceType), [serviceType, allServiceTypes]);
  const themeColors = useMemo(() => getThemeColors(currentTheme), [currentTheme]);

  return {
    currentTheme,
    themeColors,
    getServiceTheme,
    getThemeColors
  };
}

