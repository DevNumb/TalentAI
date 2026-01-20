
import { createClient } from '@supabase/supabase-js';

// Assuming these environment variables are provided in the environment
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
