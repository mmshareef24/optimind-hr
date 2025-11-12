import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Edit, Calendar, Users, TrendingUp } from "lucide-react";

export default function AccrualPolicyCard({ policy, onEdit }) {
  const leaveTypeColors = {
    annual: 'from-blue-500 to-blue-600',
    sick: 'from-red-500 to-red-600',
    hajj: 'from-emerald-500 to-emerald-600',
    other: 'from-purple-500 to-purple-600'
  };

  const leaveTypeIcons = {
    annual: '🏖️',
    sick: '🏥',
    hajj: '🕋',
    other: '📋'
  };

  return (
    <Card className="border-2 border-slate-200 hover:shadow-xl transition-all group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${leaveTypeColors[policy.leave_type]} flex items-center justify-center shadow-lg text-2xl`}>
              {leaveTypeIcons[policy.leave_type]}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">{policy.policy_name}</h4>
              <Badge className="mt-1 bg-blue-100 text-blue-700 capitalize">
                {policy.leave_type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <Badge className={policy.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700'}>
            {policy.is_active ? '✓ Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg border-l-4 border-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs text-slate-600">Annual</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{policy.annual_entitlement}</p>
            <p className="text-xs text-slate-500">days/year</p>
          </div>

          <div className="p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs text-slate-600">Monthly</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{policy.monthly_accrual_rate}</p>
            <p className="text-xs text-slate-500">days/month</p>
          </div>
        </div>

        {/* Policy Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
            <span className="text-slate-600">Probation Period</span>
            <span className="font-semibold">{policy.probation_period_months} months</span>
          </div>

          {policy.max_carryover > 0 && (
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded text-sm">
              <span className="text-purple-700">Max Carryover</span>
              <span className="font-semibold text-purple-700">{policy.max_carryover} days</span>
            </div>
          )}

          <div className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
            <span className="text-slate-600">Accrual Frequency</span>
            <Badge variant="outline" className="capitalize">{policy.accrual_frequency}</Badge>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className={`flex items-center gap-2 p-2 rounded ${policy.prorate_for_new_hires ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
            {policy.prorate_for_new_hires ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>Prorate new hires</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded ${policy.accrue_while_on_leave ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
            {policy.accrue_while_on_leave ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>Accrue on leave</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded ${policy.accrue_during_probation ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
            {policy.accrue_during_probation ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>During probation</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded ${policy.employment_type?.includes('full_time') ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
            <Users className="w-3 h-3" />
            <span>{policy.employment_type?.length || 0} types</span>
          </div>
        </div>

        {policy.notes && (
          <p className="text-xs text-slate-600 mb-4 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
            {policy.notes}
          </p>
        )}

        <Button
          variant="outline"
          onClick={() => onEdit(policy)}
          className="w-full group-hover:bg-emerald-50 group-hover:border-emerald-300 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Policy
        </Button>
      </CardContent>
    </Card>
  );
}