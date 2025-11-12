import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Gift, Heart, Shield, Car, Home, Utensils, Plus, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const benefitIcons = {
  health_insurance: Heart,
  life_insurance: Shield,
  transportation_allowance: Car,
  housing_allowance: Home,
  meal_allowance: Utensils,
  other: Gift
};

export default function MyBenefits({ employee }) {
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const queryClient = useQueryClient();

  const { data: allBenefits = [], isLoading: loadingBenefits } = useQuery({
    queryKey: ['all-benefits'],
    queryFn: async () => {
      const benefits = await base44.entities.Benefit.filter({ is_active: true });
      return benefits;
    }
  });

  const { data: myEnrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['my-benefit-enrollments', employee.id],
    queryFn: async () => {
      const enrollments = await base44.entities.BenefitEnrollment.filter({
        employee_id: employee.id
      });
      return enrollments;
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async (benefitId) => {
      const benefit = allBenefits.find(b => b.id === benefitId);
      return await base44.entities.BenefitEnrollment.create({
        employee_id: employee.id,
        benefit_id: benefitId,
        enrollment_date: new Date().toISOString().split('T')[0],
        effective_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        employee_contribution: benefit.employee_contribution || 0,
        employer_contribution: benefit.employer_contribution || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-benefit-enrollments']);
      setShowEnrollDialog(false);
      setSelectedBenefit(null);
      toast.success('Enrollment request submitted');
    },
    onError: () => {
      toast.error('Failed to enroll in benefit');
    }
  });

  const handleEnroll = (benefit) => {
    setSelectedBenefit(benefit);
    setShowEnrollDialog(true);
  };

  const handleConfirmEnroll = () => {
    if (selectedBenefit) {
      enrollMutation.mutate(selectedBenefit.id);
    }
  };

  // Get enrolled benefit IDs
  const enrolledBenefitIds = myEnrollments
    .filter(e => e.status === 'active' || e.status === 'pending')
    .map(e => e.benefit_id);

  // Available benefits (not enrolled)
  const availableBenefits = allBenefits.filter(b => !enrolledBenefitIds.includes(b.id));

  // Get benefit details for enrollment
  const enrichedEnrollments = myEnrollments.map(enrollment => {
    const benefit = allBenefits.find(b => b.id === enrollment.benefit_id);
    return { ...enrollment, benefit };
  });

  if (loadingBenefits || loadingEnrollments) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Active Benefits */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            My Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {enrichedEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 mb-4">You are not enrolled in any benefits yet</p>
              <Button onClick={() => setShowEnrollDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Enroll in Benefits
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedEnrollments.map((enrollment) => {
                const benefit = enrollment.benefit;
                if (!benefit) return null;
                
                const Icon = benefitIcons[benefit.benefit_type] || Gift;
                
                return (
                  <Card key={enrollment.id} className="border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{benefit.benefit_name}</h3>
                            <p className="text-sm text-slate-600">{benefit.provider}</p>
                            <p className="text-sm text-slate-500 mt-1">{benefit.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                              <div className="p-2 bg-slate-50 rounded">
                                <p className="text-slate-600">Your Contribution</p>
                                <p className="font-semibold text-slate-900">{enrollment.employee_contribution} SAR/mo</p>
                              </div>
                              <div className="p-2 bg-purple-50 rounded">
                                <p className="text-purple-700">Company Contribution</p>
                                <p className="font-semibold text-purple-900">{enrollment.employer_contribution} SAR/mo</p>
                              </div>
                            </div>

                            {enrollment.policy_number && (
                              <div className="mt-3 text-sm">
                                <p className="text-slate-600">Policy Number: <span className="font-medium text-slate-900">{enrollment.policy_number}</span></p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          enrollment.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          enrollment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {enrollment.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Benefits */}
      {availableBenefits.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Available Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {availableBenefits.map((benefit) => {
                const Icon = benefitIcons[benefit.benefit_type] || Gift;
                
                return (
                  <Card key={benefit.id} className="border border-slate-200 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{benefit.benefit_name}</h3>
                          <p className="text-sm text-slate-600">{benefit.provider}</p>
                        </div>
                        {benefit.is_mandatory && (
                          <Badge className="bg-amber-100 text-amber-700">Mandatory</Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mb-3">{benefit.description}</p>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div className="p-2 bg-slate-50 rounded">
                          <p className="text-slate-600">Your Cost</p>
                          <p className="font-semibold text-slate-900">{benefit.employee_contribution} SAR/mo</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-blue-700">Company Pays</p>
                          <p className="font-semibold text-blue-900">{benefit.employer_contribution} SAR/mo</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleEnroll(benefit)}
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Enroll Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enroll Confirmation Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Benefit Enrollment</DialogTitle>
          </DialogHeader>
          
          {selectedBenefit && (
            <div className="space-y-4">
              <p className="text-slate-700">
                You are about to enroll in <strong>{selectedBenefit.benefit_name}</strong>
              </p>
              
              <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Monthly Contribution:</span>
                  <span className="font-semibold text-slate-900">{selectedBenefit.employee_contribution} SAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Company Contribution:</span>
                  <span className="font-semibold text-slate-900">{selectedBenefit.employer_contribution} SAR</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-slate-700">Total Benefit Value:</span>
                  <span className="font-bold text-emerald-600">{selectedBenefit.total_cost} SAR/month</span>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Your enrollment will be activated immediately and deductions will start from the next payroll cycle.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmEnroll}
              disabled={enrollMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}