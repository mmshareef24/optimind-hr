import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, CheckCircle, AlertCircle, TrendingUp, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PayrollProcessor({ 
  month, 
  employees, 
  timesheets, 
  leaves, 
  existingPayrolls,
  onCalculate,
  processing 
}) {
  const [calculationResults, setCalculationResults] = useState(null);

  const calculatePayrollForEmployee = (employee) => {
    // Get employee's timesheet for the month
    const timesheet = timesheets.find(t => 
      t.employee_id === employee.id && 
      t.period_start.startsWith(month)
    );

    // Get employee's approved leaves for the month
    const monthLeaves = leaves.filter(l => 
      l.employee_id === employee.id && 
      l.status === 'approved' &&
      (l.start_date.startsWith(month) || l.end_date.startsWith(month))
    );

    // Calculate base salary components
    const basicSalary = employee.basic_salary || 0;
    const housingAllowance = employee.housing_allowance || 0;
    const transportAllowance = employee.transport_allowance || 0;

    // Calculate overtime pay (if any)
    const overtimeHours = timesheet?.overtime_hours || 0;
    const hourlyRate = basicSalary / 240; // Assuming 240 working hours per month
    const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x for overtime

    // Calculate gross salary
    const grossSalary = basicSalary + housingAllowance + transportAllowance + overtimePay;

    // Calculate GOSI contributions (Saudi labor law)
    const gosiCalculationBase = Math.min(basicSalary + housingAllowance, 45000); // GOSI cap
    let gosiEmployee = 0;
    let gosiEmployer = 0;

    if (employee.gosi_applicable) {
      if (employee.nationality === 'Saudi Arabia' || employee.nationality === 'Saudi') {
        // Saudi nationals: 10% employee + 12% employer
        gosiEmployee = gosiCalculationBase * 0.10;
        gosiEmployer = gosiCalculationBase * 0.12;
      } else {
        // Non-Saudis: 2% employer only (occupational hazards)
        gosiEmployee = 0;
        gosiEmployer = gosiCalculationBase * 0.02;
      }
    }

    // Calculate deductions for unpaid leaves
    const unpaidLeaveDays = monthLeaves
      .filter(l => l.leave_type === 'unpaid')
      .reduce((sum, l) => sum + (l.total_days || 0), 0);
    const dailyRate = basicSalary / 30;
    const absenceDeduction = unpaidLeaveDays * dailyRate;

    // Total deductions
    const totalDeductions = gosiEmployee + absenceDeduction;

    // Net salary
    const netSalary = grossSalary - totalDeductions;

    return {
      employee_id: employee.id,
      month: month,
      basic_salary: basicSalary,
      housing_allowance: housingAllowance,
      transport_allowance: transportAllowance,
      overtime_pay: parseFloat(overtimePay.toFixed(2)),
      gross_salary: parseFloat(grossSalary.toFixed(2)),
      gosi_employee: parseFloat(gosiEmployee.toFixed(2)),
      gosi_employer: parseFloat(gosiEmployer.toFixed(2)),
      gosi_calculation_base: gosiCalculationBase,
      absence_deduction: parseFloat(absenceDeduction.toFixed(2)),
      total_deductions: parseFloat(totalDeductions.toFixed(2)),
      net_salary: parseFloat(netSalary.toFixed(2)),
      working_days: 30,
      present_days: timesheet?.days_present || 30,
      absent_days: unpaidLeaveDays,
      overtime_hours: overtimeHours,
      status: 'calculated'
    };
  };

  const handleCalculateAll = () => {
    const results = employees.map(emp => {
      // Skip if payroll already exists for this month
      const existing = existingPayrolls.find(p => 
        p.employee_id === emp.id && p.month === month
      );
      
      if (existing) {
        return { ...existing, status: 'existing' };
      }

      return calculatePayrollForEmployee(emp);
    });

    setCalculationResults(results);
  };

  const handleProcessPayroll = () => {
    if (calculationResults) {
      const newPayrolls = calculationResults.filter(r => r.status === 'calculated');
      onCalculate(newPayrolls);
    }
  };

  const newPayrolls = calculationResults?.filter(r => r.status === 'calculated') || [];
  const existingCount = calculationResults?.filter(r => r.status === 'existing').length || 0;
  const totalGross = newPayrolls.reduce((sum, p) => sum + p.gross_salary, 0);
  const totalNet = newPayrolls.reduce((sum, p) => sum + p.net_salary, 0);
  const totalGOSI = newPayrolls.reduce((sum, p) => sum + p.gosi_employee + p.gosi_employer, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Payroll Processing</h3>
                <p className="text-sm text-slate-600">
                  Process payroll for {month} • {employees.length} employees
                </p>
              </div>
            </div>
            {!calculationResults && (
              <Button
                onClick={handleCalculateAll}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={processing}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Payroll
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calculation Results */}
      {calculationResults && (
        <>
          {/* Summary Statistics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Employees to Process</p>
                    <p className="text-2xl font-bold text-blue-700">{newPayrolls.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 mb-1">Total Gross Salary</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {totalGross.toLocaleString()} SAR
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Total Net Salary</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {totalNet.toLocaleString()} SAR
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600 mb-1">Total GOSI</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {totalGOSI.toLocaleString()} SAR
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {existingCount > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                {existingCount} employee(s) already have payroll for {month} and will be skipped.
              </AlertDescription>
            </Alert>
          )}

          {newPayrolls.length === 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                All employees already have payroll processed for {month}.
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Results */}
          {newPayrolls.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b">
                <CardTitle>Payroll Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Employee</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Basic</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Allowances</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Overtime</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Gross</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">GOSI</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Deductions</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newPayrolls.map((payroll, idx) => {
                        const employee = employees.find(e => e.id === payroll.employee_id);
                        return (
                          <tr key={idx} className="border-b hover:bg-slate-50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {employee?.first_name} {employee?.last_name}
                                </p>
                                <p className="text-xs text-slate-500">{employee?.employee_id}</p>
                              </div>
                            </td>
                            <td className="text-right p-4 text-sm">
                              {payroll.basic_salary.toLocaleString()}
                            </td>
                            <td className="text-right p-4 text-sm">
                              {(payroll.housing_allowance + payroll.transport_allowance).toLocaleString()}
                            </td>
                            <td className="text-right p-4 text-sm text-blue-600">
                              {payroll.overtime_pay > 0 ? `+${payroll.overtime_pay.toLocaleString()}` : '-'}
                            </td>
                            <td className="text-right p-4 text-sm font-semibold">
                              {payroll.gross_salary.toLocaleString()}
                            </td>
                            <td className="text-right p-4 text-sm text-red-600">
                              -{(payroll.gosi_employee + payroll.gosi_employer).toLocaleString()}
                            </td>
                            <td className="text-right p-4 text-sm text-red-600">
                              -{payroll.total_deductions.toLocaleString()}
                            </td>
                            <td className="text-right p-4 text-sm font-bold text-emerald-600">
                              {payroll.net_salary.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2">
                      <tr>
                        <td className="p-4 font-bold text-slate-900" colSpan="4">TOTAL</td>
                        <td className="text-right p-4 font-bold text-slate-900">
                          {totalGross.toLocaleString()}
                        </td>
                        <td className="text-right p-4 font-bold text-red-600">
                          -{totalGOSI.toLocaleString()}
                        </td>
                        <td className="text-right p-4 font-bold text-red-600">
                          -{newPayrolls.reduce((sum, p) => sum + p.total_deductions, 0).toLocaleString()}
                        </td>
                        <td className="text-right p-4 font-bold text-emerald-600">
                          {totalNet.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {newPayrolls.length > 0 && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCalculationResults(null)}
              >
                Recalculate
              </Button>
              <Button
                onClick={handleProcessPayroll}
                disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Process Payroll ({newPayrolls.length} employees)
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}