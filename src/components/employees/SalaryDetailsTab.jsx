import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, TrendingUp, Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SalaryDetailsTab({ formData, setFormData }) {
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Auto-calculate housing and transport allowances
  useEffect(() => {
    if (autoCalculate && formData.basic_salary > 0) {
      const housing = formData.basic_salary * 0.25; // 25% of basic
      const transport = formData.basic_salary * 0.10; // 10% of basic
      
      setFormData({
        ...formData,
        housing_allowance: parseFloat(housing.toFixed(2)),
        transport_allowance: parseFloat(transport.toFixed(2))
      });
    }
  }, [formData.basic_salary, autoCalculate]);

  // Auto-calculate GOSI salary basis when GOSI is applicable
  useEffect(() => {
    if (formData.gosi_applicable && formData.basic_salary > 0) {
      // GOSI calculation base = Basic Salary + Housing Allowance (capped at 45,000 SAR)
      const gosiBase = Math.min(
        formData.basic_salary + (formData.housing_allowance || 0),
        45000
      );
      
      setFormData({
        ...formData,
        gosi_salary_basis: parseFloat(gosiBase.toFixed(2))
      });
    } else if (!formData.gosi_applicable) {
      setFormData({
        ...formData,
        gosi_salary_basis: 0
      });
    }
  }, [formData.basic_salary, formData.housing_allowance, formData.gosi_applicable]);

  const totalSalary = 
    parseFloat(formData.basic_salary || 0) + 
    parseFloat(formData.housing_allowance || 0) + 
    parseFloat(formData.transport_allowance || 0);

  const isSaudi = formData.nationality?.toLowerCase() === 'saudi' || 
                  formData.nationality?.toLowerCase() === 'saudi arabia' ||
                  formData.nationality?.toLowerCase() === 'ksa';

  // Calculate GOSI deductions for display
  const gosiBase = formData.gosi_salary_basis || 0;
  const employeeGOSI = isSaudi ? gosiBase * 0.10 : 0;
  const employerGOSI = isSaudi ? gosiBase * 0.12 : gosiBase * 0.02;

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
          <div className="space-y-4">
            <div>
              <Label>Basic Salary (SAR) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.basic_salary || ''}
                onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-calculate"
                checked={autoCalculate}
                onCheckedChange={setAutoCalculate}
              />
              <label
                htmlFor="auto-calculate"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-calculate housing (25%) and transport (10%) allowances
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allowances */}
      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Allowances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Housing Allowance (SAR)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.housing_allowance || ''}
                onChange={(e) => setFormData({ ...formData, housing_allowance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={autoCalculate}
              />
              {autoCalculate && formData.basic_salary > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Calculated: 25% of basic salary
                </p>
              )}
            </div>

            <div>
              <Label>Transport Allowance (SAR)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.transport_allowance || ''}
                onChange={(e) => setFormData({ ...formData, transport_allowance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={autoCalculate}
              />
              {autoCalculate && formData.basic_salary > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Calculated: 10% of basic salary
                </p>
              )}
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
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gosi-applicable"
                checked={formData.gosi_applicable}
                onCheckedChange={(checked) => setFormData({ ...formData, gosi_applicable: checked })}
              />
              <label
                htmlFor="gosi-applicable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                GOSI Applicable
              </label>
            </div>

            {formData.gosi_applicable && (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    GOSI is calculated on Basic Salary + Housing Allowance, capped at 45,000 SAR.
                    {isSaudi ? (
                      <> Employee contributes 10%, Employer contributes 12% (9% + 2% + 1%).</>
                    ) : (
                      <> Non-Saudi employees: No employee contribution. Employer contributes 2% (Occupational Hazards only).</>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>GOSI Number</Label>
                    <Input
                      value={formData.gosi_number || ''}
                      onChange={(e) => setFormData({ ...formData, gosi_number: e.target.value })}
                      placeholder="Enter GOSI registration number"
                    />
                  </div>

                  <div>
                    <Label>GOSI Registration Date</Label>
                    <Input
                      type="date"
                      value={formData.gosi_registration_date || ''}
                      onChange={(e) => setFormData({ ...formData, gosi_registration_date: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>GOSI Salary Basis (SAR)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.gosi_salary_basis || ''}
                      onChange={(e) => setFormData({ ...formData, gosi_salary_basis: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      disabled
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Auto-calculated: Basic Salary + Housing Allowance (capped at 45,000 SAR)
                    </p>
                  </div>
                </div>

                {/* GOSI Calculation Preview */}
                {formData.gosi_salary_basis > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      GOSI Deduction Preview
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Calculation Base:</span>
                        <span className="font-semibold">{gosiBase.toLocaleString()} SAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Employee Share ({isSaudi ? '10%' : '0%'}):</span>
                        <span className="font-semibold text-red-600">
                          {employeeGOSI > 0 ? `-${employeeGOSI.toLocaleString()}` : '0.00'} SAR
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Employer Share ({isSaudi ? '12%' : '2%'}):</span>
                        <span className="font-semibold text-blue-600">{employerGOSI.toLocaleString()} SAR</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-amber-300">
                        <span className="font-semibold text-slate-900">Total GOSI:</span>
                        <span className="font-bold text-amber-600">
                          {(employeeGOSI + employerGOSI).toLocaleString()} SAR
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Package Summary */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="border-b border-purple-200">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Salary Package Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-purple-100">
              <span className="text-slate-600">Basic Salary</span>
              <span className="font-semibold text-slate-900">
                {parseFloat(formData.basic_salary || 0).toLocaleString()} SAR
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-purple-100">
              <span className="text-slate-600">Housing Allowance</span>
              <span className="font-semibold text-slate-900">
                {parseFloat(formData.housing_allowance || 0).toLocaleString()} SAR
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-purple-100">
              <span className="text-slate-600">Transport Allowance</span>
              <span className="font-semibold text-slate-900">
                {parseFloat(formData.transport_allowance || 0).toLocaleString()} SAR
              </span>
            </div>
            {formData.gosi_applicable && employeeGOSI > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-purple-100">
                <span className="text-slate-600">Less: GOSI Employee Share</span>
                <span className="font-semibold text-red-600">
                  -{employeeGOSI.toLocaleString()} SAR
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-white rounded-lg px-3 mt-3">
              <span className="font-bold text-slate-900 text-lg">
                {formData.gosi_applicable && employeeGOSI > 0 ? 'Net Salary' : 'Total Gross Salary'}
              </span>
              <span className="font-bold text-2xl text-purple-600">
                {(totalSalary - employeeGOSI).toLocaleString()} SAR
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}