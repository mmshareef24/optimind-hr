import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, Users, FolderKanban, Clock, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeReports from "../components/reports/EmployeeReports";
import ProjectReports from "../components/reports/ProjectReports";
import TimeTrackingReports from "../components/reports/TimeTrackingReports";
import PayrollReportsGenerator from "../components/payroll/PayrollReportsGenerator";

export default function Reports() {
  const [activeTab, setActiveTab] = useState('employees');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks'],
    queryFn: () => base44.entities.ProjectTask.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => base44.entities.TimeEntry.list(),
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list(),
  });

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Analytics</h1>
        <p className="text-slate-600">Generate customizable reports and view analytics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card 
          className={`border-0 shadow-lg cursor-pointer transition-all ${
            activeTab === 'employees' ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => setActiveTab('employees')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Employees</p>
                <p className="text-2xl font-bold text-emerald-600">{employees.length}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg cursor-pointer transition-all ${
            activeTab === 'projects' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setActiveTab('projects')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Projects</p>
                <p className="text-2xl font-bold text-blue-600">{projects.length}</p>
              </div>
              <FolderKanban className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg cursor-pointer transition-all ${
            activeTab === 'time' ? 'ring-2 ring-purple-500' : ''
          }`}
          onClick={() => setActiveTab('time')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Time Entries</p>
                <p className="text-2xl font-bold text-purple-600">{timeEntries.length}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-0 shadow-lg cursor-pointer transition-all ${
            activeTab === 'payroll' ? 'ring-2 ring-amber-500' : ''
          }`}
          onClick={() => setActiveTab('payroll')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Payroll Records</p>
                <p className="text-2xl font-bold text-amber-600">{payrolls.length}</p>
              </div>
              <DollarSign className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Employee Reports</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                <span className="hidden sm:inline">Project Reports</span>
              </TabsTrigger>
              <TabsTrigger value="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Time Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="payroll" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Payroll Reports</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="employees">
              <EmployeeReports 
                employees={employees}
                departments={departments}
              />
            </TabsContent>

            <TabsContent value="projects">
              <ProjectReports 
                projects={projects}
                tasks={tasks}
                employees={employees}
                departments={departments}
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
              <PayrollReportsGenerator 
                payrolls={payrolls}
                employees={employees}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}