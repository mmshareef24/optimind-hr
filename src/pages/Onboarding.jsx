import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { UserPlus, CheckSquare, FileText, Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import StatCard from "../components/hrms/StatCard";
import NewHiresList from "../components/onboarding/NewHiresList";
import ChecklistManager from "../components/onboarding/ChecklistManager";
import TaskBoard from "../components/onboarding/TaskBoard";
import DocumentCenter from "../components/onboarding/DocumentCenter";
import OnboardingProgress from "../components/onboarding/OnboardingProgress";
import ChecklistForm from "../components/onboarding/ChecklistForm";
import AssignChecklistModal from "../components/onboarding/AssignChecklistModal";
import { toast } from "sonner";

export default function Onboarding() {
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user-onboarding'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setUserRole(userData.role || 'user');
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(employee);
      return userData;
    }
  });

  // Fetch data
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: checklists = [], isLoading: loadingChecklists } = useQuery({
    queryKey: ['onboarding-checklists'],
    queryFn: () => base44.entities.OnboardingChecklist.list('-created_date'),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['onboarding-tasks'],
    queryFn: () => base44.entities.OnboardingTask.list('-created_date'),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['onboarding-documents'],
    queryFn: () => base44.entities.OnboardingDocument.list('-created_date'),
  });

  // Mutations
  const createChecklistMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingChecklist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-checklists']);
      setShowChecklistForm(false);
      setEditingChecklist(null);
      toast.success('Checklist created successfully');
    },
    onError: () => toast.error('Failed to create checklist')
  });

  const updateChecklistMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingChecklist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-checklists']);
      setShowChecklistForm(false);
      setEditingChecklist(null);
      toast.success('Checklist updated successfully');
    },
    onError: () => toast.error('Failed to update checklist')
  });

  const assignChecklistMutation = useMutation({
    mutationFn: async ({ employeeId, checklistId, tasks, startDate }) => {
      // Create tasks for the employee
      const taskPromises = tasks.map((task, index) => {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (task.day_number || index));
        
        return base44.entities.OnboardingTask.create({
          ...task,
          employee_id: employeeId,
          checklist_id: checklistId,
          due_date: dueDate.toISOString().split('T')[0],
          order: index
        });
      });
      
      await Promise.all(taskPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-tasks']);
      setShowAssignModal(false);
      setSelectedEmployee(null);
      toast.success('Checklist assigned successfully');
    },
    onError: () => toast.error('Failed to assign checklist')
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-tasks']);
      toast.success('Task updated successfully');
    },
    onError: () => toast.error('Failed to update task')
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-documents']);
      toast.success('Document uploaded successfully');
    },
    onError: () => toast.error('Failed to upload document')
  });

  // Filter new hires (hired in last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const newHires = employees.filter(emp => {
    const hireDate = new Date(emp.hire_date);
    return hireDate >= ninetyDaysAgo;
  });

  // Calculate statistics
  const activeOnboarding = newHires.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const pendingDocuments = documents.filter(d => d.status === 'pending' || d.status === 'submitted').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get tasks for current user
  const myTasks = currentUser ? tasks.filter(t => 
    t.employee_id === currentUser.id || 
    t.assigned_user_id === currentUser.id
  ) : [];

  const handleSubmitChecklist = (data) => {
    if (editingChecklist) {
      updateChecklistMutation.mutate({ id: editingChecklist.id, data });
    } else {
      createChecklistMutation.mutate(data);
    }
  };

  const handleAssignChecklist = (employeeId) => {
    setSelectedEmployee(employeeId);
    setShowAssignModal(true);
  };

  const handleCompleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    updateTaskMutation.mutate({
      id: taskId,
      data: {
        ...task,
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0],
        completed_by: currentUser?.id
      }
    });
  };

  const handleUploadDocument = async (file, documentData) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadDocumentMutation.mutate({
        ...documentData,
        file_url,
        uploaded_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  if (loadingEmployees || loadingChecklists || loadingTasks) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Onboarding</h1>
          <p className="text-slate-600">Streamline the new hire experience</p>
        </div>
        {userRole === 'admin' && (
          <Button 
            onClick={() => { setEditingChecklist(null); setShowChecklistForm(true); }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <CheckSquare className="w-4 h-4 mr-2" /> Create Checklist
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Onboarding"
          value={activeOnboarding}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Pending Tasks"
          value={totalTasks - completedTasks}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Pending Documents"
          value={pendingDocuments}
          icon={FileText}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* My Tasks Alert (for non-admin users) */}
      {userRole !== 'admin' && myTasks.filter(t => t.status !== 'completed').length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">You have pending onboarding tasks</h3>
                <p className="text-sm text-blue-700">
                  {myTasks.filter(t => t.status !== 'completed').length} tasks require your attention. 
                  Please complete them as soon as possible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue={userRole === 'admin' ? 'new-hires' : 'my-tasks'} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          {userRole === 'admin' && (
            <>
              <TabsTrigger
                value="new-hires"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                New Hires
              </TabsTrigger>
              <TabsTrigger
                value="checklists"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Checklists
              </TabsTrigger>
            </>
          )}
          <TabsTrigger
            value="my-tasks"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            My Tasks
            {myTasks.filter(t => t.status !== 'completed').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {myTasks.filter(t => t.status !== 'completed').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* New Hires Tab */}
        {userRole === 'admin' && (
          <TabsContent value="new-hires">
            <NewHiresList
              newHires={newHires}
              tasks={tasks}
              checklists={checklists}
              onAssignChecklist={handleAssignChecklist}
            />
          </TabsContent>
        )}

        {/* Checklists Tab */}
        {userRole === 'admin' && (
          <TabsContent value="checklists">
            <ChecklistManager
              checklists={checklists}
              onEdit={(checklist) => {
                setEditingChecklist(checklist);
                setShowChecklistForm(true);
              }}
              onDelete={(id) => {
                if (confirm('Are you sure you want to delete this checklist?')) {
                  base44.entities.OnboardingChecklist.delete(id).then(() => {
                    queryClient.invalidateQueries(['onboarding-checklists']);
                    toast.success('Checklist deleted');
                  });
                }
              }}
            />
          </TabsContent>
        )}

        {/* My Tasks Tab */}
        <TabsContent value="my-tasks">
          <TaskBoard
            tasks={myTasks}
            employees={employees}
            currentUser={currentUser}
            onCompleteTask={handleCompleteTask}
            onUpdateTask={(taskId, data) => {
              const task = tasks.find(t => t.id === taskId);
              updateTaskMutation.mutate({ id: taskId, data: { ...task, ...data } });
            }}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentCenter
            documents={userRole === 'admin' ? documents : documents.filter(d => d.employee_id === currentUser?.id)}
            tasks={tasks}
            currentUser={currentUser}
            userRole={userRole}
            onUploadDocument={handleUploadDocument}
            onSignDocument={(docId, signatureData) => {
              const doc = documents.find(d => d.id === docId);
              base44.entities.OnboardingDocument.update(docId, {
                ...doc,
                is_signed: true,
                signature_data: signatureData,
                signed_date: new Date().toISOString().split('T')[0],
                signed_by: currentUser?.id
              }).then(() => {
                queryClient.invalidateQueries(['onboarding-documents']);
                toast.success('Document signed successfully');
              });
            }}
            onApproveDocument={(docId) => {
              const doc = documents.find(d => d.id === docId);
              base44.entities.OnboardingDocument.update(docId, {
                ...doc,
                status: 'approved',
                reviewed_by: currentUser?.id,
                reviewed_date: new Date().toISOString().split('T')[0]
              }).then(() => {
                queryClient.invalidateQueries(['onboarding-documents']);
                toast.success('Document approved');
              });
            }}
            onRejectDocument={(docId, reason) => {
              const doc = documents.find(d => d.id === docId);
              base44.entities.OnboardingDocument.update(docId, {
                ...doc,
                status: 'rejected',
                reviewed_by: currentUser?.id,
                reviewed_date: new Date().toISOString().split('T')[0],
                rejection_reason: reason
              }).then(() => {
                queryClient.invalidateQueries(['onboarding-documents']);
                toast.success('Document rejected');
              });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Checklist Form Dialog */}
      <Dialog open={showChecklistForm} onOpenChange={setShowChecklistForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChecklist ? 'Edit Checklist' : 'Create New Checklist'}
            </DialogTitle>
          </DialogHeader>
          <ChecklistForm
            checklist={editingChecklist}
            onSubmit={handleSubmitChecklist}
            onCancel={() => {
              setShowChecklistForm(false);
              setEditingChecklist(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Checklist Modal */}
      {selectedEmployee && (
        <AssignChecklistModal
          open={showAssignModal}
          onOpenChange={setShowAssignModal}
          employee={employees.find(e => e.id === selectedEmployee)}
          checklists={checklists.filter(c => c.is_active)}
          onAssign={(checklistId, tasks, startDate) => {
            assignChecklistMutation.mutate({
              employeeId: selectedEmployee,
              checklistId,
              tasks,
              startDate
            });
          }}
        />
      )}
    </div>
  );
}