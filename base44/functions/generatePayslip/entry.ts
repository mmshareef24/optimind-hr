import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Generate payslip for a specific employee and month
 * Returns formatted payslip data and optionally sends via email
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payroll_id, send_email = false } = await req.json();
    
    if (!payroll_id) {
      return Response.json({ error: 'payroll_id is required' }, { status: 400 });
    }

    // Fetch payroll record
    const payrollRecords = await base44.asServiceRole.entities.Payroll.filter({ id: payroll_id });
    if (payrollRecords.length === 0) {
      return Response.json({ error: 'Payroll record not found' }, { status: 404 });
    }
    const payroll = payrollRecords[0];

    // Fetch employee details
    const employees = await base44.asServiceRole.entities.Employee.filter({ id: payroll.employee_id });
    if (employees.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }
    const employee = employees[0];

    // Check access permissions
    const currentEmployee = await base44.asServiceRole.entities.Employee.filter({ 
      email: user.email 
    });
    
    const isOwnPayslip = currentEmployee.length > 0 && currentEmployee[0].id === employee.id;
    const isAdmin = user.role === 'admin';
    const isManager = currentEmployee.length > 0 && employee.manager_id === currentEmployee[0].id;
    
    if (!isOwnPayslip && !isAdmin && !isManager) {
      return Response.json({ error: 'Access denied to this payslip' }, { status: 403 });
    }

    // Format payslip data
    const payslipData = {
      payslip_id: `PS-${payroll.month.replace('-', '')}-${employee.employee_id}`,
      employee: {
        id: employee.employee_id,
        name: `${employee.first_name} ${employee.last_name}`,
        department: employee.department,
        job_title: employee.job_title,
        bank_account: employee.iban || employee.bank_account
      },
      period: {
        month: payroll.month,
        working_days: payroll.working_days,
        present_days: payroll.present_days,
        absent_days: payroll.absent_days,
        overtime_hours: payroll.overtime_hours
      },
      earnings: {
        basic_salary: payroll.basic_salary,
        housing_allowance: payroll.housing_allowance,
        transport_allowance: payroll.transport_allowance,
        food_allowance: payroll.food_allowance || 0,
        mobile_allowance: payroll.mobile_allowance || 0,
        other_fixed_allowances: payroll.other_fixed_allowances || 0,
        overtime_pay: payroll.overtime_pay || 0,
        bonus: payroll.bonus || 0,
        commission: payroll.commission || 0,
        other_variable_allowances: payroll.other_variable_allowances || 0
      },
      gross_salary: payroll.gross_salary,
      deductions: {
        gosi_employee: payroll.gosi_employee,
        loan_deduction: payroll.loan_deduction || 0,
        advance_deduction: payroll.advance_deduction || 0,
        absence_deduction: payroll.absence_deduction || 0,
        other_deductions: payroll.other_deductions || 0
      },
      total_deductions: payroll.total_deductions,
      net_salary: payroll.net_salary,
      payment: {
        method: payroll.payment_method,
        date: payroll.payment_date,
        reference: payroll.payment_reference,
        status: payroll.status
      },
      generated_date: new Date().toISOString(),
      generated_by: user.email
    };

    // Generate text-based payslip for email/download
    const payslipText = generatePayslipText(payslipData);

    // Send email if requested
    if (send_email && employee.email) {
      await base44.integrations.Core.SendEmail({
        to: employee.email,
        subject: `Payslip for ${payroll.month}`,
        body: `Dear ${employee.first_name},\n\nYour payslip for ${payroll.month} is ready.\n\n${payslipText}\n\nYou can also download it from the HRMS portal.\n\nBest regards,\nHR Team`
      });
    }

    return Response.json({
      success: true,
      payslip: payslipData,
      payslip_text: payslipText,
      email_sent: send_email && employee.email ? true : false
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generatePayslipText(data) {
  const formatCurrency = (amount) => `${(amount || 0).toFixed(2)} SAR`;
  const line = '─'.repeat(70);
  const doubleLine = '═'.repeat(70);
  
  return `
${doubleLine}
                          PAYSLIP - ${data.period.month}
${doubleLine}

Payslip ID: ${data.payslip_id}
Generated: ${new Date(data.generated_date).toLocaleDateString()}

EMPLOYEE INFORMATION
${line}
Employee ID:    ${data.employee.id}
Name:           ${data.employee.name}
Department:     ${data.employee.department}
Job Title:      ${data.employee.job_title}

ATTENDANCE SUMMARY
${line}
Working Days:   ${data.period.working_days}
Present Days:   ${data.period.present_days}
Absent Days:    ${data.period.absent_days}
Overtime Hours: ${data.period.overtime_hours}

EARNINGS
${line}
Basic Salary:              ${formatCurrency(data.earnings.basic_salary)}
Housing Allowance:         ${formatCurrency(data.earnings.housing_allowance)}
Transport Allowance:       ${formatCurrency(data.earnings.transport_allowance)}
${data.earnings.food_allowance > 0 ? `Food Allowance:            ${formatCurrency(data.earnings.food_allowance)}\n` : ''}${data.earnings.mobile_allowance > 0 ? `Mobile Allowance:          ${formatCurrency(data.earnings.mobile_allowance)}\n` : ''}${data.earnings.overtime_pay > 0 ? `Overtime Pay:              ${formatCurrency(data.earnings.overtime_pay)}\n` : ''}${data.earnings.bonus > 0 ? `Bonus:                     ${formatCurrency(data.earnings.bonus)}\n` : ''}${data.earnings.commission > 0 ? `Commission:                ${formatCurrency(data.earnings.commission)}\n` : ''}
                          ${line}
GROSS SALARY:              ${formatCurrency(data.gross_salary)}

DEDUCTIONS
${line}
GOSI (Employee):           ${formatCurrency(data.deductions.gosi_employee)}
${data.deductions.loan_deduction > 0 ? `Loan Deduction:            ${formatCurrency(data.deductions.loan_deduction)}\n` : ''}${data.deductions.advance_deduction > 0 ? `Advance Deduction:         ${formatCurrency(data.deductions.advance_deduction)}\n` : ''}${data.deductions.absence_deduction > 0 ? `Absence Deduction:         ${formatCurrency(data.deductions.absence_deduction)}\n` : ''}${data.deductions.other_deductions > 0 ? `Other Deductions:          ${formatCurrency(data.deductions.other_deductions)}\n` : ''}
                          ${line}
TOTAL DEDUCTIONS:          ${formatCurrency(data.total_deductions)}

${doubleLine}
NET SALARY:                ${formatCurrency(data.net_salary)}
${doubleLine}

PAYMENT DETAILS
${line}
Payment Method:   ${data.payment.method}
${data.payment.date ? `Payment Date:     ${data.payment.date}\n` : ''}${data.payment.reference ? `Reference:        ${data.payment.reference}\n` : ''}Status:           ${data.payment.status}
${data.employee.bank_account ? `Bank Account:     ${data.employee.bank_account}\n` : ''}
${doubleLine}
This is a computer-generated payslip and does not require a signature.
${doubleLine}
`;
}