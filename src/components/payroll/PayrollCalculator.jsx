import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus } from "lucide-react";
import GOSICalculator, { calculateGOSI } from './GOSICalculator';

export default function PayrollCalculator({ employee, month, onCalculationComplete }) {
  const [salaryComponents, setSalaryComponents] = useState({
    basic_salary: employee?.basic_salary || 0,
    housing_allowance: employee?.housing_allowance || 0,
    transport_allowance: employee?.transport_allowance || 0,
    food_allowance: 0,
    mobile_allowance: 0,
    other_fixed_allowances: 0,
    overtime_pay: 0,
    bonus: 0,
    commission: 0,
    other_variable_allowances: 0,
    working_days: 30,
    present_days: 30,
    absent_days: 0,
    overtime_hours: 0,
    loan_deduction: 0,
    advance_deduction: 0,
    other_deductions: 0
  });

  const [gosiDetails, setGosiDetails] = useState(null);

  useEffect(() => {
    // Calculate absent days
    const absentDays = salaryComponents.working_days - salaryComponents.present_days;
    setSalaryComponents(prev => ({ ...prev, absent_days: absentDays }));
  }, [salaryComponents.working_days, salaryComponents.present_days]);

  const handleInputChange = (field, value) => {
    setSalaryComponents(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculateAbsenceDeduction = () => {
    const { basic_salary, absent_days, working_days } = salaryComponents;
    if (absent_days <= 0 || working_days <= 0) return 0;
    return (basic_salary / working_days) * absent_days;
  };

  const calculateOvertimePay = () => {
    const { basic_salary, overtime_hours, working_days } = salaryComponents;
    if (overtime_hours <= 0) return 0;
    // Saudi Labor Law: Overtime = 150% of hourly rate
    const hoursPerDay = 8;
    const totalWorkingHours = working_days * hoursPerDay;
    const hourlyRate = basic_salary / totalWorkingHours;
    return hourlyRate * 1.5 * overtime_hours;
  };

  const calculatePayroll = () => {
    const overtimePay = calculateOvertimePay();
    const absenceDeduction = calculateAbsenceDeduction();

    // Calculate gross salary
    const totalFixedAllowances = 
      salaryComponents.basic_salary +
      salaryComponents.housing_allowance +
      salaryComponents.transport_allowance +
      salaryComponents.food_allowance +
      salaryComponents.mobile_allowance +
      salaryComponents.other_fixed_allowances;

    const totalVariableAllowances =
      overtimePay +
      salaryComponents.bonus +
      salaryComponents.commission +
      salaryComponents.other_variable_allowances;

    const grossSalary = totalFixedAllowances + totalVariableAllowances;

    // Calculate GOSI
    const gosi = calculateGOSI(employee, salaryComponents);

    // Calculate total deductions
    const totalDeductions =
      gosi.employeeShare +
      salaryComponents.loan_deduction +
      salaryComponents.advance_deduction +
      absenceDeduction +
      salaryComponents.other_deductions;

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    const payrollData = {
      employee_id: employee.id,
      month: month,
      basic_salary: salaryComponents.basic_salary,
      housing_allowance: salaryComponents.housing_allowance,
      transport_allowance: salaryComponents.transport_allowance,
      food_allowance: salaryComponents.food_allowance,
      mobile_allowance: salaryComponents.mobile_allowance,
      other_fixed_allowances: salaryComponents.other_fixed_allowances,
      overtime_pay: parseFloat(overtimePay.toFixed(2)),
      bonus: salaryComponents.bonus,
      commission: salaryComponents.commission,
      other_variable_allowances: salaryComponents.other_variable_allowances,
      gross_salary: parseFloat(grossSalary.toFixed(2)),
      gosi_employee: gosi.employeeShare,
      gosi_employer: gosi.employerShare,
      gosi_calculation_base: gosi.gosiBase,
      loan_deduction: salaryComponents.loan_deduction,
      advance_deduction: salaryComponents.advance_deduction,
      absence_deduction: parseFloat(absenceDeduction.toFixed(2)),
      other_deductions: salaryComponents.other_deductions,
      total_deductions: parseFloat(totalDeductions.toFixed(2)),
      net_salary: parseFloat(netSalary.toFixed(2)),
      working_days: salaryComponents.working_days,
      present_days: salaryComponents.present_days,
      absent_days: salaryComponents.absent_days,
      overtime_hours: salaryComponents.overtime_hours,
      status: 'calculated'
    };

    onCalculationComplete(payrollData);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Fixed Salary Components
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Basic Salary (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.basic_salary}
                onChange={(e) => handleInputChange('basic_salary', e.target.value)}
              />
            </div>
            <div>
              <Label>Housing Allowance (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.housing_allowance}
                onChange={(e) => handleInputChange('housing_allowance', e.target.value)}
              />
            </div>
            <div>
              <Label>Transport Allowance (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.transport_allowance}
                onChange={(e) => handleInputChange('transport_allowance', e.target.value)}
              />
            </div>
            <div>
              <Label>Food Allowance (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.food_allowance}
                onChange={(e) => handleInputChange('food_allowance', e.target.value)}
              />
            </div>
            <div>
              <Label>Mobile Allowance (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.mobile_allowance}
                onChange={(e) => handleInputChange('mobile_allowance', e.target.value)}
              />
            </div>
            <div>
              <Label>Other Fixed Allowances (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.other_fixed_allowances}
                onChange={(e) => handleInputChange('other_fixed_allowances', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Variable Components & Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Working Days</Label>
              <Input
                type="number"
                value={salaryComponents.working_days}
                onChange={(e) => handleInputChange('working_days', e.target.value)}
              />
            </div>
            <div>
              <Label>Present Days</Label>
              <Input
                type="number"
                value={salaryComponents.present_days}
                onChange={(e) => handleInputChange('present_days', e.target.value)}
              />
            </div>
            <div>
              <Label>Absent Days</Label>
              <Input
                type="number"
                value={salaryComponents.absent_days}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>Overtime Hours</Label>
              <Input
                type="number"
                value={salaryComponents.overtime_hours}
                onChange={(e) => handleInputChange('overtime_hours', e.target.value)}
              />
            </div>
            <div>
              <Label>Bonus (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.bonus}
                onChange={(e) => handleInputChange('bonus', e.target.value)}
              />
            </div>
            <div>
              <Label>Commission (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.commission}
                onChange={(e) => handleInputChange('commission', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Minus className="w-5 h-5 text-red-600" />
            Deductions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Loan Deduction (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.loan_deduction}
                onChange={(e) => handleInputChange('loan_deduction', e.target.value)}
              />
            </div>
            <div>
              <Label>Advance Deduction (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.advance_deduction}
                onChange={(e) => handleInputChange('advance_deduction', e.target.value)}
              />
            </div>
            <div>
              <Label>Other Deductions (SAR)</Label>
              <Input
                type="number"
                value={salaryComponents.other_deductions}
                onChange={(e) => handleInputChange('other_deductions', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <GOSICalculator 
        employee={employee} 
        salaryComponents={salaryComponents}
        onCalculate={setGosiDetails}
      />

      <div className="flex justify-end">
        <Button
          onClick={calculatePayroll}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg px-8"
          size="lg"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculate Payroll
        </Button>
      </div>
    </div>
  );
}