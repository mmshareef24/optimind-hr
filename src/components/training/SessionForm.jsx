import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SessionForm({ session, programs, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    program_id: "",
    session_name: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    instructor: "",
    max_participants: "",
    status: "scheduled",
    notes: ""
  });

  useEffect(() => {
    if (session) setFormData(session);
  }, [session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const activePrograms = programs.filter(p => p.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Session' : 'Schedule Training Session'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Training Program *</Label>
            <Select value={formData.program_id} onValueChange={(v) => setFormData(prev => ({ ...prev, program_id: v }))} required>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>
                {activePrograms.map(prog => (
                  <SelectItem key={prog.id} value={prog.id}>{prog.program_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Session Name *</Label>
            <Input
              value={formData.session_name}
              onChange={(e) => setFormData(prev => ({ ...prev, session_name: e.target.value }))}
              placeholder="e.g., Batch 1 - January 2025"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} required />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={formData.start_time} onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={formData.end_time} onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} placeholder="Room / Meeting Link" />
            </div>
            <div>
              <Label>Max Participants</Label>
              <Input type="number" value={formData.max_participants} onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div>
            <Label>Instructor</Label>
            <Input value={formData.instructor} onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))} />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {session ? 'Update Session' : 'Schedule Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}