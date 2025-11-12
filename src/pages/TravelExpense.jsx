import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plane, Receipt, Plus, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import StatCard from "../components/hrms/StatCard";
import TravelRequestForm from "../components/travel/TravelRequestForm";
import ExpenseClaimForm from "../components/travel/ExpenseClaimForm";
import TravelRequestCard from "../components/travel/TravelRequestCard";
import ExpenseClaimCard from "../components/travel/ExpenseClaimCard";
import TravelApprovalPanel from "../components/travel/TravelApprovalPanel";
import ExpenseApprovalPanel from "../components/travel/ExpenseApprovalPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function TravelExpense() {
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingTravel, setEditingTravel] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setUserRole(userData.role || 'user');
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(employee);
      return employee;
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: travelRequests = [], isLoading: loadingTravel } = useQuery({
    queryKey: ['travel-requests'],
    queryFn: () => base44.entities.TravelRequest.list('-created_date'),
  });

  const { data: expenseClaims = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expense-claims'],
    queryFn: () => base44.entities.ExpenseClaim.list('-created_date'),
  });

  // Mutations for Travel Requests
  const createTravelMutation = useMutation({
    mutationFn: (data) => base44.entities.TravelRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-requests']);
      setShowTravelForm(false);
      setEditingTravel(null);
      toast.success('Travel request submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit travel request');
    }
  });

  const updateTravelMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TravelRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-requests']);
      setShowTravelForm(false);
      setEditingTravel(null);
      toast.success('Travel request updated successfully');
    },
    onError: () => {
      toast.error('Failed to update travel request');
    }
  });

  const approveTravelMutation = useMutation({
    mutationFn: ({ id, notes }) => {
      const request = travelRequests.find(r => r.id === id);
      return base44.entities.TravelRequest.update(id, {
        ...request,
        status: 'approved',
        approval_date: new Date().toISOString().split('T')[0],
        approved_by: currentUser?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-requests']);
      toast.success('Travel request approved');
    },
    onError: () => {
      toast.error('Failed to approve travel request');
    }
  });

  const rejectTravelMutation = useMutation({
    mutationFn: ({ id, notes }) => {
      const request = travelRequests.find(r => r.id === id);
      return base44.entities.TravelRequest.update(id, {
        ...request,
        status: 'rejected',
        rejection_reason: notes,
        approved_by: currentUser?.id,
        approval_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-requests']);
      toast.success('Travel request rejected');
    },
    onError: () => {
      toast.error('Failed to reject travel request');
    }
  });

  // Mutations for Expense Claims
  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpenseClaim.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-claims']);
      setShowExpenseForm(false);
      setEditingExpense(null);
      toast.success('Expense claim submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit expense claim');
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExpenseClaim.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-claims']);
      setShowExpenseForm(false);
      setEditingExpense(null);
      toast.success('Expense claim updated successfully');
    },
    onError: () => {
      toast.error('Failed to update expense claim');
    }
  });

  const approveExpenseMutation = useMutation({
    mutationFn: ({ id, notes }) => {
      const claim = expenseClaims.find(c => c.id === id);
      return base44.entities.ExpenseClaim.update(id, {
        ...claim,
        status: 'approved',
        approval_date: new Date().toISOString().split('T')[0],
        approved_by: currentUser?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-claims']);
      toast.success('Expense claim approved');
    },
    onError: () => {
      toast.error('Failed to approve expense claim');
    }
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: ({ id, notes }) => {
      const claim = expenseClaims.find(c => c.id === id);
      return base44.entities.ExpenseClaim.update(id, {
        ...claim,
        status: 'rejected',
        rejection_reason: notes,
        approved_by: currentUser?.id,
        approval_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-claims']);
      toast.success('Expense claim rejected');
    },
    onError: () => {
      toast.error('Failed to reject expense claim');
    }
  });

  const handleSubmitTravel = (data) => {
    if (editingTravel) {
      updateTravelMutation.mutate({ id: editingTravel.id, data });
    } else {
      createTravelMutation.mutate(data);
    }
  };

  const handleSubmitExpense = (data) => {
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data });
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  const handleEditTravel = (request) => {
    setEditingTravel(request);
    setShowTravelForm(true);
  };

  const handleEditExpense = (claim) => {
    setEditingExpense(claim);
    setShowExpenseForm(true);
  };

  // Filter data based on role
  const myTravelRequests = currentUser ? travelRequests.filter(r => r.employee_id === currentUser.id) : [];
  const myExpenses = currentUser ? expenseClaims.filter(c => c.employee_id === currentUser.id) : [];
  const allTravelRequests = userRole === 'admin' ? travelRequests : myTravelRequests;
  const allExpenses = userRole === 'admin' ? expenseClaims : myExpenses;

  // Calculate statistics
  const pendingTravelCount = myTravelRequests.filter(r => r.status === 'pending').length;
  const approvedTravelCount = myTravelRequests.filter(r => r.status === 'approved').length;
  const totalExpenseAmount = myExpenses
    .filter(e => e.status === 'approved' || e.status === 'paid')
    .reduce((sum, e) => sum + (e.amount_in_sar || e.amount || 0), 0);
  const pendingExpenseAmount = myExpenses
    .filter(e => e.status === 'submitted' || e.status === 'under_review')
    .reduce((sum, e) => sum + (e.amount_in_sar || e.amount || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Travel & Expense Management</h1>
          <p className="text-slate-600">Manage business travel and expense claims</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => { setEditingTravel(null); setShowTravelForm(true); }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Plane className="w-4 h-4 mr-2" /> New Travel Request
          </Button>
          <Button
            onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
          >
            <Receipt className="w-4 h-4 mr-2" /> New Expense Claim
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Travel"
          value={pendingTravelCount}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Approved Travel"
          value={approvedTravelCount}
          icon={CheckCircle}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Total Expenses"
          value={`${totalExpenseAmount.toLocaleString()} SAR`}
          icon={DollarSign}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending Claims"
          value={`${pendingExpenseAmount.toLocaleString()} SAR`}
          icon={Receipt}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue={userRole === 'admin' ? 'travel-approvals' : 'my-travel'} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger
            value="my-travel"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Plane className="w-4 h-4 mr-2" />
            My Travel
          </TabsTrigger>
          <TabsTrigger
            value="my-expenses"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Receipt className="w-4 h-4 mr-2" />
            My Expenses
          </TabsTrigger>
          {userRole === 'admin' && (
            <>
              <TabsTrigger
                value="travel-approvals"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Travel Approvals
              </TabsTrigger>
              <TabsTrigger
                value="expense-approvals"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Expense Approvals
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* My Travel Tab */}
        <TabsContent value="my-travel">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {loadingTravel ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
                </div>
              ) : myTravelRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No travel requests yet</p>
                  <Button onClick={() => setShowTravelForm(true)} variant="outline">
                    Submit Your First Travel Request
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {myTravelRequests.map((request) => (
                    <TravelRequestCard
                      key={request.id}
                      request={request}
                      employee={currentUser}
                      onEdit={handleEditTravel}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Expenses Tab */}
        <TabsContent value="my-expenses">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {loadingExpenses ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : myExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No expense claims yet</p>
                  <Button onClick={() => setShowExpenseForm(true)} variant="outline">
                    Submit Your First Expense Claim
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myExpenses.map((claim) => (
                    <ExpenseClaimCard
                      key={claim.id}
                      claim={claim}
                      employee={currentUser}
                      travelRequests={travelRequests}
                      onEdit={handleEditExpense}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Approvals Tab (Admin) */}
        {userRole === 'admin' && (
          <TabsContent value="travel-approvals">
            <TravelApprovalPanel
              requests={allTravelRequests}
              employees={employees}
              onApprove={(id, notes) => approveTravelMutation.mutate({ id, notes })}
              onReject={(id, notes) => rejectTravelMutation.mutate({ id, notes })}
            />
          </TabsContent>
        )}

        {/* Expense Approvals Tab (Admin) */}
        {userRole === 'admin' && (
          <TabsContent value="expense-approvals">
            <ExpenseApprovalPanel
              claims={allExpenses}
              employees={employees}
              travelRequests={travelRequests}
              onApprove={(id, notes) => approveExpenseMutation.mutate({ id, notes })}
              onReject={(id, notes) => rejectExpenseMutation.mutate({ id, notes })}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Travel Request Form Dialog */}
      <Dialog open={showTravelForm} onOpenChange={setShowTravelForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTravel ? 'Edit Travel Request' : 'New Travel Request'}
            </DialogTitle>
          </DialogHeader>
          {currentUser && (
            <TravelRequestForm
              request={editingTravel}
              employee={currentUser}
              onSubmit={handleSubmitTravel}
              onCancel={() => {
                setShowTravelForm(false);
                setEditingTravel(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Expense Claim Form Dialog */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense Claim' : 'New Expense Claim'}
            </DialogTitle>
          </DialogHeader>
          {currentUser && (
            <ExpenseClaimForm
              claim={editingExpense}
              employee={currentUser}
              travelRequests={myTravelRequests.filter(r => r.status === 'approved')}
              onSubmit={handleSubmitExpense}
              onCancel={() => {
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}