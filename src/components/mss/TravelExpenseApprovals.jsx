import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, Receipt, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function TravelExpenseApprovals({ 
  teamMembers, 
  travelRequests, 
  expenseClaims, 
  onApproveTravel, 
  onRejectTravel, 
  onApproveExpense, 
  onRejectExpense 
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [itemType, setItemType] = useState(null); // 'travel' or 'expense'
  const [notes, setNotes] = useState('');

  const pendingTravel = travelRequests.filter(t => t.status === 'pending');
  const pendingExpenses = expenseClaims.filter(e => e.status === 'submitted' || e.status === 'under_review');

  const handleAction = () => {
    if (itemType === 'travel') {
      if (actionType === 'approve') {
        onApproveTravel(selectedItem.id);
      } else {
        onRejectTravel(selectedItem.id, notes);
      }
    } else if (itemType === 'expense') {
      if (actionType === 'approve') {
        onApproveExpense(selectedItem.id);
      } else {
        onRejectExpense(selectedItem.id, notes);
      }
    }
    setSelectedItem(null);
    setActionType(null);
    setItemType(null);
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
    <div className="space-y-6">
      <Tabs defaultValue="travel" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="travel">
            <Plane className="w-4 h-4 mr-2" />
            Travel Requests ({pendingTravel.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Receipt className="w-4 h-4 mr-2" />
            Expense Claims ({pendingExpenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Travel Requests */}
        <TabsContent value="travel">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                Pending Travel Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTravel.length === 0 ? (
                <div className="text-center py-12">
                  <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No pending travel requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTravel.map(request => {
                    const employee = teamMembers.find(m => m.id === request.employee_id);
                    return (
                      <Card key={request.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {employee?.first_name} {employee?.last_name}
                              </h4>
                              <p className="text-sm text-slate-500">{employee?.job_title}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">
                              {request.request_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{request.purpose}</p>
                          <div className="grid md:grid-cols-4 gap-3 mb-3 text-sm">
                            <div>
                              <p className="text-slate-500">Destination</p>
                              <p className="font-medium">{request.destination}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Departure</p>
                              <p className="font-medium">{format(new Date(request.departure_date), 'MMM dd')}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Duration</p>
                              <p className="font-medium">{request.duration_days} days</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Est. Cost</p>
                              <p className="font-semibold text-blue-600">
                                {request.estimated_cost?.toLocaleString()} SAR
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-3 border-t">
                            <Button
                              onClick={() => {
                                setSelectedItem(request);
                                setItemType('travel');
                                setActionType('approve');
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedItem(request);
                                setItemType('travel');
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
        </TabsContent>

        {/* Expense Claims */}
        <TabsContent value="expenses">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Pending Expense Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No pending expense claims</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingExpenses.map(claim => {
                    const employee = teamMembers.find(m => m.id === claim.employee_id);
                    return (
                      <Card key={claim.id} className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {employee?.first_name} {employee?.last_name}
                              </h4>
                              <p className="text-sm text-slate-500">{employee?.job_title}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              {expenseTypeLabels[claim.expense_type]}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{claim.description}</p>
                          <div className="grid md:grid-cols-4 gap-3 mb-3 text-sm">
                            <div>
                              <p className="text-slate-500">Merchant</p>
                              <p className="font-medium">{claim.merchant}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Date</p>
                              <p className="font-medium">{format(new Date(claim.expense_date), 'MMM dd')}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Payment</p>
                              <p className="font-medium capitalize">{claim.payment_method?.replace(/_/g, ' ')}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Amount</p>
                              <p className="font-semibold text-emerald-600">
                                {(claim.amount_in_sar || claim.amount)?.toLocaleString()} SAR
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-3 border-t">
                            <Button
                              onClick={() => {
                                setSelectedItem(claim);
                                setItemType('expense');
                                setActionType('approve');
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedItem(claim);
                                setItemType('expense');
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
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' 
                ? `Approve ${itemType === 'travel' ? 'Travel Request' : 'Expense Claim'}`
                : `Reject ${itemType === 'travel' ? 'Travel Request' : 'Expense Claim'}`
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {actionType === 'approve'
                ? `Are you sure you want to approve this ${itemType === 'travel' ? 'travel request' : 'expense claim'}?`
                : `Please provide a reason for rejecting this ${itemType === 'travel' ? 'travel request' : 'expense claim'}.`
              }
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
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
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