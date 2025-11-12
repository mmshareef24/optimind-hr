import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, Clock, AlertCircle, FileText, Upload, Calendar, 
  Edit, Trophy, Target, Sparkles, Download, Eye, PartyPopper,
  Zap, Rocket, Star, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

export default function NewHirePortal({ employee, tasks }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [completionData, setCompletionData] = useState({
    notes: '',
    document_url: null,
    signature_data: null
  });

  const queryClient = useQueryClient();

  // Group tasks by status
  const tasksByStatus = {
    overdue: tasks.filter(t => t.status === 'overdue'),
    not_started: tasks.filter(t => t.status === 'not_started'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed')
  };

  // Calculate completion and statistics
  const totalTasks = tasks.length;
  const completedTasks = tasksByStatus.completed.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const daysWithCompany = differenceInDays(new Date(), new Date(employee.hire_date));
  const tasksRemaining = totalTasks - completedTasks;
  const overdueTasks = tasksByStatus.overdue.length;
  
  // Calculate next milestone
  const getNextMilestone = () => {
    if (completionPercentage >= 100) return null;
    if (completionPercentage < 25) return { label: 'First Quarter', target: 25, icon: Zap };
    if (completionPercentage < 50) return { label: 'Halfway There', target: 50, icon: Rocket };
    if (completionPercentage < 75) return { label: 'Three Quarters', target: 75, icon: Star };
    return { label: 'Almost Done', target: 100, icon: Trophy };
  };
  
  const nextMilestone = getNextMilestone();

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => {
      setCompletionData({ ...completionData, document_url: url });
      toast.success('Document uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload document');
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('completeOnboardingTask', {
        task_id: selectedTask.id,
        notes: completionData.notes,
        document_url: completionData.document_url,
        signature_data: completionData.signature_data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-tasks']);
      setShowCompleteDialog(false);
      setSelectedTask(null);
      setCompletionData({ notes: '', document_url: null, signature_data: null });
      toast.success('Task completed! Great job!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to complete task');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingFile(true);
      uploadFileMutation.mutate(file);
      setUploadingFile(false);
    }
  };

  const handleCompleteTask = (task) => {
    setSelectedTask(task);
    setShowCompleteDialog(true);
  };

  const handleSubmitCompletion = () => {
    if (selectedTask.requires_document && !completionData.document_url) {
      toast.error('Please upload the required document');
      return;
    }
    if (selectedTask.requires_signature && !completionData.signature_data) {
      toast.error('Please provide your signature');
      return;
    }
    completeTaskMutation.mutate();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Banner */}
      <Card className="border-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <CardContent className="p-8 relative z-10">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Welcome Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    Welcome, {employee.first_name}! {completionPercentage === 100 ? '🏆' : '👋'}
                  </h2>
                  <p className="text-blue-100">
                    {employee.job_title} • {employee.department}
                  </p>
                </div>
              </div>
              
              <p className="text-white/90 mb-6 text-lg">
                {completionPercentage === 100 
                  ? "Congratulations! You've completed your onboarding journey. Welcome to the team!"
                  : "Let's get you started with your onboarding journey. Complete your tasks to unlock your full potential!"}
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-200" />
                    <span className="text-xs text-blue-200">Days with us</span>
                  </div>
                  <p className="text-2xl font-bold">{daysWithCompany}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-200" />
                    <span className="text-xs text-blue-200">Tasks Done</span>
                  </div>
                  <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-200" />
                    <span className="text-xs text-blue-200">Progress</span>
                  </div>
                  <p className="text-2xl font-bold">{completionPercentage}%</p>
                </div>
              </div>
            </div>
            
            {/* Progress Circle */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-40 h-40 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-1">{completionPercentage}%</div>
                    <div className="text-sm text-blue-100">Complete</div>
                  </div>
                </div>
                {completionPercentage === 100 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2 animate-bounce">
                    <Trophy className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Bar with Milestone */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-100">Your Journey</span>
              {nextMilestone && (
                <div className="flex items-center gap-2 text-sm">
                  <nextMilestone.icon className="w-4 h-4" />
                  <span>Next: {nextMilestone.label} ({nextMilestone.target}%)</span>
                </div>
              )}
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-4 bg-white/20"
            />
            {completionPercentage === 100 && (
              <p className="text-center mt-3 text-sm flex items-center justify-center gap-2">
                <PartyPopper className="w-4 h-4" />
                <span>You've unlocked: Fully Onboarded Status!</span>
                <PartyPopper className="w-4 h-4" />
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Overdue Tasks Alert */}
      {tasksByStatus.overdue.length > 0 && (
        <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg mb-1">
                  🚨 {tasksByStatus.overdue.length} Task{tasksByStatus.overdue.length > 1 ? 's' : ''} Need{tasksByStatus.overdue.length === 1 ? 's' : ''} Immediate Attention
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  These tasks are past their due date. Please prioritize them to stay on track with your onboarding.
                </p>
                <div className="flex flex-wrap gap-2">
                  {tasksByStatus.overdue.slice(0, 3).map((task) => (
                    <Badge key={task.id} variant="outline" className="bg-white border-red-200 text-red-700">
                      {task.task_title}
                    </Badge>
                  ))}
                  {tasksByStatus.overdue.length > 3 && (
                    <Badge variant="outline" className="bg-white border-red-200 text-red-700">
                      +{tasksByStatus.overdue.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Progress Encouragement Card */}
      {completionPercentage > 0 && completionPercentage < 100 && tasksByStatus.overdue.length === 0 && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 mb-1">
                  {completionPercentage >= 75 ? "Almost There!" : 
                   completionPercentage >= 50 ? "Great Progress!" : 
                   "You're Doing Great!"}
                </h3>
                <p className="text-sm text-emerald-700">
                  {tasksRemaining} task{tasksRemaining !== 1 ? 's' : ''} remaining. 
                  {nextMilestone && ` Just ${nextMilestone.target - completionPercentage}% away from ${nextMilestone.label}!`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">{completionPercentage}%</div>
                <div className="text-xs text-emerald-600">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Lists */}
      {tasksByStatus.overdue.length > 0 && (
        <Card>
          <CardHeader className="border-b bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Overdue Tasks ({tasksByStatus.overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {tasksByStatus.overdue.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  onComplete={handleCompleteTask}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-5 h-5" />
            Your Tasks ({tasksByStatus.not_started.length + tasksByStatus.in_progress.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {[...tasksByStatus.in_progress, ...tasksByStatus.not_started].length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <p className="text-lg font-semibold text-slate-900 mb-2">
                All Tasks Complete! 🎉
              </p>
              <p className="text-slate-600">
                You've finished all your onboarding tasks. Welcome to the team!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...tasksByStatus.in_progress, ...tasksByStatus.not_started].map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  onComplete={handleCompleteTask}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {tasksByStatus.completed.length > 0 && (
        <Card>
          <CardHeader className="border-b bg-emerald-50">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <CheckCircle className="w-5 h-5" />
              Completed Tasks ({tasksByStatus.completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {tasksByStatus.completed.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  readOnly
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Complete Task Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              Complete Task: {selectedTask?.task_title}
            </DialogTitle>
            <DialogDescription>
              {selectedTask?.task_description}
            </DialogDescription>
          </DialogHeader>
          
          <Separator />

          <div className="space-y-5">
            {/* Task Details Card */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Due Date:</span>
                    <span className="font-semibold">{selectedTask?.due_date && format(new Date(selectedTask.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(selectedTask?.priority)}>
                      {selectedTask?.priority} Priority
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedTask?.requires_document && (
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Upload Required Document *
                </Label>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  Please upload the necessary document to complete this task
                </p>
                <div className="mt-2">
                  {completionData.document_url ? (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-emerald-900">Document Uploaded Successfully</p>
                          <p className="text-xs text-emerald-700">Your document is ready for review</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(completionData.document_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-400 transition-colors bg-slate-50">
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <Label 
                          htmlFor="file-upload" 
                          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Choose File
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          {uploadingFile ? 'Uploading...' : 'PDF, DOC, DOCX, JPG, PNG (Max 10MB)'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTask?.requires_signature && (
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Your Electronic Signature *
                </Label>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  By signing, you acknowledge that you have completed this task
                </p>
                <div className="mt-2">
                  <Card className="border-2 border-slate-300 bg-white">
                    <CardContent className="p-4">
                      <Input
                        placeholder="Type your full name as signature"
                        value={completionData.signature_data || ''}
                        onChange={(e) => setCompletionData({ ...completionData, signature_data: e.target.value })}
                        className="text-lg font-signature text-center border-0 focus-visible:ring-0"
                        style={{ fontFamily: 'cursive' }}
                      />
                      <Separator className="my-3" />
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600">
                          I, <strong>{completionData.signature_data || '________'}</strong>, confirm that I have reviewed and completed this onboarding task on {format(new Date(), 'MMMM dd, yyyy')}.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <div>
              <Label className="text-base font-semibold">Additional Notes (Optional)</Label>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Share any comments, questions, or feedback about this task
              </p>
              <Textarea
                placeholder="E.g., Completed training with John. Great insights on company culture..."
                value={completionData.notes}
                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>
            
            {/* Completion Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  What happens next?
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Your task will be marked as complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Your progress will be updated automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>HR will be notified of your completion</span>
                  </li>
                  {completedTasks + 1 === totalTasks && (
                    <li className="flex items-start gap-2">
                      <Trophy className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">This is your last task - you'll be fully onboarded! 🎉</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCompletion}
              disabled={completeTaskMutation.isPending}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
              size="lg"
            >
              {completeTaskMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Task & Continue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({ task, getStatusIcon, getStatusColor, getPriorityColor, onComplete, readOnly = false }) {
  const isOverdue = task.status === 'overdue';
  const daysUntilDue = differenceInDays(new Date(task.due_date), new Date());
  
  return (
    <Card className={`border-2 hover:shadow-lg transition-all ${
      isOverdue ? 'border-red-200 bg-red-50/50' : 
      task.status === 'completed' ? 'border-emerald-200 bg-emerald-50/50' : 
      'border-slate-200 hover:border-blue-300'
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Status Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isOverdue ? 'bg-red-100' :
              task.status === 'completed' ? 'bg-emerald-100' :
              task.status === 'in_progress' ? 'bg-blue-100' :
              'bg-slate-100'
            }`}>
              {getStatusIcon(task.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Task Title */}
              <h4 className="font-bold text-slate-900 mb-1 text-lg">{task.task_title}</h4>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.task_description}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace(/_/g, ' ')}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority} priority
                </Badge>
                {task.requires_document && (
                  <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
                    <FileText className="w-3 h-3 mr-1" />
                    Doc Required
                  </Badge>
                )}
                {task.requires_signature && (
                  <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                    <Edit className="w-3 h-3 mr-1" />
                    Signature
                  </Badge>
                )}
              </div>

              {/* Date Info */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                  {!task.completed_date && daysUntilDue >= 0 && daysUntilDue <= 3 && (
                    <Badge variant="outline" className="ml-1 text-xs bg-amber-50 text-amber-700 border-amber-200">
                      {daysUntilDue === 0 ? 'Today!' : `${daysUntilDue}d left`}
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="outline" className="ml-1 text-xs bg-red-50 text-red-700 border-red-200">
                      {Math.abs(daysUntilDue)}d overdue
                    </Badge>
                  )}
                </div>
                {task.completed_date && (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Completed: {format(new Date(task.completed_date), 'MMM dd')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          {!readOnly && task.status !== 'completed' && (
            <Button
              size="lg"
              onClick={() => onComplete(task)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg flex-shrink-0"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
          
          {task.status === 'completed' && (
            <div className="flex items-center gap-2 text-emerald-600 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Done</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}