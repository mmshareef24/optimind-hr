import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is admin/HR
        if (user.role !== 'admin') {
            return Response.json({ error: 'Only HR can assign onboarding checklists' }, { status: 403 });
        }

        const { checklistId, employeeId, startDate } = await req.json();
        
        if (!checklistId || !employeeId) {
            return Response.json({ error: 'checklistId and employeeId are required' }, { status: 400 });
        }
        
        // Fetch the checklist
        const checklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ id: checklistId });
        if (checklists.length === 0) {
            return Response.json({ error: 'Checklist not found' }, { status: 404 });
        }
        const checklist = checklists[0];
        
        // Fetch the employee
        const employees = await base44.asServiceRole.entities.Employee.filter({ id: employeeId });
        if (employees.length === 0) {
            return Response.json({ error: 'Employee not found' }, { status: 404 });
        }
        const employee = employees[0];
        
        // Fetch all task templates for this checklist
        // Note: In a real implementation, you would have template tasks linked to the checklist
        // For now, we'll create a standard set of tasks based on the checklist type
        
        const taskTemplates = [
            {
                task_title: 'Complete Employee Information Form',
                task_description: 'Fill out all personal and contact information',
                task_type: 'document_submission',
                assigned_to: 'new_hire',
                priority: 'high',
                day_number: 1,
                requires_document: true,
                order: 1
            },
            {
                task_title: 'Submit Required Documents',
                task_description: 'Upload ID copy, educational certificates, and other required documents',
                task_type: 'document_submission',
                assigned_to: 'new_hire',
                priority: 'critical',
                day_number: 1,
                requires_document: true,
                order: 2
            },
            {
                task_title: 'Sign Employment Contract',
                task_description: 'Review and electronically sign your employment contract',
                task_type: 'document_submission',
                assigned_to: 'new_hire',
                priority: 'critical',
                day_number: 1,
                requires_signature: true,
                order: 3
            },
            {
                task_title: 'IT System Access Setup',
                task_description: 'Set up email account, system credentials, and software access',
                task_type: 'system_access',
                assigned_to: 'it',
                priority: 'high',
                day_number: 1,
                order: 4
            },
            {
                task_title: 'Workspace and Equipment Setup',
                task_description: 'Assign desk, computer, phone, and other necessary equipment',
                task_type: 'equipment_setup',
                assigned_to: 'it',
                priority: 'high',
                day_number: 1,
                order: 5
            },
            {
                task_title: 'Company Orientation',
                task_description: 'Attend company orientation session to learn about culture, policies, and procedures',
                task_type: 'orientation',
                assigned_to: 'hr',
                priority: 'high',
                day_number: 1,
                order: 6
            },
            {
                task_title: 'Review Company Policies',
                task_description: 'Read and acknowledge all company policies including HR policies, Code of Conduct, and IT policies',
                task_type: 'policy_review',
                assigned_to: 'new_hire',
                priority: 'medium',
                day_number: 2,
                order: 7
            },
            {
                task_title: 'Department Introduction',
                task_description: 'Meet your team members and understand your department structure',
                task_type: 'meeting',
                assigned_to: 'manager',
                priority: 'high',
                day_number: 2,
                order: 8
            },
            {
                task_title: 'Role-Specific Training',
                task_description: 'Complete training sessions specific to your job role',
                task_type: 'training',
                assigned_to: 'manager',
                priority: 'high',
                day_number: 3,
                order: 9
            },
            {
                task_title: '30-Day Check-in',
                task_description: 'Meet with HR to discuss your first month experience and address any concerns',
                task_type: 'meeting',
                assigned_to: 'hr',
                priority: 'medium',
                day_number: 30,
                order: 10
            }
        ];
        
        const start = new Date(startDate || employee.hire_date || new Date());
        const createdTasks = [];
        
        // Create tasks for the employee
        for (const template of taskTemplates) {
            const dueDate = new Date(start);
            dueDate.setDate(dueDate.getDate() + (template.day_number - 1));
            
            const taskData = {
                checklist_id: checklistId,
                employee_id: employeeId,
                task_title: template.task_title,
                task_description: template.task_description,
                task_type: template.task_type,
                assigned_to: template.assigned_to,
                priority: template.priority,
                day_number: template.day_number,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'not_started',
                requires_document: template.requires_document || false,
                requires_signature: template.requires_signature || false,
                order: template.order
            };
            
            const createdTask = await base44.asServiceRole.entities.OnboardingTask.create(taskData);
            createdTasks.push(createdTask);
        }
        
        // Send notification to the new hire
        if (employee.email) {
            await base44.integrations.Core.SendEmail({
                to: employee.email,
                subject: `Welcome to ${checklist.checklist_name || 'the Company'} - Your Onboarding Checklist`,
                body: `Dear ${employee.first_name},\n\nWelcome to the team! We're excited to have you on board.\n\nYour onboarding checklist has been assigned with ${createdTasks.length} tasks to help you get started. Please log into the HRMS system to view your tasks and complete them by the specified due dates.\n\nYour first day tasks include:\n- Complete Employee Information Form\n- Submit Required Documents\n- Sign Employment Contract\n\nIf you have any questions, please don't hesitate to reach out to the HR team.\n\nBest regards,\nHR Team`
            });
        }
        
        // Notify manager if employee has one
        if (employee.manager_id) {
            const managers = await base44.asServiceRole.entities.Employee.filter({ id: employee.manager_id });
            if (managers.length > 0 && managers[0].email) {
                await base44.integrations.Core.SendEmail({
                    to: managers[0].email,
                    subject: `New Team Member Onboarding - ${employee.first_name} ${employee.last_name}`,
                    body: `Hi ${managers[0].first_name},\n\n${employee.first_name} ${employee.last_name} has been assigned an onboarding checklist. Some tasks require your attention:\n\n- Department Introduction\n- Role-Specific Training\n\nPlease log into the HRMS system to view and complete your assigned tasks.\n\nThank you,\nHR Team`
                });
            }
        }
        
        return Response.json({ 
            success: true, 
            message: `Successfully created ${createdTasks.length} onboarding tasks for ${employee.first_name} ${employee.last_name}`,
            tasksCreated: createdTasks.length,
            tasks: createdTasks
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});