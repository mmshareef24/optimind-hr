import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, FileText, Gift, Shield } from "lucide-react";
import PayrollProcessor from "../components/payroll/PayrollProcessor";
import PayrollList from "../components/payroll/PayrollList";
import BenefitsManagement from "../components/benefits/BenefitsManagement";
import StatCard from "../components/hrms/StatCard";

export default function PayrollManagement() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  const { data: user } = useQuery({
    queryKey: ['current-user-payroll'],
    queryFn: () => base44.auth.me()
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const { data: payrollStats } = useQuery({
    queryKey: ['payroll-stats', currentMonth],
    queryFn: async () => {
      const records = await base44.entities.Payroll.filter({ month: currentMonth });
      
      return {
        total_employees: records.length,
        total_gross: records.reduce((sum, r) => sum + (r.gross_salary || 0), 0),
        total_net: records.reduce((sum, r) => sum + (r.net_salary || 0), 0),
        total_gosi: records.reduce((sum, r) => sum + (r.gosi_employer || 0), 0),
        pending_approval: records.filter(r => r.status === 'calculated').length,
        processed: records.filter(r => r.status === 'paid').length
      };
    },
    initialData: {
      total_employees: 0,
      total_gross: 0,
      total_net: 0,
      total_gosi: 0,
      pending_approval: 0,
      processed: 0
    }
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('payroll_benefits_management')}</h1>
        <p className="text-slate-600">{t('payroll_benefits_desc')}</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('employees')}
          value={payrollStats.total_employees}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('total_gross_month')}
          value={`${payrollStats.total_gross.toLocaleString()} SAR`}
          icon={DollarSign}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('total_net_month')}
          value={`${payrollStats.total_net.toLocaleString()} SAR`}
          icon={DollarSign}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title={t('employer_gosi')}
          value={`${payrollStats.total_gosi.toLocaleString()} SAR`}
          icon={Shield}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="process" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="process" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            {t('process_payroll')}
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            {t('payroll_records')}
          </TabsTrigger>
          <TabsTrigger value="benefits" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Gift className="w-4 h-4 mr-2" />
            {t('benefits')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <PayrollProcessor />
        </TabsContent>

        <TabsContent value="records">
          <PayrollList />
        </TabsContent>

        <TabsContent value="benefits">
          <BenefitsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}