import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function PositionForm({ position, positions, companies, onSubmit, onCancel, onSaveDraft }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const [formData, setFormData] = useState(position || {
    position_title: "",
    position_title_ar: "",
    position_code: "",
    department: "",
    company_id: "",
    reports_to_position_id: "",
    level: 3,
    job_grade: "",
    is_managerial: false,
    responsibilities: "",
    requirements: "",
    headcount_allocated: 1,
    salary_range_min: 0,
    salary_range_max: 0,
    status: "active",
    is_published: true,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  };

  const departments = [...new Set(positions.map(p => p.department).filter(Boolean))];
  const parentPositions = positions.filter(p => 
    p.id !== position?.id && 
    (formData.company_id ? p.company_id === formData.company_id : true)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className={`font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Position Title (English) *</Label>
            <Input
              value={formData.position_title}
              onChange={(e) => setFormData({...formData, position_title: e.target.value})}
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Position Title (Arabic)</Label>
            <Input
              value={formData.position_title_ar}
              onChange={(e) => setFormData({...formData, position_title_ar: e.target.value})}
              placeholder="e.g., مهندس برمجيات أول"
              dir="rtl"
            />
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Position Code *</Label>
            <Input
              value={formData.position_code}
              onChange={(e) => setFormData({...formData, position_code: e.target.value})}
              placeholder="e.g., SSE-001"
              required
            />
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Company</Label>
            <Select
              value={formData.company_id}
              onValueChange={(val) => setFormData({...formData, company_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Hierarchy */}
      <div>
        <h3 className={`font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>Hierarchy & Structure</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Department *</Label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              placeholder="e.g., Engineering"
              list="departments-list"
              required
            />
            <datalist id="departments-list">
              {departments.map(dept => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Reports To (Position)</Label>
            <Select
              value={formData.reports_to_position_id}
              onValueChange={(val) => setFormData({...formData, reports_to_position_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None (Top Level)</SelectItem>
                {parentPositions.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.position_title} ({p.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Organizational Level</Label>
            <Select
              value={formData.level.toString()}
              onValueChange={(val) => setFormData({...formData, level: parseInt(val)})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Executive</SelectItem>
                <SelectItem value="2">2 - Senior Manager</SelectItem>
                <SelectItem value="3">3 - Manager</SelectItem>
                <SelectItem value="4">4 - Team Lead</SelectItem>
                <SelectItem value="5">5 - Senior Staff</SelectItem>
                <SelectItem value="6">6 - Staff</SelectItem>
                <SelectItem value="7">7 - Junior Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Job Grade</Label>
            <Input
              value={formData.job_grade}
              onChange={(e) => setFormData({...formData, job_grade: e.target.value})}
              placeholder="e.g., A1, B2, C3"
            />
          </div>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label>Is Managerial Position</Label>
            <Switch
              checked={formData.is_managerial}
              onCheckedChange={(checked) => setFormData({...formData, is_managerial: checked})}
            />
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div>
        <h3 className={`font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>Job Details</h3>
        <div className="space-y-4">
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Responsibilities</Label>
            <Textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
              placeholder="Key responsibilities and duties..."
              className="h-24"
            />
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Requirements</Label>
            <Textarea
              value={formData.requirements}
              onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              placeholder="Required qualifications, experience, and skills..."
              className="h-24"
            />
          </div>
        </div>
      </div>

      {/* Headcount & Compensation */}
      <div>
        <h3 className={`font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>Headcount & Compensation</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Allocated Headcount</Label>
            <Input
              type="number"
              min="1"
              value={formData.headcount_allocated}
              onChange={(e) => setFormData({...formData, headcount_allocated: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Min Salary (SAR)</Label>
            <Input
              type="number"
              min="0"
              value={formData.salary_range_min}
              onChange={(e) => setFormData({...formData, salary_range_min: parseFloat(e.target.value)})}
            />
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Max Salary (SAR)</Label>
            <Input
              type="number"
              min="0"
              value={formData.salary_range_max}
              onChange={(e) => setFormData({...formData, salary_range_max: parseFloat(e.target.value)})}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className={`font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>Status & Settings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({...formData, status: val})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label>Published (Visible for Recruitment)</Label>
            <Switch
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({...formData, is_published: checked})}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className={isRTL ? 'text-right block' : ''}>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Additional notes..."
          className="h-20"
        />
      </div>

      {/* Actions */}
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {onSaveDraft && !position && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSaveDraft}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Clock className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          )}
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            {position ? t('update') : t('create')}
          </Button>
        </div>
      </div>
    </form>
  );
}