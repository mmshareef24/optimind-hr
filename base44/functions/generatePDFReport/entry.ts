import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.2';

/**
 * Generate PDF reports for various HRMS data
 * Supports: employees, payroll, attendance, leave, GOSI
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { report_type, filters = {}, send_email = false, email_to = null } = await req.json();
    
    if (!report_type) {
      return Response.json({ error: 'report_type is required' }, { status: 400 });
    }

    let doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let reportTitle = '';
    let data = [];

    // Fetch data based on report type
    if (report_type === 'employees') {
      reportTitle = 'Employee Directory Report';
      data = await base44.asServiceRole.entities.Employee.list();
      
      if (filters.department) {
        data = data.filter(e => e.department === filters.department);
      }
      if (filters.status) {
        data = data.filter(e => e.status === filters.status);
      }
      
      generateEmployeeReport(doc, data, pageWidth);
      
    } else if (report_type === 'payroll') {
      reportTitle = `Payroll Report - ${filters.month || 'All'}`;
      const query = filters.month ? { month: filters.month } : {};
      data = await base44.asServiceRole.entities.Payroll.filter(query);
      
      const employees = await base44.asServiceRole.entities.Employee.list();
      data = data.map(p => {
        const emp = employees.find(e => e.id === p.employee_id);
        return { ...p, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown' };
      });
      
      generatePayrollReport(doc, data, pageWidth, filters.month);
      
    } else if (report_type === 'gosi') {
      reportTitle = `GOSI Report - ${filters.month}`;
      if (!filters.month) {
        return Response.json({ error: 'Month is required for GOSI report' }, { status: 400 });
      }
      
      const payrollData = await base44.asServiceRole.entities.Payroll.filter({ month: filters.month });
      const employees = await base44.asServiceRole.entities.Employee.list();
      
      data = payrollData.map(p => {
        const emp = employees.find(e => e.id === p.employee_id);
        return { ...p, employee: emp };
      });
      
      generateGOSIReport(doc, data, pageWidth, filters.month);
      
    } else if (report_type === 'leave') {
      reportTitle = 'Leave Requests Report';
      data = await base44.asServiceRole.entities.LeaveRequest.list();
      
      if (filters.status) {
        data = data.filter(l => l.status === filters.status);
      }
      
      const employees = await base44.asServiceRole.entities.Employee.list();
      data = data.map(l => {
        const emp = employees.find(e => e.id === l.employee_id);
        return { ...l, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown' };
      });
      
      generateLeaveReport(doc, data, pageWidth);
    }

    const pdfBytes = doc.output('arraybuffer');

    // Send email if requested
    if (send_email && email_to) {
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
      
      await base44.integrations.Core.SendEmail({
        to: email_to,
        subject: reportTitle,
        body: `Dear User,

Please find attached the ${reportTitle}.

Generated on: ${new Date().toLocaleString()}

Best regards,
HRMS System`
      });
    }

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${report_type}-report-${Date.now()}.pdf`
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateEmployeeReport(doc, employees, pageWidth) {
  addHeader(doc, pageWidth, 'EMPLOYEE DIRECTORY REPORT');
  
  let y = 60;
  doc.setFontSize(10);
  
  // Table headers
  doc.setFont(undefined, 'bold');
  doc.text('ID', 20, y);
  doc.text('Name', 45, y);
  doc.text('Department', 100, y);
  doc.text('Position', 145, y);
  
  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  
  // Data rows
  y += 8;
  doc.setFont(undefined, 'normal');
  
  employees.forEach((emp, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(emp.employee_id || '', 20, y);
    doc.text(`${emp.first_name} ${emp.last_name}`, 45, y);
    doc.text(emp.department || 'N/A', 100, y);
    doc.text(emp.job_title || 'N/A', 145, y);
    
    y += 7;
  });
  
  addFooter(doc, employees.length);
}

function generatePayrollReport(doc, payrolls, pageWidth, month) {
  addHeader(doc, pageWidth, `PAYROLL REPORT - ${month || 'All Months'}`);
  
  let y = 60;
  doc.setFontSize(10);
  
  // Summary
  const totalGross = payrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
  const totalGOSI = payrolls.reduce((sum, p) => sum + (p.gosi_employer || 0), 0);
  
  doc.setFont(undefined, 'bold');
  doc.text(`Total Employees: ${payrolls.length}`, 20, y);
  doc.text(`Total Gross: ${totalGross.toFixed(2)} SAR`, 20, y + 7);
  doc.text(`Total Net: ${totalNet.toFixed(2)} SAR`, 20, y + 14);
  doc.text(`Employer GOSI: ${totalGOSI.toFixed(2)} SAR`, 20, y + 21);
  
  y += 35;
  doc.line(20, y, pageWidth - 20, y);
  
  // Table headers
  y += 8;
  doc.text('Employee', 20, y);
  doc.text('Gross', 90, y);
  doc.text('Deductions', 125, y);
  doc.text('Net', 165, y);
  
  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  
  // Data
  y += 8;
  doc.setFont(undefined, 'normal');
  
  payrolls.forEach((p) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(p.employee_name || 'Unknown', 20, y);
    doc.text(`${p.gross_salary.toFixed(2)}`, 90, y);
    doc.text(`${p.total_deductions.toFixed(2)}`, 125, y);
    doc.setFont(undefined, 'bold');
    doc.text(`${p.net_salary.toFixed(2)}`, 165, y);
    doc.setFont(undefined, 'normal');
    
    y += 7;
  });
  
  addFooter(doc, payrolls.length);
}

function generateGOSIReport(doc, data, pageWidth, month) {
  addHeader(doc, pageWidth, `GOSI CONTRIBUTION REPORT - ${month}`);
  
  const saudis = data.filter(d => d.employee?.nationality === 'Saudi' || d.employee?.nationality === 'Saudi Arabia');
  const nonSaudis = data.filter(d => d.employee?.nationality !== 'Saudi' && d.employee?.nationality !== 'Saudi Arabia');
  
  const totalEmployee = data.reduce((sum, d) => sum + (d.gosi_employee || 0), 0);
  const totalEmployer = data.reduce((sum, d) => sum + (d.gosi_employer || 0), 0);
  
  let y = 60;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  
  doc.text(`Total Employees: ${data.length} (Saudi: ${saudis.length}, Non-Saudi: ${nonSaudis.length})`, 20, y);
  y += 7;
  doc.text(`Employee Contribution: ${totalEmployee.toFixed(2)} SAR`, 20, y);
  y += 7;
  doc.text(`Employer Contribution: ${totalEmployer.toFixed(2)} SAR`, 20, y);
  y += 7;
  doc.text(`Total GOSI: ${(totalEmployee + totalEmployer).toFixed(2)} SAR`, 20, y);
  
  y += 15;
  doc.line(20, y, pageWidth - 20, y);
  
  // Saudi Employees
  y += 10;
  doc.setFontSize(12);
  doc.text(`SAUDI EMPLOYEES (${saudis.length})`, 20, y);
  
  y += 8;
  doc.setFontSize(9);
  doc.text('Name', 20, y);
  doc.text('Wage Base', 90, y);
  doc.text('Employee', 130, y);
  doc.text('Employer', 165, y);
  
  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  
  y += 7;
  doc.setFont(undefined, 'normal');
  
  saudis.forEach((d) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(d.employee ? `${d.employee.first_name} ${d.employee.last_name}` : 'Unknown', 20, y);
    doc.text(`${(d.gosi_calculation_base || d.basic_salary).toFixed(2)}`, 90, y);
    doc.text(`${d.gosi_employee.toFixed(2)}`, 130, y);
    doc.text(`${d.gosi_employer.toFixed(2)}`, 165, y);
    
    y += 6;
  });
  
  addFooter(doc, data.length);
}

function generateLeaveReport(doc, leaves, pageWidth) {
  addHeader(doc, pageWidth, 'LEAVE REQUESTS REPORT');
  
  let y = 60;
  doc.setFontSize(10);
  
  const pending = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;
  
  doc.setFont(undefined, 'bold');
  doc.text(`Total Requests: ${leaves.length}`, 20, y);
  doc.text(`Pending: ${pending}`, 20, y + 7);
  doc.text(`Approved: ${approved}`, 20, y + 14);
  doc.text(`Rejected: ${rejected}`, 20, y + 21);
  
  y += 35;
  doc.line(20, y, pageWidth - 20, y);
  
  y += 8;
  doc.text('Employee', 20, y);
  doc.text('Type', 80, y);
  doc.text('Period', 115, y);
  doc.text('Days', 160, y);
  doc.text('Status', 180, y);
  
  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  
  y += 8;
  doc.setFont(undefined, 'normal');
  
  leaves.forEach((leave) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(leave.employee_name || 'Unknown', 20, y);
    doc.text(leave.leave_type || 'N/A', 80, y);
    doc.text(`${leave.start_date} to ${leave.end_date}`, 115, y);
    doc.text(`${leave.total_days}`, 160, y);
    doc.text(leave.status, 180, y);
    
    y += 6;
  });
  
  addFooter(doc, leaves.length);
}

function addHeader(doc, pageWidth, title) {
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
}

function addFooter(doc, recordCount) {
  const pageCount = doc.internal.pages.length - 1;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount} | Total Records: ${recordCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
}