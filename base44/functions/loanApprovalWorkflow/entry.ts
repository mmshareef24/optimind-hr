import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Configuration thresholds in SAR
const HR_APPROVAL_THRESHOLD = 5000; // Loans above this need HR approval
const SENIOR_MANAGEMENT_THRESHOLD = 15000; // Loans above this need senior management approval

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, loanRequestId, comments } = await req.json();
        
        // Fetch the loan request
        const loanRequests = await base44.entities.LoanRequest.filter({ id: loanRequestId });
        if (loanRequests.length === 0) {
            return Response.json({ error: 'Loan request not found' }, { status: 404 });
        }
        
        const loanRequest = loanRequests[0];
        
        // Fetch employee details
        const employees = await base44.entities.Employee.filter({ id: loanRequest.employee_id });
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
                const needsHRApproval = loanRequest.amount_requested >= HR_APPROVAL_THRESHOLD;
                
                if (needsHRApproval) {
                    updateData = {
                        manager_status: 'approved',
                        manager_approved_by: user.email,
                        manager_approval_date: new Date().toISOString().split('T')[0],
                        manager_comments: comments || '',
                        current_approver_role: 'hr',
                        hr_status: 'pending'
                    };
                    
                    notificationMessage = `Your loan request for ${loanRequest.amount_requested} SAR has been approved by your manager and is pending HR approval.`;
                    
                    // Notify HR
                    await base44.integrations.Core.SendEmail({
                        to: 'hr@company.sa', // Configure this
                        subject: `Loan Request Pending HR Approval - ${employee.first_name} ${employee.last_name}`,
                        body: `A loan request requires HR approval:\n\nEmployee: ${employee.first_name} ${employee.last_name}\nLoan Type: ${loanRequest.loan_type}\nAmount: ${loanRequest.amount_requested} SAR\nRepayment Period: ${loanRequest.repayment_period} months\nMonthly Deduction: ${loanRequest.monthly_deduction} SAR\nPurpose: ${loanRequest.purpose}\n\nManager: Approved\n\nPlease review in the HRMS system.`
                    });
                } else {
                    updateData = {
                        manager_status: 'approved',
                        manager_approved_by: user.email,
                        manager_approval_date: new Date().toISOString().split('T')[0],
                        manager_comments: comments || '',
                        hr_status: 'not_required',
                        senior_management_status: 'not_required',
                        status: 'approved',
                        current_approver_role: 'completed'
                    };
                    
                    notificationMessage = `Great news! Your loan request for ${loanRequest.amount_requested} SAR has been approved.`;
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
                
                notificationMessage = `Your loan request for ${loanRequest.amount_requested} SAR has been rejected by your manager.\nReason: ${comments || 'Not specified'}`;
            }
        }
        
        // HR approval/rejection
        if (action === 'hr_approve' || action === 'hr_reject') {
            // Verify user is HR (admin role)
            if (user.role !== 'admin') {
                return Response.json({ error: 'Only HR can perform this action' }, { status: 403 });
            }
            
            if (action === 'hr_approve') {
                const needsSeniorApproval = loanRequest.amount_requested >= SENIOR_MANAGEMENT_THRESHOLD;
                
                if (needsSeniorApproval) {
                    updateData = {
                        hr_status: 'approved',
                        hr_approved_by: user.email,
                        hr_approval_date: new Date().toISOString().split('T')[0],
                        hr_comments: comments || '',
                        current_approver_role: 'senior_management',
                        senior_management_status: 'pending'
                    };
                    
                    notificationMessage = `Your loan request for ${loanRequest.amount_requested} SAR has been approved by HR and is pending senior management approval.`;
                    
                    // Notify Senior Management
                    await base44.integrations.Core.SendEmail({
                        to: 'management@company.sa', // Configure this
                        subject: `Loan Request Pending Senior Management Approval - ${employee.first_name} ${employee.last_name}`,
                        body: `A high-value loan request requires senior management approval:\n\nEmployee: ${employee.first_name} ${employee.last_name}\nLoan Type: ${loanRequest.loan_type}\nAmount: ${loanRequest.amount_requested} SAR\nRepayment Period: ${loanRequest.repayment_period} months\nPurpose: ${loanRequest.purpose}\n\nManager: Approved\nHR: Approved\n\nPlease review in the HRMS system.`
                    });
                } else {
                    updateData = {
                        hr_status: 'approved',
                        hr_approved_by: user.email,
                        hr_approval_date: new Date().toISOString().split('T')[0],
                        hr_comments: comments || '',
                        senior_management_status: 'not_required',
                        status: 'approved',
                        current_approver_role: 'completed'
                    };
                    
                    notificationMessage = `Excellent! Your loan request for ${loanRequest.amount_requested} SAR has been fully approved.`;
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
                
                notificationMessage = `Your loan request for ${loanRequest.amount_requested} SAR has been rejected by HR.\nReason: ${comments || 'Not specified'}`;
            }
        }
        
        // Senior Management approval/rejection
        if (action === 'senior_management_approve' || action === 'senior_management_reject') {
            // Verify user has senior management permissions (admin role)
            if (user.role !== 'admin') {
                return Response.json({ error: 'Only senior management can perform this action' }, { status: 403 });
            }
            
            if (action === 'senior_management_approve') {
                updateData = {
                    senior_management_status: 'approved',
                    senior_management_approved_by: user.email,
                    senior_management_approval_date: new Date().toISOString().split('T')[0],
                    senior_management_comments: comments || '',
                    status: 'approved',
                    current_approver_role: 'completed'
                };
                
                notificationMessage = `Congratulations! Your loan request for ${loanRequest.amount_requested} SAR has been fully approved by senior management.`;
            } else {
                updateData = {
                    senior_management_status: 'rejected',
                    senior_management_approved_by: user.email,
                    senior_management_approval_date: new Date().toISOString().split('T')[0],
                    senior_management_comments: comments || '',
                    status: 'rejected',
                    rejection_reason: comments || 'Rejected by senior management',
                    current_approver_role: 'completed'
                };
                
                notificationMessage = `Your loan request for ${loanRequest.amount_requested} SAR has been rejected by senior management.\nReason: ${comments || 'Not specified'}`;
            }
        }
        
        // Update the loan request
        await base44.asServiceRole.entities.LoanRequest.update(loanRequestId, updateData);
        
        // Send notification to employee
        if (employee.email) {
            await base44.integrations.Core.SendEmail({
                to: employee.email,
                subject: 'Loan Request Status Update',
                body: notificationMessage
            });
        }
        
        return Response.json({ 
            success: true, 
            message: 'Loan request processed successfully',
            updatedRequest: { ...loanRequest, ...updateData }
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});