import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Calculator, TrendingUp, Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SalaryDetailsTab({ formData, setFormData }) {
  // Auto-calculate housing and transport allowances
  useEffect(() => {
    if (formData.basic_salary) {
      const basicSalary = parseFloat(formData.basic_salary) || 0;
      const housingAllowance = basicSalary * 0.25; // 25%
      const transportAllowance = basicSalary * 0.10; // 10%
      
      setFormData({
        ...formData,
        housing_allowance: parseFloat(housingAllowance.toFixed(2)),
        transport_allowance: parseFloat(transportAllowance.toFixed(2))
      });
    }
  }, [formData.basic_salary]);

  // Auto-calculate GOSI salary basis (typically basic + housing)
  useEffect(() => {
    if (formData.gosi_applicable && formData.basic_salary) {
      const basicSalary = parseFloat(formData.basic_salary) || 0;
      const housingAllowance = parseFloat(formData.housing_allowance) || 0;
      const gosiBasis = basicSalary + housingAllowance;
      
      setFormData({
        ...formData,
        gosi_salary_basis: parseFloat(gosiBasis.toFixed(2))
      });
    }
  }, [formData.basic_salary, formData.housing_allowance, formData.gosi_applicable]);

  const totalSalary = 
    (parseFloat(formData.basic_salary) || 0) +
    (parseFloat(formData.housing_allowance) || 0) +
    (parseFloat(formData.transport_allowance) || 0);

  return (
    <div className="space-y-6">
      {/* Basic Salary */}
      <Card className="border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Basic Salary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <Label>Basic Salary (SAR) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.basic_salary}
              onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
              placeholder="Enter basic salary"
              required
              className="text-lg font-semibold"
            />
            <p className="text-xs text-slate-500 mt-1">
              Housing and transport allowances will be calculated automatically
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Calculated Allowances */}
      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Auto-Calculated Allowances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base">Housing Allowance (25%)</Label>
                <span className="text-2xl font-bold text-blue-600">
                  {formData.housing_allowance?.toLocaleString()} SAR
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Automatically calculated as 25% of basic salary
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base">Transport Allowance (10%)</Label>
                <span className="text-2xl font-bold text-emerald-600">
                  {formData.transport_allowance?.toLocaleString()} SAR
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Automatically calculated as 10% of basic salary
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GOSI Information */}
      <Card className="border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            GOSI Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border">
            <Checkbox
              id="gosi"
              checked={formData.gosi_applicable}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                gosi_applicable: checked,
                gosi_salary_basis: checked ? formData.gosi_salary_basis : 0
              })}
            />
            <div className="flex-1">
              <label htmlFor="gosi" className="text-sm font-medium cursor-pointer">
                GOSI Applicable
              </label>
              <p className="text-xs text-slate-500 mt-1">
                Check if this employee is eligible for GOSI (General Organization for Social Insurance) contributions
              </p>
            </div>
          </div>

          {formData.gosi_applicable && (
            <div className="space-y-4 pt-2">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  GOSI contributions are calculated based on the salary basis (Basic + Housing). 
                  The employee contribution is 10% and employer contribution is 12%.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>GOSI Number</Label>
                  <Input
                    value={formData.gosi_number || ''}
                    onChange={(e) => setFormData({ ...formData, gosi_number: e.target.value })}
                    placeholder="Enter GOSI number"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Employee's GOSI registration number
                  </p>
                </div>

                <div>
                  <Label>GOSI Registration Date</Label>
                  <Input
                    type="date"
                    value={formData.gosi_registration_date || ''}
                    onChange={(e) => setFormData({ ...formData, gosi_registration_date: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Date when registered with GOSI
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <Label className="text-base">GOSI Salary Basis</Label>
                    <p className="text-xs text-slate-600 mt-1">Basic + Housing Allowance</p>
                  </div>
                  <span className="text-2xl font-bold text-amber-600">
                    {(formData.gosi_salary_basis || 0).toLocaleString()} SAR
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-amber-200 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Employee Share (10%)</p>
                    <p className="font-semibold text-slate-900">
                      {((formData.gosi_salary_basis || 0) * 0.10).toLocaleString()} SAR
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Employer Share (12%)</p>
                    <p className="font-semibold text-slate-900">
                      {((formData.gosi_salary_basis || 0) * 0.12).toLocaleString()} SAR
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Salary Summary */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="border-b border-purple-100">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Total Salary Package
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Basic Salary</span>
              <span className="font-semibold">
                {(parseFloat(formData.basic_salary) || 0).toLocaleString()} SAR
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Housing Allowance</span>
              <span className="font-semibold">
                {(parseFloat(formData.housing_allowance) || 0).toLocaleString()} SAR
              </span>
            </div>
            <div className="flex justify-between text-sm pb-3 border-b">
              <span className="text-slate-600">Transport Allowance</span>
              <span className="font-semibold">
                {(parseFloat(formData.transport_allowance) || 0).toLocaleString()} SAR
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-lg text-slate-900">Gross Monthly Salary</span>
              <span className="font-bold text-3xl text-purple-600">
                {totalSalary.toLocaleString()} SAR
              </span>
            </div>
            
            {formData.gosi_applicable && formData.gosi_salary_basis > 0 && (
              <>
                <div className="flex justify-between text-sm text-red-600 pt-2 border-t">
                  <span>Less: GOSI Deduction (10%)</span>
                  <span className="font-semibold">
                    - {((formData.gosi_salary_basis || 0) * 0.10).toLocaleString()} SAR
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-purple-300">
                  <span className="font-bold text-lg text-slate-900">Net Salary (after GOSI)</span>
                  <span className="font-bold text-2xl text-emerald-600">
                    {(totalSalary - ((formData.gosi_salary_basis || 0) * 0.10)).toLocaleString()} SAR
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}