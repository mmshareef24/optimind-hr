import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function SINADComplianceMonitor({ records }) {
  const { language } = useTranslation();

  const recentRecords = records.slice(0, 6).reverse();
  const avgScore = recentRecords.length > 0
    ? Math.round(recentRecords.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / recentRecords.length)
    : 0;

  const trend = recentRecords.length >= 2
    ? recentRecords[recentRecords.length - 1].compliance_score - recentRecords[0].compliance_score
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'نظرة عامة على الامتثال' : 'Compliance Overview'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'متوسط درجة الامتثال' : 'Average Compliance Score'}</p>
              <p className="text-4xl font-bold text-slate-900">{avgScore}%</p>
            </div>
            <div className="flex items-center gap-2">
              {trend > 0 ? (
                <>
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">+{trend}%</span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown className="w-6 h-6 text-red-600" />
                  <span className="text-red-600 font-semibold">{trend}%</span>
                </>
              ) : (
                <>
                  <Minus className="w-6 h-6 text-slate-400" />
                  <span className="text-slate-600">No change</span>
                </>
              )}
            </div>
          </div>

          {/* Compliance Chart Placeholder */}
          <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
            <p className="text-slate-500">{language === 'ar' ? 'مخطط الامتثال' : 'Compliance chart visualization'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'نصائح الامتثال' : 'Compliance Tips'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>{language === 'ar' ? 'تأكد من دقة بيانات الموظفين والرواتب' : 'Ensure employee and salary data is accurate'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>{language === 'ar' ? 'قدم ملفات الأجور قبل الموعد النهائي' : 'Submit wage files before deadline'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>{language === 'ar' ? 'ادفع الرواتب في الوقت المحدد' : 'Pay salaries on time'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>{language === 'ar' ? 'حافظ على تحديث معلومات البنك والإيبان' : 'Keep bank and IBAN information updated'}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}