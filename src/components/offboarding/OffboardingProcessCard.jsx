import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserX, Calendar, Edit, CheckCircle, AlertCircle, FileText, Printer } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClearancePrintForm from "./ClearancePrintForm";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function OffboardingProcessCard({ process, employee, tasks, onEdit, onUpdateProcess }) {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const { data: clearanceItems = [] } = useQuery({
    queryKey: ['clearance-items', process.id],
    queryFn: () => base44.entities.ClearanceItem.filter({ offboarding_process_id: process.id })
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const company = companies.find(c => c.id === employee?.company_id);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const overdueTasks = tasks.filter(t => 
    t.status === 'pending' && new Date(t.due_date) < new Date()
  ).length;

  const daysUntilLastDay = differenceInDays(new Date(process.last_working_day), new Date());

  const statusColors = {
    initiated: 'bg-blue-100 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    pending_clearance: 'bg-purple-100 text-purple-700 border-purple-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const typeColors = {
    resignation: 'bg-blue-100 text-blue-700',
    retirement: 'bg-purple-100 text-purple-700',
    termination: 'bg-red-100 text-red-700',
    contract_end: 'bg-amber-100 text-amber-700',
    mutual_agreement: 'bg-emerald-100 text-emerald-700'
  };

  return (
    <>
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-red-50/30">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <UserX className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl mb-2">
                {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColors[process.status]}>
                  {process.status.replace('_', ' ')}
                </Badge>
                <Badge className={typeColors[process.termination_type]}>
                  {process.termination_type.replace('_', ' ')}
                </Badge>
                {employee && (
                  <Badge variant="outline">
                    {employee.employee_id} • {employee.department}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintDialogOpen(true)}>
              <Printer className="w-4 h-4 mr-2" />
              Print Forms
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Timeline */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Calendar className="w-4 h-4" />
              Resignation Date
            </div>
            <p className="font-semibold text-slate-900">
              {format(new Date(process.resignation_date || process.created_date), 'MMM dd, yyyy')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 text-sm text-amber-600 mb-1">
              <Calendar className="w-4 h-4" />
              Last Working Day
            </div>
            <p className="font-semibold text-slate-900">
              {format(new Date(process.last_working_day), 'MMM dd, yyyy')}
            </p>
            {daysUntilLastDay > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {daysUntilLastDay} days remaining
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
              <Calendar className="w-4 h-4" />
              Termination Date
            </div>
            <p className="font-semibold text-slate-900">
              {format(new Date(process.effective_termination_date), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Task Completion</span>
            <span className="text-sm font-semibold text-slate-900">
              {completedTasks}/{totalTasks} ({completionPercentage}%)
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          {overdueTasks > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Key Information */}
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${process.exit_interview_completed ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span className="text-sm text-slate-600">Exit Interview</span>
              <Badge variant={process.exit_interview_completed ? "default" : "outline"} className="ml-auto">
                {process.exit_interview_completed ? 'Completed' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${process.clearance_completed ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span className="text-sm text-slate-600">Clearance</span>
              <Badge variant={process.clearance_completed ? "default" : "outline"} className="ml-auto">
                {process.clearance_completed ? 'Completed' : 'Pending'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${process.final_settlement_paid ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span className="text-sm text-slate-600">Final Settlement</span>
              <Badge variant={process.final_settlement_paid ? "default" : "outline"} className="ml-auto">
                {process.final_settlement_paid ? 'Paid' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <FileText className={`w-4 h-4 ${process.rehire_eligible ? 'text-emerald-600' : 'text-red-600'}`} />
              <span className="text-sm text-slate-600">Rehire Status</span>
              <Badge variant={process.rehire_eligible ? "default" : "destructive"} className="ml-auto">
                {process.rehire_eligible ? 'Eligible' : 'Not Eligible'}
              </Badge>
            </div>
          </div>
        </div>

        {process.termination_reason && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-1">Reason:</p>
            <p className="text-sm text-slate-600">{process.termination_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clearance Forms - {employee?.first_name} {employee?.last_name}</DialogTitle>
          </DialogHeader>
          <ClearancePrintForm
            process={process}
            employee={employee}
            clearanceItems={clearanceItems}
            company={company}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}