import React from 'react';

/**
 * GOSI Calculation as per Saudi Arabia regulations (2024)
 * 
 * For Saudi Nationals:
 * - Employee contribution: 10% (Annuities Branch only)
 * - Employer contribution: 12% (9% Annuities + 2% Hazards + 1% SANED)
 * 
 * For Non-Saudi (Expats):
 * - Employee contribution: 0%
 * - Employer contribution: 2% (Occupational Hazards only)
 * 
 * GOSI Calculation Base: Basic Salary + Housing Allowance (capped at 45,000 SAR)
 */

export const calculateGOSI = (employee, salaryComponents) => {
  const { basic_salary = 0, housing_allowance = 0 } = salaryComponents;
  const isSaudi = employee?.nationality?.toLowerCase() === 'saudi' || 
                  employee?.nationality?.toLowerCase() === 'saudi arabia' ||
                  employee?.nationality?.toLowerCase() === 'ksa';

  // GOSI base = Basic + Housing (capped at 45,000 SAR)
  let gosiBase = basic_salary + housing_allowance;
  const GOSI_CAP = 45000;
  
  if (gosiBase > GOSI_CAP) {
    gosiBase = GOSI_CAP;
  }

  let employeeShare = 0;
  let employerShare = 0;

  if (isSaudi) {
    // Saudi National
    employeeShare = gosiBase * 0.10; // 10% employee
    employerShare = gosiBase * 0.12; // 12% employer (9% + 2% + 1%)
  } else {
    // Non-Saudi (Expat)
    employeeShare = 0; // No employee contribution
    employerShare = gosiBase * 0.02; // 2% employer (Occupational Hazards only)
  }

  return {
    gosiBase: parseFloat(gosiBase.toFixed(2)),
    employeeShare: parseFloat(employeeShare.toFixed(2)),
    employerShare: parseFloat(employerShare.toFixed(2)),
    totalGOSI: parseFloat((employeeShare + employerShare).toFixed(2)),
    isSaudi
  };
};

export default function GOSICalculator({ employee, salaryComponents, onCalculate }) {
  const gosiDetails = calculateGOSI(employee, salaryComponents);

  React.useEffect(() => {
    if (onCalculate) {
      onCalculate(gosiDetails);
    }
  }, [employee, salaryComponents]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">GOSI</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">GOSI Calculation</h3>
          <p className="text-xs text-slate-500">
            {gosiDetails.isSaudi ? 'Saudi National' : 'Non-Saudi Expatriate'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-blue-100">
          <span className="text-sm text-slate-600">Calculation Base</span>
          <span className="font-semibold text-slate-900">{gosiDetails.gosiBase.toLocaleString()} SAR</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-blue-100">
          <span className="text-sm text-slate-600">Employee Share ({gosiDetails.isSaudi ? '10%' : '0%'})</span>
          <span className="font-semibold text-red-600">-{gosiDetails.employeeShare.toLocaleString()} SAR</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-blue-100">
          <span className="text-sm text-slate-600">Employer Share ({gosiDetails.isSaudi ? '12%' : '2%'})</span>
          <span className="font-semibold text-blue-600">{gosiDetails.employerShare.toLocaleString()} SAR</span>
        </div>
        
        <div className="flex justify-between items-center py-3 bg-white rounded-lg px-3 mt-4">
          <span className="font-semibold text-slate-900">Total GOSI Contribution</span>
          <span className="font-bold text-lg text-indigo-600">{gosiDetails.totalGOSI.toLocaleString()} SAR</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Note:</strong> GOSI base is calculated on Basic Salary + Housing Allowance, 
          capped at 45,000 SAR as per Saudi GOSI regulations.
        </p>
      </div>
    </div>
  );
}