import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://wqsnjqjlasjpdvmvhkpa.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_NU0DqAJ7vQffDIqAHNS6rw_MXf2WYPU';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  DEFAULT_SUPABASE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
