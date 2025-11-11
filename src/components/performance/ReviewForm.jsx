import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, FileText } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function ReviewForm({ review, employee, goals, onSubmit, onCancel, isSelfAssessment = false }) {
  const [formData, setFormData] = useState({
    review_period: '',
    review_type: 'quarterly',
    quality_of_work: 3,
    productivity: 3,
    communication: 3,
    teamwork: 3,
    initiative: 3,
    attendance_punctuality: 3,
    technical_skills: 3,
    leadership: 3,
    strengths: '',
    areas_for_improvement: '',
    achievements: '',
    manager_comments: '',
    self_assessment_comments: '',
    development_plan: '',
    recommended_action: 'no_action'
  });

  useEffect(() => {
    if (review) {
      setFormData({
        review_period: review.review_period || '',
        review_type: review.review_type || 'quarterly',
        quality_of_work: review.quality_of_work || 3,
        productivity: review.productivity || 3,
        communication: review.communication || 3,
        teamwork: review.teamwork || 3,
        initiative: review.initiative || 3,
        attendance_punctuality: review.attendance_punctuality || 3,
        technical_skills: review.technical_skills || 3,
        leadership: review.leadership || 3,
        strengths: review.strengths || '',
        areas_for_improvement: review.areas_for_improvement || '',
        achievements: review.achievements || '',
        manager_comments: review.manager_comments || '',
        self_assessment_comments: review.self_assessment_comments || '',
        development_plan: review.development_plan || '',
        recommended_action: review.recommended_action || 'no_action'
      });
    }
  }, [review]);

  const calculateOverallRating = () => {
    const ratings = [
      formData.quality_of_work,
      formData.productivity,
      formData.communication,
      formData.teamwork,
      formData.initiative,
      formData.attendance_punctuality,
      formData.technical_skills,
      formData.leadership
    ];
    const sum = ratings.reduce((a, b) => a + b, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const goalsData = goals ? {
      goals_met: goals.filter(g => g.status === 'completed').length,
      total_goals: goals.length
    } : {};

    onSubmit({
      ...review,
      ...formData,
      overall_rating: parseFloat(calculateOverallRating()),
      ...goalsData,
      status: isSelfAssessment ? 'manager_review_pending' : 'completed',
      review_date: new Date().toISOString().split('T')[0]
    });
  };

  const RatingSlider = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-slate-700">{value}</span>
          <Star className={`w-4 h-4 ${value >= 4 ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={1}
        max={5}
        step={0.5}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          {isSelfAssessment ? 'Self-Assessment' : 'Performance Review'}
          {employee && ` - ${employee.first_name} ${employee.last_name}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Review Period *</Label>
              <Input
                value={formData.review_period}
                onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                placeholder="Q1 2025, Annual 2024"
                required
              />
            </div>
            <div>
              <Label>Review Type</Label>
              <Select 
                value={formData.review_type} 
                onValueChange={(val) => setFormData({ ...formData, review_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="mid_year">Mid-Year</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="project_based">Project-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Goals Summary */}
          {goals && goals.length > 0 && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-2">Goals Performance</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-emerald-600">Total Goals:</span>
                  <span className="ml-2 font-semibold">{goals.length}</span>
                </div>
                <div>
                  <span className="text-emerald-600">Completed:</span>
                  <span className="ml-2 font-semibold">{goals.filter(g => g.status === 'completed').length}</span>
                </div>
                <div>
                  <span className="text-emerald-600">Success Rate:</span>
                  <span className="ml-2 font-semibold">
                    {goals.length > 0 ? ((goals.filter(g => g.status === 'completed').length / goals.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Ratings */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Performance Ratings (1-5)</h3>
            <div className="space-y-4">
              <RatingSlider
                label="Quality of Work"
                value={formData.quality_of_work}
                onChange={(val) => setFormData({ ...formData, quality_of_work: val })}
              />
              <RatingSlider
                label="Productivity"
                value={formData.productivity}
                onChange={(val) => setFormData({ ...formData, productivity: val })}
              />
              <RatingSlider
                label="Communication"
                value={formData.communication}
                onChange={(val) => setFormData({ ...formData, communication: val })}
              />
              <RatingSlider
                label="Teamwork"
                value={formData.teamwork}
                onChange={(val) => setFormData({ ...formData, teamwork: val })}
              />
              <RatingSlider
                label="Initiative"
                value={formData.initiative}
                onChange={(val) => setFormData({ ...formData, initiative: val })}
              />
              <RatingSlider
                label="Attendance & Punctuality"
                value={formData.attendance_punctuality}
                onChange={(val) => setFormData({ ...formData, attendance_punctuality: val })}
              />
              <RatingSlider
                label="Technical Skills"
                value={formData.technical_skills}
                onChange={(val) => setFormData({ ...formData, technical_skills: val })}
              />
              <RatingSlider
                label="Leadership"
                value={formData.leadership}
                onChange={(val) => setFormData({ ...formData, leadership: val })}
              />
            </div>

            {/* Overall Rating Display */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-900">Overall Rating</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-blue-600">{calculateOverallRating()}</span>
                  <span className="text-slate-600">/ 5.0</span>
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div>
            <Label>Key Achievements</Label>
            <Textarea
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              placeholder="List major accomplishments during this period..."
              rows={3}
            />
          </div>

          <div>
            <Label>Strengths</Label>
            <Textarea
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              placeholder="Key strengths demonstrated..."
              rows={3}
            />
          </div>

          <div>
            <Label>Areas for Improvement</Label>
            <Textarea
              value={formData.areas_for_improvement}
              onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
              placeholder="Areas that need development..."
              rows={3}
            />
          </div>

          {isSelfAssessment ? (
            <div>
              <Label>Self-Assessment Comments</Label>
              <Textarea
                value={formData.self_assessment_comments}
                onChange={(e) => setFormData({ ...formData, self_assessment_comments: e.target.value })}
                placeholder="Your thoughts on your performance..."
                rows={4}
              />
            </div>
          ) : (
            <>
              <div>
                <Label>Manager Comments</Label>
                <Textarea
                  value={formData.manager_comments}
                  onChange={(e) => setFormData({ ...formData, manager_comments: e.target.value })}
                  placeholder="Overall assessment and feedback..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Development Plan</Label>
                <Textarea
                  value={formData.development_plan}
                  onChange={(e) => setFormData({ ...formData, development_plan: e.target.value })}
                  placeholder="Training, development, and growth opportunities..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Recommended Action</Label>
                <Select 
                  value={formData.recommended_action} 
                  onValueChange={(val) => setFormData({ ...formData, recommended_action: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_action">No Action</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="salary_increase">Salary Increase</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="pip">Performance Improvement Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {isSelfAssessment ? 'Submit Self-Assessment' : 'Complete Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}