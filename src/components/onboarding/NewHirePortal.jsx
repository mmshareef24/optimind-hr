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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { 
  CheckCircle, Clock, AlertCircle, FileText, Upload, Calendar, 
  Edit, Trophy, Target, Sparkles 
} from "lucide-react";
import { toast } from "sonner";

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

  // Calculate completion
  const totalTasks = tasks.length;
  const completedTasks = tasksByStatus.completed.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
      {/* Welcome Banner */}
      <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome, {employee.first_name}! 🎉
              </h2>
              <p className="text-blue-100 mb-4">
                Let's get you started with your onboarding journey
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span>{completedTasks}/{totalTasks} Tasks Complete</span>
                </div>
                {completionPercentage === 100 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-300" />
                    <span>All Done!</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{completionPercentage}%</div>
              <Progress value={completionPercentage} className="w-32 h-3 bg-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Tasks Alert */}
      {tasksByStatus.overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">
                  You have {tasksByStatus.overdue.length} overdue task{tasksByStatus.overdue.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-700">Please complete these tasks as soon as possible</p>
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

      {/* Complete Task Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Task: {selectedTask?.task_title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">{selectedTask?.task_description}</p>

            {selectedTask?.requires_document && (
              <div>
                <Label>Upload Required Document *</Label>
                <div className="mt-2">
                  {completionData.document_url ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm text-emerald-700">Document uploaded</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                      {uploadingFile && <span className="text-sm text-slate-500">Uploading...</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTask?.requires_signature && (
              <div>
                <Label>Your Signature *</Label>
                <div className="mt-2">
                  <Input
                    placeholder="Type your full name as signature"
                    value={completionData.signature_data || ''}
                    onChange={(e) => setCompletionData({ ...completionData, signature_data: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    By typing your name, you acknowledge and agree to this task
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes or comments..."
                value={completionData.notes}
                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCompletion}
              disabled={completeTaskMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {completeTaskMutation.isPending ? 'Completing...' : 'Complete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({ task, getStatusIcon, getStatusColor, getPriorityColor, onComplete, readOnly = false }) {
  return (
    <Card className="border border-slate-200 hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon(task.status)}
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">{task.task_title}</h4>
              <p className="text-sm text-slate-600 mb-2">{task.task_description}</p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace(/_/g, ' ')}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                {task.requires_document && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Document Required
                  </Badge>
                )}
                {task.requires_signature && (
                  <Badge variant="outline" className="text-xs">
                    <Edit className="w-3 h-3 mr-1" />
                    Signature Required
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </div>
                {task.completed_date && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    Completed: {new Date(task.completed_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {!readOnly && task.status !== 'completed' && (
            <Button
              size="sm"
              onClick={() => onComplete(task)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}