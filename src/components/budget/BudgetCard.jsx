import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Users, DollarSign, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function BudgetCard({ budget, employees, positions, onEdit, onDelete }) {
  const position = positions.find(p => p.id === budget.position_id);
  const variance = budget.total_budgeted_cost - budget.total_actual_cost;
  const salaryInScale = position && position.min_salary && position.max_salary
    ? budget.budgeted_salary_cost >= position.min_salary && budget.budgeted_salary_cost <= position.max_salary
    : true;
  const variancePercentage = budget.total_budgeted_cost > 0 
    ? ((Math.abs(variance) / budget.total_budgeted_cost) * 100).toFixed(1) 
    : 0;
  const isOverBudget = variance < 0;
  const utilizationPercentage = budget.total_budgeted_cost > 0 
    ? ((budget.total_actual_cost / budget.total_budgeted_cost) * 100).toFixed(1) 
    : 0;

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    exceeded: 'bg-red-100 text-red-700 border-red-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-900">
                {budget.budget_type === 'departmental' && budget.department}
                {budget.budget_type === 'position' && position?.position_title}
                {budget.budget_type === 'total_headcount' && 'Total Headcount Budget'}
              </h3>
              <Badge className={statusColors[budget.status]}>
                {budget.status}
              </Badge>
              {isOverBudget && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Over Budget
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {budget.budget_period} • {budget.budget_type}
            </p>
            {position && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {position.position_title}
                </Badge>
                {position.min_salary && position.max_salary && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      Scale: {position.min_salary.toLocaleString()} - {position.max_salary.toLocaleString()} SAR
                    </span>
                    {!salaryInScale && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        Outside Scale
                      </Badge>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => onEdit(budget)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(budget.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-slate-500">Headcount</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {budget.actual_headcount || 0} / {budget.allocated_headcount}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-500">Budgeted</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {budget.total_budgeted_cost.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-slate-500">Actual</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {(budget.total_actual_cost || 0).toLocaleString()}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${isOverBudget ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} border`}>
            <div className="flex items-center gap-2 mb-1">
              {isOverBudget ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              )}
              <span className="text-xs text-slate-500">Variance</span>
            </div>
            <p className={`text-xl font-bold ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`}>
              {isOverBudget ? '-' : '+'}{Math.abs(variance).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">{variancePercentage}%</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Budget Utilization</span>
            <span className="text-sm font-semibold text-slate-900">{utilizationPercentage}%</span>
          </div>
          <Progress 
            value={parseFloat(utilizationPercentage)} 
            className={`h-2 ${parseFloat(utilizationPercentage) > 100 ? '[&>div]:bg-red-500' : ''}`}
          />
        </div>

        {budget.notes && (
          <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">
            {budget.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}