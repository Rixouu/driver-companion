import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Create a single instance of the Supabase client
export const supabase = createClientComponentClient<Database>() 