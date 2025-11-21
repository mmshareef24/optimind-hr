import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RequisitionForm({ requisition, positions, budgets, employees, departments, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    position_id: "",
    department: "",
    job_title: "",
    number_of_openings: 1,
    employment_type: "full_time",
    priority: "medium",
    salary_range_min: "",
    salary_range_max: "",
    budget_allocation_id: "",
    hiring_manager: "",
    job_description: "",
    required_qualifications: "",
    preferred_qualifications: "",
    target_start_date: "",
    deadline_date: "",
    status: "draft",
    notes: ""
  });

  const [budgetCheck, setBudgetCheck] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    if (requisition) {
      setFormData(requisition);
      if (requisition.position_id) {
        const pos = positions.find(p => p.id === requisition.position_id);
        setSelectedPosition(pos);
      }
    }
  }, [requisition, positions]);

  useEffect(() => {
    // Auto-fill when position is selected
    if (formData.position_id && positions.length > 0) {
      const pos = positions.find(p => p.id === formData.position_id);
      if (pos) {
        setSelectedPosition(pos);
        setFormData(prev => ({
          ...prev,
          job_title: pos.title || prev.job_title,
          department: pos.department || prev.department,
          salary_range_min: pos.min_salary || prev.salary_range_min,
          salary_range_max: pos.max_salary || prev.salary_range_max
        }));
        
        // Check budget availability
        checkBudgetAvailability(pos);
      }
    }
  }, [formData.position_id, positions]);

  const checkBudgetAvailability = (position) => {
    if (!position) return;
    
    const currentYear = new Date().getFullYear();
    const positionBudgets = budgets.filter(b => 
      b.position_id === position.id && 
      b.budget_year === currentYear &&
      b.status === 'active'
    );

    if (positionBudgets.length > 0) {
      const budget = positionBudgets[0];
      const vacantPositions = (budget.allocated_headcount || 0) - (budget.actual_headcount || 0);
      
      if (vacantPositions > 0) {
        setBudgetCheck({
          status: 'available',
          message: `Budget approved: ${vacantPositions} position(s) available`,
          budget
        });
      } else {
        setBudgetCheck({
          status: 'exceeded',
          message: 'Budget limit reached for this position',
          budget
        });
      }
    } else {
      setBudgetCheck({
        status: 'not_found',
        message: 'No budget allocation found for this position'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      budget_approved: budgetCheck?.status === 'available',
      budget_allocation_id: budgetCheck?.budget?.id || null,
      requisition_number: requisition?.requisition_number || `REQ-${Date.now()}`
    };
    
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{requisition ? 'Edit Requisition' : 'Create Job Requisition'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Position (Optional)</Label>
              <Select 
                value={formData.position_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, position_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None (Manual Entry)</SelectItem>
                  {positions.filter(p => p.status === 'published').map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title} - {pos.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Job Title *</Label>
              <Input
                value={formData.job_title}
                onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>
          </div>

          {/* Budget Check Alert */}
          {budgetCheck && (
            <Alert className={
              budgetCheck.status === 'available' ? 'border-emerald-200 bg-emerald-50' :
              budgetCheck.status === 'exceeded' ? 'border-red-200 bg-red-50' :
              'border-amber-200 bg-amber-50'
            }>
              {budgetCheck.status === 'available' ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              <AlertDescription className={
                budgetCheck.status === 'available' ? 'text-emerald-900' :
                budgetCheck.status === 'exceeded' ? 'text-red-900' :
                'text-amber-900'
              }>
                {budgetCheck.message}
                {budgetCheck.budget && (
                  <div className="mt-2 text-sm">
                    Budget: {budgetCheck.budget.total_budgeted_cost?.toLocaleString()} SAR | 
                    Allocated: {budgetCheck.budget.allocated_headcount} | 
                    Current: {budgetCheck.budget.actual_headcount}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Number of Openings *</Label>
              <Input
                type="number"
                min="1"
                value={formData.number_of_openings}
                onChange={(e) => setFormData(prev => ({ ...prev, number_of_openings: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div>
              <Label>Employment Type</Label>
              <Select 
                value={formData.employment_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary & Priority */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Min Salary (SAR)</Label>
              <Input
                type="number"
                value={formData.salary_range_min}
                onChange={(e) => setFormData(prev => ({ ...prev, salary_range_min: parseFloat(e.target.value) }))}
                placeholder="e.g., 8000"
              />
            </div>

            <div>
              <Label>Max Salary (SAR)</Label>
              <Input
                type="number"
                value={formData.salary_range_max}
                onChange={(e) => setFormData(prev => ({ ...prev, salary_range_max: parseFloat(e.target.value) }))}
                placeholder="e.g., 12000"
              />
            </div>

            <div>
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hiring Manager */}
          <div>
            <Label>Hiring Manager</Label>
            <Select 
              value={formData.hiring_manager} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, hiring_manager: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hiring manager" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Target Start Date</Label>
              <Input
                type="date"
                value={formData.target_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, target_start_date: e.target.value }))}
              />
            </div>

            <div>
              <Label>Deadline to Fill</Label>
              <Input
                type="date"
                value={formData.deadline_date}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <Label>Job Description</Label>
            <Textarea
              value={formData.job_description}
              onChange={(e) => setFormData(prev => ({ ...prev, job_description: e.target.value }))}
              placeholder="Detailed job description..."
              rows={4}
            />
          </div>

          {/* Qualifications */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Required Qualifications</Label>
              <Textarea
                value={formData.required_qualifications}
                onChange={(e) => setFormData(prev => ({ ...prev, required_qualifications: e.target.value }))}
                placeholder="Must-have qualifications..."
                rows={3}
              />
            </div>

            <div>
              <Label>Preferred Qualifications</Label>
              <Textarea
                value={formData.preferred_qualifications}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_qualifications: e.target.value }))}
                placeholder="Nice-to-have qualifications..."
                rows={3}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {requisition ? 'Update Requisition' : 'Create Requisition'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}