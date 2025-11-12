import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Play, RefreshCw, Settings, History, TrendingUp, CheckCircle, AlertTriangle, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Alert, AlertDescription
} from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import StatCard from "../components/hrms/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LeaveAccrualManagement() {
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [forceReprocess, setForceReprocess] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyFormData, setPolicyFormData] = useState({
    policy_name: '',
    leave_type: 'annual',
    annual_entitlement: 21,
    monthly_accrual_rate: 1.75,
    accrual_frequency: 'monthly',
    probation_period_months: 3,
    accrue_during_probation: false,
    max_carryover: 10,
    carryover_expiry_months: 3,
    accrue_while_on_leave: true,
    prorate_for_new_hires: true,
    employment_type: ['full_time'],
    is_active: true,
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: policies = [], isLoading: loadingPolicies } = useQuery({
    queryKey: ['accrual-policies'],
    queryFn: () => base44.entities.LeaveAccrualPolicy.list('-created_date'),
  });

  const { data: accrualHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['accrual-history'],
    queryFn: () => base44.entities.LeaveAccrual.list('-accrual_date', 100),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  // Initialize policies mutation
  const initializePoliciesMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('initializeLeaveAccrualPolicies', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accrual-policies']);
      toast.success(`${data.policies_created} default policies created`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to initialize policies');
    }
  });

  // Process accrual mutation
  const processAccrualMutation = useMutation({
    mutationFn: async ({ period, force }) => {
      const response = await base44.functions.invoke('processMonthlyLeaveAccrual', {
        accrual_period: period,
        force_reprocess: force
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accrual-history']);
      queryClient.invalidateQueries(['leave-balances']);
      setShowProcessDialog(false);
      toast.success(
        `Processed ${data.results.processed} employees. Total days accrued: ${data.results.total_days_accrued}`
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process accrual');
    }
  });

  // Create/Update policy mutations
  const createPolicyMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveAccrualPolicy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['accrual-policies']);
      setShowPolicyDialog(false);
      setPolicyFormData({
        policy_name: '',
        leave_type: 'annual',
        annual_entitlement: 21,
        monthly_accrual_rate: 1.75,
        accrual_frequency: 'monthly',
        probation_period_months: 3,
        accrue_during_probation: false,
        max_carryover: 10,
        carryover_expiry_months: 3,
        accrue_while_on_leave: true,
        prorate_for_new_hires: true,
        employment_type: ['full_time'],
        is_active: true,
        notes: ''
      });
      toast.success('Policy created successfully');
    },
    onError: () => {
      toast.error('Failed to create policy');
    }
  });

  const updatePolicyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveAccrualPolicy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['accrual-policies']);
      setShowPolicyDialog(false);
      setEditingPolicy(null);
      toast.success('Policy updated successfully');
    },
    onError: () => {
      toast.error('Failed to update policy');
    }
  });

  const handleProcessAccrual = () => {
    processAccrualMutation.mutate({ period: selectedPeriod, force: forceReprocess });
  };

  const handleInitializePolicies = () => {
    initializePoliciesMutation.mutate();
  };

  const handleSavePolicy = () => {
    if (editingPolicy) {
      updatePolicyMutation.mutate({ id: editingPolicy.id, data: policyFormData });
    } else {
      createPolicyMutation.mutate(policyFormData);
    }
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setPolicyFormData(policy);
    setShowPolicyDialog(true);
  };

  // Calculate statistics
  const activePolicies = policies.filter(p => p.is_active).length;
  const totalAccrualsThisMonth = accrualHistory.filter(a => 
    a.accrual_period === new Date().toISOString().slice(0, 7)
  ).length;
  const totalDaysAccruedThisMonth = accrualHistory
    .filter(a => a.accrual_period === new Date().toISOString().slice(0, 7))
    .reduce((sum, a) => sum + a.days_accrued, 0);
  
  // Get unique periods from history
  const processedPeriods = [...new Set(accrualHistory.map(a => a.accrual_period))].sort().reverse();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leave Accrual Management</h1>
          <p className="text-slate-600">Automate monthly leave accruals and manage policies</p>
        </div>
        <div className="flex gap-3">
          {policies.length === 0 && (
            <Button
              onClick={handleInitializePolicies}
              variant="outline"
              className="gap-2"
              disabled={initializePoliciesMutation.isPending}
            >
              <Settings className="w-4 h-4" />
              Initialize Default Policies
            </Button>
          )}
          <Button
            onClick={() => setShowProcessDialog(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg gap-2"
          >
            <Play className="w-4 h-4" />
            Process Accrual
          </Button>
        </div>
      </div>

      {/* Alert for no policies */}
      {policies.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>No accrual policies configured.</strong> Click "Initialize Default Policies" to set up standard Saudi labor law policies, or create custom policies.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title="Active Policies"
          value={activePolicies}
          icon={Settings}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Employees"
          value={employees.filter(e => e.status === 'active').length}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Accruals This Month"
          value={totalAccrualsThisMonth}
          icon={TrendingUp}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Days Accrued (Month)"
          value={totalDaysAccruedThisMonth.toFixed(1)}
          icon={Calendar}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="bg-white border-2 border-slate-200 p-1">
          <TabsTrigger value="policies" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Accrual Policies
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Processing History
          </TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex justify-between items-center">
                <CardTitle>Accrual Policies</CardTitle>
                <Button onClick={() => { setEditingPolicy(null); setShowPolicyDialog(true); }}>
                  Add Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingPolicies ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : policies.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No policies configured</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {policies.map((policy) => (
                    <Card key={policy.id} className="border-2 border-slate-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg mb-1">{policy.policy_name}</h4>
                            <Badge className={`${
                              policy.leave_type === 'annual' ? 'bg-blue-100 text-blue-700' :
                              policy.leave_type === 'sick' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {policy.leave_type.toUpperCase()}
                            </Badge>
                          </div>
                          <Badge className={policy.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {policy.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm text-slate-600">Annual Entitlement</span>
                            <span className="font-semibold">{policy.annual_entitlement} days</span>
                          </div>
                          <div className="flex justify-between p-2 bg-emerald-50 rounded">
                            <span className="text-sm text-emerald-700">Monthly Accrual</span>
                            <span className="font-semibold text-emerald-700">{policy.monthly_accrual_rate} days</span>
                          </div>
                          <div className="flex justify-between p-2 bg-blue-50 rounded">
                            <span className="text-sm text-blue-700">Probation Period</span>
                            <span className="font-semibold text-blue-700">{policy.probation_period_months} months</span>
                          </div>
                          {policy.max_carryover > 0 && (
                            <div className="flex justify-between p-2 bg-purple-50 rounded">
                              <span className="text-sm text-purple-700">Max Carryover</span>
                              <span className="font-semibold text-purple-700">{policy.max_carryover} days</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 mb-4">
                          <div className="flex items-center gap-2">
                            {policy.prorate_for_new_hires ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                            <span>Prorate for new hires</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {policy.accrue_while_on_leave ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                            <span>Accrue while on leave</span>
                          </div>
                        </div>

                        <Button variant="outline" onClick={() => handleEditPolicy(policy)} className="w-full">
                          Edit Policy
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
              <CardTitle>Processing History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : accrualHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No accrual history yet</p>
                  <Button onClick={() => setShowProcessDialog(true)}>
                    Process First Accrual
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {processedPeriods.map(period => {
                    const periodAccruals = accrualHistory.filter(a => a.accrual_period === period);
                    const totalDays = periodAccruals.reduce((sum, a) => sum + a.days_accrued, 0);
                    const employeeCount = new Set(periodAccruals.map(a => a.employee_id)).size;

                    return (
                      <div key={period}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-slate-900">{format(new Date(period + '-01'), 'MMMM yyyy')}</h4>
                          <div className="flex gap-4 text-sm">
                            <span className="text-slate-600">{employeeCount} employees</span>
                            <span className="font-semibold text-emerald-600">{totalDays.toFixed(1)} days accrued</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {periodAccruals.slice(0, 5).map(accrual => {
                            const employee = employees.find(e => e.id === accrual.employee_id);
                            return (
                              <div key={accrual.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {employee?.first_name} {employee?.last_name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {accrual.leave_type} • {accrual.employment_months} months service
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-emerald-600">+{accrual.days_accrued} days</p>
                                  <p className="text-xs text-slate-500">Balance: {accrual.balance_after}</p>
                                </div>
                              </div>
                            );
                          })}
                          {periodAccruals.length > 5 && (
                            <p className="text-sm text-slate-500 text-center py-2">
                              +{periodAccruals.length - 5} more employees
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Accrual Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Monthly Leave Accrual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                This will process leave accruals for all active employees based on configured policies.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Accrual Period</Label>
              <Input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="force-reprocess"
                checked={forceReprocess}
                onCheckedChange={setForceReprocess}
              />
              <Label htmlFor="force-reprocess" className="text-sm">
                Force reprocess (if already processed)
              </Label>
            </div>

            {forceReprocess && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  Warning: Reprocessing will create duplicate accrual records. Use with caution.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessAccrual}
              disabled={processAccrualMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processAccrualMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Process Accrual
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Form Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit' : 'Create'} Accrual Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Policy Name *</Label>
                <Input
                  value={policyFormData.policy_name}
                  onChange={(e) => setPolicyFormData({...policyFormData, policy_name: e.target.value})}
                  placeholder="e.g., Annual Leave - Full Time"
                />
              </div>
              <div>
                <Label>Leave Type *</Label>
                <Select
                  value={policyFormData.leave_type}
                  onValueChange={(val) => setPolicyFormData({...policyFormData, leave_type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="hajj">Hajj Leave</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Annual Entitlement (Days) *</Label>
                <Input
                  type="number"
                  value={policyFormData.annual_entitlement}
                  onChange={(e) => {
                    const annual = parseFloat(e.target.value);
                    setPolicyFormData({
                      ...policyFormData,
                      annual_entitlement: annual,
                      monthly_accrual_rate: parseFloat((annual / 12).toFixed(2))
                    });
                  }}
                />
              </div>
              <div>
                <Label>Monthly Accrual Rate (Days)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={policyFormData.monthly_accrual_rate}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Probation Period (Months)</Label>
                <Input
                  type="number"
                  value={policyFormData.probation_period_months}
                  onChange={(e) => setPolicyFormData({...policyFormData, probation_period_months: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Max Carryover (Days)</Label>
                <Input
                  type="number"
                  value={policyFormData.max_carryover}
                  onChange={(e) => setPolicyFormData({...policyFormData, max_carryover: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Accrue during probation</Label>
                <Switch
                  checked={policyFormData.accrue_during_probation}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, accrue_during_probation: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Accrue while on leave</Label>
                <Switch
                  checked={policyFormData.accrue_while_on_leave}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, accrue_while_on_leave: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Prorate for new hires</Label>
                <Switch
                  checked={policyFormData.prorate_for_new_hires}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, prorate_for_new_hires: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active Policy</Label>
                <Switch
                  checked={policyFormData.is_active}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, is_active: checked})}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={policyFormData.notes}
                onChange={(e) => setPolicyFormData({...policyFormData, notes: e.target.value})}
                placeholder="Additional policy details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePolicy}
              disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingPolicy ? 'Update' : 'Create'} Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}