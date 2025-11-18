import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SharedServiceForm({ open, onOpenChange, employee, assignment, companies, existingAssignments }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(assignment || {
    company_id: "",
    service_type: "it_support",
    allocation_percentage: 0,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: "",
    cost_allocation_amount: 0,
    responsibilities: "",
    status: "active",
    notes: ""
  });

  React.useEffect(() => {
    if (assignment) {
      setFormData(assignment);
    } else {
      setFormData({
        company_id: "",
        service_type: "it_support",
        allocation_percentage: 0,
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: "",
        cost_allocation_amount: 0,
        responsibilities: "",
        status: "active",
        notes: ""
      });
    }
  }, [assignment, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedServiceAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-service-assignments']);
      toast.success('Assignment created successfully');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to create assignment');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SharedServiceAssignment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-service-assignments']);
      toast.success('Assignment updated successfully');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update assignment');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const activeAssignments = existingAssignments.filter(a => 
      a.status === 'active' && 
      a.id !== assignment?.id
    );
    const totalAllocation = activeAssignments.reduce((sum, a) => sum + (a.allocation_percentage || 0), 0);
    
    if (totalAllocation + parseFloat(formData.allocation_percentage) > 100) {
      toast.error(`Total allocation cannot exceed 100%. Current: ${totalAllocation}%`);
      return;
    }

    const data = {
      ...formData,
      employee_id: employee.id,
      allocation_percentage: parseFloat(formData.allocation_percentage),
      cost_allocation_amount: parseFloat(formData.cost_allocation_amount) || 0
    };

    if (assignment) {
      updateMutation.mutate({ id: assignment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const availableCompanies = companies.filter(c => 
    c.id !== employee?.company_id && 
    !existingAssignments.some(a => a.company_id === c.id && a.id !== assignment?.id && a.status === 'active')
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Edit' : 'Add'} Shared Service Assignment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Company *</Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              required
              disabled={!!assignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              Primary company: {companies.find(c => c.id === employee?.company_id)?.name_en}
            </p>
          </div>

          <div>
            <Label>Service Type *</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it_support">IT Support</SelectItem>
                <SelectItem value="hr_services">HR Services</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="facilities">Facilities</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Allocation Percentage * (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.allocation_percentage}
                onChange={(e) => setFormData({ ...formData, allocation_percentage: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Cost Allocation (SAR/month)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_allocation_amount}
                onChange={(e) => setFormData({ ...formData, cost_allocation_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Effective From *</Label>
              <Input
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Effective To (Optional)</Label>
              <Input
                type="date"
                value={formData.effective_to}
                onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Responsibilities</Label>
            <Textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="Specific responsibilities for this company..."
              rows={3}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                assignment ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}