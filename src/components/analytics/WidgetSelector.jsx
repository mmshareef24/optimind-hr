import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, PieChart, TrendingUp, DollarSign, Calendar, Clock, GraduationCap, Briefcase, Award } from 'lucide-react';

const WIDGET_TEMPLATES = [
  {
    id: 'employee_count',
    title: 'Employee Count',
    description: 'Total active and inactive employees',
    type: 'employee_count',
    visualization: 'stat',
    icon: Users,
    category: 'Employees'
  },
  {
    id: 'department_distribution',
    title: 'Department Distribution',
    description: 'Employee breakdown by department',
    type: 'department_distribution',
    visualization: 'pie',
    icon: PieChart,
    category: 'Employees'
  },
  {
    id: 'leave_statistics',
    title: 'Leave Statistics',
    description: 'Leave requests status overview',
    type: 'leave_statistics',
    visualization: 'stat',
    icon: Calendar,
    category: 'Time & Attendance'
  },
  {
    id: 'payroll_summary',
    title: 'Payroll Summary',
    description: 'Current month payroll totals',
    type: 'payroll_summary',
    visualization: 'stat',
    icon: DollarSign,
    category: 'Payroll'
  },
  {
    id: 'attendance_rate',
    title: 'Attendance Rate',
    description: 'Today\'s attendance metrics',
    type: 'attendance_rate',
    visualization: 'stat',
    icon: Clock,
    category: 'Time & Attendance'
  },
  {
    id: 'recruitment_pipeline',
    title: 'Recruitment Pipeline',
    description: 'Candidates by stage',
    type: 'recruitment_pipeline',
    visualization: 'bar',
    icon: Briefcase,
    category: 'Recruitment'
  },
  {
    id: 'training_completion',
    title: 'Training Completion',
    description: 'Training enrollment status',
    type: 'training_completion',
    visualization: 'stat',
    icon: GraduationCap,
    category: 'Training'
  },
  {
    id: 'monthly_trends',
    title: 'Monthly Hiring Trends',
    description: 'New hires per month (this year)',
    type: 'monthly_trends',
    visualization: 'line',
    icon: TrendingUp,
    category: 'Employees'
  },
  {
    id: 'expense_summary',
    title: 'Expense Summary',
    description: 'Year-to-date expense claims',
    type: 'expense_summary',
    visualization: 'stat',
    icon: Award,
    category: 'Finance'
  }
];

export default function WidgetSelector({ open, onOpenChange, onSelect }) {
  const categories = [...new Set(WIDGET_TEMPLATES.map(w => w.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WIDGET_TEMPLATES.filter(w => w.category === category).map(widget => (
                  <Card 
                    key={widget.id}
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-emerald-500"
                    onClick={() => {
                      onSelect(widget);
                      onOpenChange(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <widget.icon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{widget.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{widget.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}