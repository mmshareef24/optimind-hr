import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function QIWARegistrationForm({ employees, companies, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    employee_id: '',
    company_id: '',
    iqama_number: '',
    border_number: '',
    work_permit_number: '',
    work_permit_expiry: '',
    contract_type: 'unlimited',
    job_title_ar: '',
    occupation_code: '',
    registration_status: 'pending'
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.QIWARecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['qiwa-records']);
      toast.success('Employee registered in QIWA successfully');
      onClose();
    },
    onError: () => toast.error('Failed to register employee')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Employee *</Label>
          <Select value={formData.employee_id} onValueChange={(val) => setFormData({...formData, employee_id: val})}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Company *</Label>
          <Select value={formData.company_id} onValueChange={(val) => setFormData({...formData, company_id: val})}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(comp => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Iqama Number *</Label>
          <Input
            value={formData.iqama_number}
            onChange={(e) => setFormData({...formData, iqama_number: e.target.value})}
            placeholder="10-digit Iqama number"
            required
          />
        </div>

        <div>
          <Label>Border Number</Label>
          <Input
            value={formData.border_number}
            onChange={(e) => setFormData({...formData, border_number: e.target.value})}
            placeholder="Border entry number"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Work Permit Number</Label>
          <Input
            value={formData.work_permit_number}
            onChange={(e) => setFormData({...formData, work_permit_number: e.target.value})}
          />
        </div>

        <div>
          <Label>Work Permit Expiry</Label>
          <Input
            type="date"
            value={formData.work_permit_expiry}
            onChange={(e) => setFormData({...formData, work_permit_expiry: e.target.value})}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Job Title (Arabic)</Label>
          <Input
            value={formData.job_title_ar}
            onChange={(e) => setFormData({...formData, job_title_ar: e.target.value})}
            placeholder="المسمى الوظيفي"
          />
        </div>

        <div>
          <Label>Occupation Code</Label>
          <Input
            value={formData.occupation_code}
            onChange={(e) => setFormData({...formData, occupation_code: e.target.value})}
            placeholder="e.g., 2421"
          />
        </div>
      </div>

      <div>
        <Label>Contract Type</Label>
        <Select value={formData.contract_type} onValueChange={(val) => setFormData({...formData, contract_type: val})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unlimited">Unlimited</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Register in QIWA
        </Button>
      </div>
    </form>
  );
}