import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, DollarSign, Calendar, Edit, Trash2, CheckCircle, AlertTriangle } from "lucide-react";

export default function RequisitionCard({ requisition, positions, budgets, candidates, onEdit, onDelete, isAdmin }) {
  const position = positions.find(p => p.id === requisition.position_id);
  const candidateCount = candidates?.length || 0;
  
  const statusColors = {
    draft: "bg-slate-100 text-slate-700",
    pending_approval: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    open: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-purple-100 text-purple-700",
    offer_extended: "bg-indigo-100 text-indigo-700",
    filled: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    on_hold: "bg-orange-100 text-orange-700"
  };

  const priorityColors = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700"
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {requisition.job_title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-600">{requisition.department}</span>
                {position && (
                  <Badge variant="outline" className="text-xs">
                    {position.title}
                  </Badge>
                )}
                <Badge className={statusColors[requisition.status]}>
                  {requisition.status.replace('_', ' ')}
                </Badge>
                <Badge className={priorityColors[requisition.priority]}>
                  {requisition.priority}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(requisition)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(requisition.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Openings</p>
            <p className="font-semibold text-slate-900">{requisition.number_of_openings}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Candidates</p>
            <p className="font-semibold text-slate-900">{candidateCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Salary Range</p>
            <p className="font-semibold text-slate-900">
              {requisition.salary_range_min && requisition.salary_range_max
                ? `${requisition.salary_range_min.toLocaleString()}-${requisition.salary_range_max.toLocaleString()}`
                : 'Not specified'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Deadline</p>
            <p className="font-semibold text-slate-900">
              {requisition.deadline_date 
                ? new Date(requisition.deadline_date).toLocaleDateString()
                : 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Status */}
      {requisition.budget_approved ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-2 rounded">
          <CheckCircle className="w-4 h-4" />
          <span>Budget Approved</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
          <AlertTriangle className="w-4 h-4" />
          <span>Budget Approval Pending</span>
        </div>
      )}

      {requisition.job_description && (
        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
          {requisition.job_description}
        </p>
      )}
    </Card>
  );
}