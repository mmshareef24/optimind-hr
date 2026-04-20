import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin has full access
    if (user.role === 'admin') {
      const companies = await base44.entities.Company.filter({ status: 'active' });
      return Response.json({
        userType: 'admin',
        accessibleCompanyIds: companies.map(c => c.id),
        permissions: ['*'],
        isAdmin: true
      });
    }

    // Get user's role assignments
    const userRoles = await base44.entities.UserRole.filter({ 
      user_email: user.email, 
      status: 'active' 
    });

    if (userRoles.length === 0) {
      // No roles assigned - default to ESS with employee's own company
      const employee = await base44.entities.Employee.filter({ email: user.email });
      const companyIds = employee.length > 0 && employee[0].company_id 
        ? [employee[0].company_id] 
        : [];
      
      return Response.json({
        userType: 'ess',
        accessibleCompanyIds: companyIds,
        permissions: [],
        isAdmin: false,
        employeeId: employee.length > 0 ? employee[0].id : null
      });
    }

    // Get unique company IDs from user roles
    const accessibleCompanyIds = [...new Set(userRoles.map(ur => ur.company_id).filter(Boolean))];

    // Get role details
    const roleIds = [...new Set(userRoles.map(ur => ur.role_id))];
    const roles = await base44.entities.Role.filter({ status: 'active' });
    const assignedRoles = roles.filter(r => roleIds.includes(r.id));

    // Collect all permissions
    const permissions = assignedRoles.flatMap(r => r.permissions || []);

    // Determine user type
    const roleCodes = assignedRoles.map(r => r.role_code);
    let userType = 'ess';
    if (roleCodes.includes('mss') || roleCodes.includes('manager')) {
      userType = 'mss';
    } else if (roleCodes.some(code => !['ess', 'employee'].includes(code))) {
      userType = 'limited';
    }

    // Get employee record if exists
    const employee = await base44.entities.Employee.filter({ email: user.email });

    return Response.json({
      userType,
      accessibleCompanyIds,
      permissions,
      isAdmin: false,
      employeeId: employee.length > 0 ? employee[0].id : null,
      roles: assignedRoles.map(r => ({ id: r.id, code: r.role_code, name: r.role_name })),
      userRoles: userRoles.map(ur => ({
        roleId: ur.role_id,
        companyId: ur.company_id
      }))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});