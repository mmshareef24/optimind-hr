
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
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
import AccrualScheduler from "../components/leave/AccrualScheduler";
import AccrualPolicyCard from "../components/leave/AccrualPolicyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LeaveAccrualManagement() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

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
      toast.success(t('policies_created_success', { count: data.policies_created }));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('failed_initialize_policies'));
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
        t('accrual_processed_success', { processed: data.results.processed, days: data.results.total_days_accrued })
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('failed_process_accrual'));
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
      toast.success(t('policy_created_success'));
    },
    onError: () => {
      toast.error(t('failed_create_policy'));
    }
  });

  const updatePolicyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveAccrualPolicy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['accrual-policies']);
      setShowPolicyDialog(false);
      setEditingPolicy(null);
      toast.success(t('policy_updated_success'));
    },
    onError: () => {
      toast.error(t('failed_update_policy'));
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
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('leave_accrual_management')}</h1>
          <p className="text-slate-600">{t('leave_accrual_desc')}</p>
        </div>
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {policies.length === 0 && (
            <Button
              onClick={handleInitializePolicies}
              variant="outline"
              className="gap-2"
              disabled={initializePoliciesMutation.isPending}
            >
              <Settings className="w-4 h-4" />
              {t('initialize_default_policies')}
            </Button>
          )}
          <Button
            onClick={() => setShowProcessDialog(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg gap-2"
          >
            <Play className="w-4 h-4" />
            {t('process_accrual')}
          </Button>
        </div>
      </div>

      {/* Alert for no policies */}
      {policies.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className={`text-amber-900 ${isRTL ? 'text-right' : ''}`}>
            <strong>{t('no_accrual_policies')}</strong> {t('click_initialize')}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title={t('active_policies')}
          value={activePolicies}
          icon={Settings}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('employees')}
          value={employees.filter(e => e.status === 'active').length}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('accruals_this_month')}
          value={totalAccrualsThisMonth}
          icon={TrendingUp}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title={t('days_accrued_month')}
          value={totalDaysAccruedThisMonth.toFixed(1)}
          icon={Calendar}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="scheduler" className="space-y-6">
        <TabsList className="bg-white border-2 border-slate-200 p-1">
          <TabsTrigger value="scheduler" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            {t('scheduler')}
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            {t('policies_count')} ({activePolicies})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            {t('history')}
          </TabsTrigger>
        </TabsList>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AccrualScheduler
                onRunNow={() => setShowProcessDialog(true)}
                isProcessing={processAccrualMutation.isPending}
              />
            </div>

            {/* Quick Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className={`text-base ${isRTL ? 'text-right' : ''}`}>{t('how_it_works')}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-emerald-700">1</span>
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm font-semibold text-slate-900">{t('monthly_processing')}</p>
                    <p className="text-xs text-slate-600">{t('runs_automatically')}</p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-700">2</span>
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm font-semibold text-slate-900">{t('policy_application')}</p>
                    <p className="text-xs text-slate-600">{t('applied_to_eligible')}</p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-700">3</span>
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm font-semibold text-slate-900">{t('balance_updates')}</p>
                    <p className="text-xs text-slate-600">{t('balances_auto_updated')}</p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-700">4</span>
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm font-semibold text-slate-900">{t('audit_trail')}</p>
                    <p className="text-xs text-slate-600">{t('accruals_logged')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
              <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className={isRTL ? 'text-right' : ''}>{t('accrual_policies')}</CardTitle>
                <Button onClick={() => { setEditingPolicy(null); setShowPolicyDialog(true); }}>
                  {t('add_policy')}
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
                  <p className="text-slate-500">{t('no_policies_configured')}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {policies.map((policy) => (
                    <AccrualPolicyCard
                      key={policy.id}
                      policy={policy}
                      onEdit={handleEditPolicy}
                      isRTL={isRTL}
                    />
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
              <CardTitle className={isRTL ? 'text-right' : ''}>{t('processing_history')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : accrualHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">{t('no_accrual_history')}</p>
                  <Button onClick={() => setShowProcessDialog(true)}>
                    {t('process_first_accrual')}
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
                        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <h4 className="font-bold text-slate-900">{format(new Date(period + '-01'), 'MMMM yyyy')}</h4>
                          <div className={`flex gap-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="text-slate-600">{employeeCount} {t('employees')}</span>
                            <span className="font-semibold text-emerald-600">{totalDays.toFixed(1)} {t('days_accrued')}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {periodAccruals.slice(0, 5).map(accrual => {
                            const employee = employees.find(e => e.id === accrual.employee_id);
                            return (
                              <div key={accrual.id} className={`flex items-center justify-between p-3 bg-slate-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className={isRTL ? 'text-right' : ''}>
                                  <p className="font-semibold text-slate-900">
                                    {employee?.first_name} {employee?.last_name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {t(accrual.leave_type)} • {accrual.employment_months} {t('months_service')}
                                  </p>
                                </div>
                                <div className={isRTL ? 'text-left' : 'text-right'}>
                                  <p className="font-bold text-emerald-600">+{accrual.days_accrued} {t('days')}</p>
                                  <p className="text-xs text-slate-500">{t('balance')}: {accrual.balance_after}</p>
                                </div>
                              </div>
                            );
                          })}
                          {periodAccruals.length > 5 && (
                            <p className="text-sm text-slate-500 text-center py-2">
                              +{periodAccruals.length - 5} {t('more_employees')}
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
            <DialogTitle className={isRTL ? 'text-right' : ''}>{t('process_monthly_leave_accrual')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
              <AlertDescription className={`text-blue-900 ${isRTL ? 'text-right' : ''}`}>
                {t('will_process_accruals')}
              </AlertDescription>
            </Alert>

            <div>
              <Label className={isRTL ? 'text-right block' : ''}>{t('accrual_period')}</Label>
              <Input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
              />
            </div>

            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
              <Checkbox
                id="force-reprocess"
                checked={forceReprocess}
                onCheckedChange={setForceReprocess}
              />
              <Label htmlFor="force-reprocess" className="text-sm">
                {t('force_reprocess')}
              </Label>
            </div>

            {forceReprocess && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className={`text-amber-900 text-sm ${isRTL ? 'text-right' : ''}`}>
                  {t('reprocess_warning')}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className={isRTL ? 'flex-row-reverse justify-end' : ''}>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleProcessAccrual}
              disabled={processAccrualMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processAccrualMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('process_accrual')}
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
            <DialogTitle className={isRTL ? 'text-right' : ''}>{editingPolicy ? t('edit_accrual_policy') : t('create_accrual_policy')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('policy_name')}</Label>
                <Input
                  value={policyFormData.policy_name}
                  onChange={(e) => setPolicyFormData({...policyFormData, policy_name: e.target.value})}
                  placeholder={t('policy_name_placeholder')}
                />
              </div>
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('leave_type')}</Label>
                <Select
                  value={policyFormData.leave_type}
                  onValueChange={(val) => setPolicyFormData({...policyFormData, leave_type: val})}
                >
                  <SelectTrigger className={isRTL ? 'text-right' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                    <SelectItem value="annual">{t('annual_leave')}</SelectItem>
                    <SelectItem value="sick">{t('sick_leave')}</SelectItem>
                    <SelectItem value="hajj">{t('hajj_leave')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('annual_entitlement')}</Label>
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
                <Label className={isRTL ? 'text-right block' : ''}>{t('monthly_accrual_rate')}</Label>
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
                <Label className={isRTL ? 'text-right block' : ''}>{t('probation_period')}</Label>
                <Input
                  type="number"
                  value={policyFormData.probation_period_months}
                  onChange={(e) => setPolicyFormData({...policyFormData, probation_period_months: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('max_carryover')}</Label>
                <Input
                  type="number"
                  value={policyFormData.max_carryover}
                  onChange={(e) => setPolicyFormData({...policyFormData, max_carryover: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('carryover_expiry_months')}</Label>
                <Input
                  type="number"
                  value={policyFormData.carryover_expiry_months}
                  onChange={(e) => setPolicyFormData({...policyFormData, carryover_expiry_months: parseInt(e.target.value)})}
                />
              </div>
              <div>
                {/* employment_type input is not present in the original UI, maintaining state only. */}
              </div>
            </div>

            <div className="space-y-3">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Label>{t('accrue_during_probation')}</Label>
                <Switch
                  checked={policyFormData.accrue_during_probation}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, accrue_during_probation: checked})}
                />
              </div>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Label>{t('accrue_while_on_leave')}</Label>
                <Switch
                  checked={policyFormData.accrue_while_on_leave}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, accrue_while_on_leave: checked})}
                />
              </div>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Label>{t('prorate_for_new_hires')}</Label>
                <Switch
                  checked={policyFormData.prorate_for_new_hires}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, prorate_for_new_hires: checked})}
                />
              </div>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Label>{t('active_policy')}</Label>
                <Switch
                  checked={policyFormData.is_active}
                  onCheckedChange={(checked) => setPolicyFormData({...policyFormData, is_active: checked})}
                />
              </div>
            </div>

            <div>
              <Label className={isRTL ? 'text-right block' : ''}>{t('notes')}</Label>
              <Input
                value={policyFormData.notes}
                onChange={(e) => setPolicyFormData({...policyFormData, notes: e.target.value})}
                placeholder={t('additional_policy_details')}
              />
            </div>
          </div>
          <DialogFooter className={isRTL ? 'flex-row-reverse justify-end' : ''}>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSavePolicy}
              disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingPolicy ? t('update_policy') : t('create_policy')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
