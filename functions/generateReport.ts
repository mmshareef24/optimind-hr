import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const ENTITY_MAP = {
  employees: 'Employee',
  payroll: 'Payroll',
  attendance: 'Attendance',
  leave: 'LeaveRequest',
  performance: 'PerformanceReview',
  training: 'TrainingEnrollment',
  assets: 'Asset',
  recruitment: 'Candidate'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module, fields, filters = {}, sortField, sortDirection = 'asc', limit = 50 } = await req.json();

    if (!module || !fields || fields.length === 0) {
      return Response.json({ error: 'Module and fields are required' }, { status: 400 });
    }

    const entityName = ENTITY_MAP[module];
    if (!entityName) {
      return Response.json({ error: 'Invalid module' }, { status: 400 });
    }

    // Build filter query
    const filterQuery = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (key === 'date_from') {
          filterQuery.date = filterQuery.date || {};
          filterQuery.date.$gte = value;
        } else if (key === 'date_to') {
          filterQuery.date = filterQuery.date || {};
          filterQuery.date.$lte = value;
        } else {
          filterQuery[key] = value;
        }
      }
    });

    // Fetch data
    let records;
    const sortPrefix = sortDirection === 'desc' ? '-' : '';
    const sortParam = sortField ? `${sortPrefix}${sortField}` : '-created_date';

    if (Object.keys(filterQuery).length > 0) {
      records = await base44.entities[entityName].filter(filterQuery, sortParam);
    } else {
      records = await base44.entities[entityName].list(sortParam);
    }

    // Get total count before limiting
    const totalCount = records.length;

    // Apply limit for preview
    const limitedRecords = records.slice(0, limit);

    // Project only selected fields
    const projectedRecords = limitedRecords.map(record => {
      const projected = { id: record.id };
      fields.forEach(field => {
        projected[field] = record[field];
      });
      return projected;
    });

    return Response.json({
      records: projectedRecords,
      totalCount,
      module,
      fields
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});