import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, DollarSign, Users, FileText, CheckCircle2, 
  AlertTriangle, Calendar, TrendingUp 
} from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';
import StatCard from "@/components/hrms/StatCard";
import SINADWageFileGenerator from "@/components/sinad/SINADWageFileGenerator";
import SINADSubmissionHistory from "@/components/sinad/SINADSubmissionHistory";
import SINADComplianceMonitor from "@/components/sinad/SINADComplianceMonitor";
import SINADSubmissionManager from "@/components/sinad/SINADSubmissionManager";

export default function SINAD() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [selectedRecord, setSelectedRecord] = useState(null);
  const queryClient = useQueryClient();

  const { data: sinadRecords = [], isLoading } = useQuery({
    queryKey: ['sinad-records'],
    queryFn: () => base44.entities.SINADRecord.list('-submission_date')
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: recentPayrolls = [] } = useQuery({
    queryKey: ['recent-payrolls'],
    queryFn: () => base44.entities.Payroll.list('-month', 100)
  });

  // Calculate statistics
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthRecord = sinadRecords.find(r => r.submission_month === currentMonth);
  
  const stats = {
    totalSubmissions: sinadRecords.length,
    approved: sinadRecords.filter(r => r.status === 'approved').length,
    pending: sinadRecords.filter(r => r.status === 'submitted').length,
    avgCompliance: sinadRecords.length > 0 
      ? Math.round(sinadRecords.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / sinadRecords.length)
      : 0,
    currentMonthStatus: currentMonthRecord?.status || 'draft'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'نظام سند' : 'SINAD System'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'نظام حماية الأجور - إدارة ملفات الأجور والامتثال' 
              : 'Wage Protection System - Manage wage files and compliance'}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title={language === 'ar' ? 'إجمالي التقديمات' : 'Total Submissions'}
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
          title={language === 'ar' ? 'قيد المراجعة' : 'Under Review'}
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
        <StatCard
          title={language === 'ar' ? 'حالة الشهر الحالي' : 'Current Month'}
          value={stats.currentMonthStatus}
          icon={Calendar}
          bgColor="from-indigo-500 to-indigo-600"
        />
      </div>

      {/* Current Month Submission Manager */}
      {currentMonthRecord && currentMonthRecord.status !== 'approved' && currentMonthRecord.status !== 'paid' && (
        <SINADSubmissionManager
          record={currentMonthRecord}
          onSubmitComplete={() => queryClient.invalidateQueries(['sinad-records'])}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
          <TabsTrigger value="generator">
            {language === 'ar' ? 'إنشاء الملف' : 'Generate File'}
          </TabsTrigger>
          <TabsTrigger value="history">
            {language === 'ar' ? 'السجل' : 'History'}
          </TabsTrigger>
          <TabsTrigger value="compliance">
            {language === 'ar' ? 'الامتثال' : 'Compliance'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <SINADWageFileGenerator 
            companies={companies}
            payrolls={recentPayrolls}
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
      <Card className="border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">
                {language === 'ar' ? 'حول نظام سند' : 'About SINAD System'}
              </h4>
              <p className="text-sm text-purple-800 mb-3">
                {language === 'ar' 
                  ? 'نظام سند هو نظام حماية الأجور في المملكة العربية السعودية الذي يضمن دفع رواتب الموظفين في الوقت المحدد. يجب تقديم ملفات الأجور شهرياً.'
                  : "SINAD is Saudi Arabia's Wage Protection System ensuring timely salary payments to employees. Wage files must be submitted monthly."}
              </p>
              <div className="text-xs text-purple-700 space-y-1">
                <p>• {language === 'ar' ? 'إنشاء ملف الأجور من بيانات الرواتب المعتمدة' : 'Generate wage files from approved payroll data'}</p>
                <p>• {language === 'ar' ? 'التحقق من البيانات قبل التقديم' : 'Validate data before submission'}</p>
                <p>• {language === 'ar' ? 'تقديم تلقائي إلى نظام سند' : 'Automated submission to SINAD'}</p>
                <p>• {language === 'ar' ? 'تتبع حالة التقديم والامتثال' : 'Track submission status and compliance'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}