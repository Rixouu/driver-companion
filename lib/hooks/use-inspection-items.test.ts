import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInspectionItems } from './use-inspection-items';
import type { InspectionItem, InspectionItemTemplate, InspectionPhoto } from '@/components/inspections/inspection-details';
import type { SupabaseClient } from '@supabase/supabase-js';

const mockSupabase = {
  from: vi.fn(),
} as unknown as SupabaseClient;

// Mock return chain for Supabase queries
const mockQueryChain = {
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  // Default successful responses
  then: (callback: any) => Promise.resolve(callback({ data: [], error: null })),
};

const mockInitialItems: InspectionItem[] = [
  {
    id: 'item-1',
    inspection_id: 'insp-1',
    template_id: 'tpl-1',
    status: 'pending',
  },
  {
    id: 'item-2',
    inspection_id: 'insp-1',
    template_id: 'tpl-2',
    status: 'pending',
  },
  {
    id: 'item-3',
    inspection_id: 'insp-1',
    template_id: 'tpl-no-photo-no-template', // Will not have a template or photo in mocks
    status: 'pending',
  },
];

const mockTemplates: Partial<InspectionItemTemplate>[] = [
  { id: 'tpl-1', name_translations: { en: 'Template 1' } },
  { id: 'tpl-2', name_translations: { en: 'Template 2' } },
];

const mockPhotos: Partial<InspectionPhoto>[] = [
  { id: 'photo-1', inspection_item_id: 'item-1', photo_url: 'url-1' },
  { id: 'photo-2', inspection_item_id: 'item-1', photo_url: 'url-2' },
];

describe('useInspectionItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default implementation for from() to return the chainable mock
    vi.mocked(mockSupabase.from).mockImplementation(() => mockQueryChain as any);
    // Default implementation for `in` which returns the promise-like chain
    vi.mocked(mockQueryChain.in).mockImplementation(() => mockQueryChain as any);
    // Default select mock
    vi.mocked(mockQueryChain.select).mockImplementation(() => mockQueryChain as any);
  });

  const setupHook = (props: Partial<Parameters<typeof useInspectionItems>[0]>) => {
    const defaultProps = {
      initialInspectionItems: undefined,
      supabase: mockSupabase,
    };
    return renderHook((renderProps) => useInspectionItems({ ...defaultProps, ...props, ...renderProps }));
  };

  it('should initialize with initialInspectionItems and isLoadingTemplates as false', () => {
    const { result } = setupHook({ initialInspectionItems: mockInitialItems });
    expect(result.current.itemsWithTemplates).toEqual(mockInitialItems);
    expect(result.current.isLoadingTemplates).toBe(false);
  });

  it('should not fetch if initialInspectionItems is undefined or empty', () => {
    setupHook({ initialInspectionItems: undefined });
    expect(mockSupabase.from).not.toHaveBeenCalled();

    setupHook({ initialInspectionItems: [] });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should fetch templates and photos if initialInspectionItems are provided and itemsWithTemplates is initially empty', async () => {
    // This test simulates the scenario where the hook is called with initial items,
    // but the internal state `itemsWithTemplates` is initially empty,
    // forcing the useEffect to run the fetching logic.
    // We achieve this by not passing initialInspectionItems to setupHook directly,
    // but rather relying on the default useState([]) and then re-rendering with props.

    const { result, rerender } = renderHook(
      (props: Parameters<typeof useInspectionItems>[0]) => useInspectionItems(props),
      {
        initialProps: { initialInspectionItems: undefined, supabase: mockSupabase },
      }
    );

    // Mock Supabase responses
    vi.mocked(mockSupabase.from).mockImplementation((tableName: string) => {
      if (tableName === 'inspection_item_templates') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockTemplates, error: null }),
        } as any;
      }
      if (tableName === 'inspection_photos') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
        } as any;
      }
      return mockQueryChain as any;
    });

    // Now provide the initial items
    rerender({ initialInspectionItems: mockInitialItems, supabase: mockSupabase });

    expect(result.current.isLoadingTemplates).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingTemplates).toBe(false);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('inspection_item_templates');
    expect(mockSupabase.from).toHaveBeenCalledWith('inspection_photos');
    
    const { itemsWithTemplates } = result.current;
    expect(itemsWithTemplates).toHaveLength(mockInitialItems.length);
    // Check item 1
    expect(itemsWithTemplates[0].template).toEqual(mockTemplates[0]);
    expect(itemsWithTemplates[0].inspection_photos).toEqual([mockPhotos[0], mockPhotos[1]]);
    // Check item 2
    expect(itemsWithTemplates[1].template).toEqual(mockTemplates[1]);
    expect(itemsWithTemplates[1].inspection_photos).toEqual([]); // No photos for item-2 in mockPhotos
    // Check item 3 (no template, no photos)
    expect(itemsWithTemplates[2].template).toBeUndefined();
    expect(itemsWithTemplates[2].inspection_photos).toEqual([]);
  });

  it('should set isLoadingTemplates to false on template fetch error', async () => {
    vi.mocked(mockSupabase.from).mockImplementation((tableName: string) => {
      if (tableName === 'inspection_item_templates') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: null, error: new Error('Template fetch failed') }),
        } as any;
      }
      return mockQueryChain as any;
    });

    const { result, rerender } = renderHook(
      (props: Parameters<typeof useInspectionItems>[0]) => useInspectionItems(props),
      { initialProps: { initialInspectionItems: undefined, supabase: mockSupabase } }
    );
    rerender({ initialInspectionItems: mockInitialItems, supabase: mockSupabase });

    expect(result.current.isLoadingTemplates).toBe(true);
    await waitFor(() => expect(result.current.isLoadingTemplates).toBe(false));
    // When there's a template error, the hook returns early and doesn't update itemsWithTemplates
    // So itemsWithTemplates remains as the initial state (empty array)
    expect(result.current.itemsWithTemplates).toHaveLength(0);
  });

  it('should handle photo fetch error gracefully', async () => {
    vi.mocked(mockSupabase.from).mockImplementation((tableName: string) => {
      if (tableName === 'inspection_item_templates') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockTemplates, error: null }),
        } as any;
      }
      if (tableName === 'inspection_photos') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: null, error: new Error('Photo fetch failed') }),
        } as any;
      }
      return mockQueryChain as any;
    });

    const { result, rerender } = renderHook(
      (props: Parameters<typeof useInspectionItems>[0]) => useInspectionItems(props),
      { initialProps: { initialInspectionItems: undefined, supabase: mockSupabase } }
    );
    rerender({ initialInspectionItems: mockInitialItems, supabase: mockSupabase });
    
    await waitFor(() => expect(result.current.isLoadingTemplates).toBe(false));
    expect(result.current.itemsWithTemplates[0].template).toEqual(mockTemplates[0]); // Template loaded
    expect(result.current.itemsWithTemplates[0].inspection_photos).toEqual([]); // Photos empty due to error
  });

  it('should allow updating itemsWithTemplates via setItemsWithTemplates', () => {
    const { result } = setupHook({ initialInspectionItems: mockInitialItems });
    const newItems = [{ id: 'item-new', inspection_id: 'insp-1', template_id: 'tpl-new', status: 'pass' } as InspectionItem];
    act(() => {
      result.current.setItemsWithTemplates(newItems);
    });
    expect(result.current.itemsWithTemplates).toEqual(newItems);
  });

  it('should not fetch if templateIds array is empty', async () => {
    const itemsWithoutTemplateIds = [
      { id: 'item-no-tpl', inspection_id: 'insp-1', template_id: null, status: 'pending' } as unknown as InspectionItem,
    ];
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useInspectionItems>[0]) => useInspectionItems(props),
      { initialProps: { initialInspectionItems: undefined, supabase: mockSupabase } }
    );
    rerender({ initialInspectionItems: itemsWithoutTemplateIds, supabase: mockSupabase });
    
    // isLoadingTemplates should be false quickly as no actual call to DB is made for templates
    await waitFor(() => expect(result.current.isLoadingTemplates).toBe(false));
    expect(mockSupabase.from).not.toHaveBeenCalledWith('inspection_item_templates');
    // When there are no template IDs, the hook returns early and doesn't process photos either
    expect(mockSupabase.from).not.toHaveBeenCalledWith('inspection_photos');
  });

}); 