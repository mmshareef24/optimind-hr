import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Calculator, TrendingUp, DollarSign, Shield, Users, Calendar,
  CheckCircle2, AlertTriangle, Search, Filter
} from "lucide-react";
import { calculateMonthlyPayroll, validatePayrollCalculation } from './PayrollCalculationEngine';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EnhancedPayrollProcessor({
  employees = [],
  timeEntries = [],
  attendance = [],
  leaves = [],
  existingPayrolls = [],
  onProcessPayroll
}) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [calculatedPayrolls, setCalculatedPayrolls] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesDept = selectedDepartment === 'all' || emp.department === selectedDepartment;
    const matchesSearch = 
      emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.includes(searchTerm);
    
    // Check if already processed
    const alreadyProcessed = existingPayrolls.some(p => 
      p.employee_id === emp.id && p.month === selectedMonth && p.status !== 'draft'
    );

    return matchesDept && matchesSearch && !alreadyProcessed && emp.status === 'active';
  });

  const handleCalculateAll = () => {
    setProcessing(true);

    const calculations = filteredEmployees.map(employee => {
      // Filter time entries for this employee and month
      const empTimeEntries = timeEntries.filter(te => 
        te.employee_id === employee.id &&
        te.date.startsWith(selectedMonth) &&
        te.status === 'approved'
      );

      // Filter attendance for this employee and month
      const empAttendance = attendance.filter(att =>
        att.employee_id === employee.id &&
        att.date.startsWith(selectedMonth)
      );

      // Filter leaves for this employee and month
      const empLeaves = leaves.filter(leave =>
        leave.employee_id === employee.id &&
        leave.status === 'approved' &&
        leave.start_date.startsWith(selectedMonth)
      );

      const calculation = calculateMonthlyPayroll(
        employee,
        empTimeEntries,
        empAttendance,
        empLeaves,
        { working_days: 30 }
      );

      const validation = validatePayrollCalculation(calculation);

      return {
        ...calculation,
        validation,
        employee
      };
    });

    setCalculatedPayrolls(calculations);
    setProcessing(false);
  };

  const handleProcessAll = () => {
    if (calculatedPayrolls.length === 0) {
      return;
    }

    // Convert calculations to payroll records
    const payrollRecords = calculatedPayrolls.map(calc => ({
      employee_id: calc.employee_id,
      month: selectedMonth,
      basic_salary: calc.basic_salary,
      housing_allowance: calc.housing_allowance,
      transport_allowance: calc.transport_allowance,
      overtime_pay: calc.overtime_pay,
      gross_salary: calc.gross_salary,
      gosi_employee: calc.gosi_employee,
      gosi_employer: calc.gosi_employer,
      gosi_calculation_base: calc.gosi_calculation_base,
      absence_deduction: calc.absence_deduction,
      other_deductions: calc.loan_deduction + calc.advance_deduction + calc.other_deductions,
      total_deductions: calc.total_deductions,
      net_salary: calc.net_salary,
      working_days: calc.working_days,
      present_days: calc.present_days,
      absent_days: calc.absent_days,
      overtime_hours: calc.overtime_hours,
      status: 'calculated'
    }));

    onProcessPayroll(payrollRecords);
    setCalculatedPayrolls([]);
  };

  const totalGrossSalary = calculatedPayrolls.reduce((sum, p) => sum + p.gross_salary, 0);
  const totalDeductions = calculatedPayrolls.reduce((sum, p) => sum + p.total_deductions, 0);
  const totalNetSalary = calculatedPayrolls.reduce((sum, p) => sum + p.net_salary, 0);
  const totalGOSIEmployer = calculatedPayrolls.reduce((sum, p) => sum + p.gosi_employer, 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            Payroll Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Payroll Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().substring(0, 7)}
              />
            </div>

            <div>
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Search Employee</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-slate-600">
              <strong>{filteredEmployees.length}</strong> employees ready for processing
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleCalculateAll}
                variant="outline"
                disabled={filteredEmployees.length === 0 || processing}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Payroll
              </Button>
              <Button
                onClick={handleProcessAll}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={calculatedPayrolls.length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Process {calculatedPayrolls.length} Payrolls
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {calculatedPayrolls.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Gross</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalGrossSalary.toLocaleString()} SAR
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600">
                    {totalDeductions.toLocaleString()} SAR
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Net</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {totalNetSalary.toLocaleString()} SAR
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">GOSI Employer</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {totalGOSIEmployer.toLocaleString()} SAR
                  </p>
                </div>
                <Shield className="w-10 h-10 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculation Results */}
      {calculatedPayrolls.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculatedPayrolls.map((payroll) => (
                <Card key={payroll.employee_id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-white">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                          {payroll.employee.first_name?.[0]}{payroll.employee.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {payroll.employee.first_name} {payroll.employee.last_name}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {payroll.employee.job_title} • {payroll.employee.department}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">Net Salary</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {payroll.net_salary.toLocaleString()} SAR
                            </p>
                          </div>
                        </div>

                        {/* Validation Messages */}
                        {payroll.validation.warnings.length > 0 && (
                          <Alert className="mb-3 bg-amber-50 border-amber-200">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-sm text-amber-900">
                              {payroll.validation.warnings.join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Gross Salary</p>
                            <p className="font-semibold text-slate-900">
                              {payroll.gross_salary.toLocaleString()} SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">GOSI Employee</p>
                            <p className="font-semibold text-red-600">
                              -{payroll.gosi_employee.toLocaleString()} SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Other Deductions</p>
                            <p className="font-semibold text-red-600">
                              -{(payroll.absence_deduction + payroll.late_deduction + payroll.loan_deduction + payroll.advance_deduction).toLocaleString()} SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Working Days</p>
                            <p className="font-semibold text-slate-900">
                              {payroll.present_days}/{payroll.working_days}
                            </p>
                          </div>
                        </div>

                        {payroll.overtime_hours > 0 && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              +{payroll.overtime_hours.toFixed(1)}h overtime ({payroll.overtime_pay.toLocaleString()} SAR)
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <Calculator className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-2">No payroll calculations yet</p>
            <p className="text-sm text-slate-400">
              Click "Calculate Payroll" to process salaries for selected employees
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}