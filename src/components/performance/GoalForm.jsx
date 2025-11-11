import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target } from "lucide-react";

export default function GoalForm({ goal, employees, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    category: 'individual',
    priority: 'medium',
    target_date: '',
    start_date: new Date().toISOString().split('T')[0],
    measurement_criteria: '',
    kpi_target: '',
    kpi_unit: '',
    weight: 0,
    review_period: '',
    notes: ''
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        employee_id: goal.employee_id || '',
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'individual',
        priority: goal.priority || 'medium',
        target_date: goal.target_date || '',
        start_date: goal.start_date || new Date().toISOString().split('T')[0],
        measurement_criteria: goal.measurement_criteria || '',
        kpi_target: goal.kpi_target || '',
        kpi_unit: goal.kpi_unit || '',
        weight: goal.weight || 0,
        review_period: goal.review_period || '',
        notes: goal.notes || ''
      });
    }
  }, [goal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...goal,
      ...formData,
      kpi_target: formData.kpi_target ? parseFloat(formData.kpi_target) : 0,
      weight: parseFloat(formData.weight) || 0
    });
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-600" />
          {goal ? 'Edit Goal' : 'Set New Goal'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!goal && (
            <div>
              <Label>Employee *</Label>
              <Select 
                value={formData.employee_id} 
                onValueChange={(val) => setFormData({ ...formData, employee_id: val })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.job_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Goal Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Increase sales by 20%"
              required
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the goal..."
              rows={3}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="organizational">Organizational</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Target Date *</Label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                min={formData.start_date}
                required
              />
            </div>
          </div>

          <div>
            <Label>Success Measurement Criteria</Label>
            <Textarea
              value={formData.measurement_criteria}
              onChange={(e) => setFormData({ ...formData, measurement_criteria: e.target.value })}
              placeholder="How will success be measured?"
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>KPI Target</Label>
              <Input
                type="number"
                value={formData.kpi_target}
                onChange={(e) => setFormData({ ...formData, kpi_target: e.target.value })}
                placeholder="100"
              />
            </div>

            <div>
              <Label>KPI Unit</Label>
              <Input
                value={formData.kpi_unit}
                onChange={(e) => setFormData({ ...formData, kpi_unit: e.target.value })}
                placeholder="sales, tasks, %"
              />
            </div>

            <div>
              <Label>Weight (%)</Label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="20"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div>
            <Label>Review Period</Label>
            <Input
              value={formData.review_period}
              onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
              placeholder="Q1 2025, Annual 2024"
            />
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}