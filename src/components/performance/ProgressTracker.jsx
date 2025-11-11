import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function ProgressTracker({ goal, onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [updateData, setUpdateData] = useState({
    progress: goal.progress || 0,
    kpi_current: goal.kpi_current || 0,
    status: goal.status || 'in_progress',
    notes: ''
  });

  const handleSubmit = () => {
    onUpdate(goal.id, updateData);
    setShowDialog(false);
    setUpdateData({
      progress: goal.progress || 0,
      kpi_current: goal.kpi_current || 0,
      status: goal.status || 'in_progress',
      notes: ''
    });
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Update Progress
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Goal Progress</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">{goal.title}</h4>
              <p className="text-sm text-slate-600">{goal.description}</p>
            </div>

            <div>
              <Label>Progress (%)</Label>
              <Input
                type="number"
                value={updateData.progress}
                onChange={(e) => setUpdateData({ ...updateData, progress: parseInt(e.target.value) })}
                min="0"
                max="100"
              />
            </div>

            {goal.kpi_target && (
              <div>
                <Label>Current KPI Value</Label>
                <Input
                  type="number"
                  value={updateData.kpi_current}
                  onChange={(e) => setUpdateData({ ...updateData, kpi_current: parseFloat(e.target.value) })}
                  placeholder={`Target: ${goal.kpi_target} ${goal.kpi_unit}`}
                />
              </div>
            )}

            <div>
              <Label>Status</Label>
              <Select 
                value={updateData.status} 
                onValueChange={(val) => setUpdateData({ ...updateData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Update Notes</Label>
              <Textarea
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                placeholder="What progress has been made?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
              Update Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}