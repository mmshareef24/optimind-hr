import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.2';

/**
 * Generate PDF payslip and optionally send via email
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

    // Fetch payroll and employee
    const payrollRecords = await base44.asServiceRole.entities.Payroll.filter({ id: payroll_id });
    if (payrollRecords.length === 0) {
      return Response.json({ error: 'Payroll not found' }, { status: 404 });
    }
    const payroll = payrollRecords[0];

    const employees = await base44.asServiceRole.entities.Employee.filter({ id: payroll.employee_id });
    if (employees.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }
    const employee = employees[0];

    // Check permissions
    const currentEmployee = await base44.asServiceRole.entities.Employee.filter({ email: user.email });
    const isOwnPayslip = currentEmployee.length > 0 && currentEmployee[0].id === employee.id;
    const isAdmin = user.role === 'admin';
    
    if (!isOwnPayslip && !isAdmin) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('PAYSLIP', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(payroll.month, pageWidth / 2, 30, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Employee Info
    let y = 55;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Employee Information', 20, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Employee ID: ${employee.employee_id}`, 20, y);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 70, y);
    
    y += 7;
    doc.text(`Name: ${employee.first_name} ${employee.last_name}`, 20, y);
    
    y += 7;
    doc.text(`Department: ${employee.department || 'N/A'}`, 20, y);
    doc.text(`Job Title: ${employee.job_title || 'N/A'}`, 120, y);
    
    // Attendance
    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Attendance Summary', 20, y);
    
    y += 7;
    doc.setFont(undefined, 'normal');
    doc.text(`Working Days: ${payroll.working_days}`, 20, y);
    doc.text(`Present: ${payroll.present_days}`, 70, y);
    doc.text(`Absent: ${payroll.absent_days}`, 120, y);
    doc.text(`Overtime: ${payroll.overtime_hours}h`, 160, y);
    
    // Earnings
    y += 15;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('EARNINGS', 20, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const earnings = [
      ['Basic Salary', payroll.basic_salary],
      ['Housing Allowance', payroll.housing_allowance],
      ['Transport Allowance', payroll.transport_allowance],
      ['Overtime Pay', payroll.overtime_pay],
      ['Bonus', payroll.bonus]
    ];
    
    earnings.forEach(([label, amount]) => {
      if (amount > 0) {
        doc.text(label, 25, y);
        doc.text(`${amount.toFixed(2)} SAR`, pageWidth - 45, y, { align: 'right' });
        y += 6;
      }
    });
    
    // Gross Salary
    y += 5;
    doc.setDrawColor(16, 185, 129);
    doc.line(20, y - 2, pageWidth - 20, y - 2);
    doc.setFont(undefined, 'bold');
    doc.text('GROSS SALARY', 25, y);
    doc.text(`${payroll.gross_salary.toFixed(2)} SAR`, pageWidth - 45, y, { align: 'right' });
    
    // Deductions
    y += 12;
    doc.setFontSize(12);
    doc.text('DEDUCTIONS', 20, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const deductions = [
      ['GOSI (Employee)', payroll.gosi_employee],
      ['Loan Deduction', payroll.loan_deduction],
      ['Advance Deduction', payroll.advance_deduction],
      ['Absence Deduction', payroll.absence_deduction],
      ['Other Deductions', payroll.other_deductions]
    ];
    
    deductions.forEach(([label, amount]) => {
      if (amount > 0) {
        doc.text(label, 25, y);
        doc.text(`${amount.toFixed(2)} SAR`, pageWidth - 45, y, { align: 'right' });
        y += 6;
      }
    });
    
    // Total Deductions
    y += 5;
    doc.setDrawColor(239, 68, 68); // Red
    doc.line(20, y - 2, pageWidth - 20, y - 2);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL DEDUCTIONS', 25, y);
    doc.text(`${payroll.total_deductions.toFixed(2)} SAR`, pageWidth - 45, y, { align: 'right' });
    
    // Net Salary
    y += 15;
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(15, y - 8, pageWidth - 30, 18, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('NET SALARY', 25, y);
    doc.text(`${payroll.net_salary.toFixed(2)} SAR`, pageWidth - 45, y, { align: 'right' });
    
    // Payment Details
    doc.setTextColor(0, 0, 0);
    y += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Details', 20, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Payment Method: ${payroll.payment_method || 'N/A'}`, 20, y);
    
    if (payroll.payment_date) {
      y += 6;
      doc.text(`Payment Date: ${payroll.payment_date}`, 20, y);
    }
    
    if (employee.iban || employee.bank_account) {
      y += 6;
      doc.text(`Bank Account: ${employee.iban || employee.bank_account}`, 20, y);
    }
    
    // Footer
    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer-generated payslip and does not require a signature.', pageWidth / 2, y, { align: 'center' });
    
    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    // Send email if requested
    if (send_email && employee.email) {
      await base44.integrations.Core.SendEmail({
        to: employee.email,
        subject: `Payslip for ${payroll.month}`,
        body: `Dear ${employee.first_name},

Your payslip for ${payroll.month} is ready and attached as a PDF.

Payroll Summary:
- Gross Salary: ${payroll.gross_salary.toFixed(2)} SAR
- Total Deductions: ${payroll.total_deductions.toFixed(2)} SAR
- Net Salary: ${payroll.net_salary.toFixed(2)} SAR

You can also access your payslips anytime through the ESS portal.

Best regards,
HR Team`
      });
    }

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=payslip-${employee.employee_id}-${payroll.month}.pdf`
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});