import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, Calendar, CheckCircle2 } from "lucide-react";

export default function MilestoneForm({ 
  milestone, 
  projectId,
  existingMilestones = [],
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    project_id: projectId,
    milestone_name: '',
    description: '',
    due_date: '',
    completed_date: '',
    status: 'pending',
    deliverables: '',
    order: existingMilestones.length + 1
  });

  useEffect(() => {
    if (milestone) {
      setFormData(milestone);
    }
  }, [milestone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-emerald-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-600" />
            Milestone Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Milestone Name *</Label>
              <Input
                value={formData.milestone_name}
                onChange={(e) => setFormData({ ...formData, milestone_name: e.target.value })}
                placeholder="e.g., Project Kickoff, Alpha Release, Final Delivery"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this milestone and its significance"
                rows={3}
              />
            </div>

            <div>
              <Label>Deliverables</Label>
              <Textarea
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                placeholder="List expected deliverables for this milestone"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Status */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Timeline & Status
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => {
                  const updates = { status: val };
                  // Auto-set completed date when marking as completed
                  if (val === 'completed' && !formData.completed_date) {
                    updates.completed_date = new Date().toISOString().split('T')[0];
                  }
                  setFormData({ ...formData, ...updates });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'completed' && (
              <div>
                <Label>Completed Date</Label>
                <Input
                  type="date"
                  value={formData.completed_date}
                  onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Controls the order in which milestones appear
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {milestone ? 'Update Milestone' : 'Create Milestone'}
        </Button>
      </div>
    </form>
  );
}