import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Target, Clock } from "lucide-react";

export default function ProjectForm({ project, employees, onSubmit, onCancel, onSaveDraft }) {
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    description: '',
    client_name: '',
    project_manager_id: '',
    department: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget: 0,
    progress: 0,
    risk_level: 'low',
    tags: [],
    notes: ''
  });

  useEffect(() => {
    if (project) {
      setFormData(project);
    }
  }, [project]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Project Code *</Label>
              <Input
                value={formData.project_code}
                onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                placeholder="PRJ-001"
                required
              />
            </div>

            <div>
              <Label>Project Name *</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description"
                rows={3}
              />
            </div>

            <div>
              <Label>Client Name</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Client or internal department"
              />
            </div>

            <div>
              <Label>Department</Label>
              <Select
                value={formData.department}
                onValueChange={(val) => setFormData({ ...formData, department: val })}
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
          </div>
        </CardContent>
      </Card>

      {/* Project Manager & Status */}
      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Management & Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Project Manager</Label>
              <Select
                value={formData.project_manager_id}
                onValueChange={(val) => setFormData({ ...formData, project_manager_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project manager" />
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

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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

            <div>
              <Label>Risk Level</Label>
              <Select
                value={formData.risk_level}
                onValueChange={(val) => setFormData({ ...formData, risk_level: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Progress (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Budget */}
      <Card className="border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Timeline & Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Budget (SAR)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes or comments"
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-3">
          {onSaveDraft && !project && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSaveDraft}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Clock className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          )}
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            {project ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </div>
    </form>
  );
}