import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, X } from "lucide-react";

export default function TaskForm({ 
  task, 
  projectId,
  employees = [],
  allTasks = [],
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    project_id: projectId,
    task_name: '',
    description: '',
    assigned_to: '',
    status: 'todo',
    priority: 'medium',
    start_date: '',
    due_date: '',
    estimated_hours: 0,
    actual_hours: 0,
    progress: 0,
    dependencies: [],
    tags: [],
    notes: ''
  });

  const [selectedDependencies, setSelectedDependencies] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (task) {
      setFormData(task);
      setSelectedDependencies(task.dependencies || []);
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      dependencies: selectedDependencies
    });
  };

  const toggleDependency = (taskId) => {
    if (selectedDependencies.includes(taskId)) {
      setSelectedDependencies(selectedDependencies.filter(id => id !== taskId));
    } else {
      setSelectedDependencies([...selectedDependencies, taskId]);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  // Filter out current task from dependencies list
  const availableTasks = allTasks.filter(t => t.id !== task?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-emerald-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Task Information</h3>
          <div className="space-y-4">
            <div>
              <Label>Task Name *</Label>
              <Input
                value={formData.task_name}
                onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                placeholder="Enter task name"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Assign To *</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(val) => setFormData({ ...formData, assigned_to: val })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
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
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
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
                    <SelectItem value="urgent">Urgent</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Hours */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Timeline & Hours</h3>
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
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label>Actual Hours</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.actual_hours}
                onChange={(e) => setFormData({ ...formData, actual_hours: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependencies */}
      {availableTasks.length > 0 && (
        <Card className="border-purple-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Task Dependencies</h3>
            <p className="text-sm text-slate-600 mb-4">
              Select tasks that must be completed before this task can start
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableTasks.map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedDependencies.includes(t.id)}
                    onCheckedChange={() => toggleDependency(t.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{t.task_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {t.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {t.priority}
                      </Badge>
                    </div>
                  </div>
                  {t.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              ))}
            </div>
            {selectedDependencies.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-900">
                  <strong>{selectedDependencies.length}</strong> {selectedDependencies.length === 1 ? 'dependency' : 'dependencies'} selected
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      <Card className="border-amber-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Tags</h3>
          <div className="flex gap-2 mb-3">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
            />
            <Button type="button" onClick={addTag} variant="outline">
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}