import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * QIWA API Integration & Sync Handler
 * Synchronizes employee data with QIWA platform
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, employee_id, qiwa_record_id } = await req.json();

    // Retrieve QIWA API credentials from environment
    const QIWA_API_KEY = Deno.env.get('QIWA_API_KEY');
    const QIWA_API_URL = Deno.env.get('QIWA_API_URL') || 'https://api.qiwa.sa/v1';

    if (!QIWA_API_KEY) {
      return Response.json({ 
        success: false, 
        error: 'QIWA API credentials not configured' 
      }, { status: 500 });
    }

    const qiwaHeaders = {
      'Authorization': `Bearer ${QIWA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    switch (action) {
      case 'register_employee': {
        // Fetch employee and QIWA record
        const employee = await base44.asServiceRole.entities.Employee.filter({ id: employee_id });
        const qiwaRecord = await base44.asServiceRole.entities.QIWARecord.filter({ id: qiwa_record_id });

        if (!employee[0] || !qiwaRecord[0]) {
          return Response.json({ success: false, error: 'Employee or QIWA record not found' }, { status: 404 });
        }

        const emp = employee[0];
        const qiwa = qiwaRecord[0];

        // Prepare QIWA registration payload
        const registrationData = {
          iqama_number: qiwa.iqama_number,
          border_number: qiwa.border_number,
          work_permit_number: qiwa.work_permit_number,
          employee_name_en: `${emp.first_name} ${emp.last_name}`,
          employee_name_ar: emp.first_name_ar && emp.last_name_ar ? `${emp.first_name_ar} ${emp.last_name_ar}` : '',
          job_title_ar: qiwa.job_title_ar,
          occupation_code: qiwa.occupation_code,
          contract_type: qiwa.contract_type,
          contract_start_date: qiwa.contract_start_date,
          contract_end_date: qiwa.contract_end_date,
          nationality: emp.nationality,
          date_of_birth: emp.date_of_birth,
          gender: emp.gender
        };

        // Call QIWA API
        const qiwaResponse = await fetch(`${QIWA_API_URL}/employees/register`, {
          method: 'POST',
          headers: qiwaHeaders,
          body: JSON.stringify(registrationData)
        });

        const qiwaResult = await qiwaResponse.json();

        if (qiwaResponse.ok) {
          // Update QIWA record with success
          await base44.asServiceRole.entities.QIWARecord.update(qiwa_record_id, {
            registration_status: 'registered',
            registration_date: new Date().toISOString().split('T')[0],
            qiwa_id: qiwaResult.qiwa_employee_id || qiwa.qiwa_id,
            last_sync_date: new Date().toISOString(),
            sync_status: 'success',
            sync_error: null
          });

          // Send success notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: 'QIWA Registration Successful',
            body: `Employee ${emp.first_name} ${emp.last_name} has been successfully registered in QIWA.`
          });

          return Response.json({
            success: true,
            message: 'Employee registered in QIWA successfully',
            qiwa_id: qiwaResult.qiwa_employee_id
          });
        } else {
          // Update with error
          await base44.asServiceRole.entities.QIWARecord.update(qiwa_record_id, {
            registration_status: 'pending',
            last_sync_date: new Date().toISOString(),
            sync_status: 'error',
            sync_error: qiwaResult.error || 'Registration failed'
          });

          // Send error notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: 'QIWA Registration Failed',
            body: `Failed to register employee ${emp.first_name} ${emp.last_name} in QIWA. Error: ${qiwaResult.error || 'Unknown error'}`
          });

          return Response.json({
            success: false,
            error: qiwaResult.error || 'Registration failed'
          }, { status: 400 });
        }
      }

      case 'sync_work_permit': {
        const qiwaRecord = await base44.asServiceRole.entities.QIWARecord.filter({ id: qiwa_record_id });
        
        if (!qiwaRecord[0]) {
          return Response.json({ success: false, error: 'QIWA record not found' }, { status: 404 });
        }

        const qiwa = qiwaRecord[0];

        // Fetch work permit status from QIWA
        const permitResponse = await fetch(`${QIWA_API_URL}/work-permits/${qiwa.work_permit_number}`, {
          method: 'GET',
          headers: qiwaHeaders
        });

        if (permitResponse.ok) {
          const permitData = await permitResponse.json();
          
          await base44.asServiceRole.entities.QIWARecord.update(qiwa_record_id, {
            work_permit_expiry: permitData.expiry_date,
            last_sync_date: new Date().toISOString(),
            sync_status: 'success',
            sync_error: null
          });

          // Check if permit is expiring soon (within 90 days)
          const expiryDate = new Date(permitData.expiry_date);
          const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: user.email,
              subject: 'Work Permit Expiring Soon',
              body: `Work permit for employee (QIWA ID: ${qiwa.qiwa_id}) will expire in ${daysUntilExpiry} days. Please renew.`
            });
          }

          return Response.json({
            success: true,
            expiry_date: permitData.expiry_date,
            days_until_expiry: daysUntilExpiry
          });
        } else {
          const errorData = await permitResponse.json();
          
          await base44.asServiceRole.entities.QIWARecord.update(qiwa_record_id, {
            last_sync_date: new Date().toISOString(),
            sync_status: 'error',
            sync_error: errorData.error || 'Failed to sync work permit'
          });

          return Response.json({
            success: false,
            error: errorData.error || 'Failed to sync work permit'
          }, { status: 400 });
        }
      }

      case 'bulk_sync': {
        // Sync all active QIWA records
        const allRecords = await base44.asServiceRole.entities.QIWARecord.filter({
          registration_status: 'registered'
        });

        const syncResults = {
          success: 0,
          failed: 0,
          errors: []
        };

        for (const record of allRecords) {
          try {
            const permitResponse = await fetch(`${QIWA_API_URL}/work-permits/${record.work_permit_number}`, {
              method: 'GET',
              headers: qiwaHeaders
            });

            if (permitResponse.ok) {
              const permitData = await permitResponse.json();
              
              await base44.asServiceRole.entities.QIWARecord.update(record.id, {
                work_permit_expiry: permitData.expiry_date,
                last_sync_date: new Date().toISOString(),
                sync_status: 'success',
                sync_error: null
              });

              syncResults.success++;
            } else {
              const errorData = await permitResponse.json();
              
              await base44.asServiceRole.entities.QIWARecord.update(record.id, {
                last_sync_date: new Date().toISOString(),
                sync_status: 'error',
                sync_error: errorData.error
              });

              syncResults.failed++;
              syncResults.errors.push({
                record_id: record.id,
                error: errorData.error
              });
            }
          } catch (error) {
            syncResults.failed++;
            syncResults.errors.push({
              record_id: record.id,
              error: error.message
            });
          }
        }

        // Send summary notification
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: 'QIWA Bulk Sync Completed',
          body: `Bulk sync completed. Success: ${syncResults.success}, Failed: ${syncResults.failed}`
        });

        return Response.json({
          success: true,
          results: syncResults
        });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('QIWA Sync Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});