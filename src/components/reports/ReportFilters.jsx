import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { useTranslation } from "@/components/TranslationContext";

const STATUS_OPTIONS = {
  employees: ['active', 'inactive', 'on_leave', 'terminated'],
  payroll: ['draft', 'pending', 'approved', 'paid'],
  attendance: ['present', 'absent', 'late', 'half_day'],
  leave: ['pending', 'approved', 'rejected', 'cancelled'],
  performance: ['draft', 'in_progress', 'completed'],
  training: ['enrolled', 'in_progress', 'completed', 'withdrawn'],
  assets: ['available', 'assigned', 'maintenance', 'retired'],
  recruitment: ['active', 'rejected', 'hired', 'withdrawn']
};

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'temporary'];
const LEAVE_TYPES = ['annual', 'sick', 'unpaid', 'maternity', 'paternity', 'emergency'];
const CANDIDATE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const CANDIDATE_SOURCES = ['website', 'linkedin', 'referral', 'job_board', 'recruiter'];
const ASSET_CATEGORIES = ['electronics', 'furniture', 'vehicles', 'equipment', 'software'];
const ASSET_CONDITIONS = ['excellent', 'good', 'fair', 'poor'];

export default function ReportFilters({ module, moduleConfig, filters, setFilters, employees }) {
  const { language } = useTranslation();

  const handleFilterChange = (key, value) => {
    if (value === '' || value === 'all') {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  const clearFilters = () => setFilters({});

  const renderFilterField = (field) => {
    switch (field) {
      case 'status':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(v) => handleFilterChange('status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(STATUS_OPTIONS[module] || []).map(s => (
                  <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'department':
        const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'القسم' : 'Department'}</Label>
            <Select 
              value={filters.department || 'all'} 
              onValueChange={(v) => handleFilterChange('department', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'employment_type':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'نوع التوظيف' : 'Employment Type'}</Label>
            <Select 
              value={filters.employment_type || 'all'} 
              onValueChange={(v) => handleFilterChange('employment_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EMPLOYMENT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'gender':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'الجنس' : 'Gender'}</Label>
            <Select 
              value={filters.gender || 'all'} 
              onValueChange={(v) => handleFilterChange('gender', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'nationality':
        const nationalities = [...new Set(employees.map(e => e.nationality).filter(Boolean))];
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'الجنسية' : 'Nationality'}</Label>
            <Select 
              value={filters.nationality || 'all'} 
              onValueChange={(v) => handleFilterChange('nationality', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Nationalities</SelectItem>
                {nationalities.map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'leave_type':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'نوع الإجازة' : 'Leave Type'}</Label>
            <Select 
              value={filters.leave_type || 'all'} 
              onValueChange={(v) => handleFilterChange('leave_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {LEAVE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'stage':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'المرحلة' : 'Stage'}</Label>
            <Select 
              value={filters.stage || 'all'} 
              onValueChange={(v) => handleFilterChange('stage', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {CANDIDATE_STAGES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'source':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'المصدر' : 'Source'}</Label>
            <Select 
              value={filters.source || 'all'} 
              onValueChange={(v) => handleFilterChange('source', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {CANDIDATE_SOURCES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'category':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
            <Select 
              value={filters.category || 'all'} 
              onValueChange={(v) => handleFilterChange('category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ASSET_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'condition':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'الحالة' : 'Condition'}</Label>
            <Select 
              value={filters.condition || 'all'} 
              onValueChange={(v) => handleFilterChange('condition', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {ASSET_CONDITIONS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'period_month':
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'الشهر' : 'Month'}</Label>
            <Select 
              value={filters.period_month?.toString() || 'all'} 
              onValueChange={(v) => handleFilterChange('period_month', v === 'all' ? '' : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'period_year':
        const currentYear = new Date().getFullYear();
        return (
          <div key={field}>
            <Label>{language === 'ar' ? 'السنة' : 'Year'}</Label>
            <Select 
              value={filters.period_year?.toString() || 'all'} 
              onValueChange={(v) => handleFilterChange('period_year', v === 'all' ? '' : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.from({ length: 5 }, (_, i) => (
                  <SelectItem key={currentYear - i} value={(currentYear - i).toString()}>
                    {currentYear - i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'date':
        return (
          <div key={field} className="space-y-2">
            <Label>{language === 'ar' ? 'نطاق التاريخ' : 'Date Range'}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                placeholder="From"
              />
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                placeholder="To"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-600" />
            {language === 'ar' ? 'الفلاتر' : 'Filters'}
          </CardTitle>
          {Object.keys(filters).length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {moduleConfig.filterFields.map(field => renderFilterField(field))}
      </CardContent>
    </Card>
  );
}