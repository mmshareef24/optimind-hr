import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function ProgramForm({ program, employees, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    program_name: "",
    program_code: "",
    category: "technical",
    description: "",
    objectives: "",
    duration_hours: "",
    delivery_method: "in_person",
    instructor: "",
    instructor_employee_id: "",
    external_provider: "",
    cost_per_participant: 0,
    max_participants: "",
    prerequisites: "",
    target_audience: "",
    certification_awarded: false,
    certification_name: "",
    certification_validity_months: "",
    is_mandatory: false,
    status: "active",
    materials_url: "",
    notes: ""
  });

  useEffect(() => {
    if (program) {
      setFormData(program);
    }
  }, [program]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program ? 'Edit Training Program' : 'Create Training Program'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Program Name *</Label>
              <Input
                value={formData.program_name}
                onChange={(e) => setFormData(prev => ({ ...prev, program_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Program Code</Label>
              <Input
                value={formData.program_code}
                onChange={(e) => setFormData(prev => ({ ...prev, program_code: e.target.value }))}
                placeholder="e.g., TRN-001"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="soft_skills">Soft Skills</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delivery Method</Label>
              <Select value={formData.delivery_method} onValueChange={(v) => setFormData(prev => ({ ...prev, delivery_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="blended">Blended</SelectItem>
                  <SelectItem value="self_paced">Self-Paced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (Hours) *</Label>
              <Input
                type="number"
                value={formData.duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label>Learning Objectives</Label>
            <Textarea
              value={formData.objectives}
              onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Internal Instructor</Label>
              <Select value={formData.instructor_employee_id || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, instructor_employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>External Instructor/Provider</Label>
              <Input
                value={formData.instructor || formData.external_provider}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value, external_provider: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Cost per Participant (SAR)</Label>
              <Input
                type="number"
                value={formData.cost_per_participant}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_per_participant: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Max Participants</Label>
              <Input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Prerequisites</Label>
              <Input
                value={formData.prerequisites}
                onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
              />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Input
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                placeholder="e.g., IT Department, Managers"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.certification_awarded}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, certification_awarded: v }))}
              />
              <Label>Awards Certificate</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_mandatory}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_mandatory: v }))}
              />
              <Label>Mandatory Training</Label>
            </div>
          </div>

          {formData.certification_awarded && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Certificate Name</Label>
                <Input
                  value={formData.certification_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, certification_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Validity (Months)</Label>
                <Input
                  type="number"
                  value={formData.certification_validity_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, certification_validity_months: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {program ? 'Update Program' : 'Create Program'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}