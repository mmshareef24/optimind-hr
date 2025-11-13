import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const AccessControlContext = createContext();

// Role to module mapping
const ROLE_MODULE_MAP = {
  super_admin: ['*'],
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

  const { data: baseUser, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-access'],
    queryFn: () => base44.auth.me()
  });

  const { data: userData, isLoading: loadingUserData } = useQuery({
    queryKey: ['user-data', baseUser?.email],
    queryFn: async () => {
      if (!baseUser?.email) return null;
      const users = await base44.entities.User.filter({ email: baseUser.email });
      return users[0] || null;
    },
    enabled: !!baseUser?.email
  });

  const { data: employee } = useQuery({
    queryKey: ['employee-record', baseUser?.email],
    queryFn: async () => {
      if (!baseUser?.email) return null;
      const employees = await base44.entities.Employee.filter({ email: baseUser.email });
      return employees[0] || null;
    },
    enabled: !!baseUser?.email
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const isAdmin = baseUser?.role === 'admin';
  const customRoles = userData?.custom_roles || [];
  const companyAccess = userData?.company_access || [];

  const accessibleCompanies = useMemo(() => {
    if (!baseUser) return [];
    
    if (isAdmin) {
      return companies;
    }
    if (Array.isArray(companyAccess) && companyAccess.length > 0) {
      return companies.filter(c => companyAccess.includes(c.id));
    }
    if (employee?.company_id) {
      return companies.filter(c => c.id === employee.company_id);
    }
    return [];
  }, [baseUser, isAdmin, companyAccess, employee?.company_id, companies]);

  const changeSelectedCompany = useCallback((companyId) => {
    setSelectedCompanyIdState(companyId);
    localStorage.setItem('selectedCompanyId', companyId);
  }, []);

  const hasModuleAccess = useCallback((moduleName) => {
    if (isAdmin) return true;
    if (customRoles.includes('super_admin')) return true;

    for (const role of customRoles) {
      const allowedModules = ROLE_MODULE_MAP[role] || [];
      if (allowedModules.includes('*') || allowedModules.includes(moduleName)) {
        return true;
      }
    }
    return false;
  }, [isAdmin, customRoles]);

  const hasPermission = useCallback((permissionName) => {
    if (isAdmin) return true;
    if (!userData?.permissions || typeof userData.permissions !== 'object') return false;
    return userData.permissions[permissionName] || false;
  }, [isAdmin, userData?.permissions]);

  const hasRole = useCallback((roleName) => {
    if (isAdmin) return true;
    return Array.isArray(customRoles) && customRoles.includes(roleName);
  }, [isAdmin, customRoles]);

  const getAccessibleCompanyIds = useCallback(() => {
    if (selectedCompanyId !== 'all') {
      return [selectedCompanyId];
    }
    if (isAdmin) {
      return companies.map(c => c.id);
    }
    return accessibleCompanies.map(c => c.id);
  }, [selectedCompanyId, isAdmin, companies, accessibleCompanies]);

  const isSuperAdmin = isAdmin || customRoles.includes('super_admin');

  const value = useMemo(() => ({
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
  }), [
    baseUser,
    userData,
    employee,
    loadingUser,
    loadingUserData,
    selectedCompanyId,
    changeSelectedCompany,
    accessibleCompanies,
    hasModuleAccess,
    hasPermission,
    hasRole,
    getAccessibleCompanyIds,
    isAdmin,
    isSuperAdmin
  ]);

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