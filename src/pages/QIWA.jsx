import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Users, FileText, CheckCircle2, AlertTriangle, 
  RefreshCw, Download, Upload, Calendar, Shield 
} from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';
import StatCard from "@/components/hrms/StatCard";
import QIWARegistrationForm from "@/components/qiwa/QIWARegistrationForm";
import QIWAEmployeeList from "@/components/qiwa/QIWAEmployeeList";
import QIWAWageFileUpload from "@/components/qiwa/QIWAWageFileUpload";

export default function QIWA() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const { data: qiwaRecords = [], isLoading } = useQuery({
    queryKey: ['qiwa-records'],
    queryFn: () => base44.entities.QIWARecord.list()
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  // Calculate statistics
  const stats = {
    total: qiwaRecords.length,
    registered: qiwaRecords.filter(r => r.registration_status === 'registered' || r.registration_status === 'active').length,
    pending: qiwaRecords.filter(r => r.registration_status === 'pending').length,
    expiringPermits: qiwaRecords.filter(r => {
      if (!r.work_permit_expiry) return false;
      const daysUntilExpiry = Math.ceil((new Date(r.work_permit_expiry) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    }).length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'منصة قوى' : 'QIWA Platform'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'إدارة تسجيل الموظفين وتصاريح العمل والعقود على منصة قوى' 
              : 'Manage employee registration, work permits, and contracts on QIWA'}
          </p>
        </div>
        <Button 
          onClick={() => setShowRegistrationForm(!showRegistrationForm)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Users className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'تسجيل موظف جديد' : 'Register Employee'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={language === 'ar' ? 'إجمالي السجلات' : 'Total Records'}
          value={stats.total}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={language === 'ar' ? 'مسجلون ونشطون' : 'Registered & Active'}
          value={stats.registered}
          icon={CheckCircle2}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={language === 'ar' ? 'قيد الانتظار' : 'Pending Registration'}
          value={stats.pending}
          icon={RefreshCw}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={language === 'ar' ? 'تصاريح قريبة الانتهاء' : 'Expiring Permits (90d)'}
          value={stats.expiringPermits}
          icon={AlertTriangle}
          bgColor="from-red-500 to-red-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
          <TabsTrigger value="employees">
            {language === 'ar' ? 'الموظفون' : 'Employees'}
          </TabsTrigger>
          <TabsTrigger value="contracts">
            {language === 'ar' ? 'العقود' : 'Contracts'}
          </TabsTrigger>
          <TabsTrigger value="wage-files">
            {language === 'ar' ? 'ملفات الأجور' : 'Wage Files'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          {showRegistrationForm && (
            <Card className="mb-6 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'تسجيل موظف في قوى' : 'Register Employee in QIWA'}</CardTitle>
              </CardHeader>
              <CardContent>
                <QIWARegistrationForm
                  employees={employees}
                  companies={companies}
                  onClose={() => setShowRegistrationForm(false)}
                />
              </CardContent>
            </Card>
          )}
          <QIWAEmployeeList 
            records={qiwaRecords}
            employees={employees}
            onEdit={setSelectedEmployee}
          />
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إدارة العقود' : 'Contract Management'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>{language === 'ar' ? 'إدارة عقود الموظفين المسجلة في قوى' : 'Manage employee contracts registered in QIWA'}</p>
                <p className="text-sm mt-2">{language === 'ar' ? 'قريباً' : 'Coming soon'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wage-files">
          <QIWAWageFileUpload companies={companies} />
        </TabsContent>
      </Tabs>

      {/* Help Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                {language === 'ar' ? 'حول منصة قوى' : 'About QIWA Platform'}
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                {language === 'ar' 
                  ? 'منصة قوى هي المنصة الرسمية لخدمات العمل في المملكة العربية السعودية، تديرها وزارة الموارد البشرية والتنمية الاجتماعية. تشمل الخدمات: تسجيل الموظفين، تصاريح العمل، العقود، وملفات الأجور.'
                  : "QIWA is Saudi Arabia's official platform for labor services, managed by the Ministry of Human Resources and Social Development (HRSD). Services include: employee registration, work permits, contracts, and wage files."}
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• {language === 'ar' ? 'تأكد من تحديث البيانات بانتظام' : 'Ensure data is updated regularly'}</p>
                <p>• {language === 'ar' ? 'راقب تواريخ انتهاء تصاريح العمل' : 'Monitor work permit expiry dates'}</p>
                <p>• {language === 'ar' ? 'رفع ملفات الأجور شهرياً' : 'Upload wage files monthly'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}