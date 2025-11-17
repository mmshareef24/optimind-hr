import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function BudgetForm({ budget, departments, positions, employees, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    budget_year: new Date().getFullYear(),
    budget_period: `${new Date().getFullYear()}-Annual`,
    department: '',
    position_id: '',
    budget_type: 'departmental',
    allocated_headcount: 0,
    budgeted_salary_cost: 0,
    budgeted_benefits_cost: 0,
    budgeted_gosi_cost: 0,
    total_budgeted_cost: 0,
    status: 'draft',
    notes: ''
  });

  const selectedPosition = positions.find(p => p.id === formData.position_id);
  const salaryInRange = selectedPosition 
    ? formData.budgeted_salary_cost >= (selectedPosition.min_salary || 0) && 
      formData.budgeted_salary_cost <= (selectedPosition.max_salary || Infinity)
    : true;

  useEffect(() => {
    if (budget) {
      setFormData(budget);
    }
  }, [budget]);

  useEffect(() => {
    const total = 
      parseFloat(formData.budgeted_salary_cost || 0) +
      parseFloat(formData.budgeted_benefits_cost || 0) +
      parseFloat(formData.budgeted_gosi_cost || 0);
    
    setFormData(prev => ({ ...prev, total_budgeted_cost: total }));
  }, [formData.budgeted_salary_cost, formData.budgeted_benefits_cost, formData.budgeted_gosi_cost]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{budget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget Year</Label>
              <Select 
                value={formData.budget_year.toString()} 
                onValueChange={(v) => setFormData({...formData, budget_year: parseInt(v)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Budget Period</Label>
              <Input
                value={formData.budget_period}
                onChange={(e) => setFormData({...formData, budget_period: e.target.value})}
                placeholder="e.g., 2025-Q1 or 2025-Annual"
              />
            </div>
          </div>

          <div>
            <Label>Budget Type</Label>
            <Select 
              value={formData.budget_type} 
              onValueChange={(v) => setFormData({...formData, budget_type: v})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departmental">Departmental</SelectItem>
                <SelectItem value="position">Position-Based</SelectItem>
                <SelectItem value="total_headcount">Total Headcount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.budget_type !== 'total_headcount' && (
            <div>
              <Label>Department</Label>
              <Select 
                value={formData.department} 
                onValueChange={(v) => setFormData({...formData, department: v})}
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
          )}

          {formData.budget_type === 'position' && (
            <div>
              <Label>Position (Optional)</Label>
              <Select 
                value={formData.position_id} 
                onValueChange={(v) => {
                  const pos = positions.find(p => p.id === v);
                  const suggestedSalary = pos && pos.min_salary && pos.max_salary
                    ? Math.round((pos.min_salary + pos.max_salary) / 2)
                    : formData.budgeted_salary_cost;
                  setFormData({
                    ...formData, 
                    position_id: v,
                    budgeted_salary_cost: suggestedSalary
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {positions
                    .filter(p => !formData.department || p.department === formData.department)
                    .map(pos => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.position_title}
                        {pos.min_salary && pos.max_salary && (
                          <span className="text-xs text-slate-500 ml-2">
                            ({pos.min_salary.toLocaleString()} - {pos.max_salary.toLocaleString()} SAR)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedPosition && selectedPosition.min_salary && selectedPosition.max_salary && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Position Salary Scale</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Min: {selectedPosition.min_salary.toLocaleString()} SAR</span>
                    <span className="text-slate-600">Max: {selectedPosition.max_salary.toLocaleString()} SAR</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Allocated Headcount</Label>
            <Input
              type="number"
              value={formData.allocated_headcount}
              onChange={(e) => setFormData({...formData, allocated_headcount: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Budgeted Salary (SAR)</Label>
              <Input
                type="number"
                value={formData.budgeted_salary_cost}
                onChange={(e) => setFormData({...formData, budgeted_salary_cost: parseFloat(e.target.value) || 0})}
                className={!salaryInRange ? 'border-amber-500' : ''}
              />
              {!salaryInRange && selectedPosition && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Outside position salary scale
                </p>
              )}
            </div>

            <div>
              <Label>Budgeted Benefits (SAR)</Label>
              <Input
                type="number"
                value={formData.budgeted_benefits_cost}
                onChange={(e) => setFormData({...formData, budgeted_benefits_cost: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <Label>Budgeted GOSI (SAR)</Label>
              <Input
                type="number"
                value={formData.budgeted_gosi_cost}
                onChange={(e) => setFormData({...formData, budgeted_gosi_cost: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
            <Label>Total Budgeted Cost (SAR)</Label>
            <Input
              type="number"
              value={formData.total_budgeted_cost}
              disabled
              className="bg-slate-50"
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(v) => setFormData({...formData, status: v})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="exceeded">Exceeded</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {budget ? 'Update' : 'Create'} Budget
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}