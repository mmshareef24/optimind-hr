import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Calendar, Percent, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import SharedServiceForm from "./SharedServiceForm";

export default function SharedServiceTab({ employee }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['shared-service-assignments', employee?.id],
    queryFn: () => base44.entities.SharedServiceAssignment.filter({ employee_id: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id) => base44.entities.SharedServiceAssignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-service-assignments']);
      toast.success('Assignment deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete assignment');
    }
  });

  const activeAssignments = assignments.filter(a => a.status === 'active');
  const totalAllocation = activeAssignments.reduce((sum, a) => sum + (a.allocation_percentage || 0), 0);

  const getCompanyName = (companyId) => {
    return companies.find(c => c.id === companyId)?.name_en || 'Unknown Company';
  };

  const serviceTypeLabels = {
    it_support: 'IT Support',
    hr_services: 'HR Services',
    finance: 'Finance',
    legal: 'Legal',
    facilities: 'Facilities',
    procurement: 'Procurement',
    other: 'Other'
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shared Service Assignments</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Manage cross-company service assignments
              </p>
            </div>
            <Button 
              onClick={() => { setEditingAssignment(null); setShowForm(true); }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Summary */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Companies Served</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{activeAssignments.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">Total Allocation</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">{totalAllocation}%</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Primary Company</span>
              </div>
              <p className="text-sm font-semibold text-purple-900">
                {getCompanyName(employee?.company_id)}
              </p>
            </div>
          </div>

          {/* Assignments List */}
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">No shared service assignments</p>
              <p className="text-sm text-slate-400 mb-4">
                This employee is only assigned to their primary company
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900">
                          {getCompanyName(assignment.company_id)}
                        </h4>
                        <Badge className={
                          assignment.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-700'
                        }>
                          {assignment.status}
                        </Badge>
                        <Badge variant="outline">
                          {serviceTypeLabels[assignment.service_type]}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Percent className="w-4 h-4" />
                          <span>Allocation: <strong>{assignment.allocation_percentage}%</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            From: <strong>{format(new Date(assignment.effective_from), 'MMM dd, yyyy')}</strong>
                          </span>
                        </div>
                        {assignment.cost_allocation_amount > 0 && (
                          <div className="text-sm text-slate-600">
                            Cost Allocation: <strong>{assignment.cost_allocation_amount.toLocaleString()} SAR/month</strong>
                          </div>
                        )}
                        {assignment.effective_to && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              To: <strong>{format(new Date(assignment.effective_to), 'MMM dd, yyyy')}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {assignment.responsibilities && (
                        <p className="text-sm text-slate-600 mt-2">
                          <strong>Responsibilities:</strong> {assignment.responsibilities}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this assignment?')) {
                            deleteAssignmentMutation.mutate(assignment.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SharedServiceForm
        open={showForm}
        onOpenChange={setShowForm}
        employee={employee}
        assignment={editingAssignment}
        companies={companies}
        existingAssignments={assignments}
      />
    </div>
  );
}