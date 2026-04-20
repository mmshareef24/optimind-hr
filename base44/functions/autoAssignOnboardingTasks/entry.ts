import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Automatically assign onboarding checklist and tasks to new employees
 * Can be triggered manually or via webhook
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { employee_id, checklist_id = null } = await req.json();
    
    if (!employee_id) {
      return Response.json({ error: 'employee_id is required' }, { status: 400 });
    }

    // Get employee details
    const employees = await base44.asServiceRole.entities.Employee.filter({ id: employee_id });
    if (employees.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }
    const employee = employees[0];

    // Find appropriate checklist
    let checklist;
    if (checklist_id) {
      const checklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ id: checklist_id });
      if (checklists.length === 0) {
        return Response.json({ error: 'Checklist not found' }, { status: 404 });
      }
      checklist = checklists[0];
    } else {
      // Auto-select checklist based on department or job role
      const allChecklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ is_active: true });
      
      // Try to match by department
      checklist = allChecklists.find(c => c.department === employee.department);
      
      // If no department match, try job role
      if (!checklist) {
        checklist = allChecklists.find(c => c.job_role === employee.job_title);
      }
      
      // If still no match, get the default/general checklist
      if (!checklist) {
        checklist = allChecklists.find(c => !c.department && !c.job_role);
      }
      
      if (!checklist) {
        return Response.json({ 
          error: 'No suitable onboarding checklist found. Please create a default checklist first.' 
        }, { status: 404 });
      }
    }

    // Get checklist template tasks (if stored separately, or define default tasks)
    const defaultTasks = [
      {
        task_title: "Complete Personal Information",
        task_description: "Fill in your complete profile including emergency contacts, bank details, and personal information",
        task_type: "document_submission",
        assigned_to: "new_hire",
        priority: "critical",
        day_number: 1,
        requires_document: false,
        requires_signature: false,
        order: 1
      },
      {
        task_title: "Sign Employment Contract",
        task_description: "Review and sign your employment contract",
        task_type: "document_submission",
        assigned_to: "new_hire",
        priority: "critical",
        day_number: 1,
        requires_document: true,
        requires_signature: true,
        order: 2
      },
      {
        task_title: "Review Company Policies",
        task_description: "Read and acknowledge company policies, code of conduct, and employee handbook",
        task_type: "policy_review",
        assigned_to: "new_hire",
        priority: "high",
        day_number: 1,
        requires_document: false,
        requires_signature: true,
        order: 3
      },
      {
        task_title: "IT Setup - Email & System Access",
        task_description: "Provision email account, system access, and necessary software licenses",
        task_type: "system_access",
        assigned_to: "it",
        priority: "high",
        day_number: 1,
        requires_document: false,
        requires_signature: false,
        order: 4
      },
      {
        task_title: "Equipment Assignment",
        task_description: "Assign laptop, phone, access card, and other necessary equipment",
        task_type: "equipment_setup",
        assigned_to: "it",
        priority: "high",
        day_number: 1,
        requires_document: false,
        requires_signature: false,
        order: 5
      },
      {
        task_title: "Welcome Orientation Session",
        task_description: "Attend company orientation to learn about vision, mission, and culture",
        task_type: "orientation",
        assigned_to: "new_hire",
        priority: "high",
        day_number: 1,
        requires_document: false,
        requires_signature: false,
        order: 6
      },
      {
        task_title: "Meet Your Team",
        task_description: "Introduction meeting with direct manager and team members",
        task_type: "meeting",
        assigned_to: "manager",
        priority: "medium",
        day_number: 2,
        requires_document: false,
        requires_signature: false,
        order: 7
      },
      {
        task_title: "Department-Specific Training",
        task_description: "Complete training specific to your department and role",
        task_type: "training",
        assigned_to: "new_hire",
        priority: "high",
        day_number: 3,
        requires_document: false,
        requires_signature: false,
        order: 8
      },
      {
        task_title: "Health & Safety Training",
        task_description: "Complete mandatory health and safety training",
        task_type: "training",
        assigned_to: "new_hire",
        priority: "high",
        day_number: 5,
        requires_document: false,
        requires_signature: true,
        order: 9
      },
      {
        task_title: "30-Day Check-in",
        task_description: "Review progress, address concerns, and provide feedback",
        task_type: "meeting",
        assigned_to: "manager",
        priority: "medium",
        day_number: 30,
        requires_document: false,
        requires_signature: false,
        order: 10
      }
    ];

    // Calculate due dates based on hire date and day_number
    const hireDate = new Date(employee.hire_date);
    const createdTasks = [];
    const errors = [];

    for (const taskTemplate of defaultTasks) {
      try {
        const dueDate = new Date(hireDate);
        dueDate.setDate(dueDate.getDate() + taskTemplate.day_number);

        // Determine assigned user
        let assigned_user_id = null;
        if (taskTemplate.assigned_to === 'manager' && employee.manager_id) {
          assigned_user_id = employee.manager_id;
        }

        const taskData = {
          checklist_id: checklist.id,
          employee_id: employee.id,
          task_title: taskTemplate.task_title,
          task_description: taskTemplate.task_description,
          task_type: taskTemplate.task_type,
          assigned_to: taskTemplate.assigned_to,
          assigned_user_id: assigned_user_id,
          priority: taskTemplate.priority,
          day_number: taskTemplate.day_number,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'not_started',
          requires_document: taskTemplate.requires_document,
          requires_signature: taskTemplate.requires_signature,
          order: taskTemplate.order
        };

        const task = await base44.asServiceRole.entities.OnboardingTask.create(taskData);
        createdTasks.push(task);

        // Send notification to assignee
        if (taskTemplate.assigned_to === 'new_hire' && employee.email) {
          await base44.integrations.Core.SendEmail({
            to: employee.email,
            subject: `Welcome! Your Onboarding Task: ${taskTemplate.task_title}`,
            body: `Dear ${employee.first_name},

Welcome to the team! 

You have a new onboarding task assigned:

Task: ${taskTemplate.task_title}
Due Date: ${dueDate.toLocaleDateString()}
Priority: ${taskTemplate.priority}

Description:
${taskTemplate.task_description}

Please log in to the ESS portal to complete this task.

Best regards,
HR Team`
          });
        }

      } catch (error) {
        errors.push({
          task: taskTemplate.task_title,
          error: error.message
        });
      }
    }

    // Send welcome email to new hire
    if (employee.email) {
      await base44.integrations.Core.SendEmail({
        to: employee.email,
        subject: `Welcome to the Team, ${employee.first_name}!`,
        body: `Dear ${employee.first_name},

Welcome to our company! We're thrilled to have you join our team as ${employee.job_title}.

Your onboarding journey has officially begun! We've prepared a customized checklist to help you get started smoothly. You have ${createdTasks.length} tasks assigned to help you settle in.

Key Information:
- Start Date: ${new Date(employee.hire_date).toLocaleDateString()}
- Department: ${employee.department || 'N/A'}
- Manager: ${employee.manager_id ? 'Assigned' : 'To be assigned'}

Next Steps:
1. Log in to the Employee Self-Service (ESS) portal
2. Complete your profile information
3. Review and complete your onboarding tasks
4. Reach out to HR if you have any questions

We're here to support you every step of the way. If you have any questions or need assistance, please don't hesitate to contact HR.

Looking forward to working with you!

Best regards,
HR Team`
      });
    }

    // Notify HR
    const hrUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const hrUser of hrUsers.slice(0, 2)) { // Notify up to 2 HR admins
      await base44.integrations.Core.SendEmail({
        to: hrUser.email,
        subject: `New Employee Onboarding Started: ${employee.first_name} ${employee.last_name}`,
        body: `A new employee has been assigned to the onboarding workflow:

Employee: ${employee.first_name} ${employee.last_name}
Employee ID: ${employee.employee_id}
Department: ${employee.department || 'N/A'}
Job Title: ${employee.job_title}
Start Date: ${new Date(employee.hire_date).toLocaleDateString()}

Checklist: ${checklist.checklist_name}
Total Tasks: ${createdTasks.length}
${errors.length > 0 ? `Errors: ${errors.length}` : ''}

Please monitor the onboarding progress in the Onboarding Management section.

Best regards,
HRMS System`
      });
    }

    return Response.json({
      success: true,
      message: 'Onboarding tasks assigned successfully',
      data: {
        employee_name: `${employee.first_name} ${employee.last_name}`,
        checklist_name: checklist.checklist_name,
        total_tasks: createdTasks.length,
        tasks: createdTasks,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});