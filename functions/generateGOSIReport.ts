import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Generate GOSI report for a specific month
 * Includes all employees, wages, contributions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { month, company_id = null } = await req.json();
    
    if (!month) {
      return Response.json({ error: 'Month is required (format: YYYY-MM)' }, { status: 400 });
    }

    // Fetch payroll records for the month
    let payrollRecords = await base44.asServiceRole.entities.Payroll.filter({ month: month });
    
    // Fetch all employees
    const allEmployees = await base44.asServiceRole.entities.Employee.list();
    
    // Filter by company if specified
    if (company_id) {
      const companyEmployeeIds = allEmployees
        .filter(e => e.company_id === company_id)
        .map(e => e.id);
      payrollRecords = payrollRecords.filter(p => companyEmployeeIds.includes(p.employee_id));
    }

    // Enrich with employee data and separate Saudi/Non-Saudi
    const saudiEmployees = [];
    const nonSaudiEmployees = [];
    
    for (const payroll of payrollRecords) {
      const employee = allEmployees.find(e => e.id === payroll.employee_id);
      if (!employee) continue;
      
      const isSaudi = employee.nationality === 'Saudi' || employee.nationality === 'Saudi Arabia';
      const data = {
        ...payroll,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        employee_id_number: employee.employee_id,
        national_id: employee.national_id,
        nationality: employee.nationality,
        gosi_number: employee.gosi_number,
        is_saudi: isSaudi
      };
      
      if (isSaudi) {
        saudiEmployees.push(data);
      } else {
        nonSaudiEmployees.push(data);
      }
    }

    // Calculate totals
    const totalEmployees = payrollRecords.length;
    const saudiCount = saudiEmployees.length;
    const nonSaudiCount = nonSaudiEmployees.length;
    
    const totalWages = payrollRecords.reduce((sum, p) => sum + (p.gosi_calculation_base || p.basic_salary), 0);
    const totalEmployeeContribution = payrollRecords.reduce((sum, p) => sum + (p.gosi_employee || 0), 0);
    const totalEmployerContribution = payrollRecords.reduce((sum, p) => sum + (p.gosi_employer || 0), 0);
    const totalContribution = totalEmployeeContribution + totalEmployerContribution;
    
    const occupationalHazards = totalWages * 0.02; // 2% for all employees
    const sanedContribution = saudiEmployees.reduce((sum, p) => sum + (p.gosi_calculation_base || p.basic_salary), 0) * 0.02; // 2% for Saudis only

    // Create GOSI report record
    const gosiReportData = {
      report_month: month,
      company_id: company_id,
      report_type: 'monthly_contribution',
      total_employees: totalEmployees,
      saudi_employees: saudiCount,
      non_saudi_employees: nonSaudiCount,
      total_wages: totalWages,
      total_employee_contribution: totalEmployeeContribution,
      total_employer_contribution: totalEmployerContribution,
      total_contribution: totalContribution,
      occupational_hazards: occupationalHazards,
      saned_contribution: sanedContribution,
      status: 'generated',
      due_date: `${month}-10`, // GOSI due on 10th of following month
      payment_status: 'pending'
    };

    const gosiReport = await base44.asServiceRole.entities.GOSIReport.create(gosiReportData);

    // Generate report text
    const reportText = generateGOSIReportText({
      ...gosiReportData,
      saudi_employees: saudiEmployees,
      non_saudi_employees: nonSaudiEmployees
    });

    return Response.json({
      success: true,
      message: 'GOSI report generated successfully',
      report: gosiReport,
      report_text: reportText,
      summary: {
        total_employees: totalEmployees,
        saudi_employees: saudiCount,
        non_saudi_employees: nonSaudiCount,
        total_contribution: totalContribution,
        due_date: gosiReportData.due_date
      },
      employee_details: {
        saudi: saudiEmployees,
        non_saudi: nonSaudiEmployees
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateGOSIReportText(data) {
  const line = '─'.repeat(80);
  const doubleLine = '═'.repeat(80);
  const formatCurrency = (amount) => `${(amount || 0).toFixed(2)} SAR`;
  
  let report = `
${doubleLine}
                        GOSI MONTHLY CONTRIBUTION REPORT
                              ${data.report_month}
${doubleLine}

SUMMARY
${line}
Total Employees:              ${data.total_employees}
Saudi Employees:              ${data.saudi_employees}
Non-Saudi Employees:          ${data.non_saudi_employees}

Total Wages:                  ${formatCurrency(data.total_wages)}
Employee Contribution:        ${formatCurrency(data.total_employee_contribution)}
Employer Contribution:        ${formatCurrency(data.total_employer_contribution)}
Occupational Hazards (2%):    ${formatCurrency(data.occupational_hazards)}
SANED Contribution (2%):      ${formatCurrency(data.saned_contribution)}

${doubleLine}
TOTAL CONTRIBUTION:           ${formatCurrency(data.total_contribution)}
${doubleLine}

Due Date: ${data.due_date}

SAUDI EMPLOYEES (${data.saudi_employees.length})
${line}
`;

  data.saudi_employees.forEach((emp, i) => {
    report += `
${i + 1}. ${emp.employee_name} (${emp.employee_id_number})
   National ID: ${emp.national_id || 'N/A'}
   GOSI Number: ${emp.gosi_number || 'N/A'}
   Wage Base:   ${formatCurrency(emp.gosi_calculation_base || emp.basic_salary)}
   Employee:    ${formatCurrency(emp.gosi_employee)}
   Employer:    ${formatCurrency(emp.gosi_employer)}
`;
  });

  if (data.non_saudi_employees.length > 0) {
    report += `
${line}
NON-SAUDI EMPLOYEES (${data.non_saudi_employees.length})
${line}
`;

    data.non_saudi_employees.forEach((emp, i) => {
      report += `
${i + 1}. ${emp.employee_name} (${emp.employee_id_number})
   Nationality: ${emp.nationality}
   Wage Base:   ${formatCurrency(emp.gosi_calculation_base || emp.basic_salary)}
   Employer:    ${formatCurrency(emp.gosi_employer)} (Occupational Hazards only)
`;
    });
  }

  report += `
${doubleLine}
End of Report
${doubleLine}
`;

  return report;
}