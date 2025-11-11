import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Calendar, AlertTriangle, CheckCircle, TrendingDown, FileText } from "lucide-react";
import { calculateMonthlyPayroll } from './PayrollCalculationEngine';
import { toast } from "sonner";

export default function EnhancedPayrollProcessor({ 
  employees = [], 
  timeEntries = [],
  attendance = [],
  leaveRequests = [],
  onGeneratePayroll,
  selectedMonth 
}) {
  const [processing, setProcessing] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [deductionsConfig, setDeductionsConfig] = useState({});

  // Calculate payroll for selected employees with leave deductions
  const calculatedPayrolls = useMemo(() => {
    if (!selectedEmployees.length) return [];

    return selectedEmployees.map(empId => {
      const employee = employees.find(e => e.id === empId);
      if (!employee) return null;

      // Filter data for this employee and month
      const empTimeEntries = timeEntries.filter(t => 
        t.employee_id === empId && 
        t.date?.startsWith(selectedMonth)
      );

      const empAttendance = attendance.filter(a => 
        a.employee_id === empId &&
        a.date?.startsWith(selectedMonth)
      );

      // Filter APPROVED leaves for this employee and month
      const empLeaves = leaveRequests.filter(leave => {
        if (leave.employee_id !== empId) return false;
        if (leave.status !== 'approved') return false;
        
        // Check if leave overlaps with selected month
        const leaveStart = new Date(leave.start_date);
        const leaveEnd = new Date(leave.end_date);
        const monthStart = new Date(selectedMonth + '-01');
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        
        return (leaveStart <= monthEnd && leaveEnd >= monthStart);
      });

      const empDeductions = deductionsConfig[empId] || {};

      return calculateMonthlyPayroll(
        employee,
        empTimeEntries,
        empAttendance,
        empLeaves,  // Pass approved leaves for deduction calculation
        { ...empDeductions, working_days: 30 }
      );
    }).filter(Boolean);
  }, [selectedEmployees, employees, timeEntries, attendance, leaveRequests, deductionsConfig, selectedMonth]);

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(e => e.id));
    }
  };

  const handleToggleEmployee = (empId) => {
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
    }
  };

  const handleDeductionChange = (empId, field, value) => {
    setDeductionsConfig({
      ...deductionsConfig,
      [empId]: {
        ...deductionsConfig[empId],
        [field]: parseFloat(value) || 0
      }
    });
  };

  const handleProcessPayroll = async () => {
    if (calculatedPayrolls.length === 0) {
      toast.error('No employees selected');
      return;
    }

    setProcessing(true);
    try {
      await onGeneratePayroll(calculatedPayrolls, selectedMonth);
      toast.success(`Payroll processed for ${calculatedPayrolls.length} employees`);
      setSelectedEmployees([]);
      setDeductionsConfig({});
    } catch (error) {
      toast.error('Failed to process payroll: ' + error.message);
    }
    setProcessing(false);
  };

  const totalNetSalary = calculatedPayrolls.reduce((sum, p) => sum + (p?.net_salary || 0), 0);
  const totalGross = calculatedPayrolls.reduce((sum, p) => sum + (p?.gross_salary || 0), 0);
  const totalDeductions = calculatedPayrolls.reduce((sum, p) => sum + (p?.total_deductions || 0), 0);
  const totalLeaveDeductions = calculatedPayrolls.reduce((sum, p) => sum + (p?.absence_deduction || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Selected</p>
                <p className="text-3xl font-bold text-blue-600">{selectedEmployees.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Gross Salary</p>
                <p className="text-xl font-bold text-emerald-600">
                  {(totalGross / 1000).toFixed(1)}K
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Deductions</p>
                <p className="text-xl font-bold text-red-600">
                  {(totalDeductions / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Net Payable</p>
                <p className="text-xl font-bold text-purple-600">
                  {(totalNetSalary / 1000).toFixed(1)}K
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Deductions Alert */}
      {totalLeaveDeductions > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <strong>Unpaid leave deductions:</strong> {totalLeaveDeductions.toFixed(2)} SAR across selected employees
          </AlertDescription>
        </Alert>
      )}

      {/* Employee Selection and Details */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Processing - {selectedMonth}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={handleProcessPayroll}
                disabled={processing || calculatedPayrolls.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                {processing ? 'Processing...' : `Process ${calculatedPayrolls.length} Payrolls`}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No employees found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => {
                const isSelected = selectedEmployees.includes(employee.id);
                const calculation = calculatedPayrolls.find(p => p.employee_id === employee.id);
                const hasUnpaidLeave = calculation && calculation.absence_deduction > 0;

                return (
                  <Card
                    key={employee.id}
                    className={`border transition-all cursor-pointer ${
                      isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                    }`}
                    onClick={() => handleToggleEmployee(employee.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEmployee(employee.id)}
                          className="w-4 h-4 text-emerald-600"
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {employee.first_name} {employee.last_name}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {employee.job_title} • {employee.department}
                              </p>
                            </div>
                            {hasUnpaidLeave && (
                              <Badge className="bg-amber-100 text-amber-700">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Unpaid Leave
                              </Badge>
                            )}
                          </div>

                          {isSelected && calculation && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                <div>
                                  <p className="text-slate-500">Basic Salary</p>
                                  <p className="font-semibold">{calculation.basic_salary.toLocaleString()} SAR</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Gross</p>
                                  <p className="font-semibold text-emerald-600">
                                    {calculation.gross_salary.toLocaleString()} SAR
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Deductions</p>
                                  <p className="font-semibold text-red-600">
                                    -{calculation.total_deductions.toLocaleString()} SAR
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Net Salary</p>
                                  <p className="font-semibold text-purple-600">
                                    {calculation.net_salary.toLocaleString()} SAR
                                  </p>
                                </div>
                              </div>

                              {/* Breakdown */}
                              <div className="grid md:grid-cols-3 gap-3 text-xs">
                                {calculation.overtime_pay > 0 && (
                                  <div className="bg-emerald-50 p-2 rounded">
                                    <p className="text-slate-600">Overtime</p>
                                    <p className="font-semibold text-emerald-700">
                                      +{calculation.overtime_pay.toLocaleString()} SAR
                                    </p>
                                  </div>
                                )}
                                {calculation.gosi_employee > 0 && (
                                  <div className="bg-amber-50 p-2 rounded">
                                    <p className="text-slate-600">GOSI (Employee)</p>
                                    <p className="font-semibold text-amber-700">
                                      -{calculation.gosi_employee.toLocaleString()} SAR
                                    </p>
                                  </div>
                                )}
                                {calculation.absence_deduction > 0 && (
                                  <div className="bg-red-50 p-2 rounded">
                                    <p className="text-slate-600">Leave/Absence</p>
                                    <p className="font-semibold text-red-700">
                                      -{calculation.absence_deduction.toLocaleString()} SAR
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Additional Deductions Input */}
                              <div className="mt-3 grid md:grid-cols-3 gap-3" onClick={(e) => e.stopPropagation()}>
                                <div>
                                  <Label className="text-xs">Loan Deduction</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={deductionsConfig[employee.id]?.loan_deduction || ''}
                                    onChange={(e) => handleDeductionChange(employee.id, 'loan_deduction', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Advance Deduction</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={deductionsConfig[employee.id]?.advance_deduction || ''}
                                    onChange={(e) => handleDeductionChange(employee.id, 'advance_deduction', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Other Deductions</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={deductionsConfig[employee.id]?.other_deductions || ''}
                                    onChange={(e) => handleDeductionChange(employee.id, 'other_deductions', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}