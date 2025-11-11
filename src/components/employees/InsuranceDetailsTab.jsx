import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Shield, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InsuranceDetailsTab({ insurance, setInsurance, dependents }) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentInsurance, setCurrentInsurance] = useState({
    insurance_type: 'health',
    policy_number: '',
    provider_name: '',
    coverage_amount: 0,
    premium_amount: 0,
    start_date: '',
    expiry_date: '',
    status: 'active',
    beneficiaries: []
  });

  const handleAdd = () => {
    if (editingIndex !== null) {
      const updated = [...insurance];
      updated[editingIndex] = currentInsurance;
      setInsurance(updated);
      setEditingIndex(null);
    } else {
      setInsurance([...insurance, currentInsurance]);
    }
    setCurrentInsurance({
      insurance_type: 'health',
      policy_number: '',
      provider_name: '',
      coverage_amount: 0,
      premium_amount: 0,
      start_date: '',
      expiry_date: '',
      status: 'active',
      beneficiaries: []
    });
    setShowForm(false);
  };

  const handleEdit = (index) => {
    setCurrentInsurance(insurance[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    setInsurance(insurance.filter((_, i) => i !== index));
  };

  const toggleBeneficiary = (dependentName) => {
    const beneficiaries = currentInsurance.beneficiaries || [];
    if (beneficiaries.includes(dependentName)) {
      setCurrentInsurance({
        ...currentInsurance,
        beneficiaries: beneficiaries.filter(b => b !== dependentName)
      });
    } else {
      setCurrentInsurance({
        ...currentInsurance,
        beneficiaries: [...beneficiaries, dependentName]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Insurance Policies ({insurance.length})</h3>
        {!showForm && (
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingIndex(null);
              setCurrentInsurance({
                insurance_type: 'health',
                policy_number: '',
                provider_name: '',
                coverage_amount: 0,
                premium_amount: 0,
                start_date: '',
                expiry_date: '',
                status: 'active',
                beneficiaries: []
              });
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Insurance
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              {editingIndex !== null ? 'Edit Insurance' : 'Add Insurance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Insurance Type *</Label>
                <Select
                  value={currentInsurance.insurance_type}
                  onValueChange={(val) => setCurrentInsurance({ ...currentInsurance, insurance_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health Insurance</SelectItem>
                    <SelectItem value="life">Life Insurance</SelectItem>
                    <SelectItem value="medical">Medical Insurance</SelectItem>
                    <SelectItem value="dental">Dental Insurance</SelectItem>
                    <SelectItem value="vision">Vision Insurance</SelectItem>
                    <SelectItem value="disability">Disability Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider Name *</Label>
                <Input
                  value={currentInsurance.provider_name}
                  onChange={(e) => setCurrentInsurance({ ...currentInsurance, provider_name: e.target.value })}
                  placeholder="e.g., Bupa, Tawuniya"
                  required
                />
              </div>
              <div>
                <Label>Policy Number *</Label>
                <Input
                  value={currentInsurance.policy_number}
                  onChange={(e) => setCurrentInsurance({ ...currentInsurance, policy_number: e.target.value })}
                  placeholder="Enter policy number"
                  required
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={currentInsurance.status}
                  onValueChange={(val) => setCurrentInsurance({ ...currentInsurance, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Coverage Amount (SAR)</Label>
                <Input
                  type="number"
                  value={currentInsurance.coverage_amount}
                  onChange={(e) => setCurrentInsurance({ ...currentInsurance, coverage_amount: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Monthly Premium (SAR)</Label>
                <Input
                  type="number"
                  value={currentInsurance.premium_amount}
                  onChange={(e) => setCurrentInsurance({ ...currentInsurance, premium_amount: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={currentInsurance.start_date}
                  onChange={(e) => setCurrentInsurance({ ...currentInsurance, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={currentInsurance.expiry_date}
                  onChange={(e) => setCurrentInsurance({ ...currentInsurance, expiry_date: e.target.value })}
                />
              </div>
            </div>

            {/* Beneficiaries */}
            {dependents.length > 0 && (
              <div className="mt-6">
                <Label className="mb-3 block">Beneficiaries</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dependents.map((dependent, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={`beneficiary-${idx}`}
                        checked={currentInsurance.beneficiaries?.includes(dependent.full_name)}
                        onCheckedChange={() => toggleBeneficiary(dependent.full_name)}
                      />
                      <label htmlFor={`beneficiary-${idx}`} className="text-sm">
                        {dependent.full_name} ({dependent.relationship})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!currentInsurance.provider_name || !currentInsurance.policy_number}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Insurance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance List */}
      {insurance.length > 0 && (
        <div className="space-y-3">
          {insurance.map((policy, index) => (
            <Card key={index} className="border border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="font-semibold text-slate-900 capitalize">
                          {policy.insurance_type.replace('_', ' ')} - {policy.provider_name}
                        </h4>
                        <p className="text-sm text-slate-600">Policy: {policy.policy_number}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm ml-8">
                      <div>
                        <span className="text-slate-500">Coverage:</span>
                        <span className="ml-2 font-semibold">{policy.coverage_amount?.toLocaleString()} SAR</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Premium:</span>
                        <span className="ml-2 font-semibold">{policy.premium_amount?.toLocaleString()} SAR/mo</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expiry:</span>
                        <span className="ml-2 font-semibold">{policy.expiry_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          policy.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          policy.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {policy.status}
                        </span>
                      </div>
                    </div>
                    {policy.beneficiaries && policy.beneficiaries.length > 0 && (
                      <div className="mt-2 ml-8 text-xs text-slate-600">
                        Beneficiaries: {policy.beneficiaries.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!showForm && insurance.length === 0 && (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">No insurance policies added yet</p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Insurance Policy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Information Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Note:</strong> Health insurance is mandatory for all employees in Saudi Arabia. 
          Ensure coverage is active and valid at all times.
        </AlertDescription>
      </Alert>
    </div>
  );
}