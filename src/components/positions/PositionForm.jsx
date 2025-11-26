import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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

const DEFAULT_LEVELS = [
  { level_number: 1, name_en: "Executive", name_ar: "تنفيذي" },
  { level_number: 2, name_en: "Senior Manager", name_ar: "مدير أول" },
  { level_number: 3, name_en: "Manager", name_ar: "مدير" },
  { level_number: 4, name_en: "Team Lead", name_ar: "قائد فريق" },
  { level_number: 5, name_en: "Senior Staff", name_ar: "موظف أول" },
  { level_number: 6, name_en: "Staff", name_ar: "موظف" },
  { level_number: 7, name_en: "Junior Staff", name_ar: "موظف مبتدئ" },
];

export default function PositionForm({ position, positions, companies, employees, departments, onSubmit, onCancel, onSaveDraft }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  const { data: orgLevels = [] } = useQuery({
    queryKey: ['org-levels'],
    queryFn: () => base44.entities.OrgLevel.list(),
  });

  // Use custom levels if available, otherwise use defaults
  const levels = orgLevels.length > 0 
    ? [...orgLevels].sort((a, b) => a.level_number - b.level_number)
    : DEFAULT_LEVELS;
  
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

  const departmentsList = departments || [...new Set(positions.map(p => p.department).filter(Boolean))];
  
  // Filter positions for 'Reports To' dropdown - only exclude current position
  const parentPositions = positions.filter(p => p.id !== position?.id);

  // Get employees in selected department
  const departmentEmployees = formData.department 
    ? (employees || []).filter(emp => emp.department === formData.department && emp.status === 'active')
    : [];

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
            <Select
              value={formData.department}
              onValueChange={(val) => setFormData({...formData, department: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {(departments || departmentsList).map(dept => (
                  <SelectItem key={typeof dept === 'string' ? dept : dept.id} value={typeof dept === 'string' ? dept : dept.name}>
                    {typeof dept === 'string' ? dept : dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Reports To (Position)</Label>
            <Select
              value={formData.reports_to_position_id}
              onValueChange={(val) => setFormData({...formData, reports_to_position_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent position (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None (Top Level)</SelectItem>
                {parentPositions.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.position_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.department && departmentEmployees.length > 0 && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-2">Department Employees ({departmentEmployees.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {departmentEmployees.slice(0, 5).map(emp => (
                    <div key={emp.id} className="text-xs text-slate-600">
                      • {emp.first_name} {emp.last_name} {emp.job_title ? `- ${emp.job_title}` : ''}
                    </div>
                  ))}
                  {departmentEmployees.length > 5 && (
                    <p className="text-xs text-slate-500 italic">+{departmentEmployees.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
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
                {levels.map(level => (
                  <SelectItem key={level.level_number} value={level.level_number.toString()}>
                    {level.level_number} - {language === 'ar' ? (level.name_ar || level.name_en) : level.name_en}
                  </SelectItem>
                ))}
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