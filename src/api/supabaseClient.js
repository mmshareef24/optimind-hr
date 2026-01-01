import { createClient } from '@supabase/supabase-js'

// Expect Vite env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a singleton Supabase client. If envs are missing, export null to allow guards.
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// Helper to check if Supabase is configured
export const isSupabaseConfigured = !!supabase