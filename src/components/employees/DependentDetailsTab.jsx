import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Users } from "lucide-react";

export default function DependentDetailsTab({ dependents, setDependents }) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentDependent, setCurrentDependent] = useState({
    full_name: '',
    relationship: 'spouse',
    date_of_birth: '',
    gender: 'male',
    national_id: '',
    passport_number: '',
    is_beneficiary: false,
    contact_number: ''
  });

  const handleAdd = () => {
    if (editingIndex !== null) {
      const updated = [...dependents];
      updated[editingIndex] = currentDependent;
      setDependents(updated);
      setEditingIndex(null);
    } else {
      setDependents([...dependents, currentDependent]);
    }
    setCurrentDependent({
      full_name: '',
      relationship: 'spouse',
      date_of_birth: '',
      gender: 'male',
      national_id: '',
      passport_number: '',
      is_beneficiary: false,
      contact_number: ''
    });
    setShowForm(false);
  };

  const handleEdit = (index) => {
    setCurrentDependent(dependents[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    setDependents(dependents.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Dependents ({dependents.length})</h3>
        {!showForm && (
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingIndex(null);
              setCurrentDependent({
                full_name: '',
                relationship: 'spouse',
                date_of_birth: '',
                gender: 'male',
                national_id: '',
                passport_number: '',
                is_beneficiary: false,
                contact_number: ''
              });
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Dependent
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              {editingIndex !== null ? 'Edit Dependent' : 'Add Dependent'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Full Name *</Label>
                <Input
                  value={currentDependent.full_name}
                  onChange={(e) => setCurrentDependent({ ...currentDependent, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <Label>Relationship *</Label>
                <Select
                  value={currentDependent.relationship}
                  onValueChange={(val) => setCurrentDependent({ ...currentDependent, relationship: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={currentDependent.gender}
                  onValueChange={(val) => setCurrentDependent({ ...currentDependent, gender: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={currentDependent.date_of_birth}
                  onChange={(e) => setCurrentDependent({ ...currentDependent, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label>National ID / Iqama</Label>
                <Input
                  value={currentDependent.national_id}
                  onChange={(e) => setCurrentDependent({ ...currentDependent, national_id: e.target.value })}
                  placeholder="Enter ID number"
                />
              </div>
              <div>
                <Label>Passport Number</Label>
                <Input
                  value={currentDependent.passport_number}
                  onChange={(e) => setCurrentDependent({ ...currentDependent, passport_number: e.target.value })}
                  placeholder="Enter passport number"
                />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  type="tel"
                  value={currentDependent.contact_number}
                  onChange={(e) => setCurrentDependent({ ...currentDependent, contact_number: e.target.value })}
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="beneficiary"
                  checked={currentDependent.is_beneficiary}
                  onCheckedChange={(checked) => setCurrentDependent({ ...currentDependent, is_beneficiary: checked })}
                />
                <label htmlFor="beneficiary" className="text-sm font-medium">
                  Insurance Beneficiary
                </label>
              </div>
            </div>

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
                disabled={!currentDependent.full_name}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Dependent
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependents List */}
      {dependents.length > 0 && (
        <div className="space-y-3">
          {dependents.map((dependent, index) => (
            <Card key={index} className="border border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{dependent.full_name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                      <span className="capitalize">{dependent.relationship}</span>
                      {dependent.gender && <span>• {dependent.gender}</span>}
                      {dependent.date_of_birth && <span>• Born {dependent.date_of_birth}</span>}
                      {dependent.is_beneficiary && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                          Beneficiary
                        </span>
                      )}
                    </div>
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

      {!showForm && dependents.length === 0 && (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">No dependents added yet</p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Dependent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}