import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "../components/hrms/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Payroll() {
  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list('-month'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const totalPayroll = payrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
  const totalGOSI = payrolls.reduce((sum, p) => sum + (p.gosi_employer || 0) + (p.gosi_employee || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Payroll & GOSI</h1>
        <p className="text-slate-600">Manage salary processing and GOSI contributions</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Payroll"
          value={`${totalPayroll.toLocaleString()} SAR`}
          icon={DollarSign}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="GOSI Contributions"
          value={`${totalGOSI.toLocaleString()} SAR`}
          icon={TrendingUp}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Processed This Month"
          value={payrolls.filter(p => p.status === 'processed').length}
          icon={Calendar}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Employees"
          value={employees.length}
          icon={Users}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/30">
          <CardTitle>Recent Payroll Records</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No payroll records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payrolls.slice(0, 10).map((payroll) => (
                <div key={payroll.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                  <div>
                    <p className="font-semibold text-slate-900">Employee #{payroll.employee_id?.slice(0, 8)}</p>
                    <p className="text-sm text-slate-500">Month: {payroll.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{payroll.net_salary?.toLocaleString()} SAR</p>
                    <p className="text-sm text-slate-500">Net Salary</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}