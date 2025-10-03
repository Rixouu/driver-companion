import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export interface TimeBasedRule {
  id: string;
  name: string;
  category_id: string | null;
  service_type_id: string | null;
  start_time: string;
  end_time: string;
  days_of_week: string[] | null;
  adjustment_percentage: number;
  priority: number;
  is_active: boolean;
  description?: string | null;
}

export function useTimeBasedPricing() {
  const [rules, setRules] = useState<TimeBasedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pricing_time_based_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (fetchError) throw fetchError;

      setRules(data || []);
      console.log('🔍 [TIME-BASED] Fetched rules:', data?.length || 0);
    } catch (err) {
      console.error('Error fetching time-based pricing rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeBasedAdjustment = (
    pickupTime: string,
    pickupDate?: Date,
    categoryId?: string,
    serviceTypeId?: string
  ) => {
    if (!pickupTime || rules.length === 0) {
      return { adjustment: 0, ruleName: null };
    }

    const hour = parseInt(pickupTime.split(':')[0]);
    const minute = parseInt(pickupTime.split(':')[1] || '0');
    const timeInMinutes = hour * 60 + minute;

    // Convert pickup date to day of week - JavaScript getDay() returns 0-6 (Sunday-Saturday)
    const dayOfWeek = pickupDate ? 
      ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][pickupDate.getDay()] :
      'monday'; // default to monday if no date

    console.log('🔍 [TIME-BASED] Checking rules for:', {
      pickupTime,
      pickupDate: pickupDate?.toDateString(),
      dayOfWeek,
      categoryId,
      serviceTypeId,
      totalRules: rules.length,
      timeInMinutes,
      hour,
      minute
    });

    // Find applicable rules based on priority and filters
    const applicableRules = rules
      .filter(rule => {
        // Check if rule applies to this category/service type
        if (rule.category_id && rule.category_id !== categoryId) {
          console.log('❌ [TIME-BASED] Category mismatch:', rule.category_id, 'vs', categoryId);
          return false;
        }
        if (rule.service_type_id && rule.service_type_id !== serviceTypeId) {
          console.log('❌ [TIME-BASED] Service type mismatch:', rule.service_type_id, 'vs', serviceTypeId);
          return false;
        }
        
        // Check if rule applies to this day (case-insensitive)
        if (rule.days_of_week && !rule.days_of_week.some(day => day.toLowerCase() === dayOfWeek.toLowerCase())) {
          console.log('❌ [TIME-BASED] Day mismatch:', rule.days_of_week, 'vs', dayOfWeek);
          return false;
        }
        
        // Check if rule applies to this time
        const ruleStartTime = rule.start_time.split(':');
        const ruleEndTime = rule.end_time.split(':');
        const ruleStartMinutes = parseInt(ruleStartTime[0]) * 60 + parseInt(ruleStartTime[1] || '0');
        const ruleEndMinutes = parseInt(ruleEndTime[0]) * 60 + parseInt(ruleEndTime[1] || '0');
        
        console.log('🔍 [TIME-BASED] Checking rule:', rule.name, {
          ruleCategory: rule.category_id,
          ruleServiceType: rule.service_type_id,
          ruleDays: rule.days_of_week,
          ruleTimeRange: `${rule.start_time}-${rule.end_time}`,
          ruleStartMinutes,
          ruleEndMinutes,
          timeInMinutes
        });
        
        // Handle overnight rules (e.g., 22:00-06:00)
        let timeMatches = false;
        if (ruleStartMinutes > ruleEndMinutes) {
          // Overnight rule: check if time is after start OR before end
          timeMatches = timeInMinutes >= ruleStartMinutes || timeInMinutes <= ruleEndMinutes;
        } else {
          // Regular rule: check if time is within range
          timeMatches = timeInMinutes >= ruleStartMinutes && timeInMinutes <= ruleEndMinutes;
        }

        if (timeMatches) {
          console.log('✅ [TIME-BASED] Rule applies:', rule.name);
        } else {
          console.log('❌ [TIME-BASED] Time mismatch:', timeInMinutes, 'vs', `${ruleStartMinutes}-${ruleEndMinutes}`);
        }

        return timeMatches;
      })
      .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    console.log('🔍 [TIME-BASED] Applicable rules:', applicableRules.length);

    // Return the highest priority applicable rule
    if (applicableRules.length > 0) {
      const rule = applicableRules[0];
      console.log('🔍 [TIME-BASED] Applied rule:', rule.name, 'Adjustment:', rule.adjustment_percentage + '%');
      
      // Format the rule name to include the time range (remove seconds if present)
      const formatTime = (time: string) => {
        return time.split(':').slice(0, 2).join(':');
      };
      const formattedRuleName = `${rule.name} (${formatTime(rule.start_time)}-${formatTime(rule.end_time)})`;
      
      return {
        adjustment: rule.adjustment_percentage,
        ruleName: formattedRuleName,
        ruleDescription: rule.description
      };
    }

    return { adjustment: 0, ruleName: null };
  };

  return {
    rules,
    loading,
    error,
    calculateTimeBasedAdjustment,
    refetch: fetchRules
  };
}
