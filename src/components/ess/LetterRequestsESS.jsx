import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Mail, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LetterRequestsESS({ employee, letterRequests }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: employee.id,
    request_type: 'salary_certificate',
    request_details: '',
    status: 'pending'
  });

  const queryClient = useQueryClient();

  const createLetterMutation = useMutation({
    mutationFn: (data) => base44.entities.ESSRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-ess-requests']);
      setShowForm(false);
      setFormData({
        employee_id: employee.id,
        request_type: 'salary_certificate',
        request_details: '',
        status: 'pending'
      });
      toast.success('Letter request submitted successfully');
    },
    onError: () => toast.error('Failed to submit letter request')
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-emerald-100 text-emerald-700'
  };

  const letterTypeLabels = {
    salary_certificate: 'Salary Certificate',
    employment_letter: 'Employment Letter',
    experience_letter: 'Experience Letter',
    to_whom_it_may_concern: 'To Whom It May Concern'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createLetterMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Request Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Request Letter
        </Button>
      </div>

      {/* Letter Requests */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-600" />
            My Letter Requests ({letterRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {letterRequests.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No letter requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {letterRequests.map(request => (
                <Card key={request.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {letterTypeLabels[request.request_type] || request.request_type}
                        </h4>
                        {request.request_details && (
                          <p className="text-sm text-slate-600 mt-1">{request.request_details}</p>
                        )}
                      </div>
                      <Badge className={statusColors[request.status]}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-slate-500">
                        Requested: {format(new Date(request.created_date), 'MMM dd, yyyy')}
                      </span>
                      {request.document_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(request.document_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>

                    {request.response_notes && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                        <strong>Note:</strong> {request.response_notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Letter Request Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Letter</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Letter Type *</Label>
              <Select
                value={formData.request_type}
                onValueChange={(val) => setFormData({ ...formData, request_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary_certificate">Salary Certificate</SelectItem>
                  <SelectItem value="employment_letter">Employment Letter</SelectItem>
                  <SelectItem value="experience_letter">Experience Letter</SelectItem>
                  <SelectItem value="to_whom_it_may_concern">To Whom It May Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Details</Label>
              <Textarea
                value={formData.request_details}
                onChange={(e) => setFormData({ ...formData, request_details: e.target.value })}
                placeholder="Specify any additional requirements (e.g., addressed to a specific entity, special mentions, etc.)"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}