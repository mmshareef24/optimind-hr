import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Get loan requests based on user role and access permissions
 * - Admin/HR: Can see all requests or filtered by company/department
 * - Manager: Can see only direct reports' requests
 * - Employee: Can see only their own requests
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filters = {} } = await req.json().catch(() => ({}));
        
        // Get all employees and loan requests
        const allEmployees = await base44.asServiceRole.entities.Employee.list();
        const allLoanRequests = await base44.asServiceRole.entities.LoanRequest.list('-created_date');
        
        // Get the current user's employee record
        const currentEmployee = allEmployees.find(e => e.id === user.employee_id || e.email === user.email);
        
        let accessibleRequests = [];
        
        // ADMIN/HR USERS
        if (user.role === 'admin') {
            accessibleRequests = allLoanRequests;
            
            // Apply company/department restrictions if user has limited access
            if (user.company_access && user.company_access.length > 0) {
                const accessibleEmployeeIds = allEmployees
                    .filter(emp => user.company_access.includes(emp.company_id))
                    .map(emp => emp.id);
                accessibleRequests = accessibleRequests.filter(req => 
                    accessibleEmployeeIds.includes(req.employee_id)
                );
            } else if (user.department_access && user.department_access.length > 0) {
                const accessibleEmployeeIds = allEmployees
                    .filter(emp => user.department_access.includes(emp.department))
                    .map(emp => emp.id);
                accessibleRequests = accessibleRequests.filter(req => 
                    accessibleEmployeeIds.includes(req.employee_id)
                );
            }
        }
        // MANAGER USERS - See direct reports' requests
        else if (currentEmployee && currentEmployee.id) {
            const directReportIds = allEmployees
                .filter(emp => emp.manager_id === currentEmployee.id)
                .map(emp => emp.id);
            
            // Include manager's own requests and their direct reports' requests
            accessibleRequests = allLoanRequests.filter(req => 
                req.employee_id === currentEmployee.id || directReportIds.includes(req.employee_id)
            );
        }
        // REGULAR EMPLOYEE - See only their own requests
        else if (currentEmployee) {
            accessibleRequests = allLoanRequests.filter(req => 
                req.employee_id === currentEmployee.id
            );
        } else {
            return Response.json({ error: 'Employee record not found for this user' }, { status: 404 });
        }
        
        // Apply additional filters
        if (filters.status) {
            accessibleRequests = accessibleRequests.filter(r => r.status === filters.status);
        }
        if (filters.loan_type) {
            accessibleRequests = accessibleRequests.filter(r => r.loan_type === filters.loan_type);
        }
        if (filters.employee_id) {
            accessibleRequests = accessibleRequests.filter(r => r.employee_id === filters.employee_id);
        }
        if (filters.current_approver_role) {
            accessibleRequests = accessibleRequests.filter(r => r.current_approver_role === filters.current_approver_role);
        }
        
        // Enrich with employee details
        const enrichedRequests = accessibleRequests.map(req => {
            const employee = allEmployees.find(e => e.id === req.employee_id);
            return {
                ...req,
                employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
                employee_email: employee?.email,
                employee_department: employee?.department,
                employee_company: employee?.company_id
            };
        });
        
        return Response.json({ 
            success: true,
            loan_requests: enrichedRequests,
            total: enrichedRequests.length,
            access_level: user.role === 'admin' ? 'admin' : (currentEmployee?.id ? 'manager' : 'employee')
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});