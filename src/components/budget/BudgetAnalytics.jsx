import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function BudgetAnalytics({ budgets, employees, positions, payrolls }) {
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
          <CardTitle>Budget vs Actual by Department</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} SAR`} />
              <Legend />
              <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
              <Bar dataKey="actual" fill="#10b981" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
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