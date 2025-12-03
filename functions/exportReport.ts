import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

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

const FIELD_LABELS = {
  employee_id: 'Employee ID',
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  department: 'Department',
  job_title: 'Job Title',
  employment_type: 'Employment Type',
  hire_date: 'Hire Date',
  status: 'Status',
  nationality: 'Nationality',
  gender: 'Gender',
  salary: 'Salary',
  phone: 'Phone',
  manager_id: 'Manager',
  period_month: 'Month',
  period_year: 'Year',
  basic_salary: 'Basic Salary',
  housing_allowance: 'Housing',
  transport_allowance: 'Transport',
  gross_salary: 'Gross Salary',
  net_salary: 'Net Salary',
  total_deductions: 'Deductions',
  gosi_employee: 'GOSI Employee',
  gosi_employer: 'GOSI Employer',
  date: 'Date',
  clock_in: 'Clock In',
  clock_out: 'Clock Out',
  total_hours: 'Total Hours',
  overtime_hours: 'Overtime',
  leave_type: 'Leave Type',
  start_date: 'Start Date',
  end_date: 'End Date',
  total_days: 'Total Days',
  reason: 'Reason',
  approved_by: 'Approved By',
  created_date: 'Created Date',
  review_period: 'Review Period',
  overall_rating: 'Rating',
  goals_achieved: 'Goals Achieved',
  asset_code: 'Asset Code',
  asset_name: 'Asset Name',
  category: 'Category',
  purchase_date: 'Purchase Date',
  purchase_cost: 'Purchase Cost',
  current_value: 'Current Value',
  condition: 'Condition',
  location: 'Location',
  assigned_to: 'Assigned To',
  stage: 'Stage',
  source: 'Source',
  application_date: 'Application Date'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module, fields, filters = {}, sortField, sortDirection = 'asc', format, reportName } = await req.json();

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

    // Fetch all data
    let records;
    const sortPrefix = sortDirection === 'desc' ? '-' : '';
    const sortParam = sortField ? `${sortPrefix}${sortField}` : '-created_date';

    if (Object.keys(filterQuery).length > 0) {
      records = await base44.entities[entityName].filter(filterQuery, sortParam);
    } else {
      records = await base44.entities[entityName].list(sortParam);
    }

    // Fetch employees for reference resolution
    let employees = [];
    if (fields.includes('employee_id') || fields.includes('manager_id') || fields.includes('assigned_to')) {
      employees = await base44.entities.Employee.list();
    }

    const getEmployeeName = (id) => {
      const emp = employees.find(e => e.id === id || e.employee_id === id);
      return emp ? `${emp.first_name} ${emp.last_name}` : id || '';
    };

    const formatValue = (value, field) => {
      if (value === null || value === undefined) return '';
      if (field === 'employee_id' || field === 'manager_id' || field === 'assigned_to') {
        return getEmployeeName(value);
      }
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'number' && ['salary', 'gross_salary', 'net_salary', 'basic_salary', 'purchase_cost', 'current_value'].includes(field)) {
        return `SAR ${value.toLocaleString()}`;
      }
      return String(value).replace(/,/g, ' ');
    };

    if (format === 'csv') {
      // Generate CSV
      const headers = fields.map(f => FIELD_LABELS[f] || f);
      const rows = records.map(record => 
        fields.map(field => formatValue(record[field], field))
      );

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

      return Response.json({
        content: csvContent,
        filename,
        recordCount: records.length
      });

    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF({ orientation: fields.length > 6 ? 'landscape' : 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(reportName || 'Report', margin, y);
      y += 8;

      // Subtitle
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString()} | ${records.length} records`, margin, y);
      y += 12;

      // Table headers
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);

      const colWidth = (pageWidth - 2 * margin) / Math.min(fields.length, 8);
      const displayFields = fields.slice(0, 8); // Limit columns for readability

      // Header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');

      displayFields.forEach((field, idx) => {
        const label = (FIELD_LABELS[field] || field).substring(0, 12);
        doc.text(label, margin + idx * colWidth + 2, y);
      });
      y += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      records.forEach((record, rowIdx) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;

          // Repeat header on new page
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
          displayFields.forEach((field, idx) => {
            const label = (FIELD_LABELS[field] || field).substring(0, 12);
            doc.text(label, margin + idx * colWidth + 2, y);
          });
          y += 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        // Alternate row colors
        if (rowIdx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F');
        }

        displayFields.forEach((field, idx) => {
          const value = formatValue(record[field], field).substring(0, 15);
          doc.text(value, margin + idx * colWidth + 2, y);
        });
        y += 6;
      });

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      const pdfBytes = doc.output('arraybuffer');

      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${reportName.replace(/\s+/g, '_')}_Report.pdf"`
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});