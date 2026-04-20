import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Initialize Default Leave Accrual Policies
 * Sets up standard Saudi Arabia labor law compliant policies
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    // Check if policies already exist
    const existingPolicies = await base44.asServiceRole.entities.LeaveAccrualPolicy.list();
    
    if (existingPolicies.length > 0) {
      return Response.json({
        success: false,
        message: 'Accrual policies already exist',
        existing_count: existingPolicies.length,
        policies: existingPolicies
      });
    }

    // Default policies based on Saudi labor law
    const defaultPolicies = [
      {
        policy_name: 'Annual Leave - Full Time',
        leave_type: 'annual',
        annual_entitlement: 21,
        monthly_accrual_rate: 1.75, // 21 / 12
        accrual_frequency: 'monthly',
        probation_period_months: 3,
        accrue_during_probation: false,
        max_carryover: 10,
        carryover_expiry_months: 3,
        accrue_while_on_leave: true,
        prorate_for_new_hires: true,
        employment_type: ['full_time'],
        is_active: true,
        effective_from: new Date().toISOString().split('T')[0],
        notes: 'Standard annual leave as per Saudi labor law - 21 days per year'
      },
      {
        policy_name: 'Annual Leave - Contract',
        leave_type: 'annual',
        annual_entitlement: 21,
        monthly_accrual_rate: 1.75,
        accrual_frequency: 'monthly',
        probation_period_months: 0,
        accrue_during_probation: true,
        max_carryover: 0,
        carryover_expiry_months: 0,
        accrue_while_on_leave: true,
        prorate_for_new_hires: true,
        employment_type: ['contract', 'temporary'],
        is_active: true,
        effective_from: new Date().toISOString().split('T')[0],
        notes: 'Annual leave for contract employees - no carryover'
      },
      {
        policy_name: 'Sick Leave - All Employees',
        leave_type: 'sick',
        annual_entitlement: 30,
        monthly_accrual_rate: 2.5, // 30 / 12
        accrual_frequency: 'monthly',
        probation_period_months: 0,
        accrue_during_probation: true,
        max_carryover: 0,
        carryover_expiry_months: 0,
        accrue_while_on_leave: false,
        prorate_for_new_hires: true,
        employment_type: ['full_time', 'part_time', 'contract', 'temporary'],
        is_active: true,
        effective_from: new Date().toISOString().split('T')[0],
        notes: 'Sick leave as per Saudi labor law - 30 days per year (First 30 days full pay, next 60 days half pay)'
      },
      {
        policy_name: 'Annual Leave - 5+ Years Service',
        leave_type: 'annual',
        annual_entitlement: 30,
        monthly_accrual_rate: 2.5, // 30 / 12
        accrual_frequency: 'monthly',
        probation_period_months: 0,
        accrue_during_probation: true,
        max_carryover: 15,
        carryover_expiry_months: 6,
        accrue_while_on_leave: true,
        prorate_for_new_hires: false,
        employment_type: ['full_time'],
        is_active: false, // Needs to be manually activated when applicable
        effective_from: new Date().toISOString().split('T')[0],
        notes: 'Enhanced annual leave for employees with 5+ years of service - 30 days per year'
      }
    ];

    // Create policies
    const createdPolicies = [];
    for (const policy of defaultPolicies) {
      const created = await base44.asServiceRole.entities.LeaveAccrualPolicy.create(policy);
      createdPolicies.push(created);
    }

    return Response.json({
      success: true,
      message: 'Default accrual policies initialized successfully',
      policies_created: createdPolicies.length,
      policies: createdPolicies
    });

  } catch (error) {
    console.error('Policy initialization error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});