import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Calculator, TrendingUp } from "lucide-react";

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
              <span className="font-bold text-lg text-slate-900">Total Monthly Salary</span>
              <span className="font-bold text-3xl text-purple-600">
                {totalSalary.toLocaleString()} SAR
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gosi"
                checked={formData.gosi_applicable}
                onCheckedChange={(checked) => setFormData({ ...formData, gosi_applicable: checked })}
              />
              <label htmlFor="gosi" className="text-sm font-medium">
                GOSI Applicable
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Check if this employee is eligible for GOSI (General Organization for Social Insurance) contributions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}