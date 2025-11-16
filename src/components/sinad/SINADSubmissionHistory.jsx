import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from '@/components/TranslationContext';

export default function SINADSubmissionHistory({ records }) {
  const { language } = useTranslation();

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    generated: 'bg-blue-100 text-blue-700',
    submitted: 'bg-purple-100 text-purple-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    paid: 'bg-green-100 text-green-700'
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-slate-500">
          <p>{language === 'ar' ? 'لا توجد إرساليات' : 'No submissions found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map(record => (
        <Card key={record.id} className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-900">
                    {record.submission_month}
                  </h4>
                  <Badge className={statusColors[record.status]}>
                    {record.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">{language === 'ar' ? 'عدد الموظفين' : 'Employees'}</p>
                    <p className="font-semibold">{record.total_employees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{language === 'ar' ? 'إجمالي الأجور' : 'Total Wages'}</p>
                    <p className="font-semibold">{record.total_wages?.toLocaleString()} SAR</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{language === 'ar' ? 'تاريخ الإرسال' : 'Submission Date'}</p>
                    <p className="font-semibold">
                      {record.submission_date ? format(new Date(record.submission_date), 'MMM dd, yyyy') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{language === 'ar' ? 'الامتثال' : 'Compliance'}</p>
                    <p className="font-semibold text-emerald-600">{record.compliance_score || 0}%</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}