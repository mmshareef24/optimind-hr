import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, Users, FileText, CheckCircle2, 
  AlertTriangle, TrendingUp, Plus, Search, Filter
} from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';
import { toast } from "sonner";
import StatCard from "@/components/hrms/StatCard";
import EOSBCalculator from "@/components/eosb/EOSBCalculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EOSBManagement() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch data
  const { data: eosbRecords = [], isLoading } = useQuery({
    queryKey: ['eosb-records'],
    queryFn: () => base44.entities.EOSBRecord.list('-calculation_date')
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ['recent-payrolls'],
    queryFn: () => base44.entities.Payroll.list('-month', 100)
  });

  // Mutations
  const createEOSBMutation = useMutation({
    mutationFn: (data) => base44.entities.EOSBRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['eosb-records']);
      setShowCalculator(false);
      setSelectedEmployee(null);
      toast.success('EOSB record created successfully');
    },
    onError: () => {
      toast.error('Failed to create EOSB record');
    }
  });

  const updateEOSBMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EOSBRecord.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['eosb-records']);
      toast.success('EOSB record updated');
    }
  });

  // Calculate statistics
  const stats = {
    totalRecords: eosbRecords.length,
    calculated: eosbRecords.filter(r => r.status === 'calculated').length,
    approved: eosbRecords.filter(r => r.status === 'approved').length,
    paid: eosbRecords.filter(r => r.status === 'paid').length,
    totalLiability: eosbRecords
      .filter(r => r.status !== 'paid' && r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.net_eosb_amount || 0), 0)
  };

  // Filter records
  const filteredRecords = eosbRecords.filter(record => {
    const employee = employees.find(e => e.id === record.employee_id);
    const matchesSearch = !searchTerm || 
      (employee && `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCalculationComplete = (calculation) => {
    createEOSBMutation.mutate(calculation);
  };

  const handleApprove = (record) => {
    updateEOSBMutation.mutate({
      id: record.id,
      data: { 
        status: 'approved', 
        approval_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleMarkPaid = (record) => {
    updateEOSBMutation.mutate({
      id: record.id,
      data: { 
        status: 'paid', 
        payment_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleInitiateCalculation = (employee) => {
    setSelectedEmployee(employee);
    setShowCalculator(true);
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
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'إدارة مكافأة نهاية الخدمة' : 'End of Service Benefits Management'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'حساب وإدارة مكافآت نهاية الخدمة وفقاً لنظام العمل السعودي' 
              : 'Calculate and manage EOSB according to Saudi Labor Law'}
          </p>
        </div>
        <Button onClick={() => setShowCalculator(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'احسب EOSB' : 'Calculate EOSB'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title={language === 'ar' ? 'إجمالي السجلات' : 'Total Records'}
          value={stats.totalRecords}
          icon={FileText}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={language === 'ar' ? 'محسوب' : 'Calculated'}
          value={stats.calculated}
          icon={AlertTriangle}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={language === 'ar' ? 'موافق عليها' : 'Approved'}
          value={stats.approved}
          icon={CheckCircle2}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={language === 'ar' ? 'مدفوعة' : 'Paid'}
          value={stats.paid}
          icon={DollarSign}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title={language === 'ar' ? 'الالتزامات المعلقة' : 'Outstanding Liability'}
          value={`${stats.totalLiability.toLocaleString()} ${language === 'ar' ? 'ريال' : 'SAR'}`}
          icon={TrendingUp}
          bgColor="from-red-500 to-red-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="records" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100">
          <TabsTrigger value="records">
            {language === 'ar' ? 'سجلات EOSB' : 'EOSB Records'}
          </TabsTrigger>
          <TabsTrigger value="employees">
            {language === 'ar' ? 'موظفين نشطين' : 'Active Employees'}
          </TabsTrigger>
        </TabsList>

        {/* EOSB Records Tab */}
        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1 relative">
              <Search className={`absolute top-3 w-4 h-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={language === 'ar' ? 'ابحث عن الموظفين...' : 'Search employees...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All Status'}</SelectItem>
                <SelectItem value="calculated">{language === 'ar' ? 'محسوب' : 'Calculated'}</SelectItem>
                <SelectItem value="approved">{language === 'ar' ? 'موافق عليها' : 'Approved'}</SelectItem>
                <SelectItem value="paid">{language === 'ar' ? 'مدفوعة' : 'Paid'}</SelectItem>
                <SelectItem value="cancelled">{language === 'ar' ? 'ملغاة' : 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records List */}
          {filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">
                  {language === 'ar' ? 'لا توجد سجلات EOSB' : 'No EOSB records found'}
                </p>
                <Button onClick={() => setShowCalculator(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'احسب أول EOSB' : 'Calculate First EOSB'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                const employee = employees.find(e => e.id === record.employee_id);
                return (
                  <Card key={record.id} className="border-slate-200">
                    <CardContent className="p-6">
                      <div className={`flex justify-between items-start mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : ''}>
                          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h4 className="font-semibold text-slate-900">
                              {employee ? `${employee.first_name} ${employee.last_name}` : record.employee_id}
                            </h4>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {record.termination_type?.replace(/_/g, ' ')} • {new Date(record.calculation_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={isRTL ? 'text-left' : 'text-right'}>
                          <p className="text-sm text-slate-600">
                            {language === 'ar' ? 'صافي المكافأة' : 'Net EOSB'}
                          </p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {record.net_eosb_amount?.toLocaleString()} {language === 'ar' ? 'ريال' : 'SAR'}
                          </p>
                        </div>
                      </div>

                      <div className={`grid grid-cols-4 gap-4 mb-4 ${isRTL ? 'text-right' : ''}`}>
                        <div>
                          <p className="text-xs text-slate-600">
                            {language === 'ar' ? 'فترة الخدمة' : 'Service Period'}
                          </p>
                          <p className="font-semibold text-sm">
                            {record.years_of_service}y {record.months_of_service}m
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">
                            {language === 'ar' ? 'تاريخ الإنهاء' : 'Termination Date'}
                          </p>
                          <p className="font-semibold text-sm">
                            {new Date(record.termination_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">
                            {language === 'ar' ? 'إجمالي EOSB' : 'Total EOSB'}
                          </p>
                          <p className="font-semibold text-sm">
                            {record.total_eosb_amount?.toLocaleString()} {language === 'ar' ? 'ريال' : 'SAR'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">
                            {language === 'ar' ? 'الخصومات' : 'Deductions'}
                          </p>
                          <p className="font-semibold text-sm text-red-600">
                            -{record.deductions?.toLocaleString()} {language === 'ar' ? 'ريال' : 'SAR'}
                          </p>
                        </div>
                      </div>

                      {record.calculation_details && (
                        <details className="mb-4">
                          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                            {language === 'ar' ? 'عرض تفاصيل الحساب' : 'View Calculation Details'}
                          </summary>
                          <pre className="mt-2 bg-slate-50 p-3 rounded text-xs whitespace-pre-wrap border">
                            {record.calculation_details}
                          </pre>
                        </details>
                      )}

                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {record.status === 'calculated' && (
                          <Button
                            onClick={() => handleApprove(record)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'موافقة' : 'Approve'}
                          </Button>
                        )}

                        {record.status === 'approved' && (
                          <Button
                            onClick={() => handleMarkPaid(record)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'تحديد كمدفوع' : 'Mark as Paid'}
                          </Button>
                        )}

                        {record.status === 'paid' && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2 w-full">
                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">
                                {language === 'ar' ? 'تم الدفع' : 'Payment Completed'}
                              </p>
                              <p className="text-xs text-purple-700">
                                {language === 'ar' ? 'دفعت في' : 'Paid on'} {new Date(record.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Active Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'موظفين نشطين' : 'Active Employees'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employees.filter(e => e.status === 'active').map(employee => {
                  const hasEOSB = eosbRecords.some(r => r.employee_id === employee.id);
                  return (
                    <div 
                      key={employee.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="font-semibold text-slate-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {employee.employee_id} • {employee.department}
                        </p>
                        <p className="text-xs text-slate-500">
                          {language === 'ar' ? 'انضم في' : 'Joined'} {new Date(employee.hire_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleInitiateCalculation(employee)}
                        size="sm"
                        variant={hasEOSB ? "outline" : "default"}
                        className={!hasEOSB ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'احسب EOSB' : 'Calculate EOSB'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'حساب مكافأة نهاية الخدمة' : 'Calculate End of Service Benefits'}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee ? (
            <EOSBCalculator 
              employee={selectedEmployee}
              onCalculationComplete={handleCalculationComplete}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">
                {language === 'ar' ? 'اختر موظف لحساب مكافأته' : 'Select an employee to calculate EOSB'}
              </p>
              <Select onValueChange={(value) => {
                const employee = employees.find(e => e.id === value);
                setSelectedEmployee(employee);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر موظف' : 'Select Employee'} />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                {language === 'ar' ? 'حول مكافأة نهاية الخدمة' : 'About End of Service Benefits (EOSB)'}
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                {language === 'ar' 
                  ? 'مكافأة نهاية الخدمة هي مبلغ يستحقه الموظف عند انتهاء خدمته وفقاً لنظام العمل السعودي.'
                  : 'EOSB is a lump sum payment due to employees upon termination of service as per Saudi Labor Law.'}
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• {language === 'ar' ? 'حساب تلقائي حسب سبب إنهاء الخدمة ومدة الخدمة' : 'Automatic calculation based on termination type and service duration'}</p>
                <p>• {language === 'ar' ? 'يشمل الراتب الأساسي وبدل السكن (اختياري)' : 'Includes basic salary and housing allowance (optional)'}</p>
                <p>• {language === 'ar' ? 'سير عمل الموافقة والدفع' : 'Approval and payment workflow'}</p>
                <p>• {language === 'ar' ? 'تكامل مع الرواتب والتقارير المالية' : 'Integration with payroll and financial reports'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}