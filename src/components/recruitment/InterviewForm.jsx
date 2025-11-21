import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InterviewForm({ interview, candidates, requisitions, employees, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    candidate_id: "",
    requisition_id: "",
    interview_type: "behavioral",
    interview_date: "",
    interview_time: "",
    duration_minutes: 60,
    interviewer_ids: [],
    location: "",
    interview_mode: "video_call",
    status: "scheduled",
    notes: ""
  });

  useEffect(() => {
    if (interview) {
      setFormData(interview);
    }
  }, [interview]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const activeCandidates = candidates.filter(c => c.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{interview ? 'Edit Interview' : 'Schedule Interview'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Candidate & Requisition */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Candidate *</Label>
              <Select 
                value={formData.candidate_id} 
                onValueChange={(value) => {
                  const candidate = candidates.find(c => c.id === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    candidate_id: value,
                    requisition_id: candidate?.requisition_id || prev.requisition_id
                  }));
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {activeCandidates.map(cand => (
                    <SelectItem key={cand.id} value={cand.id}>
                      {cand.first_name} {cand.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Interview Type *</Label>
              <Select 
                value={formData.interview_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, interview_type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone_screening">Phone Screening</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="cultural_fit">Cultural Fit</SelectItem>
                  <SelectItem value="final">Final Interview</SelectItem>
                  <SelectItem value="panel">Panel Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.interview_date}
                onChange={(e) => setFormData(prev => ({ ...prev, interview_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Time *</Label>
              <Input
                type="time"
                value={formData.interview_time}
                onChange={(e) => setFormData(prev => ({ ...prev, interview_time: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          {/* Mode & Location */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Interview Mode</Label>
              <Select 
                value={formData.interview_mode} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, interview_mode: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="video_call">Video Call</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location/Link</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder={formData.interview_mode === 'video_call' ? 'Meeting link...' : 'Office location...'}
              />
            </div>
          </div>

          {/* Feedback Section (for completed interviews) */}
          {interview && (
            <>
              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'completed' && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Technical (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.technical_rating || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, technical_rating: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label>Communication (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.communication_rating || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, communication_rating: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label>Cultural Fit (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.cultural_fit_rating || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, cultural_fit_rating: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label>Overall (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.overall_rating || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, overall_rating: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Recommendation</Label>
                    <Select 
                      value={formData.recommendation || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, recommendation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recommendation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strong_hire">Strong Hire</SelectItem>
                        <SelectItem value="hire">Hire</SelectItem>
                        <SelectItem value="maybe">Maybe</SelectItem>
                        <SelectItem value="no_hire">No Hire</SelectItem>
                        <SelectItem value="strong_no_hire">Strong No Hire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Feedback</Label>
                    <Textarea
                      value={formData.feedback || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Interview feedback and observations..."
                      rows={4}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {interview ? 'Update Interview' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}