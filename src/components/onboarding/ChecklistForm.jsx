import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Save, X, Plus, Trash2 } from "lucide-react";

export default function ChecklistForm({ checklist, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(checklist || {
    checklist_name: '',
    description: '',
    department: '',
    job_role: '',
    duration_days: 30,
    is_active: true
  });

  const [taskTemplates, setTaskTemplates] = useState(checklist?.tasks || [
    {
      task_title: 'Complete employee information form',
      task_description: '',
      task_type: 'document_submission',
      assigned_to: 'new_hire',
      priority: 'high',
      day_number: 1,
      requires_document: true,
      requires_signature: false
    }
  ]);

  const addTask = () => {
    setTaskTemplates([...taskTemplates, {
      task_title: '',
      task_description: '',
      task_type: 'general',
      assigned_to: 'new_hire',
      priority: 'medium',
      day_number: 1,
      requires_document: false,
      requires_signature: false
    }]);
  };

  const removeTask = (index) => {
    setTaskTemplates(taskTemplates.filter((_, i) => i !== index));
  };

  const updateTask = (index, field, value) => {
    const updated = [...taskTemplates];
    updated[index][field] = value;
    setTaskTemplates(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, tasks: taskTemplates });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Checklist Details</h3>
          
          <div>
            <Label>Checklist Name *</Label>
            <Input
              value={formData.checklist_name}
              onChange={(e) => setFormData({ ...formData, checklist_name: e.target.value })}
              placeholder="e.g., Software Developer Onboarding"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this checklist"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Engineering"
              />
            </div>

            <div>
              <Label>Job Role</Label>
              <Input
                value={formData.job_role}
                onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                placeholder="e.g., Software Developer"
              />
            </div>

            <div>
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active (can be assigned to new hires)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Task Templates */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Task Templates</h3>
            <Button type="button" onClick={addTask} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          <div className="space-y-4">
            {taskTemplates.map((task, index) => (
              <Card key={index} className="border border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs">Task Title *</Label>
                        <Input
                          value={task.task_title}
                          onChange={(e) => updateTask(index, 'task_title', e.target.value)}
                          placeholder="Task name"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={task.task_description}
                          onChange={(e) => updateTask(index, 'task_description', e.target.value)}
                          placeholder="Task details"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={task.task_type}
                            onValueChange={(val) => updateTask(index, 'task_type', val)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document_submission">Document</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="system_access">System Access</SelectItem>
                              <SelectItem value="equipment_setup">Equipment</SelectItem>
                              <SelectItem value="policy_review">Policy</SelectItem>
                              <SelectItem value="orientation">Orientation</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Assigned To</Label>
                          <Select
                            value={task.assigned_to}
                            onValueChange={(val) => updateTask(index, 'assigned_to', val)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new_hire">New Hire</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="hr">HR</SelectItem>
                              <SelectItem value="it">IT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Priority</Label>
                          <Select
                            value={task.priority}
                            onValueChange={(val) => updateTask(index, 'priority', val)}
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
                          <Label className="text-xs">Day #</Label>
                          <Input
                            type="number"
                            value={task.day_number}
                            onChange={(e) => updateTask(index, 'day_number', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={task.requires_document}
                            onCheckedChange={(checked) => updateTask(index, 'requires_document', checked)}
                          />
                          Requires Document
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={task.requires_signature}
                            onCheckedChange={(checked) => updateTask(index, 'requires_signature', checked)}
                          />
                          Requires Signature
                        </label>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {checklist ? 'Update Checklist' : 'Create Checklist'}
        </Button>
      </div>
    </form>
  );
}