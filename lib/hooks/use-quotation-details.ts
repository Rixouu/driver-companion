import { useState, useEffect, useCallback } from 'react';
import { Quotation, QuotationItem } from '@/types/quotations';
import { useQuotationService } from './use-quotation-service';

interface UseQuotationDetailsReturn {
  quotation: Quotation | null;
  quotationItems: QuotationItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateQuotation: (updates: Partial<Quotation>) => Promise<void>;
  updateQuotationItem: (itemId: string, updates: Partial<QuotationItem>) => Promise<void>;
  deleteQuotationItem: (itemId: string) => Promise<void>;
  addQuotationItem: (item: Omit<QuotationItem, 'id'>) => Promise<void>;
}

export function useQuotationDetails(
  quotationId: string,
  initialQuotation?: Quotation & { quotation_items?: QuotationItem[] }
): UseQuotationDetailsReturn {
  const [quotation, setQuotation] = useState<Quotation | null>(initialQuotation || null);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>(
    initialQuotation?.quotation_items || []
  );
  const [loading, setLoading] = useState(!initialQuotation);
  const [error, setError] = useState<string | null>(null);

  const {
    getQuotationById,
    updateQuotation: updateQuotationService,
    updateQuotationItem: updateQuotationItemService,
    deleteQuotationItem: deleteQuotationItemService,
    addQuotationItem: addQuotationItemService
  } = useQuotationService();

  const fetchQuotation = useCallback(async () => {
    if (!quotationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const quotationData = await getQuotationById(quotationId);
      
      if (!quotationData) {
        setError('Quotation not found');
        return;
      }
      
      setQuotation(quotationData);
      setQuotationItems(quotationData.quotation_items || []);
    } catch (err) {
      console.error('Error fetching quotation:', err);
      setError('Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  }, [quotationId, getQuotationById]);

  const refetch = useCallback(async () => {
    await fetchQuotation();
  }, [fetchQuotation]);

  const updateQuotation = useCallback(async (updates: Partial<Quotation>) => {
    if (!quotation) return;
    
    try {
      setError(null);
      const updatedQuotation = await updateQuotationService(quotation.id, updates);
      setQuotation(updatedQuotation);
    } catch (err) {
      console.error('Error updating quotation:', err);
      setError('Failed to update quotation');
      throw err;
    }
  }, [quotation, updateQuotationService]);

  const updateQuotationItem = useCallback(async (itemId: string, updates: Partial<QuotationItem>) => {
    try {
      setError(null);
      const updatedItem = await updateQuotationItemService(itemId, updates);
      
      setQuotationItems(prev => 
        prev.map(item => item.id === itemId ? updatedItem : item)
      );
    } catch (err) {
      console.error('Error updating quotation item:', err);
      setError('Failed to update quotation item');
      throw err;
    }
  }, [updateQuotationItemService]);

  const deleteQuotationItem = useCallback(async (itemId: string) => {
    try {
      setError(null);
      await deleteQuotationItemService(itemId);
      
      setQuotationItems(prev => 
        prev.filter(item => item.id !== itemId)
      );
    } catch (err) {
      console.error('Error deleting quotation item:', err);
      setError('Failed to delete quotation item');
      throw err;
    }
  }, [deleteQuotationItemService]);

  const addQuotationItem = useCallback(async (item: Omit<QuotationItem, 'id'>) => {
    if (!quotation) return;
    
    try {
      setError(null);
      const newItem = await addQuotationItemService(quotation.id, item);
      
      setQuotationItems(prev => [...prev, newItem]);
    } catch (err) {
      console.error('Error adding quotation item:', err);
      setError('Failed to add quotation item');
      throw err;
    }
  }, [quotation, addQuotationItemService]);

  useEffect(() => {
    if (!initialQuotation) {
      fetchQuotation();
    }
  }, [fetchQuotation, initialQuotation]);

  return {
    quotation,
    quotationItems,
    loading,
    error,
    refetch,
    updateQuotation,
    updateQuotationItem,
    deleteQuotationItem,
    addQuotationItem
  };
}
