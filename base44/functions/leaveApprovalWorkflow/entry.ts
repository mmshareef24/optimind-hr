import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, leaveRequestId, comments } = await req.json();
        
        // Fetch the leave request
        const leaveRequests = await base44.entities.LeaveRequest.filter({ id: leaveRequestId });
        if (leaveRequests.length === 0) {
            return Response.json({ error: 'Leave request not found' }, { status: 404 });
        }
        
        const leaveRequest = leaveRequests[0];
        
        // Fetch employee details
        const employees = await base44.entities.Employee.filter({ id: leaveRequest.employee_id });
        if (employees.length === 0) {
            return Response.json({ error: 'Employee not found' }, { status: 404 });
        }
        const employee = employees[0];
        
        let updateData = {};
        let notificationMessage = '';
        
        // Manager approval/rejection
        if (action === 'manager_approve' || action === 'manager_reject') {
            // Verify the user is the employee's manager
            const managerEmployees = await base44.entities.Employee.filter({ email: user.email });
            if (managerEmployees.length === 0 || managerEmployees[0].id !== employee.manager_id) {
                return Response.json({ error: 'Only the direct manager can approve/reject' }, { status: 403 });
            }
            
            if (action === 'manager_approve') {
                updateData = {
                    manager_status: 'approved',
                    manager_approved_by: user.email,
                    manager_approval_date: new Date().toISOString().split('T')[0],
                    manager_comments: comments || '',
                    current_approver_role: 'hr'
                };
                
                notificationMessage = `Your leave request from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been approved by your manager and forwarded to HR.`;
                
                // Notify HR
                await base44.integrations.Core.SendEmail({
                    to: 'hr@company.sa', // Configure this
                    subject: `Leave Request Pending HR Approval - ${employee.first_name} ${employee.last_name}`,
                    body: `A leave request requires HR approval:\n\nEmployee: ${employee.first_name} ${employee.last_name}\nLeave Type: ${leaveRequest.leave_type}\nDates: ${leaveRequest.start_date} to ${leaveRequest.end_date}\nDays: ${leaveRequest.total_days}\nReason: ${leaveRequest.reason}\nManager: Approved\n\nPlease review in the HRMS system.`
                });
            } else {
                updateData = {
                    manager_status: 'rejected',
                    manager_approved_by: user.email,
                    manager_approval_date: new Date().toISOString().split('T')[0],
                    manager_comments: comments || '',
                    status: 'rejected',
                    rejection_reason: comments || 'Rejected by manager',
                    current_approver_role: 'completed'
                };
                
                notificationMessage = `Your leave request from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been rejected by your manager.\nReason: ${comments || 'Not specified'}`;
            }
        }
        
        // HR approval/rejection
        if (action === 'hr_approve' || action === 'hr_reject') {
            // Verify user is HR (admin role)
            if (user.role !== 'admin') {
                return Response.json({ error: 'Only HR can perform this action' }, { status: 403 });
            }
            
            if (action === 'hr_approve') {
                updateData = {
                    hr_status: 'approved',
                    hr_approved_by: user.email,
                    hr_approval_date: new Date().toISOString().split('T')[0],
                    hr_comments: comments || '',
                    status: 'approved',
                    current_approver_role: 'completed'
                };
                
                notificationMessage = `Great news! Your leave request from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been fully approved.`;
                
                // Update leave balance
                const leaveBalances = await base44.asServiceRole.entities.LeaveBalance.filter({
                    employee_id: employee.id,
                    leave_type: leaveRequest.leave_type,
                    year: new Date().getFullYear()
                });
                
                if (leaveBalances.length > 0) {
                    const balance = leaveBalances[0];
                    await base44.asServiceRole.entities.LeaveBalance.update(balance.id, {
                        used: (balance.used || 0) + leaveRequest.total_days,
                        remaining: (balance.remaining || 0) - leaveRequest.total_days,
                        pending: Math.max((balance.pending || 0) - leaveRequest.total_days, 0)
                    });
                }
            } else {
                updateData = {
                    hr_status: 'rejected',
                    hr_approved_by: user.email,
                    hr_approval_date: new Date().toISOString().split('T')[0],
                    hr_comments: comments || '',
                    status: 'rejected',
                    rejection_reason: comments || 'Rejected by HR',
                    current_approver_role: 'completed'
                };
                
                notificationMessage = `Your leave request from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been rejected by HR.\nReason: ${comments || 'Not specified'}`;
            }
        }
        
        // Update the leave request
        await base44.asServiceRole.entities.LeaveRequest.update(leaveRequestId, updateData);
        
        // Send notification to employee
        if (employee.email) {
            await base44.integrations.Core.SendEmail({
                to: employee.email,
                subject: 'Leave Request Status Update',
                body: notificationMessage
            });
        }
        
        return Response.json({ 
            success: true, 
            message: 'Leave request processed successfully',
            updatedRequest: { ...leaveRequest, ...updateData }
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});