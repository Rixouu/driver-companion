import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInspectionStatus } from './use-inspection-status';
import { toast } from '@/components/ui/use-toast';
import type { ExtendedInspection } from '@/components/inspections/inspection-details';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Mocks
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(), // Added for completeness, though not used by this hook
  forward: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

const mockUser: User = {
  id: 'user-test-123',
  app_metadata: { provider: 'email' },
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockInspection: ExtendedInspection = {
  id: 'insp-test-456',
  vehicle_id: 'veh-test-789',
  type: 'safety',
  date: new Date().toISOString(),
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-test-123',
  inspection_items: [{ id: 'item-1' } as any], // Basic item to pass the guard
};

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn(),
  eq: vi.fn().mockReturnThis(),
} as unknown as SupabaseClient;

const mockT = (key: string) => key;

describe('useInspectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset supabase mock states for each test
    vi.mocked(mockSupabase.from).mockClear().mockReturnThis();
    vi.mocked(mockSupabase.insert).mockClear().mockReturnThis();
    vi.mocked(mockSupabase.update).mockClear().mockReturnThis();
    vi.mocked(mockSupabase.select).mockClear().mockReturnThis();
    vi.mocked(mockSupabase.single).mockClear();
    vi.mocked(mockSupabase.eq).mockClear().mockReturnThis();
  });

  const setupHook = (props: Partial<Parameters<typeof useInspectionStatus>[0]> = {}) => {
    const defaultProps = {
      inspection: mockInspection,
      user: mockUser,
      supabase: mockSupabase,
      router: mockRouter as unknown as AppRouterInstance,
      t: mockT,
    };
    return renderHook(() => useInspectionStatus({ ...defaultProps, ...props }));
  };

  it('should initialize with isUpdating as false', () => {
    const { result } = setupHook();
    expect(result.current.isUpdating).toBe(false);
  });

  describe('handleStartInspection', () => {
    it('should do nothing if inspection or inspection_items are missing', async () => {
      const { result } = setupHook({ inspection: undefined as any });
      await act(async () => {
        await result.current.handleStartInspection();
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();

      const { result: result2 } = setupHook({ inspection: { ...mockInspection, inspection_items: undefined } });
      await act(async () => {
        await result2.current.handleStartInspection();
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should successfully start an inspection', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({ data: { id: 'status-id' }, error: null }); // For insert
      vi.mocked(mockSupabase.update).mockResolvedValueOnce({ error: null } as any); // For update (eq().update() structure)

      const { result } = setupHook();
      
      await act(async () => {
        await result.current.handleStartInspection();
      });

      expect(result.current.isUpdating).toBe(false);
      expect(mockSupabase.from).toHaveBeenCalledWith('inspection_statuses');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        inspection_id: mockInspection.id,
        status: 'in_progress',
        inspector_id: mockUser.id,
      }));
      expect(mockSupabase.from).toHaveBeenCalledWith('inspections');
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        inspector_id: mockUser.id,
        status: 'in_progress',
      }));
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockInspection.id);
      expect(toast).toHaveBeenCalledWith({ title: 'inspections.messages.updateSuccess' });
      expect(mockRouter.push).toHaveBeenCalledWith(`/inspections/${mockInspection.id}/perform`);
      expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
    });

    it('should handle error during inspection_statuses insert', async () => {
      const insertError = new Error('Insert failed');
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({ data: null, error: insertError });

      const { result } = setupHook();
      await act(async () => {
        await result.current.handleStartInspection();
      });

      expect(result.current.isUpdating).toBe(false);
      expect(toast).toHaveBeenCalledWith({ title: 'inspections.messages.error', variant: 'destructive' });
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle error during inspections update', async () => {
      const updateError = new Error('Update failed');
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({ data: { id: 'status-id' }, error: null }); // Insert success
      // Mocking supabase.from('inspections').update().eq() to return an error
      const mockUpdateChain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(), // Not strictly needed for update but good to have for from() chain
        single: vi.fn().mockReturnThis(), // Not strictly needed for update
         // This part of the chain actually returns the error for .update()
        then: (callback: any) => Promise.resolve(callback({ error: updateError, data: null })) 
      };
      const mockFromChain = {
        insert: vi.fn().mockReturnThis(), 
        update: vi.fn(() => mockUpdateChain),
        select: vi.fn().mockReturnThis(), 
        single: vi.fn().mockReturnThis(), 
        eq: vi.fn().mockReturnThis(),
      };
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'inspection_statuses') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValueOnce({ data: { id: 'status-id' }, error: null }),
          } as any;
        }
        if (table === 'inspections') {
          return mockFromChain as any;
        }
        return mockSupabase.from(table) as any; // Default fallback
      });

      const { result } = setupHook();
      await act(async () => {
        await result.current.handleStartInspection();
      });

      expect(result.current.isUpdating).toBe(false);
      expect(toast).toHaveBeenCalledWith({ title: 'inspections.messages.error', variant: 'destructive' });
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should set isUpdating to true during operation and false after completion or error', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({ data: { id: 'status-id' }, error: null });
      vi.mocked(mockSupabase.update).mockResolvedValueOnce({ error: null } as any);
      
      const { result } = setupHook();
      let wasUpdatingDuringCall = false;

      const promise = act(async () => {
        const startPromise = result.current.handleStartInspection();
        // Check isUpdating immediately after calling, before awaiting
        if (result.current.isUpdating) {
          wasUpdatingDuringCall = true;
        }
        await startPromise;
      });
      
      // While the promise is not yet resolved, isUpdating should be true
      // This is a bit tricky to test reliably with act without more complex async mocks
      // But the finally block should ensure it's set to false.
      expect(result.current.isUpdating).toBe(true); // Check before promise resolves, if possible
      await promise; // wait for the act to complete
      expect(result.current.isUpdating).toBe(false);
      expect(wasUpdatingDuringCall).toBe(true); // This confirms it was true at the start of the async op
    });
  });
}); 