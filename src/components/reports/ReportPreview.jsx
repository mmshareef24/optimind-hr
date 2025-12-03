import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "@/components/TranslationContext";
import { format } from "date-fns";

export default function ReportPreview({ data, fields, moduleConfig, isLoading, employees }) {
  const { language } = useTranslation();

  const getFieldLabel = (fieldKey) => {
    const field = moduleConfig.fields.find(f => f.key === fieldKey);
    return field?.label || fieldKey;
  };

  const formatCellValue = (value, fieldKey) => {
    if (value === null || value === undefined) return '-';
    
    // Handle dates
    if (fieldKey.includes('date') && value) {
      try {
        return format(new Date(value), 'MMM dd, yyyy');
      } catch {
        return value;
      }
    }
    
    // Handle currency
    if (['salary', 'gross_salary', 'net_salary', 'basic_salary', 'purchase_cost', 'current_value'].includes(fieldKey)) {
      return `SAR ${Number(value).toLocaleString()}`;
    }
    
    // Handle employee references
    if (fieldKey === 'employee_id' && employees) {
      const emp = employees.find(e => e.id === value || e.employee_id === value);
      if (emp) return `${emp.first_name} ${emp.last_name}`;
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle status badges
    if (fieldKey === 'status') {
      const colorMap = {
        active: 'bg-emerald-100 text-emerald-700',
        approved: 'bg-emerald-100 text-emerald-700',
        completed: 'bg-emerald-100 text-emerald-700',
        paid: 'bg-emerald-100 text-emerald-700',
        present: 'bg-emerald-100 text-emerald-700',
        hired: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        draft: 'bg-slate-100 text-slate-700',
        in_progress: 'bg-blue-100 text-blue-700',
        rejected: 'bg-red-100 text-red-700',
        inactive: 'bg-slate-100 text-slate-700',
        terminated: 'bg-red-100 text-red-700',
        absent: 'bg-red-100 text-red-700',
        withdrawn: 'bg-slate-100 text-slate-700'
      };
      return (
        <Badge className={colorMap[value] || 'bg-slate-100 text-slate-700'}>
          {value.replace('_', ' ')}
        </Badge>
      );
    }
    
    return String(value);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {language === 'ar' ? 'معاينة' : 'Preview'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.records) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {language === 'ar' ? 'معاينة' : 'Preview'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12">
          <div className="text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {language === 'ar' ? 'لا توجد بيانات للمعاينة' : 'No Data to Preview'}
            </h3>
            <p className="text-slate-500">
              {language === 'ar' 
                ? 'حدد الحقول وانقر على معاينة لرؤية البيانات'
                : 'Select fields and click Preview to see data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-slate-600" />
            {language === 'ar' ? 'معاينة' : 'Preview'}
          </CardTitle>
          <Badge variant="outline">
            {data.records.length} of {data.totalCount} records
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                {fields.map(field => (
                  <TableHead key={field} className="font-semibold text-slate-700 whitespace-nowrap">
                    {getFieldLabel(field)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.records.map((record, idx) => (
                <TableRow key={record.id || idx} className="hover:bg-slate-50">
                  {fields.map(field => (
                    <TableCell key={field} className="whitespace-nowrap">
                      {formatCellValue(record[field], field)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.records.length < data.totalCount && (
          <div className="p-4 bg-amber-50 border-t text-center">
            <p className="text-sm text-amber-700">
              {language === 'ar'
                ? `يتم عرض أول ${data.records.length} سجل من أصل ${data.totalCount}. قم بالتصدير لرؤية كل البيانات.`
                : `Showing first ${data.records.length} of ${data.totalCount} records. Export to see all data.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}