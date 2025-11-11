import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Calendar, FolderKanban, CheckCircle2 } from "lucide-react";

export default function TimeEntryForm({ 
  entry,
  employee,
  projects = [],
  tasks = [],
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    employee_id: employee?.id || '',
    project_id: '',
    task_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    overtime_hours: 0,
    description: '',
    entry_type: 'regular',
    status: 'draft',
    is_billable: true,
    hourly_rate: 0,
    notes: ''
  });

  useEffect(() => {
    if (entry) {
      setFormData(entry);
    }
  }, [entry]);

  const handleSubmit = (e, submitType = 'draft') => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: submitType
    });
  };

  // Filter tasks based on selected project
  const projectTasks = formData.project_id 
    ? tasks.filter(t => t.project_id === formData.project_id)
    : [];

  return (
    <form className="space-y-6">
      {/* Date & Hours */}
      <Card className="border-emerald-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Time Details
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <Label>Entry Type</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(val) => setFormData({ ...formData, entry_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Hours</SelectItem>
                  <SelectItem value="overtime">Overtime</SelectItem>
                  <SelectItem value="project">Project Work</SelectItem>
                  <SelectItem value="task">Task Work</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Regular Hours *</Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label>Overtime Hours</Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.overtime_hours}
                onChange={(e) => setFormData({ ...formData, overtime_hours: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-900">
              <strong>Total Hours:</strong> {(formData.hours + formData.overtime_hours).toFixed(2)}h
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Project & Task Assignment */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            Project Assignment
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Project (Optional)</Label>
              <Select
                value={formData.project_id}
                onValueChange={(val) => setFormData({ 
                  ...formData, 
                  project_id: val,
                  task_id: '' // Reset task when project changes
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name} ({project.project_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.project_id && (
              <div>
                <Label>Task (Optional)</Label>
                <Select
                  value={formData.task_id}
                  onValueChange={(val) => setFormData({ ...formData, task_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No Task</SelectItem>
                    {projectTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.task_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="billable"
              checked={formData.is_billable}
              onCheckedChange={(checked) => setFormData({ ...formData, is_billable: checked })}
            />
            <label
              htmlFor="billable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Billable to client
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <div>
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the work performed"
          rows={3}
          required
        />
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={(e) => handleSubmit(e, 'draft')}
        >
          Save as Draft
        </Button>
        <Button 
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={(e) => handleSubmit(e, 'submitted')}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Submit for Approval
        </Button>
      </div>
    </form>
  );
}