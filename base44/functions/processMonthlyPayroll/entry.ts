import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Process monthly payroll for all employees or specific employees
 * Calculates: Gross salary, GOSI, deductions, benefits, net salary
 * Creates payroll records for the specified month
 */

// GOSI Contribution Rates (as of 2024)
const GOSI_RATES = {
  saudi_employee: 0.10,      // 10% employee contribution
  saudi_employer: 0.12,      // 12% employer contribution
  non_saudi_employer: 0.02,  // 2% occupational hazards only
  occupational_hazards: 0.02 // 2% for all
};

function calculateGOSI(employee, salaryBasis) {
  const isSaudi = employee.nationality === 'Saudi' || employee.nationality === 'Saudi Arabia';
  
  if (isSaudi) {
    return {
      employee_contribution: salaryBasis * GOSI_RATES.saudi_employee,
      employer_contribution: salaryBasis * GOSI_RATES.saudi_employer,
      is_saudi: true
    };
  } else {
    return {
      employee_contribution: 0,
      employer_contribution: salaryBasis * GOSI_RATES.non_saudi_employer,
      is_saudi: false
    };
  }
}

function calculateWorkingDays(month, year) {
  // In Saudi Arabia, typically 30 days per month for salary calculation
  return 30;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { month, employee_ids = null } = await req.json();
    
    if (!month) {
      return Response.json({ error: 'Month is required (format: YYYY-MM)' }, { status: 400 });
    }

    const [year, monthNum] = month.split('-');
    
    // Fetch all active employees or specific employees
    let employees = await base44.asServiceRole.entities.Employee.list();
    employees = employees.filter(e => e.status === 'active');
    
    if (employee_ids && employee_ids.length > 0) {
      employees = employees.filter(e => employee_ids.includes(e.id));
    }

    // Fetch all active deductions
    const allDeductions = await base44.asServiceRole.entities.PayrollDeduction.list();
    
    // Fetch all active benefit enrollments
    const allBenefitEnrollments = await base44.asServiceRole.entities.BenefitEnrollment.filter({
      status: 'active'
    });

    // Fetch attendance data for the month
    const attendanceRecords = await base44.asServiceRole.entities.Attendance.filter({
      date: { $gte: `${month}-01`, $lte: `${month}-31` }
    });

    // Fetch approved leave requests for the month
    const leaveRequests = await base44.asServiceRole.entities.LeaveRequest.filter({
      status: 'approved',
      start_date: { $lte: `${month}-31` },
      end_date: { $gte: `${month}-01` }
    });

    // Fetch loan requests for active loans
    const activeLoans = await base44.asServiceRole.entities.LoanRequest.filter({
      status: { $in: ['approved', 'disbursed'] }
    });

    const processedPayrolls = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Calculate basic salary components
        const basicSalary = employee.basic_salary || employee.salary || 0;
        const housingAllowance = employee.housing_allowance || 0;
        const transportAllowance = employee.transport_allowance || 0;
        
        // Calculate attendance-based adjustments
        const employeeAttendance = attendanceRecords.filter(a => a.employee_id === employee.id);
        const workingDays = calculateWorkingDays(parseInt(monthNum), parseInt(year));
        const presentDays = employeeAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const absentDays = workingDays - presentDays;
        
        // Calculate unpaid leave days for the month
        const employeeLeaves = leaveRequests.filter(l => l.employee_id === employee.id);
        let unpaidLeaveDays = 0;
        
        for (const leave of employeeLeaves) {
          if (leave.leave_type === 'unpaid') {
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
            const monthStart = new Date(`${month}-01`);
            const monthEnd = new Date(year, parseInt(monthNum), 0); // Last day of month
            
            // Calculate overlap between leave period and payroll month
            const overlapStart = leaveStart > monthStart ? leaveStart : monthStart;
            const overlapEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd;
            
            if (overlapStart <= overlapEnd) {
              const daysInMonth = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
              unpaidLeaveDays += daysInMonth;
            }
          }
        }
        
        // Calculate overtime
        const overtimeHours = employeeAttendance.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
        const hourlyRate = basicSalary / (workingDays * 8); // Assuming 8 hour workday
        const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x for overtime
        
        // Calculate total absence deduction (attendance absence + unpaid leave)
        const dailyRate = basicSalary / workingDays;
        const attendanceAbsenceDeduction = dailyRate * absentDays;
        const unpaidLeaveDeduction = dailyRate * unpaidLeaveDays;
        const absenceDeduction = attendanceAbsenceDeduction + unpaidLeaveDeduction;
        
        // Get variable allowances and bonuses (from deductions or custom)
        let bonus = 0;
        let commission = 0;
        let otherAllowances = 0;
        
        // Calculate gross salary
        const grossSalary = basicSalary + housingAllowance + transportAllowance + 
                           otherAllowances + overtimePay + bonus + commission;
        
        // Calculate GOSI
        const gosiCalculationBase = employee.gosi_salary_basis || basicSalary;
        const gosi = calculateGOSI(employee, gosiCalculationBase);
        
        // Get employee-specific deductions for this month
        const employeeDeductions = allDeductions.filter(d => 
          d.employee_id === employee.id && 
          d.is_active &&
          (!d.start_month || d.start_month <= month) &&
          (!d.end_month || d.end_month >= month)
        );
        
        let loanDeduction = 0;
        let advanceDeduction = 0;
        let otherDeductions = 0;
        
        // Process loan deductions
        const employeeLoans = activeLoans.filter(l => l.employee_id === employee.id);
        for (const loan of employeeLoans) {
          loanDeduction += loan.monthly_deduction || 0;
        }
        
        // Process other deductions
        for (const deduction of employeeDeductions) {
          if (deduction.deduction_type === 'loan_repayment') {
            loanDeduction += deduction.amount;
          } else if (deduction.deduction_type === 'advance_salary') {
            advanceDeduction += deduction.amount;
          } else if (deduction.deduction_type !== 'gosi_employee') {
            otherDeductions += deduction.amount;
          }
        }
        
        // Get benefit contributions
        const employeeBenefits = allBenefitEnrollments.filter(b => b.employee_id === employee.id);
        const benefitContributions = employeeBenefits.reduce((sum, b) => sum + (b.employee_contribution || 0), 0);
        
        // Calculate total deductions
        const totalDeductions = gosi.employee_contribution + loanDeduction + 
                               advanceDeduction + absenceDeduction + 
                               otherDeductions + benefitContributions;
        
        // Create deduction record for unpaid leave if applicable
        if (unpaidLeaveDeduction > 0) {
          await base44.asServiceRole.entities.Deduction.create({
            employee_id: employee.id,
            payroll_month: month,
            deduction_type: 'absence',
            amount: unpaidLeaveDeduction,
            description: `Unpaid leave deduction: ${unpaidLeaveDays} day(s)`,
            status: 'deducted'
          });
        }
        
        // Calculate net salary
        const netSalary = grossSalary - totalDeductions;
        
        // Create payroll record
        const payrollData = {
          employee_id: employee.id,
          month: month,
          basic_salary: basicSalary,
          housing_allowance: housingAllowance,
          transport_allowance: transportAllowance,
          food_allowance: 0,
          mobile_allowance: 0,
          other_fixed_allowances: otherAllowances,
          overtime_pay: overtimePay,
          bonus: bonus,
          commission: commission,
          other_variable_allowances: 0,
          gross_salary: grossSalary,
          gosi_employee: gosi.employee_contribution,
          gosi_employer: gosi.employer_contribution,
          gosi_calculation_base: gosiCalculationBase,
          loan_deduction: loanDeduction,
          advance_deduction: advanceDeduction,
          absence_deduction: absenceDeduction,
          other_deductions: otherDeductions + benefitContributions,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          working_days: workingDays,
          present_days: presentDays,
          absent_days: absentDays,
          overtime_hours: overtimeHours,
          status: 'calculated',
          payment_method: employee.bank_account ? 'bank_transfer' : 'cash',
          processed_by: user.email
        };
        
        const payrollRecord = await base44.asServiceRole.entities.Payroll.create(payrollData);
        processedPayrolls.push(payrollRecord);
        
      } catch (error) {
        errors.push({
          employee_id: employee.id,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Processed payroll for ${processedPayrolls.length} employees`,
      month: month,
      processed_count: processedPayrolls.length,
      error_count: errors.length,
      total_gross: processedPayrolls.reduce((sum, p) => sum + p.gross_salary, 0),
      total_net: processedPayrolls.reduce((sum, p) => sum + p.net_salary, 0),
      total_gosi_employer: processedPayrolls.reduce((sum, p) => sum + p.gosi_employer, 0),
      processed_payrolls: processedPayrolls,
      errors: errors
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});