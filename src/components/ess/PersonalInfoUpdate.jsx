import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Mail, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PersonalInfoUpdate({ employee, onUpdate }) {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bank_name: '',
    bank_account: '',
    iban: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        phone: employee.phone || '',
        email: employee.email || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
        iban: employee.iban || ''
      });
    }
  }, [employee]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Update Personal Information</h3>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Changes saved!</span>
          </div>
        )}
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 text-sm">
          You can update your contact and bank information here. Other details like name, national ID, and salary information must be updated through HR department.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card className="border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-amber-200">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Emergency Contact Name</Label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <Label>Emergency Contact Phone</Label>
                <Input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Bank Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="e.g., Al Rajhi Bank"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={formData.bank_account}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <Label>IBAN</Label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => handleChange('iban', e.target.value.toUpperCase())}
                    placeholder="SA00 0000 0000 0000 0000 0000"
                    maxLength={29}
                  />
                </div>
              </div>
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-xs">
                  Bank information changes will be reviewed by HR before being applied to your payroll.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Non-Editable Information */}
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Read-Only Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Full Name</span>
                <span className="font-semibold text-slate-900">
                  {employee?.first_name} {employee?.last_name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Employee ID</span>
                <span className="font-semibold text-slate-900">{employee?.employee_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Department</span>
                <span className="font-semibold text-slate-900">{employee?.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Job Title</span>
                <span className="font-semibold text-slate-900">{employee?.job_title}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">National ID</span>
                <span className="font-semibold text-slate-900">{employee?.national_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Hire Date</span>
                <span className="font-semibold text-slate-900">{employee?.hire_date}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              To update these details, please contact HR department.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                phone: employee.phone || '',
                email: employee.email || '',
                emergency_contact_name: employee.emergency_contact_name || '',
                emergency_contact_phone: employee.emergency_contact_phone || '',
                bank_name: employee.bank_name || '',
                bank_account: employee.bank_account || '',
                iban: employee.iban || ''
              });
              setHasChanges(false);
            }}
            disabled={!hasChanges}
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}