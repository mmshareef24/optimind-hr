import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useTranslation } from '@/components/TranslationContext';

export default function EmployeeDetailsTab({ formData, setFormData, companies = [], positions = [], employees = [] }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  // Filter positions by selected company
  const availablePositions = formData.company_id
    ? positions.filter(p => p.company_id === formData.company_id && p.status === 'active')
    : positions.filter(p => p.status === 'active');
  
  // Get potential managers (exclude the current employee being edited)
  const potentialManagers = employees.filter(emp => emp.id !== formData.id && emp.status === 'active');

  // When a position is selected, auto-fill department and job_title
  const handlePositionChange = (positionId) => {
    const selectedPosition = positions.find(p => p.id === positionId);
    if (selectedPosition) {
      setFormData({
        ...formData,
        position_id: positionId,
        job_title: selectedPosition.position_title,
        department: selectedPosition.department
      });
    } else {
      setFormData({
        ...formData,
        position_id: positionId,
        // Optionally clear job_title and department if 'None' is selected,
        // but the outline only clears position_id.
        // If positionId is null, it means 'None' was selected.
        // We will keep existing job_title/department unless explicitly cleared
        // or a new position is selected.
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Employee ID *</Label>
          <Input
            value={formData.employee_id}
            onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
            placeholder="e.g., EMP001"
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

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>First Name *</Label>
          <Input
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Last Name *</Label>
          <Input
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>First Name (Arabic)</Label>
          <Input
            value={formData.first_name_ar}
            onChange={(e) => setFormData({...formData, first_name_ar: e.target.value})}
            dir="rtl"
          />
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Last Name (Arabic)</Label>
          <Input
            value={formData.last_name_ar}
            onChange={(e) => setFormData({...formData, last_name_ar: e.target.value})}
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Email *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>National ID / Iqama *</Label>
          <Input
            value={formData.national_id}
            onChange={(e) => setFormData({...formData, national_id: e.target.value})}
            required
          />
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Passport Number</Label>
          <Input
            value={formData.passport_number}
            onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Date of Birth</Label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
          />
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(val) => setFormData({...formData, gender: val})}
          >
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Marital Status</Label>
          <Select
            value={formData.marital_status}
            onValueChange={(val) => setFormData({...formData, marital_status: val})}
          >
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Nationality</Label>
          <Input
            value={formData.nationality}
            onChange={(e) => setFormData({...formData, nationality: e.target.value})}
          />
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Hire Date *</Label>
          <Input
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
            required
          />
        </div>
      </div>

      {/* Position Selection */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border-2 border-emerald-200">
        <h3 className={`font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>Position & Role</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Position</Label>
            <Select
              value={formData.position_id}
              onValueChange={handlePositionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None (Use Job Title)</SelectItem>
                {availablePositions.map(position => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.position_title} ({position.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`text-xs text-slate-500 mt-1 ${isRTL ? 'text-right' : ''}`}>
              Select a position to auto-fill job title and department
            </p>
          </div>
          <div>
            <Label className={isRTL ? 'text-right block' : ''}>Job Title (Legacy) *</Label>
            <Input
              value={formData.job_title}
              onChange={(e) => setFormData({...formData, job_title: e.target.value})}
              placeholder="e.g., Software Engineer"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Department</Label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
          />
        </div>
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Reporting Manager</Label>
          <Select
            value={formData.manager_id || ''}
            onValueChange={(val) => setFormData({...formData, manager_id: val || null})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reporting manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
              {potentialManagers.map(manager => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.first_name} {manager.last_name} - {manager.job_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className={isRTL ? 'text-right block' : ''}>Employment Type</Label>
          <Select
            value={formData.employment_type}
            onValueChange={(val) => setFormData({...formData, employment_type: val})}
          >
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className={isRTL ? 'text-right block' : ''}>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(val) => setFormData({...formData, status: val})}
        >
          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}