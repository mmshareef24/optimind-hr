import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeTrackingDashboard from "../components/time/TimeTrackingDashboard";
import TimeEntryForm from "../components/time/TimeEntryForm";
import { toast } from "sonner";

export default function TimeTracking() {
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => base44.entities.TimeEntry.list('-date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks'],
    queryFn: () => base44.entities.ProjectTask.list(),
  });

  const currentEmployee = employees.find(e => e.email === user?.email);

  // Filter entries for current employee
  const myTimeEntries = timeEntries.filter(e => e.employee_id === currentEmployee?.id);

  const createEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['time-entries']);
      setShowEntryDialog(false);
      setEditingEntry(null);
      toast.success('Time entry logged successfully');
    },
    onError: () => {
      toast.error('Failed to log time entry');
    }
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['time-entries']);
      setShowEntryDialog(false);
      setEditingEntry(null);
      toast.success('Time entry updated successfully');
    },
    onError: () => {
      toast.error('Failed to update time entry');
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['time-entries']);
      toast.success('Time entry deleted');
    },
    onError: () => {
      toast.error('Failed to delete time entry');
    }
  });

  const handleSubmitEntry = (data) => {
    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data });
    } else {
      createEntryMutation.mutate(data);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowEntryDialog(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEntryDialog(true);
  };

  const handleDeleteEntry = (id) => {
    if (confirm('Are you sure you want to delete this time entry?')) {
      deleteEntryMutation.mutate(id);
    }
  };

  const handleGenerateTimesheet = () => {
    toast.success('Timesheet generation feature coming soon!');
  };

  if (!currentEmployee) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">Loading employee information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Time Tracking</h1>
          <p className="text-slate-600">Log your hours and manage timesheets</p>
        </div>
        <Button 
          onClick={handleAddEntry}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Hours
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="my-time" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-time">
            <Clock className="w-4 h-4 mr-2" />
            My Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-time">
          <TimeTrackingDashboard
            employee={currentEmployee}
            timeEntries={myTimeEntries}
            projects={projects}
            tasks={tasks}
            onAddEntry={handleAddEntry}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onGenerateTimesheet={handleGenerateTimesheet}
          />
        </TabsContent>
      </Tabs>

      {/* Time Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Time Entry' : 'Log Time Entry'}
            </DialogTitle>
          </DialogHeader>
          <TimeEntryForm
            entry={editingEntry}
            employee={currentEmployee}
            projects={projects}
            tasks={tasks}
            onSubmit={handleSubmitEntry}
            onCancel={() => {
              setShowEntryDialog(false);
              setEditingEntry(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}