import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CandidateForm({ candidate, requisitions, employees, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    requisition_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    nationality: "",
    current_location: "",
    resume_url: "",
    linkedin_profile: "",
    current_employer: "",
    current_job_title: "",
    years_of_experience: "",
    expected_salary: "",
    notice_period: "",
    source: "website",
    referral_employee_id: "",
    stage: "applied",
    screening_notes: ""
  });

  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (candidate) {
      setFormData(candidate);
    }
  }, [candidate]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, resume_url: file_url }));
      toast.success("Resume uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      application_date: candidate?.application_date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{candidate ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Requisition */}
          <div>
            <Label>Job Requisition *</Label>
            <Select 
              value={formData.requisition_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, requisition_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job requisition" />
              </SelectTrigger>
              <SelectContent>
                {requisitions.filter(r => r.status !== 'filled' && r.status !== 'cancelled').map(req => (
                  <SelectItem key={req.id} value={req.id}>
                    {req.job_title} - {req.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personal Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nationality</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
              />
            </div>

            <div>
              <Label>Current Location</Label>
              <Input
                value={formData.current_location}
                onChange={(e) => setFormData(prev => ({ ...prev, current_location: e.target.value }))}
              />
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <Label>Resume (PDF, DOC - Max 5MB)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              disabled={uploadingResume}
            />
            {formData.resume_url && (
              <a 
                href={formData.resume_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 hover:underline mt-1 inline-block"
              >
                View uploaded resume
              </a>
            )}
          </div>

          {/* Professional Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Current Employer</Label>
              <Input
                value={formData.current_employer}
                onChange={(e) => setFormData(prev => ({ ...prev, current_employer: e.target.value }))}
              />
            </div>

            <div>
              <Label>Current Job Title</Label>
              <Input
                value={formData.current_job_title}
                onChange={(e) => setFormData(prev => ({ ...prev, current_job_title: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Years of Experience</Label>
              <Input
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Expected Salary (SAR)</Label>
              <Input
                type="number"
                value={formData.expected_salary}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_salary: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Notice Period (Days)</Label>
              <Input
                type="number"
                value={formData.notice_period}
                onChange={(e) => setFormData(prev => ({ ...prev, notice_period: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          {/* Source & Referral */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Source</Label>
              <Select 
                value={formData.source} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="referral">Employee Referral</SelectItem>
                  <SelectItem value="job_board">Job Board</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.source === 'referral' && (
              <div>
                <Label>Referring Employee</Label>
                <Select 
                  value={formData.referral_employee_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, referral_employee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Stage */}
          <div>
            <Label>Current Stage</Label>
            <Select 
              value={formData.stage} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="phone_interview">Phone Interview</SelectItem>
                <SelectItem value="technical_test">Technical Test</SelectItem>
                <SelectItem value="in_person_interview">In-Person Interview</SelectItem>
                <SelectItem value="final_interview">Final Interview</SelectItem>
                <SelectItem value="offer_extended">Offer Extended</SelectItem>
                <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* LinkedIn */}
          <div>
            <Label>LinkedIn Profile</Label>
            <Input
              type="url"
              value={formData.linkedin_profile}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin_profile: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          {/* Screening Notes */}
          <div>
            <Label>Screening Notes</Label>
            <Textarea
              value={formData.screening_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, screening_notes: e.target.value }))}
              placeholder="Initial screening notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {candidate ? 'Update Candidate' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}