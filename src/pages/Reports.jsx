import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Filter, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "../components/hrms/StatCard";
import EmployeeReports from "../components/reports/EmployeeReports";
import ProjectReports from "../components/reports/ProjectReports";
import TimeTrackingReports from "../components/reports/TimeTrackingReports";
import PayrollReports from "../components/reports/PayrollReports";
import CustomReportBuilder from "../components/reports/CustomReportBuilder";
import AnalyticsDashboard from "../components/reports/AnalyticsDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const [activeModule, setActiveModule] = useState('analytics');

  // Fetch all data for reports
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: timeEntries = [], isLoading: loadingTime } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => base44.entities.TimeEntry.list(),
  });

  const { data: payrolls = [], isLoading: loadingPayroll } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list(),
  });

  const { data: performanceReviews = [] } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => base44.entities.PerformanceReview.list(),
  });

  const isLoading = loadingEmployees || loadingProjects || loadingTime || loadingPayroll;

  // Calculate quick stats
  const totalReports = 12; // Available report types
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const totalHours = timeEntries.reduce((sum, t) => sum + (t.hours || 0) + (t.overtime_hours || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Analytics</h1>
          <p className="text-slate-600">Comprehensive reporting and data analysis</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Report Types"
          value={totalReports}
          icon={FileText}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Employees"
          value={activeEmployees}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={BarChart3}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Total Hours Logged"
          value={`${totalHours.toFixed(0)}h`}
          icon={PieChart}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Employee Reports
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Project Reports
            </TabsTrigger>
            <TabsTrigger
              value="time"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Time Tracking
            </TabsTrigger>
            <TabsTrigger
              value="payroll"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Payroll Reports
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Custom Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard
              employees={employees}
              projects={projects}
              timeEntries={timeEntries}
              payrolls={payrolls}
              attendance={attendance}
              leaves={leaves}
              performanceReviews={performanceReviews}
            />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeReports
              employees={employees}
              attendance={attendance}
              leaves={leaves}
              performanceReviews={performanceReviews}
            />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectReports
              projects={projects}
              employees={employees}
              timeEntries={timeEntries}
            />
          </TabsContent>

          <TabsContent value="time">
            <TimeTrackingReports
              timeEntries={timeEntries}
              employees={employees}
              projects={projects}
            />
          </TabsContent>

          <TabsContent value="payroll">
            <PayrollReports
              payrolls={payrolls}
              employees={employees}
            />
          </TabsContent>

          <TabsContent value="custom">
            <CustomReportBuilder
              employees={employees}
              projects={projects}
              timeEntries={timeEntries}
              payrolls={payrolls}
              attendance={attendance}
              leaves={leaves}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}