import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const PermissionContext = createContext();

// Module structure definition
export const MODULE_STRUCTURE = {
  organization: {
    label: 'Organization',
    subModules: {
      companies: { label: 'Companies', tabs: ['list', 'details'] },
      org_structure: { label: 'Org Structure', tabs: ['chart', 'positions'] },
      departments: { label: 'Departments', tabs: ['list', 'details'] }
    }
  },
  employees: {
    label: 'Personal Administration',
    subModules: {
      employee_management: { label: 'Employee Management', tabs: ['list', 'details', 'documents'] },
      recruitment: { label: 'Recruitment', tabs: ['requisitions', 'candidates', 'interviews'] },
      onboarding: { label: 'Onboarding', tabs: ['new_hires', 'checklists', 'tasks'] },
      offboarding: { label: 'Offboarding', tabs: ['processes', 'clearances', 'tasks'] },
      documents: { label: 'Documents', tabs: ['all', 'company', 'employee'] }
    }
  },
  time_attendance: {
    label: 'Time & Attendance',
    subModules: {
      time_management: { label: 'Time Management', tabs: ['attendance', 'timesheets'] },
      shift_management: { label: 'Shift Management', tabs: ['shifts', 'assignments'] },
      leave_management: { label: 'Leave Management', tabs: ['requests', 'approvals', 'calendar', 'policies'] },
      leave_accrual: { label: 'Leave Accrual', tabs: ['policies', 'history'] }
    }
  },
  compensation: {
    label: 'Payroll & Compensation',
    subModules: {
      payroll: { label: 'Payroll Management', tabs: ['process', 'records', 'reports'] },
      gosi: { label: 'GOSI Reporting', tabs: ['reports', 'history'] },
      benefits: { label: 'Benefits & Rewards', tabs: ['benefits', 'enrollments'] },
      eosb: { label: 'EOSB Management', tabs: ['calculator', 'records'] },
      budget: { label: 'Budget Management', tabs: ['overview', 'forecasting', 'allocations'] }
    }
  },
  compliance: {
    label: 'Integration & Compliance',
    subModules: {
      qiwa: { label: 'QIWA Platform', tabs: ['registration', 'employees', 'sync'] },
      sinad: { label: 'SINAD System', tabs: ['wage_file', 'submissions', 'compliance'] }
    }
  },
  performance: {
    label: 'Performance & Projects',
    subModules: {
      performance_management: { label: 'Performance', tabs: ['goals', 'reviews'] },
      projects: { label: 'Project Management', tabs: ['projects', 'tasks', 'milestones'] },
      training: { label: 'Training', tabs: ['programs', 'sessions', 'enrollments'] }
    }
  },
  employee_services: {
    label: 'Employee Services',
    subModules: {
      ess: { label: 'ESS Portal', tabs: ['profile', 'requests', 'payslips'] },
      mss: { label: 'Manager Portal', tabs: ['team', 'approvals', 'performance'] },
      approvals: { label: 'Approvals', tabs: ['leave', 'travel', 'loans'] },
      travel_expense: { label: 'Travel & Expense', tabs: ['travel', 'expenses'] }
    }
  },
  resources: {
    label: 'Resources',
    subModules: {
      assets: { label: 'Assets & Facilities', tabs: ['assets', 'assignments', 'maintenance'] },
      health_safety: { label: 'Health & Safety', tabs: ['incidents', 'protocols'] },
      employee_relations: { label: 'Employee Relations', tabs: ['grievances', 'communications'] }
    }
  },
  administration: {
    label: 'Administration',
    subModules: {
      user_management: { label: 'User Management', tabs: ['users', 'roles', 'permissions'] },
      master_data: { label: 'Master Data', tabs: ['upload', 'export'] },
      public_holidays: { label: 'Public Holidays', tabs: ['list'] },
      change_log: { label: 'Change Log', tabs: ['logs'] }
    }
  }
};

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

export function PermissionProvider({ children }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [accessibleCompanyIds, setAccessibleCompanyIds] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles', user?.email],
    queryFn: () => base44.entities.UserRole.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.filter({ status: 'active' })
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.filter({ status: 'active' })
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      // Admin has all permissions and access to all companies
      setPermissions(['*']);
      setAccessibleCompanyIds(companies.map(c => c.id));
      if (!selectedCompanyId && companies.length > 0) {
        setSelectedCompanyId(companies[0].id);
      }
      return;
    }

    // Get unique company IDs from user's roles
    const companyIds = [...new Set(userRoles.map(ur => ur.company_id).filter(Boolean))];
    setAccessibleCompanyIds(companyIds);

    // Set default selected company if not already set
    if (!selectedCompanyId && companyIds.length > 0) {
      setSelectedCompanyId(companyIds[0]);
    }

    // Collect permissions from assigned roles (filtered by selected company if applicable)
    const relevantUserRoles = selectedCompanyId 
      ? userRoles.filter(ur => ur.company_id === selectedCompanyId)
      : userRoles;
    
    const userRoleIds = relevantUserRoles.map(ur => ur.role_id);
    const assignedRoles = roles.filter(r => userRoleIds.includes(r.id));
    const allPermissions = assignedRoles.flatMap(r => r.permissions || []);
    setPermissions(allPermissions);
  }, [user, userRoles, roles, companies, selectedCompanyId]);

  const hasPermission = (module, subModule, tab = null, action = 'view') => {
    // Admin bypass
    if (permissions.includes('*')) return true;
    
    // Check for matching permission
    return permissions.some(p => {
      const moduleMatch = p.module === module || p.module === '*';
      const subModuleMatch = !subModule || p.sub_module === subModule || p.sub_module === '*';
      const tabMatch = !tab || !p.tab || p.tab === tab || p.tab === '*';
      const actionMatch = !p.actions || p.actions.includes(action) || p.actions.includes('*');
      
      return moduleMatch && subModuleMatch && tabMatch && actionMatch;
    });
  };

  const hasModuleAccess = (module) => {
    if (permissions.includes('*')) return true;
    return permissions.some(p => p.module === module || p.module === '*');
  };

  const hasSubModuleAccess = (module, subModule) => {
    if (permissions.includes('*')) return true;
    return permissions.some(p => 
      (p.module === module || p.module === '*') && 
      (p.sub_module === subModule || p.sub_module === '*')
    );
  };

  const hasCompanyAccess = (companyId) => {
    if (permissions.includes('*')) return true;
    return accessibleCompanyIds.includes(companyId);
  };

  const getAccessibleCompanies = () => {
    return companies.filter(c => accessibleCompanyIds.includes(c.id));
  };

  // Get user type based on roles
  const getUserType = () => {
    if (user?.role === 'admin') return 'admin';
    
    const roleIds = userRoles.map(ur => ur.role_id);
    const assignedRoleCodes = roles.filter(r => roleIds.includes(r.id)).map(r => r.role_code);
    
    if (assignedRoleCodes.includes('mss') || assignedRoleCodes.includes('manager')) return 'mss';
    if (assignedRoleCodes.includes('ess') || assignedRoleCodes.includes('employee')) return 'ess';
    if (assignedRoleCodes.length > 0) return 'limited';
    
    return 'ess'; // Default to ESS
  };

  return (
    <PermissionContext.Provider value={{ 
      permissions, 
      hasPermission, 
      hasModuleAccess, 
      hasSubModuleAccess,
      hasCompanyAccess,
      getAccessibleCompanies,
      isAdmin: permissions.includes('*'),
      user,
      userType: getUserType(),
      selectedCompanyId,
      setSelectedCompanyId,
      accessibleCompanyIds
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
}