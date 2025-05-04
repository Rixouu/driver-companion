import { createServiceClient } from '@/lib/supabase/service-client';

export async function updateCharterServiceType() {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('quotations')
      .update({ service_type: 'Charter Services (Hourly)' })
      .eq('service_type', 'charter')
      .select('id, service_type');
    
    if (error) {
      console.error('Error updating charter service type:', error);
      return { success: false, error };
    }
    
    return { success: true, updatedCount: data.length, data };
  } catch (error) {
    console.error('Exception updating charter service type:', error);
    return { success: false, error };
  }
} 