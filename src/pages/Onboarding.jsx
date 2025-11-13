
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { UserPlus, CheckSquare, FileText, Users, TrendingUp, Clock, AlertCircle, Send, Bell, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import StatCard from "../components/hrms/StatCard";
import NewHiresList from "../components/onboarding/NewHiresList";
import ChecklistManager from "../components/onboarding/ChecklistManager";
import TaskBoard from "../components/onboarding/TaskBoard";
import DocumentCenter from "../components/onboarding/DocumentCenter";
import OnboardingDashboard from "../components/onboarding/OnboardingDashboard";
import ChecklistForm from "../components/onboarding/ChecklistForm";
import AssignChecklistModal from "../components/onboarding/AssignChecklistModal";
import { toast } from "sonner";
import ProtectedModule from '@/components/ProtectedModule';
import { useAccessControl } from '@/components/AccessControlContext';

function OnboardingContent() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const { selectedCompanyId, setSelectedCompanyId, getAccessibleCompanyIds, hasRole } = useAccessControl();

  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRemindersDialog, setShowRemindersDialog] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const canManageOnboarding = hasRole('onboarding_specialist') || hasRole('super_admin');

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user-onboarding'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      const employees = await base44.entities.Employee.list(); // Fetch all to find current user's employee record
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(employee);
      return userData;
    }
  });

  // Get accessible company IDs for filtering
  const accessibleCompanyIds = getAccessibleCompanyIds();

  // Fetch data for companies
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });
  // Filter companies available for selection based on access
  const availableCompaniesForSelect = allCompanies.filter(c => accessibleCompanyIds.includes(c.id));

  // Fetch all employees
  const { data: rawEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });
  // Filter employees based on access control and current company selection
  const employees = rawEmployees.filter(e => {
    const isAccessible = accessibleCompanyIds.includes(e.company_id);
    const matchesSelectedCompany = selectedCompanyId === 'all' || e.company_id === selectedCompanyId;
    return isAccessible && matchesSelectedCompany;
  });

  // Get employee IDs in the current view for filtering tasks/documents
  const employeeIdsInView = employees.map(e => e.id);

  // Fetch all checklists
  const { data: rawChecklists = [], isLoading: loadingChecklists } = useQuery({
    queryKey: ['onboarding-checklists'],
    queryFn: () => base44.entities.OnboardingChecklist.list('-created_date'),
  });
  // Filter checklists (assuming checklists might have a company_id, and global ones don't)
  const checklists = rawChecklists.filter(c => {
    const isAccessible = !c.company_id || accessibleCompanyIds.includes(c.company_id);
    const matchesSelectedCompany = selectedCompanyId === 'all' || c.company_id === selectedCompanyId;
    return isAccessible && matchesSelectedCompany;
  });

  // Fetch all tasks
  const { data: allTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['onboarding-tasks'],
    queryFn: () => base44.entities.OnboardingTask.list('-created_date'),
  });
  // Filter tasks relevant to employees in the current view
  const tasks = allTasks.filter(task => employeeIdsInView.includes(task.employee_id));


  // Fetch all documents
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['onboarding-documents'],
    queryFn: () => base44.entities.OnboardingDocument.list('-created_date'),
  });
  // Filter documents relevant to employees in the current view
  const documents = allDocuments.filter(doc => employeeIdsInView.includes(doc.employee_id));


  // Mutations
  const createChecklistMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingChecklist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-checklists']);
      setShowChecklistForm(false);
      setEditingChecklist(null);
      toast.success(t('checklist_created_successfully'));
    },
    onError: () => toast.error(t('failed_to_create_checklist'))
  });

  const updateChecklistMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingChecklist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-checklists']);
      setShowChecklistForm(false);
      setEditingChecklist(null);
      toast.success(t('checklist_updated_successfully'));
    },
    onError: () => toast.error(t('failed_to_update_checklist'))
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
      toast.success(t('checklist_assigned_successfully'));
    },
    onError: () => toast.error(t('failed_to_assign_checklist'))
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-tasks']);
      toast.success(t('task_updated_successfully'));
    },
    onError: () => toast.error(t('failed_to_update_task'))
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-documents']);
      toast.success(t('document_uploaded_successfully'));
    },
    onError: () => toast.error(t('failed_to_upload_document'))
  });

  // Auto-assign onboarding mutation
  const autoAssignMutation = useMutation({
    mutationFn: async ({ employee_id, checklist_id }) => {
      const response = await base44.functions.invoke('autoAssignOnboardingTasks', {
        employee_id,
        checklist_id
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['onboarding-tasks']);
      queryClient.invalidateQueries(['employees']);
      setShowAssignDialog(false);
      setSelectedEmployeeForAssign(null);
      setSelectedChecklistId(null);
      toast.success(t('onboarding_assigned_tasks', { count: result.data.total_tasks }));
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('failed_to_assign_onboarding'));
    }
  });

  // Send reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendOnboardingReminders', {});
      return response.data;
    },
    onSuccess: (result) => {
      setShowRemindersDialog(false);
      toast.success(t('sent_reminders', { count: result.data.reminders_sent }));
    },
    onError: () => {
      toast.error(t('failed_to_send_reminders'));
    }
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
  // const overdueTasks = tasks.filter(t => t.status === 'overdue').length; // Overdue tasks are often computed on-the-fly or by backend
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

  const handleQuickAssignOnboarding = (employee) => {
    setSelectedEmployeeForAssign(employee);
    setShowAssignDialog(true);
  };

  const handleConfirmQuickAssign = () => {
    if (!selectedEmployeeForAssign) {
      toast.error(t('please_select_employee'));
      return;
    }
    autoAssignMutation.mutate({
      employee_id: selectedEmployeeForAssign.id,
      checklist_id: selectedChecklistId || null
    });
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
      toast.error(t('failed_to_upload_file'));
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
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('employee_onboarding')}</h1>
          <p className="text-slate-600">{t('streamline_new_hire')}</p>
        </div>
        <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {canManageOnboarding && (
            <>
              <Button
                onClick={() => setShowRemindersDialog(true)}
                variant="outline"
                className="gap-2"
              >
                <Bell className="w-4 h-4" />
                {t('send_reminders')}
              </Button>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder={t('all_companies')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_companies')}</SelectItem>
                  {availableCompaniesForSelect.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => { setEditingChecklist(null); setShowChecklistForm(true); }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <CheckSquare className="w-4 h-4 mr-2" /> {t('create_checklist')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('active_onboarding')}
          value={activeOnboarding}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('completion_rate')}
          value={`${completionRate}%`}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('pending_tasks')}
          value={totalTasks - completedTasks}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={t('pending_documents')}
          value={pendingDocuments}
          icon={FileText}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* My Tasks Alert (for non-admin users) */}
      {!canManageOnboarding && myTasks.filter(t => t.status !== 'completed').length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className={isRTL ? 'text-right' : ''}>
                <h3 className="font-semibold text-blue-900 mb-1">{t('you_have_pending_tasks')}</h3>
                <p className="text-sm text-blue-700">
                  {myTasks.filter(t => t.status !== 'completed').length} {t('tasks_require_attention')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue={canManageOnboarding ? 'dashboard' : 'my-tasks'} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
          {canManageOnboarding && (
            <>
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('dashboard')}
              </TabsTrigger>
              <TabsTrigger
                value="new-hires"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                {t('new_hires')}
              </TabsTrigger>
              <TabsTrigger
                value="checklists"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                {t('checklists')}
              </TabsTrigger>
            </>
          )}
          <TabsTrigger
            value="my-tasks"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('my_tasks')}
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
            {t('documents')}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        {canManageOnboarding && (
          <TabsContent value="dashboard">
            <OnboardingDashboard
              employees={employees}
              tasks={tasks}
              checklists={checklists}
            />
          </TabsContent>
        )}

        {/* New Hires Tab */}
        {canManageOnboarding && (
          <TabsContent value="new-hires">
            <NewHiresList
              newHires={newHires}
              tasks={tasks}
              checklists={checklists}
              onAssignChecklist={handleQuickAssignOnboarding}
            />
          </TabsContent>
        )}

        {/* Checklists Tab */}
        {canManageOnboarding && (
          <TabsContent value="checklists">
            <ChecklistManager
              checklists={checklists}
              onEdit={(checklist) => {
                setEditingChecklist(checklist);
                setShowChecklistForm(true);
              }}
              onDelete={(id) => {
                if (confirm(t('confirm_delete_checklist'))) {
                  base44.entities.OnboardingChecklist.delete(id).then(() => {
                    queryClient.invalidateQueries(['onboarding-checklists']);
                    toast.success(t('checklist_deleted'));
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
            employees={rawEmployees} // Pass all employees to TaskBoard for names, as it might render tasks for other assigned users
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
            documents={canManageOnboarding ? documents : documents.filter(d => d.employee_id === currentUser?.id)}
            tasks={tasks}
            currentUser={currentUser}
            userRole={canManageOnboarding ? 'admin' : 'user'}
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
                toast.success(t('document_signed_successfully'));
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
                toast.success(t('document_approved'));
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
                toast.success(t('document_rejected'));
              });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Checklist Form Dialog */}
      <Dialog open={showChecklistForm} onOpenChange={setShowChecklistForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : ''}>
              {editingChecklist ? t('edit_checklist') : t('create_new_checklist')}
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

      {/* Quick Assign Onboarding Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : ''}>{t('assign_automated_onboarding')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : ''}`}>
              {t('assign_onboarding_to')}{' '}
              <strong>{selectedEmployeeForAssign?.first_name} {selectedEmployeeForAssign?.last_name}</strong>
            </p>

            <div>
              <Label className={isRTL ? 'text-right block' : ''}>{t('select_checklist_optional')}</Label>
              <Select value={selectedChecklistId || ''} onValueChange={setSelectedChecklistId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('auto_select_based_on')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{t('auto_select_based_on')}</SelectItem>
                  {checklists.filter(c => c.is_active).map((checklist) => (
                    <SelectItem key={checklist.id} value={checklist.id}>
                      {checklist.checklist_name}
                      {checklist.department && ` (${checklist.department})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={`text-xs text-slate-500 mt-1 ${isRTL ? 'text-right' : ''}`}>
                {t('leave_empty_auto')}
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className={`text-sm text-blue-900 font-medium mb-1 ${isRTL ? 'text-right' : ''}`}>{t('what_will_happen')}</p>
              <ul className={`text-xs text-blue-700 space-y-1 ${isRTL ? 'mr-4 list-disc text-right' : 'ml-4 list-disc'}`}>
                <li>{t('default_tasks_created')}</li>
                <li>{t('tasks_assigned_by_role')}</li>
                <li>{t('due_dates_calculated')}</li>
                <li>{t('welcome_email_sent')}</li>
                <li>{t('notification_email_hr')}</li>
              </ul>
            </div>
          </div>

          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleConfirmQuickAssign}
              disabled={autoAssignMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {autoAssignMutation.isPending ? t('assigning') : t('assign_onboarding')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog open={showRemindersDialog} onOpenChange={setShowRemindersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : ''}>{t('send_onboarding_reminders')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : ''}`}>
              {t('will_send_reminders_to')}
            </p>
            <ul className={`text-sm text-slate-600 space-y-1 ${isRTL ? 'mr-4 list-disc text-right' : 'ml-4 list-disc'}`}>
              <li>{t('new_hires_overdue')}</li>
              <li>{t('new_hires_due_today')}</li>
              <li>{t('new_hires_due_tomorrow')}</li>
              <li>{t('managers_hr_assigned')}</li>
            </ul>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className={`text-xs text-amber-800 ${isRTL ? 'text-right' : ''}`}>
                <strong>{t('quick_guide')}</strong> {t('schedule_tip')}
              </p>
            </div>
          </div>

          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button variant="outline" onClick={() => setShowRemindersDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => sendRemindersMutation.mutate()}
              disabled={sendRemindersMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              {sendRemindersMutation.isPending ? t('sending') : t('send_reminders_now')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Onboarding() {
  return (
    <ProtectedModule moduleName="Onboarding">
      <OnboardingContent />
    </ProtectedModule>
  );
}
