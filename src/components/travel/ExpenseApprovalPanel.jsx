import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, CheckCircle, XCircle, FileText, User } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function ExpenseApprovalPanel({ claims, employees, travelRequests, onApprove, onReject }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');

  const pendingClaims = claims.filter(c => c.status === 'submitted' || c.status === 'under_review');

  const handleAction = () => {
    if (actionType === 'approve') {
      onApprove(selectedClaim.id, notes);
    } else if (actionType === 'reject') {
      onReject(selectedClaim.id, notes);
    }
    setSelectedClaim(null);
    setActionType(null);
    setNotes('');
  };

  const expenseTypeLabels = {
    flight: 'Flight',
    hotel: 'Hotel',
    car_rental: 'Car Rental',
    fuel: 'Fuel',
    meals: 'Meals',
    entertainment: 'Entertainment',
    transportation: 'Transportation',
    office_supplies: 'Office Supplies',
    communication: 'Communication',
    parking: 'Parking',
    other: 'Other'
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Pending Expense Claims ({pendingClaims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingClaims.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No pending expense claims</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClaims.map((claim) => {
                const employee = employees.find(e => e.id === claim.employee_id);
                const travelRequest = travelRequests?.find(r => r.id === claim.travel_request_id);
                
                return (
                  <Card key={claim.id} className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Receipt className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {expenseTypeLabels[claim.expense_type]}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {employee?.first_name} {employee?.last_name} • {employee?.department}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {claim.payment_method.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-3">{claim.description}</p>

                      <div className="grid md:grid-cols-4 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Merchant</p>
                          <p className="font-medium text-slate-900">{claim.merchant}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="font-medium text-slate-900">
                            {format(new Date(claim.expense_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="font-semibold text-emerald-600">
                            {(claim.amount_in_sar || claim.amount).toLocaleString()} SAR
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Currency</p>
                          <p className="font-medium text-slate-900">{claim.currency}</p>
                        </div>
                      </div>

                      {travelRequest && (
                        <div className="mb-3 p-2 bg-blue-50 rounded-lg text-sm">
                          <p className="text-blue-700">
                            <strong>Related Travel:</strong> {travelRequest.destination} ({travelRequest.departure_date})
                          </p>
                        </div>
                      )}

                      {claim.receipt_url && (
                        <div className="mb-3">
                          <a
                            href={claim.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            View Receipt
                          </a>
                        </div>
                      )}

                      <div className="flex gap-3 pt-3 border-t">
                        <Button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setActionType('approve');
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setActionType('reject');
                          }}
                          variant="outline"
                          className="flex-1 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Expense Claim' : 'Reject Expense Claim'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {actionType === 'approve'
                ? 'Are you sure you want to approve this expense claim?'
                : 'Please provide a reason for rejecting this expense claim.'}
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'approve' ? 'Optional notes...' : 'Rejection reason...'}
              rows={3}
              required={actionType === 'reject'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              className={actionType === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}