import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { UserX, CheckCircle, Clock, AlertCircle, Plus, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "../components/hrms/StatCard";
import OffboardingForm from "../components/offboarding/OffboardingForm";
import OffboardingProcessCard from "../components/offboarding/OffboardingProcessCard";
import OffboardingTaskBoard from "../components/offboarding/OffboardingTaskBoard";
import ClearanceBoard from "../components/offboarding/ClearanceBoard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

export default function Offboarding() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [showForm, setShowForm] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const { data: offboardingProcesses = [], isLoading: loadingProcesses } = useQuery({
    queryKey: ['offboarding-processes'],
    queryFn: () => base44.entities.OffboardingProcess.list('-created_date')
  });

  const { data: offboardingTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['offboarding-tasks'],
    queryFn: () => base44.entities.OffboardingTask.list('-due_date')
  });

  const { data: clearanceItems = [], isLoading: loadingClearances } = useQuery({
    queryKey: ['clearance-items'],
    queryFn: () => base44.entities.ClearanceItem.list()
  });

  const createProcessMutation = useMutation({
    mutationFn: (data) => base44.entities.OffboardingProcess.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offboarding-processes']);
      toast.success('Offboarding process initiated successfully');
      setShowForm(false);
    },
    onError: () => toast.error('Failed to initiate offboarding')
  });

  const updateProcessMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OffboardingProcess.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offboarding-processes']);
      toast.success('Offboarding process updated');
      setShowForm(false);
      setEditingProcess(null);
    },
    onError: () => toast.error('Failed to update offboarding')
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.OffboardingTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offboarding-tasks']);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OffboardingTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offboarding-tasks']);
      toast.success('Task updated');
    },
    onError: () => toast.error('Failed to update task')
  });

  const createClearanceMutation = useMutation({
    mutationFn: (data) => base44.entities.ClearanceItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clearance-items']);
    }
  });

  const updateClearanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClearanceItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clearance-items']);
      toast.success('Clearance updated');
    },
    onError: () => toast.error('Failed to update clearance')
  });

  const handleSubmit = async (processData) => {
    const process = editingProcess 
      ? await updateProcessMutation.mutateAsync({ id: editingProcess.id, data: processData })
      : await createProcessMutation.mutateAsync(processData);

    if (!editingProcess && process) {
      const defaultTasks = [
        { name: 'Collect company laptop and equipment', role: 'it', days: 0, priority: 'critical' },
        { name: 'Return access cards and keys', role: 'admin', days: 0, priority: 'high' },
        { name: 'Disable all system access', role: 'it', days: 0, priority: 'critical' },
        { name: 'Conduct exit interview', role: 'hr', days: -2, priority: 'high' },
        { name: 'Process final payroll', role: 'finance', days: 7, priority: 'critical' },
        { name: 'Calculate and pay EOSB', role: 'finance', days: 14, priority: 'critical' },
        { name: 'Transfer knowledge to team', role: 'manager', days: -5, priority: 'high' },
        { name: 'Update GOSI records', role: 'hr', days: 3, priority: 'high' },
        { name: 'Cancel health insurance', role: 'hr', days: 7, priority: 'medium' },
        { name: 'Issue experience certificate', role: 'hr', days: 7, priority: 'medium' },
        { name: 'Close email account', role: 'it', days: 1, priority: 'medium' },
        { name: 'Archive employee files', role: 'hr', days: 14, priority: 'low' }
      ];

      const lastWorkingDay = new Date(processData.last_working_day);
      
      for (const task of defaultTasks) {
        await createTaskMutation.mutateAsync({
          offboarding_process_id: process.id,
          employee_id: processData.employee_id,
          task_name: task.name,
          assigned_to_role: task.role,
          due_date: format(addDays(lastWorkingDay, task.days), 'yyyy-MM-dd'),
          priority: task.priority,
          status: 'pending'
        });
      }

      // Create clearance items
      const employee = employees.find(e => e.id === processData.employee_id);
      const clearances = [
        {
          offboarding_process_id: process.id,
          employee_id: processData.employee_id,
          department: 'warehouse',
          clearance_type: 'Tools & Equipment Return',
          description: 'Return all company tools, equipment, and assets',
          requires_documentation: true
        },
        {
          offboarding_process_id: process.id,
          employee_id: processData.employee_id,
          department: 'finance_loans',
          clearance_type: 'Loan & Advance Settlement',
          description: 'Clear all outstanding employee loans and salary advances',
          requires_documentation: true
        },
        {
          offboarding_process_id: process.id,
          employee_id: processData.employee_id,
          department: 'hr_manager',
          clearance_type: 'HR Manager Final Approval',
          description: 'Final review and approval of complete offboarding process',
          requires_documentation: false
        }
      ];

      // Conditional clearance for salesmen
      if (employee?.job_title?.toLowerCase().includes('sales') || 
          employee?.department?.toLowerCase().includes('sales')) {
        clearances.push({
          offboarding_process_id: process.id,
          employee_id: processData.employee_id,
          department: 'finance_customer_balances',
          clearance_type: 'Customer Account Settlement',
          description: 'Verify all customer accounts are settled and no outstanding balances',
          requires_documentation: true,
          is_conditional: true
        });
      }

      for (const clearance of clearances) {
        await createClearanceMutation.mutateAsync(clearance);
      }
    }
  };

  const filteredProcesses = statusFilter === 'all' 
    ? offboardingProcesses 
    : offboardingProcesses.filter(p => p.status === statusFilter);

  const activeProcesses = offboardingProcesses.filter(p => 
    ['initiated', 'in_progress', 'pending_clearance'].includes(p.status)
  ).length;

  const completedProcesses = offboardingProcesses.filter(p => p.status === 'completed').length;
  const pendingTasks = offboardingTasks.filter(t => t.status === 'pending').length;
  const overdueTasks = offboardingTasks.filter(t => 
    t.status === 'pending' && new Date(t.due_date) < new Date()
  ).length;

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">Only administrators can access offboarding management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Offboarding</h1>
          <p className="text-slate-600">Manage employee exits and clearance processes</p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button 
            onClick={() => {
              setEditingProcess(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Initiate Offboarding
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title="Active Offboarding"
          value={activeProcesses}
          icon={UserX}
          bgColor="from-red-500 to-red-600"
        />
        <StatCard
          title="Completed"
          value={completedProcesses}
          icon={CheckCircle}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Overdue Tasks"
          value={overdueTasks}
          icon={AlertCircle}
          bgColor="from-red-500 to-red-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="processes" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="processes" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <UserX className="w-4 h-4 mr-2" />
            Offboarding Processes
          </TabsTrigger>
          <TabsTrigger value="clearances" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Clearance Board
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Task Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes">
          <div className="space-y-4">
            {/* Filters */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Filter className="w-5 h-5 text-slate-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="initiated">Initiated</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending_clearance">Pending Clearance</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Process List */}
            {loadingProcesses ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : filteredProcesses.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <UserX className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Offboarding Processes</h3>
                  <p className="text-slate-600 mb-4">Start managing employee exits by initiating an offboarding process.</p>
                  <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Initiate First Offboarding
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredProcesses.map(process => (
                  <OffboardingProcessCard
                    key={process.id}
                    process={process}
                    employee={employees.find(e => e.id === process.employee_id)}
                    tasks={offboardingTasks.filter(t => t.offboarding_process_id === process.id)}
                    onEdit={() => {
                      setEditingProcess(process);
                      setShowForm(true);
                    }}
                    onUpdateProcess={(data) => updateProcessMutation.mutate({ id: process.id, data })}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="clearances">
          <ClearanceBoard
            clearanceItems={clearanceItems}
            employee={null}
            onUpdate={(id, data) => updateClearanceMutation.mutate({ id, data })}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <OffboardingTaskBoard
            tasks={offboardingTasks}
            processes={offboardingProcesses}
            employees={employees}
            onUpdateTask={(id, data) => updateTaskMutation.mutate({ id, data })}
          />
        </TabsContent>
      </Tabs>

      {/* Offboarding Form Dialog */}
      <OffboardingForm
        process={editingProcess}
        employees={employees.filter(e => e.status === 'active')}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingProcess(null);
        }}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  );
}