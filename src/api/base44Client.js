// Base44 client shim: use Supabase for persistence when configured, otherwise fall back to safe stubs.
import { supabase, isSupabaseConfigured } from './supabaseClient';

const noop = () => {};
const resolved = (value) => Promise.resolve(value);

// Helper to parse order spec like '-created_date' or 'name_en'
const parseOrderSpec = (spec) => {
  if (!spec || typeof spec !== 'string') return null;
  const descending = spec.startsWith('-');
  const column = descending ? spec.slice(1) : spec;
  // Map legacy column names to Supabase defaults
  const mapped = column === 'created_date' ? 'created_at' : column;
  return { column: mapped, ascending: !descending };
};

// Build a Supabase-backed entity CRUD for a given table
const makeSupabaseEntity = (tableName) => ({
  list: async (orderSpec) => {
    let query = supabase.from(tableName).select('*');
    const order = parseOrderSpec(orderSpec);
    if (order) query = query.order(order.column, { ascending: order.ascending, nullsFirst: false });
    const { data, error } = await query;
    if (error) throw new Error(error.message || `Failed to list from ${tableName}`);
    return data || [];
  },
  filter: async (filters = {}, orderSpec) => {
    let query = supabase.from(tableName).select('*');
    // Basic equality match for provided filters
    if (filters && Object.keys(filters).length) {
      query = query.match(filters);
    }
    const order = parseOrderSpec(orderSpec);
    if (order) query = query.order(order.column, { ascending: order.ascending, nullsFirst: false });
    const { data, error } = await query;
    if (error) throw new Error(error.message || `Failed to filter ${tableName}`);
    return data || [];
  },
  create: async (payload) => {
    const { data, error } = await supabase.from(tableName).insert([payload]).select('*').single();
    if (error) throw new Error(error.message || `Failed to create in ${tableName}`);
    return data;
  },
  update: async (id, payload) => {
    const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select('*').single();
    if (error) throw new Error(error.message || `Failed to update ${tableName}`);
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw new Error(error.message || `Failed to delete from ${tableName}`);
    return { id };
  }
});

// Default entity stub when Supabase is not configured
const makeEntityStub = () => ({
  list: async () => [],
  filter: async () => [],
  create: async (data) => ({ id: 'mock-id', ...data }),
  update: async (id, data) => ({ id, ...data }),
  delete: async (id) => ({ id, deleted: true })
});

// Entities: use Supabase for critical models (Company, Employee) when available
const entities = new Proxy({}, {
  get: (_target, prop) => {
    if (isSupabaseConfigured) {
      if (prop === 'Company') return makeSupabaseEntity('companies');
      if (prop === 'Employee') return makeSupabaseEntity('employees');
      if (prop === 'Department') return makeSupabaseEntity('departments');
      if (prop === 'Position') return makeSupabaseEntity('positions');
    }
    return makeEntityStub();
  }
});

const integrationsCoreStub = {
  InvokeLLM: async () => ({ output: '', meta: { disabled: true } }),
  SendEmail: async () => ({ sent: true, meta: { disabled: true } }),
  SendSMS: async () => ({ sent: true, meta: { disabled: true } }),
  UploadFile: async () => ({ file_id: 'mock-file', meta: { disabled: true } }),
  GenerateImage: async () => ({ image_url: '', meta: { disabled: true } }),
  ExtractDataFromUploadedFile: async () => ({ data: {}, meta: { disabled: true } })
};

// Minimal functions stub so pages that call invoke don't crash in SPA mode
const functionsStub = {
  invoke: async (name, payload = {}) => {
    // Minimal built-in handler for employee filtering to keep Employees page functional
    if (isSupabaseConfigured && name === 'getFilteredEmployees') {
      const filters = payload.filters || {};
      const term = (filters.search || '').trim();
      const companyId = filters.company;
      const status = (filters.status || '').trim();
      const department = (filters.department || '').trim();

      let query = supabase.from('employees').select('*');
      if (companyId) query = query.eq('company_id', companyId);
      if (status) query = query.eq('status', status);
      if (department) query = query.eq('department', department);

      // If search term provided, search across a few text fields
      if (term) {
        const like = `%${term}%`;
        query = query.or(
          [
            `first_name.ilike.${like}`,
            `last_name.ilike.${like}`,
            `email.ilike.${like}`,
            `employee_id.ilike.${like}`,
            `department.ilike.${like}`,
            `job_title.ilike.${like}`
          ].join(',')
        );
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return { data: null, error };

      // Expose a permissive access level until role-based policies are implemented
      return { data: { employees: data || [], access_level: 'admin' }, error: null };
    }

    // Default no-op response for other functions
    return { data: {}, error: null };
  }
};

export const base44 = {
  auth: {
    // Keep a harmless stub for now; AuthContext handles real auth
    me: async () => ({ id: 'dev-user', email: 'dev@example.com', name: 'Dev User' }),
    logout: () => resolved(true),
    redirectToLogin: noop,
  },
  entities,
  integrations: {
    Core: integrationsCoreStub,
  },
  functions: functionsStub,
  appLogs: {
    logUserInApp: () => resolved(true)
  }
};
