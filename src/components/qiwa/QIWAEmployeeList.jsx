import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from '@/components/TranslationContext';

export default function QIWAEmployeeList({ records, employees, onEdit }) {
  const { language } = useTranslation();

  const getEmployee = (employeeId) => employees.find(e => e.id === employeeId);

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    registered: 'bg-blue-100 text-blue-700',
    active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-red-100 text-red-700',
    terminated: 'bg-slate-100 text-slate-700'
  };

  const isExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 90 && days > 0;
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-slate-500">
          <p>{language === 'ar' ? 'لا توجد سجلات موظفين' : 'No employee records found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map(record => {
        const employee = getEmployee(record.employee_id);
        const expiring = isExpiring(record.work_permit_expiry);

        return (
          <Card key={record.id} className="hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-slate-900">
                      {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                    </h4>
                    <Badge className={statusColors[record.registration_status]}>
                      {record.registration_status}
                    </Badge>
                    {expiring && (
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">{language === 'ar' ? 'رقم الإقامة' : 'Iqama Number'}</p>
                      <p className="font-semibold">{record.iqama_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{language === 'ar' ? 'تصريح العمل' : 'Work Permit'}</p>
                      <p className="font-semibold">{record.work_permit_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</p>
                      <p className={`font-semibold ${expiring ? 'text-red-600' : ''}`}>
                        {record.work_permit_expiry ? format(new Date(record.work_permit_expiry), 'MMM dd, yyyy') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{language === 'ar' ? 'نوع العقد' : 'Contract Type'}</p>
                      <p className="font-semibold">{record.contract_type}</p>
                    </div>
                  </div>
                </div>

                <Button size="sm" variant="ghost" onClick={() => onEdit(record)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}