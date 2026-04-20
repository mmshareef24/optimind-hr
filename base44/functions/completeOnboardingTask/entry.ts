import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Complete an onboarding task with validation
 * Handles document submission, signature collection, and notifications
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      task_id, 
      completed_by = null,
      notes = '',
      document_url = null,
      signature_data = null
    } = await req.json();
    
    if (!task_id) {
      return Response.json({ error: 'task_id is required' }, { status: 400 });
    }

    // Get task details
    const tasks = await base44.asServiceRole.entities.OnboardingTask.filter({ id: task_id });
    if (tasks.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }
    const task = tasks[0];

    // Get employee details
    const employees = await base44.asServiceRole.entities.Employee.filter({ id: task.employee_id });
    if (employees.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }
    const employee = employees[0];

    // Validate permissions
    const currentEmployee = await base44.asServiceRole.entities.Employee.filter({ email: user.email });
    const isTaskOwner = currentEmployee.length > 0 && currentEmployee[0].id === task.employee_id;
    const isManager = currentEmployee.length > 0 && currentEmployee[0].id === employee.manager_id;
    const isAdmin = user.role === 'admin';

    if (!isTaskOwner && !isManager && !isAdmin) {
      return Response.json({ error: 'Access denied - You cannot complete this task' }, { status: 403 });
    }

    // Validate requirements
    if (task.requires_document && !document_url) {
      return Response.json({ 
        error: 'This task requires a document to be uploaded' 
      }, { status: 400 });
    }

    if (task.requires_signature && !signature_data) {
      return Response.json({ 
        error: 'This task requires your signature' 
      }, { status: 400 });
    }

    // Update task
    const completedTask = await base44.asServiceRole.entities.OnboardingTask.update(task_id, {
      ...task,
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      completed_by: completed_by || user.email,
      document_url: document_url || task.document_url,
      signature_data: signature_data || task.signature_data,
      notes: notes || task.notes
    });

    // Check if all tasks in checklist are completed
    const allTasks = await base44.asServiceRole.entities.OnboardingTask.filter({ 
      employee_id: task.employee_id,
      checklist_id: task.checklist_id
    });
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const completionPercentage = Math.round((completedTasks / allTasks.length) * 100);

    // Send completion notification
    if (employee.email) {
      await base44.integrations.Core.SendEmail({
        to: employee.email,
        subject: `Task Completed: ${task.task_title}`,
        body: `Dear ${employee.first_name},

Great job! You've completed an onboarding task:

Task: ${task.task_title}
Completed: ${new Date().toLocaleDateString()}

Your Onboarding Progress: ${completionPercentage}% (${completedTasks}/${allTasks.length} tasks)

${completionPercentage === 100 ? 
  `🎉 Congratulations! You've completed all onboarding tasks! Welcome aboard!` :
  `Keep going! You have ${allTasks.length - completedTasks} task(s) remaining.`}

Best regards,
HR Team`
      });
    }

    // Notify HR if this was a critical task
    if (task.priority === 'critical' || completionPercentage === 100) {
      const hrUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const hrUser of hrUsers.slice(0, 1)) {
        await base44.integrations.Core.SendEmail({
          to: hrUser.email,
          subject: `Onboarding Task Completed: ${employee.first_name} ${employee.last_name}`,
          body: `An onboarding task has been completed:

Employee: ${employee.first_name} ${employee.last_name} (${employee.employee_id})
Task: ${task.task_title}
Priority: ${task.priority}
Completion Progress: ${completionPercentage}%

${completionPercentage === 100 ?
  `🎉 This employee has completed ALL onboarding tasks!` :
  `Remaining Tasks: ${allTasks.length - completedTasks}`}

Best regards,
HRMS System`
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Task completed successfully',
      data: {
        task: completedTask,
        completion_percentage: completionPercentage,
        total_tasks: allTasks.length,
        completed_tasks: completedTasks,
        remaining_tasks: allTasks.length - completedTasks
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});