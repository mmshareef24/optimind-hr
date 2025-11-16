import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function LeaveBalanceCard({ balance }) {
  const { t } = useTranslation();
  
  const leaveTypeConfig = {
    annual: { labelKey: 'annual_leave', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Calendar },
    sick: { labelKey: 'sick_leave', color: 'text-red-600', bgColor: 'bg-red-100', icon: Calendar },
    maternity: { labelKey: 'maternity_leave', color: 'text-pink-600', bgColor: 'bg-pink-100', icon: Calendar },
    paternity: { labelKey: 'paternity_leave', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Calendar },
    unpaid: { labelKey: 'unpaid_leave', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Calendar },
    hajj: { labelKey: 'hajj_leave', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: Calendar },
    marriage: { labelKey: 'marriage_leave', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Calendar },
    bereavement: { labelKey: 'bereavement_leave', color: 'text-slate-700', bgColor: 'bg-slate-200', icon: Calendar },
    emergency: { labelKey: 'emergency_leave', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Calendar }
  };

  const config = leaveTypeConfig[balance.leave_type] || leaveTypeConfig.annual;
  const Icon = config.icon;
  const usagePercentage = balance.total_entitled > 0 ? ((balance.used / balance.total_entitled) * 100) : 0;

  return (
    <Card className="border border-slate-200 hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <span className="text-base">{t(config.labelKey)}</span>
          </div>
          <span className={`text-2xl font-bold ${config.color}`}>
            {balance.remaining}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">{t('total')}</span>
            </div>
            <span className="font-semibold text-slate-900">{balance.total_entitled}</span>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-500">{t('used')}</span>
            </div>
            <span className="font-semibold text-red-700">{balance.used}</span>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-amber-500">{t('pending')}</span>
            </div>
            <span className="font-semibold text-amber-700">{balance.pending}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>{t('usage')}</span>
            <span>{usagePercentage.toFixed(0)}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        {balance.carried_forward > 0 && (
          <p className="text-xs text-emerald-600 font-medium">
            +{balance.carried_forward} {t('days_carried_forward')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}