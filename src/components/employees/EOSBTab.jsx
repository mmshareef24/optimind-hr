import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, DollarSign, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import EOSBCalculator from '../eosb/EOSBCalculator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EOSBTab({ employeeId, employee }) {
  const [showCalculator, setShowCalculator] = useState(false);
  const queryClient = useQueryClient();

  const { data: eosbRecords = [], isLoading } = useQuery({
    queryKey: ['eosb-records', employeeId],
    queryFn: () => base44.entities.EOSBRecord.filter({ employee_id: employeeId }, '-calculation_date'),
    enabled: !!employeeId
  });

  const createEOSBMutation = useMutation({
    mutationFn: (data) => base44.entities.EOSBRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['eosb-records', employeeId]);
      setShowCalculator(false);
      toast.success('EOSB record saved successfully');
    },
    onError: () => {
      toast.error('Failed to save EOSB record');
    }
  });

  const updateEOSBMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EOSBRecord.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['eosb-records', employeeId]);
      toast.success('EOSB record updated');
    }
  });

  const handleCalculationComplete = (calculation) => {
    createEOSBMutation.mutate(calculation);
  };

  const handleApprove = (record) => {
    updateEOSBMutation.mutate({
      id: record.id,
      data: { status: 'approved', approval_date: new Date().toISOString().split('T')[0] }
    });
  };

  const handleMarkPaid = (record) => {
    updateEOSBMutation.mutate({
      id: record.id,
      data: { status: 'paid', payment_date: new Date().toISOString().split('T')[0] }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      calculated: 'bg-blue-100 text-blue-700',
      approved: 'bg-emerald-100 text-emerald-700',
      paid: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">End of Service Benefits (EOSB)</h3>
          <p className="text-sm text-slate-600">Calculate and manage EOSB as per Saudi Labor Law</p>
        </div>
        <Button onClick={() => setShowCalculator(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Calculate EOSB
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-slate-500">Loading EOSB records...</p>
          </CardContent>
        </Card>
      ) : eosbRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">No EOSB calculations yet</p>
            <Button onClick={() => setShowCalculator(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Calculate First EOSB
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eosbRecords.map((record) => (
            <Card key={record.id} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900">
                        {record.termination_type.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      Calculated on {new Date(record.calculation_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Net EOSB Payable</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {record.net_eosb_amount?.toLocaleString()} SAR
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-600">Service Period</p>
                    <p className="font-semibold text-sm">
                      {record.years_of_service}y {record.months_of_service}m {record.days_of_service}d
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Termination Date</p>
                    <p className="font-semibold text-sm">
                      {new Date(record.termination_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Total EOSB</p>
                    <p className="font-semibold text-sm">
                      {record.total_eosb_amount?.toLocaleString()} SAR
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Deductions</p>
                    <p className="font-semibold text-sm text-red-600">
                      -{record.deductions?.toLocaleString()} SAR
                    </p>
                  </div>
                </div>

                {record.calculation_details && (
                  <details className="mb-4">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      View Calculation Details
                    </summary>
                    <pre className="mt-2 bg-slate-50 p-3 rounded text-xs whitespace-pre-wrap border">
                      {record.calculation_details}
                    </pre>
                  </details>
                )}

                {record.status === 'calculated' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(record)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}

                {record.status === 'approved' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMarkPaid(record)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Mark as Paid
                    </Button>
                  </div>
                )}

                {record.status === 'paid' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Payment Completed</p>
                      <p className="text-xs text-purple-700">
                        Paid on {new Date(record.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calculate End of Service Benefits</DialogTitle>
          </DialogHeader>
          <EOSBCalculator 
            employee={employee}
            onCalculationComplete={handleCalculationComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}