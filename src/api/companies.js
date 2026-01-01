import { supabase, isSupabaseConfigured } from './supabaseClient'
import { base44 } from './base44Client'

// Prefer Supabase for production; fall back to Base44 stub in dev when not configured
export async function listCompanies() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message || 'Failed to list companies');
    return data || [];
  }
  // Fallback to legacy stub behavior
  return base44.entities.Company.list('-created_date');
}

export async function createCompany(payload) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('companies')
      .insert([payload])
      .select('*')
      .single();
    if (error) throw new Error(error.message || 'Failed to create company');
    return data;
  }
  // Fallback stub create
  return base44.entities.Company.create(payload);
}

export async function updateCompany(id, payload) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('companies')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message || 'Failed to update company');
    return data;
  }
  // Fallback stub update
  return base44.entities.Company.update(id, payload);
}