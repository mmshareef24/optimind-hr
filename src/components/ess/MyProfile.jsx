import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Phone, MapPin, CreditCard, Edit, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export default function MyProfile({ employee, changeRequests = [] }) {
  const [editMode, setEditMode] = useState(null); // 'contact', 'emergency', 'bank', 'address'
  const [formData, setFormData] = useState({});
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const requestChangeMutation = useMutation({
    mutationFn: async (requestData) => {
      return await base44.entities.ProfileChangeRequest.create(requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile-change-requests']);
      setEditMode(null);
      setReason('');
      toast.success('Change request submitted for manager approval');
    },
    onError: () => {
      toast.error('Failed to submit change request');
    }
  });

  const handleEdit = (section) => {
    setEditMode(section);
    if (section === 'contact') {
      setFormData({
        phone: employee.phone || '',
        email: employee.email || ''
      });
    } else if (section === 'emergency') {
      setFormData({
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || ''
      });
    } else if (section === 'bank') {
      setFormData({
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
        iban: employee.iban || ''
      });
    } else if (section === 'address') {
      setFormData({
        address: employee.address || '',
        city: employee.city || ''
      });
    }
  };

  const handleSubmitChange = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for this change');
      return;
    }

    const currentData = {};
    const requestedData = {};
    
    Object.keys(formData).forEach(key => {
      currentData[key] = employee[key] || '';
      requestedData[key] = formData[key];
    });

    const requestData = {
      employee_id: employee.id,
      request_type: editMode,
      current_data: currentData,
      requested_data: requestedData,
      reason: reason,
      status: 'pending'
    };

    requestChangeMutation.mutate(requestData);
  };

  const pendingRequests = changeRequests.filter(r => r.status === 'pending');
  const hasPendingRequest = (type) => pendingRequests.some(r => r.request_type === type);

  return (
    <div className="space-y-6">
      {/* Personal Information (Read-only) */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-slate-600">Employee ID</Label>
              <p className="text-slate-900 font-medium">{employee.employee_id}</p>
            </div>
            <div>
              <Label className="text-slate-600">Full Name</Label>
              <p className="text-slate-900 font-medium">{employee.first_name} {employee.last_name}</p>
            </div>
            <div>
              <Label className="text-slate-600">National ID</Label>
              <p className="text-slate-900 font-medium">{employee.national_id}</p>
            </div>
            <div>
              <Label className="text-slate-600">Nationality</Label>
              <p className="text-slate-900 font-medium">{employee.nationality}</p>
            </div>
            <div>
              <Label className="text-slate-600">Date of Birth</Label>
              <p className="text-slate-900 font-medium">{employee.date_of_birth || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-slate-600">Gender</Label>
              <p className="text-slate-900 font-medium capitalize">{employee.gender || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-slate-600">Marital Status</Label>
              <p className="text-slate-900 font-medium capitalize">{employee.marital_status || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-slate-600">Hire Date</Label>
              <p className="text-slate-900 font-medium">{employee.hire_date}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information (Editable) */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Contact Information
            </CardTitle>
            {!editMode && !hasPendingRequest('contact_info') && (
              <Button size="sm" variant="outline" onClick={() => handleEdit('contact')}>
                <Edit className="w-4 h-4 mr-1" />
                Request Change
              </Button>
            )}
            {hasPendingRequest('contact_info') && (
              <Badge className="bg-amber-100 text-amber-700">
                <Clock className="w-3 h-3 mr-1" />
                Pending Approval
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {editMode === 'contact' ? (
            <div className="space-y-4">
              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Reason for Change *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to update this information"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setEditMode(null)} variant="outline">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSubmitChange} disabled={requestChangeMutation.isPending}>
                  <Check className="w-4 h-4 mr-1" />
                  Submit Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-600">Email</Label>
                <p className="text-slate-900 font-medium">{employee.email}</p>
              </div>
              <div>
                <Label className="text-slate-600">Phone</Label>
                <p className="text-slate-900 font-medium">{employee.phone || 'N/A'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contact (Editable) */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Emergency Contact
            </CardTitle>
            {!editMode && !hasPendingRequest('emergency_contact') && (
              <Button size="sm" variant="outline" onClick={() => handleEdit('emergency')}>
                <Edit className="w-4 h-4 mr-1" />
                Request Change
              </Button>
            )}
            {hasPendingRequest('emergency_contact') && (
              <Badge className="bg-amber-100 text-amber-700">
                <Clock className="w-3 h-3 mr-1" />
                Pending Approval
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {editMode === 'emergency' ? (
            <div className="space-y-4">
              <div>
                <Label>Contact Name *</Label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Contact Phone *</Label>
                <Input
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Reason for Change *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to update this information"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setEditMode(null)} variant="outline">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSubmitChange} disabled={requestChangeMutation.isPending}>
                  <Check className="w-4 h-4 mr-1" />
                  Submit Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-600">Contact Name</Label>
                <p className="text-slate-900 font-medium">{employee.emergency_contact_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-slate-600">Contact Phone</Label>
                <p className="text-slate-900 font-medium">{employee.emergency_contact_phone || 'N/A'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details (Editable) */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Bank Details
            </CardTitle>
            {!editMode && !hasPendingRequest('bank_details') && (
              <Button size="sm" variant="outline" onClick={() => handleEdit('bank')}>
                <Edit className="w-4 h-4 mr-1" />
                Request Change
              </Button>
            )}
            {hasPendingRequest('bank_details') && (
              <Badge className="bg-amber-100 text-amber-700">
                <Clock className="w-3 h-3 mr-1" />
                Pending Approval
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {editMode === 'bank' ? (
            <div className="space-y-4">
              <div>
                <Label>Bank Name *</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Account Number *</Label>
                <Input
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                />
              </div>
              <div>
                <Label>Reason for Change *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to update this information"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setEditMode(null)} variant="outline">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSubmitChange} disabled={requestChangeMutation.isPending}>
                  <Check className="w-4 h-4 mr-1" />
                  Submit Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label className="text-slate-600">Bank Name</Label>
                <p className="text-slate-900 font-medium">{employee.bank_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-slate-600">Account Number</Label>
                <p className="text-slate-900 font-medium">{employee.bank_account || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-slate-600">IBAN</Label>
                <p className="text-slate-900 font-medium">{employee.iban || 'N/A'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Change Requests */}
      {pendingRequests.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>You have {pendingRequests.length} pending change request(s).</strong> Your manager will review and approve/reject these changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}