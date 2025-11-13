import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const AccessControlContext = createContext();

// Role to module mapping
const ROLE_MODULE_MAP = {
  super_admin: ['*'], // Access to everything
  employee_manager: ['Employees', 'OrgStructure', 'Departments'],
  time_manager: ['TimeManagement', 'Shifts', 'ClockInOut'],
  onboarding_specialist: ['Onboarding', 'Documents'],
  payroll_manager: ['PayrollManagement', 'GOSIReporting'],
  leave_manager: ['LeaveManagement', 'LeaveAccrualManagement'],
  travel_manager: ['TravelExpense'],
  asset_manager: ['Assets'],
  project_manager: ['Projects'],
  performance_manager: ['PerformanceManagement'],
  benefit_manager: ['Benefits'],
  document_manager: ['Documents'],
  gosi_specialist: ['GOSIReporting'],
  report_viewer: ['Dashboard']
};

export function AccessControlProvider({ children }) {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState(() => {
    return localStorage.getItem('selectedCompanyId') || 'all';
  });

  // Fetch current user
  const { data: baseUser, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-access'],
    queryFn: () => base44.auth.me()
  });

  // Fetch user's extended data from User entity
  const { data: userData, isLoading: loadingUserData } = useQuery({
    queryKey: ['user-data', baseUser?.email],
    queryFn: async () => {
      if (!baseUser?.email) return null;
      const users = await base44.entities.User.filter({ email: baseUser.email });
      return users[0] || null;
    },
    enabled: !!baseUser?.email
  });

  // Fetch employee record
  const { data: employee } = useQuery({
    queryKey: ['employee-record', baseUser?.email],
    queryFn: async () => {
      if (!baseUser?.email) return null;
      const employees = await base44.entities.Employee.filter({ email: baseUser.email });
      return employees[0] || null;
    },
    enabled: !!baseUser?.email
  });

  // Fetch accessible companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  // Determine user's accessible companies
  const accessibleCompanies = React.useMemo(() => {
    if (!baseUser) return [];
    
    if (baseUser.role === 'admin') {
      return companies; // Admin sees all
    }
    if (userData?.company_access && Array.isArray(userData.company_access) && userData.company_access.length > 0) {
      return companies.filter(c => userData.company_access.includes(c.id));
    }
    if (employee?.company_id) {
      return companies.filter(c => c.id === employee.company_id);
    }
    return [];
  }, [baseUser?.role, userData?.company_access, employee?.company_id, companies]);

  const changeSelectedCompany = useCallback((companyId) => {
    setSelectedCompanyIdState(companyId);
    localStorage.setItem('selectedCompanyId', companyId);
  }, []);

  // Check if user has access to a specific module
  const hasModuleAccess = useCallback((moduleName) => {
    // Admin has access to everything
    if (baseUser?.role === 'admin') return true;

    // Check custom_roles
    const userRoles = userData?.custom_roles || [];
    
    // Super admin role has access to everything
    if (userRoles.includes('super_admin')) return true;

    // Check each role for module access
    for (const role of userRoles) {
      const allowedModules = ROLE_MODULE_MAP[role] || [];
      if (allowedModules.includes('*') || allowedModules.includes(moduleName)) {
        return true;
      }
    }

    return false;
  }, [baseUser?.role, userData?.custom_roles]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permissionName) => {
    if (baseUser?.role === 'admin') return true;
    if (!userData?.permissions || typeof userData.permissions !== 'object') return false;
    return userData.permissions[permissionName] || false;
  }, [baseUser?.role, userData?.permissions]);

  // Check if user has a specific custom role
  const hasRole = useCallback((roleName) => {
    if (baseUser?.role === 'admin') return true;
    const userRoles = userData?.custom_roles || [];
    return Array.isArray(userRoles) && userRoles.includes(roleName);
  }, [baseUser?.role, userData?.custom_roles]);

  // Get accessible company IDs for filtering
  const getAccessibleCompanyIds = useCallback(() => {
    if (selectedCompanyId !== 'all') {
      return [selectedCompanyId];
    }
    if (baseUser?.role === 'admin') {
      return companies.map(c => c.id);
    }
    return accessibleCompanies.map(c => c.id);
  }, [selectedCompanyId, baseUser?.role, companies, accessibleCompanies]);

  const isAdmin = baseUser?.role === 'admin';
  const isSuperAdmin = baseUser?.role === 'admin' || (userData?.custom_roles && Array.isArray(userData.custom_roles) && userData.custom_roles.includes('super_admin'));

  const value = {
    baseUser,
    userData,
    employee,
    isLoading: loadingUser || loadingUserData,
    selectedCompanyId,
    changeSelectedCompany,
    accessibleCompanies,
    hasModuleAccess,
    hasPermission,
    hasRole,
    getAccessibleCompanyIds,
    isAdmin,
    isSuperAdmin
  };

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within AccessControlProvider');
  }
  return context;
}