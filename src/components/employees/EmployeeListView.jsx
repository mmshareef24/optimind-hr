import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function EmployeeListView({ employees, onEdit, onDelete, accessLevel }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-slate-100 text-slate-700',
      on_leave: 'bg-amber-100 text-amber-700',
      terminated: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className={isRTL ? 'text-right' : ''}>{language === 'ar' ? 'رقم الموظف' : 'Employee ID'}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{language === 'ar' ? 'القسم' : 'Department'}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{language === 'ar' ? 'تاريخ التعيين' : 'Hire Date'}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{t('status')}</TableHead>
            <TableHead className={isRTL ? 'text-right' : ''}>{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow 
              key={employee.id} 
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => onEdit(employee)}
            >
              <TableCell className="font-medium">{employee.employee_id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                    {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                  </div>
                  <span>{employee.first_name} {employee.last_name}</span>
                </div>
              </TableCell>
              <TableCell>{employee.job_title || '-'}</TableCell>
              <TableCell>{employee.department || '-'}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.phone || '-'}</TableCell>
              <TableCell>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(employee.status)}>
                  {employee.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {accessLevel === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => onDelete(employee, e)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}