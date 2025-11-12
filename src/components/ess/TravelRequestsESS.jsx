import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import TravelRequestForm from "../travel/TravelRequestForm";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TravelRequestsESS({ employee, travelRequests }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const createTravelMutation = useMutation({
    mutationFn: (data) => base44.entities.TravelRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-travel']);
      setShowForm(false);
      toast.success('Travel request submitted successfully');
    },
    onError: () => toast.error('Failed to submit travel request')
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="space-y-6">
      {/* Request Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          New Travel Request
        </Button>
      </div>

      {/* Travel Requests */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-600" />
            My Travel Requests ({travelRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {travelRequests.length === 0 ? (
            <div className="text-center py-12">
              <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No travel requests yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {travelRequests.map(travel => (
                <Card key={travel.id} className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{travel.destination}</h4>
                        <p className="text-sm text-slate-600">{travel.purpose}</p>
                      </div>
                      <Badge className={statusColors[travel.status]}>
                        {travel.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Departure</span>
                        <p className="font-medium">{format(new Date(travel.departure_date), 'MMM dd')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Return</span>
                        <p className="font-medium">{format(new Date(travel.return_date), 'MMM dd')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Duration</span>
                        <p className="font-medium">{travel.duration_days} days</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Est. Cost</span>
                        <p className="font-semibold text-purple-600">
                          {travel.estimated_cost?.toLocaleString()} SAR
                        </p>
                      </div>
                    </div>

                    {travel.advance_required && (
                      <div className="p-2 bg-purple-50 rounded text-sm">
                        <span className="text-purple-700">
                          Advance: {travel.advance_amount?.toLocaleString()} SAR
                        </span>
                      </div>
                    )}

                    {travel.rejection_reason && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                        <strong>Rejection:</strong> {travel.rejection_reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Travel Request Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Travel Request</DialogTitle>
          </DialogHeader>
          <TravelRequestForm
            employee={employee}
            onSubmit={(data) => createTravelMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}