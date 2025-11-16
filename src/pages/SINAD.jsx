import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, FileText, CheckCircle2, Clock, AlertCircle,
  Download, Upload, TrendingUp, Shield
} from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';
import { format } from "date-fns";
import StatCard from "@/components/hrms/StatCard";
import SINADWageFileGenerator from "@/components/sinad/SINADWageFileGenerator";
import SINADSubmissionHistory from "@/components/sinad/SINADSubmissionHistory";
import SINADComplianceMonitor from "@/components/sinad/SINADComplianceMonitor";

export default function SINAD() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();

  const { data: sinadRecords = [], isLoading } = useQuery({
    queryKey: ['sinad-records'],
    queryFn: () => base44.entities.SINADRecord.list('-submission_date')
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payrolls-recent'],
    queryFn: () => base44.entities.Payroll.list('-month', 50)
  });

  // Calculate current month statistics
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthRecord = sinadRecords.find(r => r.submission_month === currentMonth);
  
  const stats = {
    totalSubmissions: sinadRecords.length,
    approved: sinadRecords.filter(r => r.status === 'approved' || r.status === 'paid').length,
    pending: sinadRecords.filter(r => r.status === 'submitted' || r.status === 'generated').length,
    avgCompliance: sinadRecords.length > 0 
      ? Math.round(sinadRecords.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / sinadRecords.length)
      : 0
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'نظام سند لحماية الأجور' : 'SINAD Wage Protection System'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'إدارة ملفات الأجور وضمان دفع الرواتب في الوقت المحدد' 
              : 'Manage wage files and ensure timely salary payments'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'تنزيل القالب' : 'Download Template'}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={language === 'ar' ? 'إجمالي الإرساليات' : 'Total Submissions'}
          value={stats.totalSubmissions}
          icon={FileText}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={language === 'ar' ? 'موافق عليها' : 'Approved'}
          value={stats.approved}
          icon={CheckCircle2}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={language === 'ar' ? 'قيد المعالجة' : 'Pending'}
          value={stats.pending}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={language === 'ar' ? 'متوسط الامتثال' : 'Avg Compliance'}
          value={`${stats.avgCompliance}%`}
          icon={TrendingUp}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Current Month Status */}
      {currentMonthRecord && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {language === 'ar' ? 'حالة الشهر الحالي' : 'Current Month Status'}
                </h3>
                <p className="text-sm text-slate-600">
                  {currentMonth} • {currentMonthRecord.total_employees} {language === 'ar' ? 'موظف' : 'employees'}
                </p>
              </div>
              <Badge className={
                currentMonthRecord.status === 'approved' || currentMonthRecord.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : currentMonthRecord.status === 'submitted'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }>
                {currentMonthRecord.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-600">{language === 'ar' ? 'إجمالي الأجور' : 'Total Wages'}</p>
                <p className="text-xl font-bold text-slate-900">
                  {currentMonthRecord.total_wages?.toLocaleString()} {language === 'ar' ? 'ريال' : 'SAR'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">{language === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}</p>
                <p className="text-xl font-bold text-slate-900">
                  {currentMonthRecord.payment_date 
                    ? format(new Date(currentMonthRecord.payment_date), 'MMM dd, yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">{language === 'ar' ? 'درجة الامتثال' : 'Compliance Score'}</p>
                <p className="text-xl font-bold text-emerald-600">
                  {currentMonthRecord.compliance_score}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
          <TabsTrigger value="generate">
            {language === 'ar' ? 'إنشاء ملف' : 'Generate File'}
          </TabsTrigger>
          <TabsTrigger value="history">
            {language === 'ar' ? 'السجل' : 'History'}
          </TabsTrigger>
          <TabsTrigger value="compliance">
            {language === 'ar' ? 'الامتثال' : 'Compliance'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <SINADWageFileGenerator 
            companies={companies}
            payrolls={payrolls}
          />
        </TabsContent>

        <TabsContent value="history">
          <SINADSubmissionHistory records={sinadRecords} />
        </TabsContent>

        <TabsContent value="compliance">
          <SINADComplianceMonitor records={sinadRecords} />
        </TabsContent>
      </Tabs>

      {/* Help Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                {language === 'ar' ? 'حول نظام سند' : 'About SINAD System'}
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                {language === 'ar' 
                  ? 'نظام سند لحماية الأجور يضمن دفع رواتب الموظفين في الوقت المحدد من خلال القنوات المالية المعتمدة. يجب تقديم ملفات الأجور شهرياً قبل تاريخ الاستحقاق.'
                  : "SINAD Wage Protection System ensures employees are paid on time through authorized financial channels. Wage files must be submitted monthly before the deadline."}
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• {language === 'ar' ? 'قم بإنشاء ملف الأجور بعد معالجة الرواتب' : 'Generate wage file after processing payroll'}</p>
                <p>• {language === 'ar' ? 'التقديم قبل اليوم الأول من الشهر التالي' : 'Submit before the 1st of the following month'}</p>
                <p>• {language === 'ar' ? 'تأكد من دقة بيانات البنوك والإيبان' : 'Ensure bank and IBAN details are accurate'}</p>
                <p>• {language === 'ar' ? 'حافظ على درجة امتثال عالية' : 'Maintain high compliance score'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}