import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import EmployeeDetailsTab from './EmployeeDetailsTab';
import DependentDetailsTab from './DependentDetailsTab';
import IDDetailsTab from './IDDetailsTab';
import SalaryDetailsTab from './SalaryDetailsTab';
import BankDetailsTab from './BankDetailsTab';
import InsuranceDetailsTab from './InsuranceDetailsTab';
import ShiftAssignmentTab from './ShiftAssignmentTab';
import LeaveBalanceTab from './LeaveBalanceTab';
import LoanBalanceTab from './LoanBalanceTab';
import BenefitsEnrollmentTab from './BenefitsEnrollmentTab';
import EOSBTab from './EOSBTab';
import SharedServiceTab from './SharedServiceTab';

export default function EmployeeFormTabs({ employee, shifts = [], companies = [], positions = [], employees = [], departments = [], onSubmit, onCancel, onSaveDraft }) {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState(employee || {
    employee_id: '',
    first_name: '',
    last_name: '',
    first_name_ar: '',
    last_name_ar: '',
    email: '',
    phone: '',
    nationality: '',
    date_of_birth: '',
    gender: 'male',
    marital_status: 'single',
    hire_date: '',
    company_id: '',
    position_id: '',
    job_title: '',
    department: '',
    employment_type: 'full_time',
    status: 'active',
    national_id: '',
    national_id_expiry: '',
    passport_number: '',
    passport_expiry: '',
    basic_salary: 0,
    housing_allowance: 0,
    transport_allowance: 0,
    bank_name: '',
    bank_account: '',
    iban: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    gosi_applicable: true,
    gosi_number: '',
    gosi_registration_date: '',
    gosi_salary_basis: 0
  });

  const [dependents, setDependents] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [shiftAssignments, setShiftAssignments] = useState([]);

  const tabs = [
    { value: 'details', label: 'Details', icon: '👤' },
    { value: 'dependents', label: 'Dependents', icon: '👨‍👩‍👧‍👦' },
    { value: 'ids', label: 'ID Docs', icon: '🆔' },
    { value: 'salary', label: 'Salary', icon: '💰' },
    { value: 'bank', label: 'Bank', icon: '🏦' },
    { value: 'insurance', label: 'Insurance', icon: '🛡️' },
    { value: 'shifts', label: 'Shifts', icon: '🕐' },
    { value: 'leave', label: 'Leave', icon: '📅', onlyEdit: true },
    { value: 'loans', label: 'Loans', icon: '💵', onlyEdit: true },
    { value: 'benefits', label: 'Benefits', icon: '🎁', onlyEdit: true },
    { value: 'eosb', label: 'EOSB', icon: '💼', onlyEdit: true },
    { value: 'shared-service', label: 'Shared Services', icon: '🏢', onlyEdit: true }
  ];

  const availableTabs = employee ? tabs : tabs.filter(t => !t.onlyEdit);
  const currentTabIndex = availableTabs.findIndex(t => t.value === activeTab);

  const handleNext = () => {
    if (currentTabIndex < availableTabs.length - 1) {
      setActiveTab(availableTabs[currentTabIndex + 1].value);
    }
  };

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setActiveTab(availableTabs[currentTabIndex - 1].value);
    }
  };

  const handleSubmit = () => {
    // Validate salary against position budget
    if (formData.position_id && formData.basic_salary) {
      const selectedPosition = positions.find(p => p.id === formData.position_id);
      
      if (selectedPosition) {
        const minSalary = parseFloat(selectedPosition.salary_range_min) || 0;
        const maxSalary = parseFloat(selectedPosition.salary_range_max) || 0;
        const basicSalary = parseFloat(formData.basic_salary);

        if (maxSalary > 0 && basicSalary > maxSalary) {
          toast.error(`❌ Cannot save! Salary ${basicSalary.toLocaleString()} SAR exceeds position budget. Maximum allowed: ${maxSalary.toLocaleString()} SAR`, {
            duration: 6000
          });
          return; // Block submission
        }

        if (minSalary > 0 && basicSalary < minSalary) {
          toast.error(`❌ Cannot save! Salary ${basicSalary.toLocaleString()} SAR is below position minimum. Minimum required: ${minSalary.toLocaleString()} SAR`, {
            duration: 6000
          });
          return; // Block submission
        }
      }
    }

    onSubmit({
      employee: formData,
      dependents,
      insurance,
      shiftAssignments
    });
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft({
        employee: formData,
        dependents,
        insurance,
        shiftAssignments
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full overflow-x-auto pb-2 -mx-2 px-2">
          <TabsList className="inline-flex h-auto bg-slate-100 p-1.5 rounded-lg">
            {availableTabs.map(tab => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs whitespace-nowrap px-2.5 py-1.5 rounded-md flex items-center gap-1"
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="details" className="mt-6">
          <EmployeeDetailsTab 
            formData={formData} 
            setFormData={setFormData}
            companies={companies}
            positions={positions}
            employees={employees}
            departments={departments}
          />
        </TabsContent>

        <TabsContent value="dependents" className="mt-6">
          <DependentDetailsTab 
            dependents={dependents}
            setDependents={setDependents}
          />
        </TabsContent>

        <TabsContent value="ids" className="mt-6">
          <IDDetailsTab 
            formData={formData} 
            setFormData={setFormData} 
          />
        </TabsContent>

        <TabsContent value="salary" className="mt-6">
          <SalaryDetailsTab 
            formData={formData} 
            setFormData={setFormData}
            selectedPosition={positions.find(p => p.id === formData.position_id)}
          />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <BankDetailsTab 
            formData={formData} 
            setFormData={setFormData} 
          />
        </TabsContent>

        <TabsContent value="insurance" className="mt-6">
          <InsuranceDetailsTab 
            insurance={insurance}
            setInsurance={setInsurance}
            dependents={dependents}
          />
        </TabsContent>

        <TabsContent value="shifts" className="mt-6">
          <ShiftAssignmentTab 
            shifts={shifts}
            currentAssignments={shiftAssignments}
            onAssignmentsChange={setShiftAssignments}
          />
        </TabsContent>

        {employee && (
          <>
            <TabsContent value="leave" className="mt-6">
              <LeaveBalanceTab employeeId={employee.id} />
            </TabsContent>

            <TabsContent value="loans" className="mt-6">
              <LoanBalanceTab employeeId={employee.id} />
            </TabsContent>

            <TabsContent value="benefits" className="mt-6">
              <BenefitsEnrollmentTab employeeId={employee.id} />
            </TabsContent>

            <TabsContent value="eosb" className="mt-6">
              <EOSBTab employeeId={employee.id} employee={employee} />
            </TabsContent>

            <TabsContent value="shared-service" className="mt-6">
              <SharedServiceTab employee={employee} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <div className="flex gap-3">
          {onSaveDraft && !employee && (
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Clock className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          )}

          {currentTabIndex > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentTabIndex < availableTabs.length - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Employee
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}