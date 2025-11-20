import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use service role for automated alerts
    const documents = await base44.asServiceRole.entities.Document.filter({
      status: 'active'
    });

    const today = new Date();
    const alertsSent = [];

    for (const doc of documents) {
      if (!doc.expiry_date) continue;

      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      const alertDays = doc.alert_days || 30;

      // Send alerts at specified days before expiry, 7 days, and on expiry
      const alertThresholds = [alertDays, 7, 0];
      
      if (alertThresholds.includes(daysUntilExpiry) && daysUntilExpiry >= 0) {
        let recipients = [];
        let subject = '';
        let body = '';

        if (doc.company_id) {
          // Company document - alert admins
          const company = await base44.asServiceRole.entities.Company.get(doc.company_id);
          
          subject = `⚠️ Company Document Expiring Soon: ${doc.document_name}`;
          body = `
            <h2>Company Document Expiry Alert</h2>
            <p><strong>Company:</strong> ${company?.name_en || 'Unknown'}</p>
            <p><strong>Document:</strong> ${doc.document_name}</p>
            <p><strong>Type:</strong> ${doc.document_type.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Expiry Date:</strong> ${new Date(doc.expiry_date).toLocaleDateString()}</p>
            <p><strong>Days Until Expiry:</strong> ${daysUntilExpiry} days</p>
            ${doc.notes ? `<p><strong>Notes:</strong> ${doc.notes}</p>` : ''}
            <p style="color: ${daysUntilExpiry === 0 ? 'red' : daysUntilExpiry <= 7 ? 'orange' : 'black'};">
              ${daysUntilExpiry === 0 ? '⚠️ This document expires TODAY!' : 
                daysUntilExpiry <= 7 ? '⚠️ Urgent: This document expires very soon!' : 
                '⚠️ Please renew this document soon.'}
            </p>
          `;

          // Get all admin users
          const users = await base44.asServiceRole.entities.User.list();
          recipients = users.filter(u => u.role === 'admin').map(u => u.email);

        } else if (doc.employee_id) {
          // Employee document - alert employee and HR
          const employee = await base44.asServiceRole.entities.Employee.get(doc.employee_id);
          
          subject = `⚠️ Document Expiring Soon: ${doc.document_name}`;
          body = `
            <h2>Employee Document Expiry Alert</h2>
            <p><strong>Employee:</strong> ${employee?.first_name} ${employee?.last_name} (${employee?.employee_id})</p>
            <p><strong>Document:</strong> ${doc.document_name}</p>
            <p><strong>Type:</strong> ${doc.document_type.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Expiry Date:</strong> ${new Date(doc.expiry_date).toLocaleDateString()}</p>
            <p><strong>Days Until Expiry:</strong> ${daysUntilExpiry} days</p>
            ${doc.notes ? `<p><strong>Notes:</strong> ${doc.notes}</p>` : ''}
            <p style="color: ${daysUntilExpiry === 0 ? 'red' : daysUntilExpiry <= 7 ? 'orange' : 'black'};">
              ${daysUntilExpiry === 0 ? '⚠️ This document expires TODAY!' : 
                daysUntilExpiry <= 7 ? '⚠️ Urgent: This document expires very soon!' : 
                '⚠️ Please renew this document soon.'}
            </p>
          `;

          recipients = [employee?.email];
          
          // Add HR admins
          const users = await base44.asServiceRole.entities.User.list();
          const hrAdmins = users.filter(u => u.role === 'admin').map(u => u.email);
          recipients.push(...hrAdmins);
        }

        // Send emails
        for (const email of recipients.filter(Boolean)) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: email,
              subject: subject,
              body: body
            });
            alertsSent.push({
              document: doc.document_name,
              recipient: email,
              daysUntilExpiry
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${email}:`, emailError);
          }
        }

        // Update document status if expired
        if (daysUntilExpiry === 0) {
          await base44.asServiceRole.entities.Document.update(doc.id, {
            status: 'expired'
          });
        }
      }
    }

    return Response.json({
      success: true,
      alertsSent: alertsSent.length,
      details: alertsSent
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});