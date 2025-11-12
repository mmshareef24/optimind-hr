import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Send reminders for overdue or upcoming onboarding tasks
 * Can be run as a scheduled job (daily)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { employee_id = null, task_id = null } = await req.json();

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get all incomplete tasks
    let tasks = await base44.asServiceRole.entities.OnboardingTask.filter({
      status: { $in: ['not_started', 'in_progress'] }
    });

    // Filter by employee or task if specified
    if (employee_id) {
      tasks = tasks.filter(t => t.employee_id === employee_id);
    }
    if (task_id) {
      tasks = tasks.filter(t => t.id === task_id);
    }

    // Get all employees
    const employees = await base44.asServiceRole.entities.Employee.list();
    const employeeMap = {};
    employees.forEach(e => { employeeMap[e.id] = e; });

    const remindersSent = [];
    const errors = [];

    for (const task of tasks) {
      try {
        const employee = employeeMap[task.employee_id];
        if (!employee) continue;

        const dueDate = new Date(task.due_date);
        const isOverdue = task.due_date < today;
        const isDueTomorrow = task.due_date === tomorrowStr;
        const isDueToday = task.due_date === today;

        // Mark overdue tasks
        if (isOverdue && task.status !== 'overdue') {
          await base44.asServiceRole.entities.OnboardingTask.update(task.id, {
            ...task,
            status: 'overdue'
          });
        }

        // Send reminder if overdue or due soon
        if (isOverdue || isDueToday || isDueTomorrow) {
          let recipientEmail = null;
          let recipientName = 'Team Member';

          if (task.assigned_to === 'new_hire') {
            recipientEmail = employee.email;
            recipientName = employee.first_name;
          } else if (task.assigned_to === 'manager' && task.assigned_user_id) {
            const manager = employeeMap[task.assigned_user_id];
            if (manager) {
              recipientEmail = manager.email;
              recipientName = manager.first_name;
            }
          } else if (task.assigned_to === 'hr' || task.assigned_to === 'it') {
            // Send to HR/IT admin emails
            const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
            if (adminUsers.length > 0) {
              recipientEmail = adminUsers[0].email;
              recipientName = 'HR Team';
            }
          }

          if (recipientEmail) {
            const urgency = isOverdue ? 'OVERDUE' : isDueToday ? 'DUE TODAY' : 'DUE TOMORROW';
            const urgencyColor = isOverdue ? '🔴' : isDueToday ? '🟡' : '🟢';

            await base44.integrations.Core.SendEmail({
              to: recipientEmail,
              subject: `${urgency}: Onboarding Task - ${task.task_title}`,
              body: `Dear ${recipientName},

${urgencyColor} ${urgency} ${urgencyColor}

You have an onboarding task that requires your attention:

Employee: ${employee.first_name} ${employee.last_name}
Task: ${task.task_title}
Due Date: ${dueDate.toLocaleDateString()}
Priority: ${task.priority}
Status: ${task.status}

Description:
${task.task_description}

${task.requires_document ? '📄 This task requires document submission.\n' : ''}${task.requires_signature ? '✍️ This task requires your signature.\n' : ''}
Please complete this task as soon as possible to ensure a smooth onboarding experience.

${task.assigned_to === 'new_hire' ? 
  'Log in to the ESS portal to complete this task.' : 
  'Log in to the HRMS to update task status.'}

${isOverdue ? 
  `This task is ${Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24))} day(s) overdue. Please prioritize completion.` : 
  ''}

Thank you,
HR Team`
            });

            remindersSent.push({
              task_id: task.id,
              task_title: task.task_title,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              recipient: recipientEmail,
              status: urgency
            });
          }
        }
      } catch (error) {
        errors.push({
          task_id: task.id,
          task_title: task.task_title,
          error: error.message
        });
      }
    }

    // Generate summary report for HR
    if (remindersSent.length > 0) {
      const hrUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const overdueTasks = remindersSent.filter(r => r.status === 'OVERDUE').length;
      const dueTodayTasks = remindersSent.filter(r => r.status === 'DUE TODAY').length;

      for (const hrUser of hrUsers.slice(0, 1)) { // Send to primary HR admin
        await base44.integrations.Core.SendEmail({
          to: hrUser.email,
          subject: `Onboarding Reminders Summary - ${new Date().toLocaleDateString()}`,
          body: `Daily Onboarding Task Reminders Summary:

Total Reminders Sent: ${remindersSent.length}
- Overdue Tasks: ${overdueTasks}
- Due Today: ${dueTodayTasks}
- Due Tomorrow: ${remindersSent.length - overdueTasks - dueTodayTasks}

${errors.length > 0 ? `Errors Encountered: ${errors.length}\n\n` : ''}
Please check the Onboarding Management dashboard for detailed status.

Best regards,
HRMS System`
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Onboarding reminders sent',
      data: {
        reminders_sent: remindersSent.length,
        overdue: remindersSent.filter(r => r.status === 'OVERDUE').length,
        due_today: remindersSent.filter(r => r.status === 'DUE TODAY').length,
        due_tomorrow: remindersSent.filter(r => r.status === 'DUE TOMORROW').length,
        reminders: remindersSent,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});