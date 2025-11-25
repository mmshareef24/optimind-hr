import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function EnrollmentForm({ enrollment, programs, sessions, employees, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    employee_id: "",
    program_id: "",
    session_id: "",
    enrollment_date: new Date().toISOString().split('T')[0],
    status: "enrolled",
    completion_date: "",
    score: "",
    passed: false,
    feedback_rating: "",
    feedback_comments: "",
    cost: 0,
    notes: ""
  });

  useEffect(() => {
    if (enrollment) setFormData(enrollment);
  }, [enrollment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const activePrograms = programs.filter(p => p.status === 'active');
  const filteredSessions = sessions.filter(s => s.program_id === formData.program_id);
  const activeEmployees = employees.filter(e => e.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{enrollment ? 'Update Enrollment' : 'Enroll Employee'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Employee *</Label>
            <Select value={formData.employee_id} onValueChange={(v) => setFormData(prev => ({ ...prev, employee_id: v }))} required disabled={!!enrollment}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {activeEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} - {emp.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Training Program *</Label>
            <Select value={formData.program_id} onValueChange={(v) => setFormData(prev => ({ ...prev, program_id: v, session_id: '' }))} required disabled={!!enrollment}>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>
                {activePrograms.map(prog => (
                  <SelectItem key={prog.id} value={prog.id}>{prog.program_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredSessions.length > 0 && (
            <div>
              <Label>Session (Optional)</Label>
              <Select value={formData.session_id || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, session_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No specific session</SelectItem>
                  {filteredSessions.map(sess => (
                    <SelectItem key={sess.id} value={sess.id}>{sess.session_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Enrollment Date</Label>
              <Input type="date" value={formData.enrollment_date} onChange={(e) => setFormData(prev => ({ ...prev, enrollment_date: e.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.status === 'completed' || formData.status === 'failed') && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Completion Date</Label>
                  <Input type="date" value={formData.completion_date} onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Score</Label>
                  <Input type="number" value={formData.score} onChange={(e) => setFormData(prev => ({ ...prev, score: parseFloat(e.target.value) }))} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={formData.passed} onCheckedChange={(v) => setFormData(prev => ({ ...prev, passed: v }))} />
                <Label>Passed</Label>
              </div>

              <div>
                <Label>Feedback Rating (1-5)</Label>
                <Input type="number" min="1" max="5" value={formData.feedback_rating} onChange={(e) => setFormData(prev => ({ ...prev, feedback_rating: parseInt(e.target.value) }))} />
              </div>

              <div>
                <Label>Feedback Comments</Label>
                <Textarea value={formData.feedback_comments} onChange={(e) => setFormData(prev => ({ ...prev, feedback_comments: e.target.value }))} rows={3} />
              </div>
            </>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {enrollment ? 'Update Enrollment' : 'Enroll Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}