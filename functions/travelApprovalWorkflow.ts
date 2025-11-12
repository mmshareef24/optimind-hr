import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Configuration thresholds
const FINANCE_APPROVAL_THRESHOLD = 10000; // SAR - travel requests above this need finance approval

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, travelRequestId, comments } = await req.json();
        
        // Fetch the travel request
        const travelRequests = await base44.entities.TravelRequest.filter({ id: travelRequestId });
        if (travelRequests.length === 0) {
            return Response.json({ error: 'Travel request not found' }, { status: 404 });
        }
        
        const travelRequest = travelRequests[0];
        
        // Fetch employee details
        const employees = await base44.entities.Employee.filter({ id: travelRequest.employee_id });
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
                const needsFinanceApproval = travelRequest.estimated_cost >= FINANCE_APPROVAL_THRESHOLD;
                
                if (needsFinanceApproval) {
                    updateData = {
                        manager_status: 'approved',
                        manager_approved_by: user.email,
                        manager_approval_date: new Date().toISOString().split('T')[0],
                        manager_comments: comments || '',
                        current_approver_role: 'finance',
                        finance_status: 'pending'
                    };
                    
                    notificationMessage = `Your travel request to ${travelRequest.destination} has been approved by your manager and is pending finance approval.`;
                    
                    // Notify Finance
                    await base44.integrations.Core.SendEmail({
                        to: 'finance@company.sa', // Configure this
                        subject: `Travel Request Pending Finance Approval - ${employee.first_name} ${employee.last_name}`,
                        body: `A travel request requires finance approval:\n\nEmployee: ${employee.first_name} ${employee.last_name}\nDestination: ${travelRequest.destination}\nDates: ${travelRequest.departure_date} to ${travelRequest.return_date}\nEstimated Cost: ${travelRequest.estimated_cost} SAR\nPurpose: ${travelRequest.purpose}\n\nManager: Approved\n\nPlease review in the HRMS system.`
                    });
                } else {
                    updateData = {
                        manager_status: 'approved',
                        manager_approved_by: user.email,
                        manager_approval_date: new Date().toISOString().split('T')[0],
                        manager_comments: comments || '',
                        finance_status: 'not_required',
                        status: 'approved',
                        current_approver_role: 'completed'
                    };
                    
                    notificationMessage = `Great news! Your travel request to ${travelRequest.destination} has been fully approved.`;
                }
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
                
                notificationMessage = `Your travel request to ${travelRequest.destination} has been rejected by your manager.\nReason: ${comments || 'Not specified'}`;
            }
        }
        
        // Finance approval/rejection
        if (action === 'finance_approve' || action === 'finance_reject') {
            // Verify user has finance permissions (admin role or specific finance role)
            if (user.role !== 'admin') {
                return Response.json({ error: 'Only finance team can perform this action' }, { status: 403 });
            }
            
            if (action === 'finance_approve') {
                updateData = {
                    finance_status: 'approved',
                    finance_approved_by: user.email,
                    finance_approval_date: new Date().toISOString().split('T')[0],
                    finance_comments: comments || '',
                    status: 'approved',
                    current_approver_role: 'completed'
                };
                
                notificationMessage = `Excellent! Your travel request to ${travelRequest.destination} has been fully approved by finance.`;
            } else {
                updateData = {
                    finance_status: 'rejected',
                    finance_approved_by: user.email,
                    finance_approval_date: new Date().toISOString().split('T')[0],
                    finance_comments: comments || '',
                    status: 'rejected',
                    rejection_reason: comments || 'Rejected by finance',
                    current_approver_role: 'completed'
                };
                
                notificationMessage = `Your travel request to ${travelRequest.destination} has been rejected by finance.\nReason: ${comments || 'Not specified'}`;
            }
        }
        
        // Update the travel request
        await base44.asServiceRole.entities.TravelRequest.update(travelRequestId, updateData);
        
        // Send notification to employee
        if (employee.email) {
            await base44.integrations.Core.SendEmail({
                to: employee.email,
                subject: 'Travel Request Status Update',
                body: notificationMessage
            });
        }
        
        return Response.json({ 
            success: true, 
            message: 'Travel request processed successfully',
            updatedRequest: { ...travelRequest, ...updateData }
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});