import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      entityName, 
      entityId, 
      changeType, 
      oldValues, 
      newValues, 
      summary,
      notes 
    } = await req.json();

    // Create change log entry
    const changeLog = await base44.asServiceRole.entities.ChangeLog.create({
      entity_name: entityName,
      entity_id: entityId,
      change_type: changeType,
      changed_by_email: user.email,
      changed_by_name: user.full_name || user.email,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      summary: summary,
      notes: notes || null
    });

    // Get all admin/HR users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const hrUsers = allUsers.filter(u => u.role === 'admin');

    // Send notifications to HR managers
    for (const hrUser of hrUsers) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: hrUser.email,
        title: `System Change: ${entityName}`,
        message: summary,
        type: 'system_change',
        related_entity: entityName,
        related_id: entityId,
        is_read: false
      });

      // Send email notification
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: hrUser.email,
        subject: `System Change Alert: ${entityName}`,
        body: `
          <h2>Change Detected</h2>
          <p><strong>Entity:</strong> ${entityName}</p>
          <p><strong>Change Type:</strong> ${changeType}</p>
          <p><strong>Changed By:</strong> ${user.full_name || user.email}</p>
          <p><strong>Summary:</strong> ${summary}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p><em>Timestamp: ${new Date().toLocaleString()}</em></p>
        `
      });
    }

    return Response.json({ 
      success: true, 
      changeLogId: changeLog.id,
      notificationsSent: hrUsers.length
    });

  } catch (error) {
    console.error('Error logging change:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});