import { calculateGOSI } from './GOSICalculator';

/**
 * Comprehensive Payroll Calculation Engine
 * Calculates gross salary, deductions, and net salary based on:
 * - Employee salary details
 * - Time entries (for hourly workers)
 * - Attendance records
 * - Leave deductions
 * - GOSI contributions
 * - Other deductions
 */

export function calculateMonthlyPayroll(employee, timeEntries = [], attendance = [], leaves = [], deductions = {}) {
  const calculation = {
    employee_id: employee.id,
    employee_name: `${employee.first_name} ${employee.last_name}`,
    
    // Earnings
    basic_salary: employee.basic_salary || 0,
    housing_allowance: employee.housing_allowance || 0,
    transport_allowance: employee.transport_allowance || 0,
    
    // Time-based earnings
    regular_hours_pay: 0,
    overtime_pay: 0,
    
    // Gross calculations
    total_fixed_allowances: 0,
    total_variable_earnings: 0,
    gross_salary: 0,
    
    // Deductions
    gosi_employee: 0,
    gosi_employer: 0,
    gosi_calculation_base: 0,
    absence_deduction: 0,
    late_deduction: 0,
    loan_deduction: deductions.loan_deduction || 0,
    advance_deduction: deductions.advance_deduction || 0,
    other_deductions: deductions.other_deductions || 0,
    total_deductions: 0,
    
    // Net salary
    net_salary: 0,
    
    // Statistics
    working_days: deductions.working_days || 30,
    present_days: 0,
    absent_days: 0,
    total_hours_worked: 0,
    overtime_hours: 0,
    late_minutes: 0,
    
    // Metadata
    calculation_date: new Date().toISOString()
  };

  // 1. Calculate fixed allowances
  calculation.total_fixed_allowances = 
    calculation.basic_salary +
    calculation.housing_allowance +
    calculation.transport_allowance;

  // 2. Calculate time-based pay (if applicable)
  if (timeEntries && timeEntries.length > 0) {
    const totalRegularHours = timeEntries.reduce((sum, entry) => {
      if (entry.status === 'approved') {
        return sum + (entry.hours || 0);
      }
      return sum;
    }, 0);

    const totalOvertimeHours = timeEntries.reduce((sum, entry) => {
      if (entry.status === 'approved') {
        return sum + (entry.overtime_hours || 0);
      }
      return sum;
    }, 0);

    calculation.total_hours_worked = totalRegularHours;
    calculation.overtime_hours = totalOvertimeHours;

    // Calculate hourly rate from monthly salary
    const monthlyWorkingHours = calculation.working_days * 8; // Assuming 8 hours/day
    const hourlyRate = calculation.basic_salary / monthlyWorkingHours;

    // Regular hours pay (only if tracking hourly)
    // For fixed salary employees, this is already in basic_salary
    
    // Overtime pay calculation (1.5x for regular overtime, 2x for holidays/weekends)
    const overtimeRate = hourlyRate * 1.5; // Saudi labor law: 1.5x for overtime
    calculation.overtime_pay = totalOvertimeHours * overtimeRate;
  }

  // 3. Calculate attendance-based deductions
  if (attendance && attendance.length > 0) {
    calculation.present_days = attendance.filter(a => 
      a.status === 'present' || a.status === 'late'
    ).length;
    
    calculation.absent_days = attendance.filter(a => 
      a.status === 'absent'
    ).length;

    // Calculate late minutes
    calculation.late_minutes = attendance.reduce((sum, a) => 
      sum + (a.late_by || 0), 0
    );

    // Absence deduction (per day rate)
    const dailyRate = calculation.basic_salary / calculation.working_days;
    calculation.absence_deduction = calculation.absent_days * dailyRate;

    // Late deduction (per minute rate - typically small percentage)
    const minuteRate = dailyRate / (8 * 60); // 8 hours = 480 minutes
    calculation.late_deduction = calculation.late_minutes * minuteRate * 0.5; // 50% penalty
  }

  // 4. Calculate unpaid leave deductions
  if (leaves && leaves.length > 0) {
    const unpaidLeaveDays = leaves
      .filter(leave => leave.leave_type === 'unpaid' && leave.status === 'approved')
      .reduce((sum, leave) => sum + (leave.total_days || 0), 0);
    
    const dailyRate = calculation.basic_salary / calculation.working_days;
    calculation.absence_deduction += unpaidLeaveDays * dailyRate;
  }

  // 5. Calculate variable earnings
  calculation.total_variable_earnings = calculation.overtime_pay;

  // 6. Calculate gross salary
  calculation.gross_salary = 
    calculation.total_fixed_allowances +
    calculation.total_variable_earnings;

  // 7. Calculate GOSI contributions
  if (employee.gosi_applicable) {
    const gosiCalc = calculateGOSI(employee);
    calculation.gosi_employee = gosiCalc.employeeShare;
    calculation.gosi_employer = gosiCalc.employerShare;
    calculation.gosi_calculation_base = gosiCalc.gosiBase;
  }

  // 8. Calculate total deductions
  calculation.total_deductions = 
    calculation.gosi_employee +
    calculation.absence_deduction +
    calculation.late_deduction +
    calculation.loan_deduction +
    calculation.advance_deduction +
    calculation.other_deductions;

  // 9. Calculate net salary
  calculation.net_salary = calculation.gross_salary - calculation.total_deductions;

  // 10. Round all monetary values to 2 decimal places
  Object.keys(calculation).forEach(key => {
    if (typeof calculation[key] === 'number' && !key.includes('days') && !key.includes('hours') && !key.includes('minutes')) {
      calculation[key] = Math.round(calculation[key] * 100) / 100;
    }
  });

  return calculation;
}

/**
 * Generate payroll for multiple employees
 */
export function calculateBulkPayroll(employees, timeEntriesMap, attendanceMap, leavesMap, month) {
  return employees.map(employee => {
    const employeeTimeEntries = timeEntriesMap[employee.id] || [];
    const employeeAttendance = attendanceMap[employee.id] || [];
    const employeeLeaves = leavesMap[employee.id] || [];

    return calculateMonthlyPayroll(
      employee,
      employeeTimeEntries,
      employeeAttendance,
      employeeLeaves,
      { working_days: 30 } // Default working days
    );
  });
}

/**
 * Validate payroll calculation
 */
export function validatePayrollCalculation(calculation) {
  const errors = [];
  const warnings = [];

  // Check for negative values
  if (calculation.net_salary < 0) {
    errors.push('Net salary cannot be negative');
  }

  // Check for unusual overtime
  if (calculation.overtime_hours > 60) {
    warnings.push('Unusual overtime hours detected (>60 hours)');
  }

  // Check for high absence rate
  if (calculation.absent_days > 10) {
    warnings.push('High absence rate detected (>10 days)');
  }

  // Check GOSI limits
  if (calculation.gosi_calculation_base > 45000) {
    warnings.push('GOSI calculation base exceeds maximum (45,000 SAR)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export default {
  calculateMonthlyPayroll,
  calculateBulkPayroll,
  validatePayrollCalculation
};