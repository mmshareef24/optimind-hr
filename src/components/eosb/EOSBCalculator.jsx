import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calculator, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function EOSBCalculator({ employee, onCalculationComplete }) {
  const [formData, setFormData] = useState({
    termination_type: 'resignation',
    termination_date: new Date().toISOString().split('T')[0],
    last_basic_salary: employee?.basic_salary || 0,
    include_housing_allowance: false,
    deductions: 0
  });

  const [result, setResult] = useState(null);

  const calculateEOSB = () => {
    if (!employee?.hire_date) {
      toast.error('Hire date is required');
      return;
    }

    const hireDate = new Date(employee.hire_date);
    const terminationDate = new Date(formData.termination_date);
    
    // Calculate service duration
    const diffTime = terminationDate - hireDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;

    // Calculation base
    const calculationBase = parseFloat(formData.last_basic_salary) + 
      (formData.include_housing_allowance ? (employee.housing_allowance || 0) : 0);

    let eosbAmount = 0;
    let years_0_to_5 = 0;
    let years_5_to_10 = 0;
    let years_above_10 = 0;
    let eosb_0_to_5 = 0;
    let eosb_5_to_10 = 0;
    let eosb_above_10 = 0;
    let calculationDetails = '';

    // Saudi Labor Law calculation
    if (formData.termination_type === 'resignation') {
      if (years < 2) {
        // No EOSB for resignation before 2 years
        calculationDetails = 'No EOSB: Service less than 2 years (resignation)';
        eosbAmount = 0;
      } else if (years < 5) {
        // Half month per year for 2-5 years
        years_0_to_5 = years;
        eosb_0_to_5 = years * (calculationBase / 2);
        eosbAmount = eosb_0_to_5;
        calculationDetails = `${years} years × (${calculationBase} / 2) = ${eosb_0_to_5} SAR`;
      } else if (years < 10) {
        // Half month for first 5 years + full month for remaining
        years_0_to_5 = 5;
        years_5_to_10 = years - 5;
        eosb_0_to_5 = 5 * (calculationBase / 2);
        eosb_5_to_10 = (years - 5) * calculationBase;
        eosbAmount = eosb_0_to_5 + eosb_5_to_10;
        calculationDetails = `First 5 years: 5 × (${calculationBase} / 2) = ${eosb_0_to_5} SAR\n`;
        calculationDetails += `Years 5-10: ${years - 5} × ${calculationBase} = ${eosb_5_to_10} SAR`;
      } else {
        // Half month for first 5 years + full month for remaining
        years_0_to_5 = 5;
        years_5_to_10 = 5;
        years_above_10 = years - 10;
        eosb_0_to_5 = 5 * (calculationBase / 2);
        eosb_5_to_10 = 5 * calculationBase;
        eosb_above_10 = (years - 10) * calculationBase;
        eosbAmount = eosb_0_to_5 + eosb_5_to_10 + eosb_above_10;
        calculationDetails = `First 5 years: 5 × (${calculationBase} / 2) = ${eosb_0_to_5} SAR\n`;
        calculationDetails += `Years 5-10: 5 × ${calculationBase} = ${eosb_5_to_10} SAR\n`;
        calculationDetails += `Years 10+: ${years - 10} × ${calculationBase} = ${eosb_above_10} SAR`;
      }
    } else {
      // Full EOSB for termination without cause, contract end, retirement, or death
      if (years <= 5) {
        years_0_to_5 = years;
        eosb_0_to_5 = years * calculationBase;
        eosbAmount = eosb_0_to_5;
        calculationDetails = `${years} years × ${calculationBase} = ${eosb_0_to_5} SAR`;
      } else if (years <= 10) {
        years_0_to_5 = 5;
        years_5_to_10 = years - 5;
        eosb_0_to_5 = 5 * calculationBase;
        eosb_5_to_10 = (years - 5) * calculationBase;
        eosbAmount = eosb_0_to_5 + eosb_5_to_10;
        calculationDetails = `First 5 years: 5 × ${calculationBase} = ${eosb_0_to_5} SAR\n`;
        calculationDetails += `Years 5-10: ${years - 5} × ${calculationBase} = ${eosb_5_to_10} SAR`;
      } else {
        years_0_to_5 = 5;
        years_5_to_10 = 5;
        years_above_10 = years - 10;
        eosb_0_to_5 = 5 * calculationBase;
        eosb_5_to_10 = 5 * calculationBase;
        eosb_above_10 = (years - 10) * calculationBase;
        eosbAmount = eosb_0_to_5 + eosb_5_to_10 + eosb_above_10;
        calculationDetails = `First 5 years: 5 × ${calculationBase} = ${eosb_0_to_5} SAR\n`;
        calculationDetails += `Years 5-10: 5 × ${calculationBase} = ${eosb_5_to_10} SAR\n`;
        calculationDetails += `Years 10+: ${years - 10} × ${calculationBase} = ${eosb_above_10} SAR`;
      }
    }

    // Add proportional amount for remaining months and days
    const proportionalAmount = (months / 12 + days / 365) * (calculationBase / (formData.termination_type === 'resignation' && years < 5 ? 2 : 1));
    eosbAmount += proportionalAmount;

    const deductions = parseFloat(formData.deductions) || 0;
    const netAmount = eosbAmount - deductions;

    const calculationResult = {
      employee_id: employee.id,
      calculation_date: new Date().toISOString().split('T')[0],
      termination_type: formData.termination_type,
      hire_date: employee.hire_date,
      termination_date: formData.termination_date,
      years_of_service: years,
      months_of_service: months,
      days_of_service: days,
      last_basic_salary: parseFloat(formData.last_basic_salary),
      include_housing_allowance: formData.include_housing_allowance,
      calculation_base: calculationBase,
      years_0_to_5,
      years_5_to_10,
      years_above_10,
      eosb_amount_0_to_5: eosb_0_to_5,
      eosb_amount_5_to_10: eosb_5_to_10,
      eosb_amount_above_10: eosb_above_10,
      total_eosb_amount: eosbAmount,
      deductions,
      net_eosb_amount: netAmount,
      calculation_details: calculationDetails,
      status: 'calculated'
    };

    setResult(calculationResult);
    toast.success('EOSB calculated successfully');
  };

  const handleSave = () => {
    if (onCalculationComplete) {
      onCalculationComplete(result);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculate End of Service Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Employee</Label>
              <Input 
                value={`${employee?.first_name} ${employee?.last_name} (${employee?.employee_id})`}
                disabled
              />
            </div>
            <div>
              <Label>Hire Date</Label>
              <Input value={employee?.hire_date} disabled />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Termination Type *</Label>
              <Select 
                value={formData.termination_type}
                onValueChange={(value) => setFormData({...formData, termination_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resignation">Resignation</SelectItem>
                  <SelectItem value="termination_with_cause">Termination (With Cause)</SelectItem>
                  <SelectItem value="termination_without_cause">Termination (Without Cause)</SelectItem>
                  <SelectItem value="contract_end">Contract End</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="death">Death</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Termination Date *</Label>
              <Input 
                type="date"
                value={formData.termination_date}
                onChange={(e) => setFormData({...formData, termination_date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Last Basic Salary (SAR) *</Label>
              <Input 
                type="number"
                value={formData.last_basic_salary}
                onChange={(e) => setFormData({...formData, last_basic_salary: e.target.value})}
              />
            </div>
            <div>
              <Label>Deductions (SAR)</Label>
              <Input 
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({...formData, deductions: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch 
              checked={formData.include_housing_allowance}
              onCheckedChange={(checked) => setFormData({...formData, include_housing_allowance: checked})}
            />
            <Label>Include Housing Allowance in Calculation</Label>
          </div>

          <Button onClick={calculateEOSB} className="w-full bg-blue-600 hover:bg-blue-700">
            <Calculator className="w-4 h-4 mr-2" />
            Calculate EOSB
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-5 h-5" />
              Calculation Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Years of Service</p>
                <p className="text-2xl font-bold text-slate-900">
                  {result.years_of_service}y {result.months_of_service}m {result.days_of_service}d
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Calculation Base</p>
                <p className="text-2xl font-bold text-slate-900">{result.calculation_base.toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Termination Type</p>
                <Badge className="mt-1">{result.termination_type}</Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-slate-600 mb-2">Calculation Breakdown:</p>
              <pre className="bg-white p-3 rounded-lg text-sm whitespace-pre-wrap border">
                {result.calculation_details}
              </pre>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-slate-600">Total EOSB</p>
                <p className="text-xl font-bold text-emerald-600">
                  {result.total_eosb_amount.toLocaleString()} SAR
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Deductions</p>
                <p className="text-xl font-bold text-red-600">
                  -{result.deductions.toLocaleString()} SAR
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Net EOSB Payable</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {result.net_eosb_amount.toLocaleString()} SAR
                </p>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <FileText className="w-4 h-4 mr-2" />
              Save EOSB Record
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}