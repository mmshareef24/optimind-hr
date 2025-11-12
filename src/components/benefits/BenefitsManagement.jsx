import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Plus, Edit, Heart, Shield, Car, Home, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const benefitIcons = {
  health_insurance: Heart,
  life_insurance: Shield,
  transportation_allowance: Car,
  housing_allowance: Home,
  meal_allowance: Utensils,
  other: Gift
};

export default function BenefitsManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    benefit_name: '',
    benefit_type: 'health_insurance',
    description: '',
    provider: '',
    employee_contribution: 0,
    employer_contribution: 0,
    is_mandatory: false,
    is_active: true
  });

  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: () => base44.entities.Benefit.list()
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['benefit-enrollments'],
    queryFn: () => base44.entities.BenefitEnrollment.list()
  });

  const createBenefitMutation = useMutation({
    mutationFn: (data) => base44.entities.Benefit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['benefits']);
      setShowDialog(false);
      resetForm();
      toast.success('Benefit created successfully');
    }
  });

  const updateBenefitMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Benefit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['benefits']);
      setShowDialog(false);
      resetForm();
      toast.success('Benefit updated successfully');
    }
  });

  const resetForm = () => {
    setFormData({
      benefit_name: '',
      benefit_type: 'health_insurance',
      description: '',
      provider: '',
      employee_contribution: 0,
      employer_contribution: 0,
      is_mandatory: false,
      is_active: true
    });
    setEditingBenefit(null);
  };

  const handleEdit = (benefit) => {
    setEditingBenefit(benefit);
    setFormData(benefit);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      total_cost: (formData.employee_contribution || 0) + (formData.employer_contribution || 0)
    };

    if (editingBenefit) {
      updateBenefitMutation.mutate({ id: editingBenefit.id, data });
    } else {
      createBenefitMutation.mutate(data);
    }
  };

  const activeBenefits = benefits.filter(b => b.is_active);
  const inactiveBenefits = benefits.filter(b => !b.is_active);

  const getBenefitEnrollmentCount = (benefitId) => {
    return enrollments.filter(e => e.benefit_id === benefitId && e.status === 'active').length;
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Benefits Management
            </CardTitle>
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Benefit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active Benefits ({activeBenefits.length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({inactiveBenefits.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-4">
              {activeBenefits.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">No active benefits</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeBenefits.map((benefit) => {
                    const Icon = benefitIcons[benefit.benefit_type] || Gift;
                    const enrollmentCount = getBenefitEnrollmentCount(benefit.id);
                    
                    return (
                      <Card key={benefit.id} className="border border-slate-200 hover:shadow-md transition-all">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{benefit.benefit_name}</h3>
                                <p className="text-sm text-slate-500">{benefit.provider}</p>
                              </div>
                            </div>
                            <Badge className={benefit.is_mandatory ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                              {benefit.is_mandatory ? 'Mandatory' : 'Optional'}
                            </Badge>
                          </div>

                          <p className="text-sm text-slate-600 mb-4">{benefit.description}</p>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-slate-600 mb-1">Employee</p>
                              <p className="font-semibold text-slate-900">{benefit.employee_contribution} SAR/mo</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-purple-700 mb-1">Employer</p>
                              <p className="font-semibold text-purple-900">{benefit.employer_contribution} SAR/mo</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-sm text-slate-600">
                              {enrollmentCount} {enrollmentCount === 1 ? 'employee enrolled' : 'employees enrolled'}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(benefit)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4 mt-4">
              {inactiveBenefits.length === 0 ? (
                <p className="text-center py-8 text-slate-600">No inactive benefits</p>
              ) : (
                <div className="space-y-3">
                  {inactiveBenefits.map((benefit) => (
                    <Card key={benefit.id} className="border border-slate-200 opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{benefit.benefit_name}</h3>
                            <p className="text-sm text-slate-500">{benefit.provider}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(benefit)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Benefit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBenefit ? 'Edit Benefit' : 'Add New Benefit'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Benefit Name *</Label>
                <Input
                  value={formData.benefit_name}
                  onChange={(e) => setFormData({ ...formData, benefit_name: e.target.value })}
                  placeholder="e.g., Health Insurance Plan A"
                />
              </div>

              <div>
                <Label>Benefit Type *</Label>
                <Select
                  value={formData.benefit_type}
                  onValueChange={(val) => setFormData({ ...formData, benefit_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_insurance">Health Insurance</SelectItem>
                    <SelectItem value="life_insurance">Life Insurance</SelectItem>
                    <SelectItem value="dental_insurance">Dental Insurance</SelectItem>
                    <SelectItem value="vision_insurance">Vision Insurance</SelectItem>
                    <SelectItem value="retirement_plan">Retirement Plan</SelectItem>
                    <SelectItem value="education_allowance">Education Allowance</SelectItem>
                    <SelectItem value="transportation_allowance">Transportation Allowance</SelectItem>
                    <SelectItem value="housing_allowance">Housing Allowance</SelectItem>
                    <SelectItem value="meal_allowance">Meal Allowance</SelectItem>
                    <SelectItem value="gym_membership">Gym Membership</SelectItem>
                    <SelectItem value="mobile_allowance">Mobile Allowance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Provider</Label>
              <Input
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="Insurance company or benefit provider"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the benefit coverage and details"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Employee Contribution (SAR/month)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.employee_contribution}
                  onChange={(e) => setFormData({ ...formData, employee_contribution: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Employer Contribution (SAR/month)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.employer_contribution}
                  onChange={(e) => setFormData({ ...formData, employer_contribution: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Mandatory for all employees</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.benefit_name || createBenefitMutation.isPending || updateBenefitMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {editingBenefit ? 'Update Benefit' : 'Create Benefit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}