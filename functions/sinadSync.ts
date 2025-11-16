import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SINAD API Integration & Sync Handler
 * Generates and submits wage files to SINAD platform
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sinad_record_id, company_id, submission_month } = await req.json();

    // Retrieve SINAD API credentials
    const SINAD_API_KEY = Deno.env.get('SINAD_API_KEY');
    const SINAD_API_URL = Deno.env.get('SINAD_API_URL') || 'https://api.sinad.sa/v1';
    const SINAD_ESTABLISHMENT_ID = Deno.env.get('SINAD_ESTABLISHMENT_ID');

    if (!SINAD_API_KEY || !SINAD_ESTABLISHMENT_ID) {
      return Response.json({ 
        success: false, 
        error: 'SINAD API credentials not configured' 
      }, { status: 500 });
    }

    const sinadHeaders = {
      'Authorization': `Bearer ${SINAD_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Establishment-ID': SINAD_ESTABLISHMENT_ID
    };

    switch (action) {
      case 'generate_wage_file': {
        // Fetch payroll data for the month
        const payrolls = await base44.asServiceRole.entities.Payroll.filter({
          month: submission_month,
          status: 'approved'
        });

        if (payrolls.length === 0) {
          return Response.json({
            success: false,
            error: 'No approved payrolls found for the specified month'
          }, { status: 404 });
        }

        // Fetch employee details
        const employees = await base44.asServiceRole.entities.Employee.list();
        const employeeMap = new Map(employees.map(e => [e.id, e]));

        // Generate wage file data
        const wageFileData = {
          establishment_id: SINAD_ESTABLISHMENT_ID,
          submission_month: submission_month,
          submission_date: new Date().toISOString().split('T')[0],
          employees: payrolls.map(payroll => {
            const employee = employeeMap.get(payroll.employee_id);
            return {
              iqama_number: employee?.national_id || '',
              employee_name: `${employee?.first_name || ''} ${employee?.last_name || ''}`,
              basic_salary: payroll.basic_salary,
              housing_allowance: payroll.housing_allowance,
              transport_allowance: payroll.transport_allowance,
              other_allowances: (payroll.food_allowance || 0) + (payroll.mobile_allowance || 0) + (payroll.other_fixed_allowances || 0),
              gross_salary: payroll.gross_salary,
              total_deductions: payroll.total_deductions,
              net_salary: payroll.net_salary,
              payment_date: payroll.payment_date,
              bank_name: employee?.bank_name || '',
              iban: employee?.iban || ''
            };
          })
        };

        const totalWages = wageFileData.employees.reduce((sum, emp) => sum + emp.gross_salary, 0);
        const totalEmployees = wageFileData.employees.length;

        // Create or update SINAD record
        let sinadRecord;
        if (sinad_record_id) {
          sinadRecord = await base44.asServiceRole.entities.SINADRecord.update(sinad_record_id, {
            total_employees: totalEmployees,
            total_wages: totalWages,
            status: 'generated',
            submission_date: new Date().toISOString().split('T')[0]
          });
        } else {
          sinadRecord = await base44.asServiceRole.entities.SINADRecord.create({
            company_id: company_id,
            submission_month: submission_month,
            total_employees: totalEmployees,
            total_wages: totalWages,
            status: 'generated',
            submission_date: new Date().toISOString().split('T')[0],
            submission_type: 'regular'
          });
        }

        return Response.json({
          success: true,
          message: 'Wage file generated successfully',
          sinad_record_id: sinadRecord.id || sinad_record_id,
          total_employees: totalEmployees,
          total_wages: totalWages,
          wage_file_data: wageFileData
        });
      }

      case 'submit_to_sinad': {
        // Fetch SINAD record
        const sinadRecord = await base44.asServiceRole.entities.SINADRecord.filter({ id: sinad_record_id });
        
        if (!sinadRecord[0]) {
          return Response.json({ success: false, error: 'SINAD record not found' }, { status: 404 });
        }

        const record = sinadRecord[0];

        // Fetch payroll data
        const payrolls = await base44.asServiceRole.entities.Payroll.filter({
          month: record.submission_month,
          status: 'approved'
        });

        const employees = await base44.asServiceRole.entities.Employee.list();
        const employeeMap = new Map(employees.map(e => [e.id, e]));

        const submissionData = {
          establishment_id: SINAD_ESTABLISHMENT_ID,
          submission_month: record.submission_month,
          submission_type: record.submission_type,
          payment_date: record.payment_date,
          bank_name: record.bank_name,
          employees: payrolls.map(payroll => {
            const employee = employeeMap.get(payroll.employee_id);
            return {
              iqama_number: employee?.national_id || '',
              employee_name: `${employee?.first_name || ''} ${employee?.last_name || ''}`,
              gross_salary: payroll.gross_salary,
              net_salary: payroll.net_salary,
              iban: employee?.iban || ''
            };
          })
        };

        // Submit to SINAD API
        const sinadResponse = await fetch(`${SINAD_API_URL}/wage-files/submit`, {
          method: 'POST',
          headers: sinadHeaders,
          body: JSON.stringify(submissionData)
        });

        const sinadResult = await sinadResponse.json();

        if (sinadResponse.ok) {
          // Update record with success
          await base44.asServiceRole.entities.SINADRecord.update(sinad_record_id, {
            status: 'submitted',
            file_reference: sinadResult.reference_number,
            submission_date: new Date().toISOString().split('T')[0],
            compliance_score: sinadResult.compliance_score || 0
          });

          // Send success notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: 'SINAD Wage File Submitted Successfully',
            body: `Wage file for ${record.submission_month} has been submitted to SINAD. Reference: ${sinadResult.reference_number}`
          });

          return Response.json({
            success: true,
            message: 'Wage file submitted to SINAD successfully',
            reference_number: sinadResult.reference_number,
            compliance_score: sinadResult.compliance_score
          });
        } else {
          // Update with error
          await base44.asServiceRole.entities.SINADRecord.update(sinad_record_id, {
            status: 'rejected',
            rejection_reason: sinadResult.error || 'Submission failed'
          });

          // Send error notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: 'SINAD Wage File Submission Failed',
            body: `Failed to submit wage file for ${record.submission_month}. Error: ${sinadResult.error || 'Unknown error'}`
          });

          return Response.json({
            success: false,
            error: sinadResult.error || 'Submission failed'
          }, { status: 400 });
        }
      }

      case 'check_submission_status': {
        const sinadRecord = await base44.asServiceRole.entities.SINADRecord.filter({ id: sinad_record_id });
        
        if (!sinadRecord[0] || !sinadRecord[0].file_reference) {
          return Response.json({ success: false, error: 'SINAD record not found or not submitted' }, { status: 404 });
        }

        const record = sinadRecord[0];

        // Check status with SINAD API
        const statusResponse = await fetch(`${SINAD_API_URL}/wage-files/${record.file_reference}/status`, {
          method: 'GET',
          headers: sinadHeaders
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          // Update record with latest status
          await base44.asServiceRole.entities.SINADRecord.update(sinad_record_id, {
            status: statusData.status,
            compliance_score: statusData.compliance_score || record.compliance_score,
            approval_date: statusData.approval_date || record.approval_date
          });

          return Response.json({
            success: true,
            status: statusData.status,
            compliance_score: statusData.compliance_score,
            approval_date: statusData.approval_date
          });
        } else {
          const errorData = await statusResponse.json();
          return Response.json({
            success: false,
            error: errorData.error || 'Failed to check status'
          }, { status: 400 });
        }
      }

      case 'validate_before_submit': {
        // Validate wage file data before submission
        const payrolls = await base44.asServiceRole.entities.Payroll.filter({
          month: submission_month,
          status: 'approved'
        });

        const employees = await base44.asServiceRole.entities.Employee.list();
        const employeeMap = new Map(employees.map(e => [e.id, e]));

        const validationErrors = [];

        payrolls.forEach((payroll, index) => {
          const employee = employeeMap.get(payroll.employee_id);
          
          if (!employee) {
            validationErrors.push(`Payroll #${index + 1}: Employee not found`);
          } else {
            if (!employee.national_id) {
              validationErrors.push(`Employee ${employee.first_name} ${employee.last_name}: Missing national ID/Iqama`);
            }
            if (!employee.iban) {
              validationErrors.push(`Employee ${employee.first_name} ${employee.last_name}: Missing IBAN`);
            }
            if (!payroll.net_salary || payroll.net_salary <= 0) {
              validationErrors.push(`Employee ${employee.first_name} ${employee.last_name}: Invalid net salary`);
            }
          }
        });

        return Response.json({
          success: validationErrors.length === 0,
          valid: validationErrors.length === 0,
          errors: validationErrors,
          total_employees: payrolls.length
        });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('SINAD Sync Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});