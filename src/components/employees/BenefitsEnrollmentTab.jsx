import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Gift, Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from '@/components/TranslationContext';

export default function BenefitsEnrollmentTab({ employeeId }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['benefit-enrollments', employeeId],
    queryFn: () => base44.entities.BenefitEnrollment.filter({ employee_id: employeeId }, '-created_date'),
    enabled: !!employeeId
  });

  const { data: benefits = [] } = useQuery({
    queryKey: ['benefits'],
    queryFn: () => base44.entities.Benefit.list(),
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: (data) => base44.entities.BenefitEnrollment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['benefit-enrollments', employeeId]);
      setShowForm(false);
      setEditingEnrollment(null);
      toast.success('Benefit enrollment created successfully');
    },
    onError: () => toast.error('Failed to create enrollment')
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BenefitEnrollment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['benefit-enrollments', employeeId]);
      setShowForm(false);
      setEditingEnrollment(null);
      toast.success('Benefit enrollment updated successfully');
    },
    onError: () => toast.error('Failed to update enrollment')
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: (id) => base44.entities.BenefitEnrollment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['benefit-enrollments', employeeId]);
      toast.success('Benefit enrollment deleted successfully');
    },
    onError: () => toast.error('Failed to delete enrollment')
  });

  const EnrollmentForm = ({ enrollment, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(enrollment || {
      employee_id: employeeId,
      benefit_id: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      effective_date: '',
      status: 'active',
      employee_contribution: 0,
      employer_contribution: 0,
      policy_number: '',
      card_number: '',
      notes: ''
    });

    const handleBenefitChange = (benefitId) => {
      const selectedBenefit = benefits.find(b => b.id === benefitId);
      if (selectedBenefit) {
        setFormData({
          ...formData,
          benefit_id: benefitId,
          employee_contribution: selectedBenefit.employee_contribution || 0,
          employer_contribution: selectedBenefit.employer_contribution || 0
        });
      } else {
        setFormData({ ...formData, benefit_id: benefitId });
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Benefit *</Label>
            <Select
              value={formData.benefit_id}
              onValueChange={handleBenefitChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select benefit" />
              </SelectTrigger>
              <SelectContent>
                {benefits.filter(b => b.is_active).map(benefit => (
                  <SelectItem key={benefit.id} value={benefit.id}>
                    {benefit.benefit_name} ({benefit.benefit_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({...formData, status: val})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Enrollment Date *</Label>
            <Input
              type="date"
              value={formData.enrollment_date}
              onChange={(e) => setFormData({...formData, enrollment_date: e.target.value})}
              required
            />
          </div>
          <div>
            <Label>Effective Date</Label>
            <Input
              type="date"
              value={formData.effective_date}
              onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Employee Contribution (SAR/month)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.employee_contribution}
              onChange={(e) => setFormData({...formData, employee_contribution: parseFloat(e.target.value)})}
            />
          </div>
          <div>
            <Label>Employer Contribution (SAR/month)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.employer_contribution}
              onChange={(e) => setFormData({...formData, employer_contribution: parseFloat(e.target.value)})}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Policy Number</Label>
            <Input
              value={formData.policy_number}
              onChange={(e) => setFormData({...formData, policy_number: e.target.value})}
              placeholder="e.g., POL-12345"
            />
          </div>
          <div>
            <Label>Card Number</Label>
            <Input
              value={formData.card_number}
              onChange={(e) => setFormData({...formData, card_number: e.target.value})}
              placeholder="Insurance card number"
            />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            {enrollment ? 'Update' : 'Enroll'} Benefit
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-lg font-semibold text-slate-900">Benefits Enrollment</h3>
          <p className="text-sm text-slate-600">Manage employee benefit enrollments</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => { setEditingEnrollment(null); setShowForm(!showForm); }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Enroll Benefit
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <EnrollmentForm
              enrollment={editingEnrollment}
              onSubmit={(data) => {
                if (editingEnrollment) {
                  updateEnrollmentMutation.mutate({ id: editingEnrollment.id, data });
                } else {
                  createEnrollmentMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingEnrollment(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {loadingEnrollments ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-2">No benefit enrollments</p>
            <p className="text-sm text-slate-400 mb-4">Add benefits to track employee enrollments</p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Enrollment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => {
            const benefit = benefits.find(b => b.id === enrollment.benefit_id);
            const StatusIcon = statusIcons[enrollment.status] || Clock;

            return (
              <Card key={enrollment.id} className="border-slate-200 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {benefit?.benefit_name || 'Unknown Benefit'}
                      </h4>
                      <p className="text-sm text-slate-600">{benefit?.benefit_type?.replace('_', ' ')}</p>
                      <Badge className={`${statusColors[enrollment.status]} mt-2`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {enrollment.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingEnrollment(enrollment);
                          setShowForm(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Delete this enrollment?')) {
                            deleteEnrollmentMutation.mutate(enrollment.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    {enrollment.enrollment_date && (
                      <div className="p-2 bg-slate-50 rounded text-xs">
                        <p className="text-slate-500">Enrolled</p>
                        <p className="font-semibold text-slate-900">
                          {format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    <div className="p-2 bg-blue-50 rounded text-xs">
                      <p className="text-blue-700">Employee Share</p>
                      <p className="font-bold text-blue-900">
                        {enrollment.employee_contribution?.toLocaleString() || 0} SAR/mo
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded text-xs">
                      <p className="text-emerald-700">Employer Share</p>
                      <p className="font-bold text-emerald-900">
                        {enrollment.employer_contribution?.toLocaleString() || 0} SAR/mo
                      </p>
                    </div>
                  </div>

                  {(enrollment.policy_number || enrollment.card_number) && (
                    <div className="text-xs text-slate-600 space-y-1">
                      {enrollment.policy_number && <p>Policy: {enrollment.policy_number}</p>}
                      {enrollment.card_number && <p>Card: {enrollment.card_number}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}