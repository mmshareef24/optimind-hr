import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function BudgetAnalytics({ budgets, employees, positions, payrolls }) {
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const departmentData = useMemo(() => {
    const deptMap = {};
    
    budgets.forEach(budget => {
      const dept = budget.department || 'Other';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          budgeted: 0,
          actual: 0
        };
      }
      deptMap[dept].budgeted += budget.total_budgeted_cost || 0;
      deptMap[dept].actual += budget.total_actual_cost || 0;
    });

    return Object.values(deptMap);
  }, [budgets]);

  const departments = useMemo(() => {
    return departmentData.map(d => d.department);
  }, [departmentData]);

  const drillDownData = useMemo(() => {
    if (!selectedDepartment) return null;
    
    return budgets
      .filter(b => (b.department || 'Other') === selectedDepartment)
      .map(b => ({
        name: b.budget_period,
        budgeted: b.total_budgeted_cost || 0,
        actual: b.total_actual_cost || 0,
        variance: (b.total_budgeted_cost || 0) - (b.total_actual_cost || 0)
      }));
  }, [budgets, selectedDepartment]);

  const handleBarClick = (data) => {
    if (data && data.department) {
      setSelectedDepartment(data.department);
    }
  };

  const statusData = useMemo(() => {
    const statusCounts = budgets.reduce((acc, budget) => {
      acc[budget.status] = (acc[budget.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [budgets]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedDepartment ? `${selectedDepartment} - Budget Details` : 'Budget vs Actual by Department'}
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedDepartment && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDepartment(null)}
                  className="text-slate-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
              <Select value={selectedDepartment || "all"} onValueChange={(value) => setSelectedDepartment(value === "all" ? null : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={selectedDepartment ? drillDownData : departmentData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedDepartment ? "name" : "department"} />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} SAR`} />
              <Legend />
              <Bar 
                dataKey="budgeted" 
                fill="#3b82f6" 
                name="Budgeted" 
                cursor="pointer"
              />
              <Bar 
                dataKey="actual" 
                fill="#10b981" 
                name="Actual"
                cursor="pointer"
              />
              {selectedDepartment && (
                <Bar 
                  dataKey="variance" 
                  fill="#f59e0b" 
                  name="Variance"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
          {!selectedDepartment && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Click on a department bar or use the dropdown to drill down
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Budget Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}