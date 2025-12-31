import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Get employees based on user role and access permissions
 * - Admin/HR: Can see all employees or filtered by company/department access
 * - Manager: Can see only direct reports
 * - Employee: Can see only themselves
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filters = {} } = await req.json().catch(() => ({}));
        
        // Get all employees (we'll filter based on access)
        const allEmployees = await base44.asServiceRole.entities.Employee.list();
        
        // Get the current user's employee record
        const currentEmployee = allEmployees.find(e => e.id === user.employee_id || e.email === user.email);
        
        let accessibleEmployees = [];
        
        // ADMIN/HR USERS - Full or scoped access
        if (user.role === 'admin') {
            // If user has specific company/department access restrictions
            if (user.company_access?.length > 0) {
                accessibleEmployees = allEmployees.filter(emp => 
                    user.company_access.includes(emp.company_id)
                );
            } else if (user.department_access?.length > 0) {
                accessibleEmployees = allEmployees.filter(emp => 
                    user.department_access.includes(emp.department)
                );
            } else {
                // Full access to all employees
                accessibleEmployees = allEmployees;
            }
        }
        // MANAGER USERS - See direct reports only
        else if (currentEmployee && currentEmployee.id) {
            // Find all employees who report to this manager
            const directReports = allEmployees.filter(emp => 
                emp.manager_id === currentEmployee.id
            );
            
            // Include the manager themselves
            accessibleEmployees = [currentEmployee, ...directReports];
        }
        // REGULAR EMPLOYEE - See only themselves
        else if (currentEmployee) {
            accessibleEmployees = [currentEmployee];
        } else {
            return Response.json({ error: 'Employee record not found for this user' }, { status: 404 });
        }
        
        // Apply additional filters if provided
        if (filters.status) {
            accessibleEmployees = accessibleEmployees.filter(e => e.status === filters.status);
        }
        if (filters.department) {
            accessibleEmployees = accessibleEmployees.filter(e => e.department === filters.department);
        }
        if (filters.company_id) {
            accessibleEmployees = accessibleEmployees.filter(e => e.company_id === filters.company_id);
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            accessibleEmployees = accessibleEmployees.filter(e => 
                (e.first_name?.toLowerCase().includes(searchLower)) ||
                (e.last_name?.toLowerCase().includes(searchLower)) ||
                (e.employee_id?.toLowerCase().includes(searchLower)) ||
                (e.email?.toLowerCase().includes(searchLower))
            );
        }

        // Calculate access level properly
        let accessLevel = 'employee';
        if (user.role === 'admin') {
            accessLevel = 'admin';
        } else if (currentEmployee && currentEmployee.id && allEmployees.some(emp => emp.manager_id === currentEmployee.id)) {
            accessLevel = 'manager';
        }
        
        return Response.json({ 
            success: true,
            employees: accessibleEmployees,
            total: accessibleEmployees.length,
            access_level: accessLevel,
            current_employee_id: currentEmployee?.id
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});