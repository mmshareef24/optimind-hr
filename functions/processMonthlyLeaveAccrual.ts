import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Automated Leave Accrual Processing Function
 * Processes monthly leave accruals for all active employees based on configured policies
 * Can be scheduled to run automatically at the start of each month
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { accrual_period, force_reprocess = false } = await req.json();
    
    // Use provided period or current month
    const processingPeriod = accrual_period || new Date().toISOString().slice(0, 7);
    const processingDate = new Date().toISOString().split('T')[0];
    
    console.log(`Starting leave accrual for period: ${processingPeriod}`);

    // Fetch all active employees
    const employees = await base44.asServiceRole.entities.Employee.filter({ status: 'active' });
    
    if (employees.length === 0) {
      return Response.json({
        success: true,
        message: 'No active employees to process',
        period: processingPeriod
      });
    }

    // Fetch accrual policies
    const policies = await base44.asServiceRole.entities.LeaveAccrualPolicy.filter({ is_active: true });
    
    if (policies.length === 0) {
      return Response.json({
        success: false,
        error: 'No active accrual policies found. Please configure policies first.',
        period: processingPeriod
      }, { status: 400 });
    }

    // Check if already processed for this period
    if (!force_reprocess) {
      const existingAccruals = await base44.asServiceRole.entities.LeaveAccrual.filter({
        accrual_period: processingPeriod
      });
      
      if (existingAccruals.length > 0) {
        return Response.json({
          success: false,
          error: `Accrual already processed for ${processingPeriod}. Use force_reprocess=true to reprocess.`,
          existing_count: existingAccruals.length,
          period: processingPeriod
        }, { status: 400 });
      }
    }

    const results = {
      period: processingPeriod,
      processed: 0,
      skipped: 0,
      errors: 0,
      total_days_accrued: 0,
      details: []
    };

    // Process each employee
    for (const employee of employees) {
      try {
        const employeeResult = await processEmployeeAccrual(
          base44,
          employee,
          policies,
          processingPeriod,
          processingDate,
          user.email
        );
        
        if (employeeResult.processed) {
          results.processed++;
          results.total_days_accrued += employeeResult.total_accrued;
          results.details.push(employeeResult);
        } else {
          results.skipped++;
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          employee_id: employee.id,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Accrual processing completed for ${processingPeriod}`,
      results
    });

  } catch (error) {
    console.error('Accrual processing error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});

/**
 * Process accrual for a single employee
 */
async function processEmployeeAccrual(base44, employee, policies, period, date, processedBy) {
  const result = {
    employee_id: employee.id,
    employee_name: `${employee.first_name} ${employee.last_name}`,
    processed: false,
    total_accrued: 0,
    accruals: []
  };

  // Calculate employment duration
  const hireDate = new Date(employee.hire_date);
  const currentDate = new Date(date);
  const employmentMonths = Math.floor(
    (currentDate - hireDate) / (1000 * 60 * 60 * 24 * 30.44)
  );

  // Process each applicable policy
  for (const policy of policies) {
    // Check if policy applies to this employee type
    if (policy.employment_type && policy.employment_type.length > 0) {
      if (!policy.employment_type.includes(employee.employment_type)) {
        continue;
      }
    }

    // Check probation period
    if (employmentMonths < policy.probation_period_months && !policy.accrue_during_probation) {
      result.accruals.push({
        leave_type: policy.leave_type,
        status: 'skipped',
        reason: 'Employee in probation period'
      });
      continue;
    }

    // Calculate accrual
    let daysToAccrue = policy.monthly_accrual_rate;
    let isProrated = false;
    let prorationFactor = 1.0;

    // Proration for mid-month hires
    if (policy.prorate_for_new_hires && employmentMonths === 0) {
      const hireDay = hireDate.getDate();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      prorationFactor = (daysInMonth - hireDay + 1) / daysInMonth;
      daysToAccrue = parseFloat((daysToAccrue * prorationFactor).toFixed(2));
      isProrated = true;
    }

    // Get or create leave balance
    const balances = await base44.asServiceRole.entities.LeaveBalance.filter({
      employee_id: employee.id,
      leave_type: policy.leave_type,
      year: currentDate.getFullYear()
    });

    let balance;
    if (balances.length === 0) {
      // Create new balance
      balance = await base44.asServiceRole.entities.LeaveBalance.create({
        employee_id: employee.id,
        leave_type: policy.leave_type,
        year: currentDate.getFullYear(),
        total_entitled: daysToAccrue,
        used: 0,
        pending: 0,
        remaining: daysToAccrue,
        carried_forward: 0
      });
    } else {
      balance = balances[0];
      
      // Update balance
      const newTotalEntitled = parseFloat((balance.total_entitled + daysToAccrue).toFixed(2));
      const newRemaining = parseFloat((balance.remaining + daysToAccrue).toFixed(2));
      
      await base44.asServiceRole.entities.LeaveBalance.update(balance.id, {
        total_entitled: newTotalEntitled,
        remaining: newRemaining
      });
      
      balance.total_entitled = newTotalEntitled;
      balance.remaining = newRemaining;
    }

    // Record accrual history
    await base44.asServiceRole.entities.LeaveAccrual.create({
      employee_id: employee.id,
      leave_type: policy.leave_type,
      accrual_date: date,
      accrual_period: period,
      days_accrued: daysToAccrue,
      balance_before: balance.total_entitled - daysToAccrue,
      balance_after: balance.total_entitled,
      accrual_rate: policy.monthly_accrual_rate,
      employment_months: employmentMonths,
      is_prorated: isProrated,
      proration_factor: prorationFactor,
      notes: isProrated ? 'Prorated for mid-month hire' : 'Standard monthly accrual',
      processed_by: processedBy
    });

    result.total_accrued += daysToAccrue;
    result.accruals.push({
      leave_type: policy.leave_type,
      days_accrued: daysToAccrue,
      balance_after: balance.total_entitled,
      is_prorated: isProrated
    });
  }

  if (result.accruals.length > 0) {
    result.processed = true;
  }

  return result;
}