import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "../components/hrms/StatCard";
import BudgetForm from "../components/budget/BudgetForm";
import BudgetCard from "../components/budget/BudgetCard";
import BudgetAnalytics from "../components/budget/BudgetAnalytics";
import BudgetForecasting from "../components/budget/BudgetForecasting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function BudgetManagement() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-budget_year')
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const { data: departmentEntities = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: () => base44.entities.Position.list()
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list()
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      setShowForm(false);
      setEditingBudget(null);
      toast.success('Budget created successfully');
    },
    onError: () => toast.error('Failed to create budget')
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      setShowForm(false);
      setEditingBudget(null);
      toast.success('Budget updated successfully');
    },
    onError: () => toast.error('Failed to update budget')
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Budget deleted successfully');
    },
    onError: () => toast.error('Failed to delete budget')
  });

  const handleSubmit = (data) => {
    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, data });
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      deleteBudgetMutation.mutate(id);
    }
  };

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const yearMatch = b.budget_year === selectedYear;
      const deptMatch = selectedDepartment === 'all' || b.department === selectedDepartment;
      return yearMatch && deptMatch;
    });
  }, [budgets, selectedYear, selectedDepartment]);

  const departments = useMemo(() => {
    const deptNames = departmentEntities.map(d => d.name);
    const employeeDepts = employees.map(e => e.department).filter(Boolean);
    return [...new Set([...deptNames, ...employeeDepts])];
  }, [employees, departmentEntities]);

  const stats = useMemo(() => {
    const currentYearBudgets = budgets.filter(b => b.budget_year === selectedYear);
    const totalBudgeted = currentYearBudgets.reduce((sum, b) => sum + (b.total_budgeted_cost || 0), 0);
    const totalActual = currentYearBudgets.reduce((sum, b) => sum + (b.total_actual_cost || 0), 0);
    const totalVariance = totalBudgeted - totalActual;
    const overBudget = currentYearBudgets.filter(b => (b.total_actual_cost || 0) > (b.total_budgeted_cost || 0)).length;
    
    return {
      totalBudgeted,
      totalActual,
      totalVariance,
      variancePercentage: totalBudgeted > 0 ? ((totalVariance / totalBudgeted) * 100).toFixed(1) : 0,
      overBudget
    };
  }, [budgets, selectedYear]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Budget Management
          </h1>
          <p className="text-slate-600">
            Track and manage people & position budgets across the organization
          </p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditingBudget(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Budgeted"
          value={`${stats.totalBudgeted.toLocaleString()} SAR`}
          icon={DollarSign}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Actual"
          value={`${stats.totalActual.toLocaleString()} SAR`}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Variance"
          value={`${Math.abs(stats.totalVariance).toLocaleString()} SAR`}
          icon={stats.totalVariance >= 0 ? TrendingUp : TrendingDown}
          trend={stats.totalVariance >= 0 ? "up" : "down"}
          trendValue={`${stats.variancePercentage}%`}
          bgColor={stats.totalVariance >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"}
        />
        <StatCard
          title="Over Budget"
          value={stats.overBudget}
          icon={stats.overBudget > 0 ? AlertTriangle : CheckCircle}
          bgColor={stats.overBudget > 0 ? "from-amber-500 to-amber-600" : "from-emerald-500 to-emerald-600"}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
          <TabsTrigger value="forecasting">Budget Forecasting</TabsTrigger>
          <TabsTrigger value="allocations">Budget Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BudgetAnalytics
            budgets={filteredBudgets}
            employees={employees}
            positions={positions}
            payrolls={payrolls}
          />
        </TabsContent>

        <TabsContent value="forecasting">
          <BudgetForecasting
            budgets={budgets}
            employees={employees}
            departments={departments}
            positions={positions}
          />
        </TabsContent>

        <TabsContent value="allocations">
          <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className={isRTL ? 'text-right' : ''}>
            Budget Allocations ({selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loadingBudgets ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">No budgets found for {selectedYear}</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Budget
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBudgets.map(budget => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  employees={employees}
                  positions={positions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Form Dialog */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          departments={departments}
          positions={positions}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(null);
          }}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}
    </div>
  );
}