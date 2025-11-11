import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  History, Eye, Download, Search, Calendar,
  TrendingUp, TrendingDown, DollarSign 
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollHistory({ payrolls, isLoading, onViewDetails }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filteredPayrolls = payrolls.filter(p =>
    p.employee_id?.includes(searchTerm) ||
    p.month?.includes(searchTerm)
  );

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      calculated: 'bg-blue-100 text-blue-700 border-blue-200',
      approved: 'bg-purple-100 text-purple-700 border-purple-200',
      processed: 'bg-amber-100 text-amber-700 border-amber-200',
      paid: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Payroll History
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by employee or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No payroll history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayrolls.map((payroll) => {
                const prevMonthPayroll = payrolls.find(p => 
                  p.employee_id === payroll.employee_id && 
                  p.month < payroll.month
                );
                const salaryChange = prevMonthPayroll 
                  ? payroll.net_salary - prevMonthPayroll.net_salary 
                  : 0;

                return (
                  <Card key={payroll.id} className="border border-slate-200 hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">
                                Employee #{payroll.employee_id?.slice(0, 12)}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {format(new Date(payroll.month + '-01'), 'MMMM yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 ml-13">
                            <div>
                              <p className="text-xs text-slate-500">Gross Salary</p>
                              <p className="font-semibold text-slate-900">
                                {payroll.gross_salary?.toLocaleString()} SAR
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Deductions</p>
                              <p className="font-semibold text-red-600">
                                -{payroll.total_deductions?.toLocaleString()} SAR
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Net Salary</p>
                              <p className="font-bold text-emerald-600 text-lg">
                                {payroll.net_salary?.toLocaleString()} SAR
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">GOSI</p>
                              <p className="font-semibold text-blue-600">
                                {(payroll.gosi_employee + payroll.gosi_employer)?.toLocaleString()} SAR
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {salaryChange !== 0 && (
                            <div className={`flex items-center gap-1 text-sm ${
                              salaryChange > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {salaryChange > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="font-semibold">
                                {Math.abs(salaryChange).toLocaleString()} SAR
                              </span>
                            </div>
                          )}
                          <Badge className={getStatusColor(payroll.status)}>
                            {payroll.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payroll)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Gross Salary</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {selectedPayroll.gross_salary?.toLocaleString()} SAR
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Total Deductions</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedPayroll.total_deductions?.toLocaleString()} SAR
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Net Salary</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedPayroll.net_salary?.toLocaleString()} SAR
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Earnings
                </h3>
                <div className="space-y-2 bg-emerald-50 rounded-lg p-4">
                  {[
                    { label: 'Basic Salary', value: selectedPayroll.basic_salary },
                    { label: 'Housing Allowance', value: selectedPayroll.housing_allowance },
                    { label: 'Transport Allowance', value: selectedPayroll.transport_allowance },
                    { label: 'Food Allowance', value: selectedPayroll.food_allowance },
                    { label: 'Mobile Allowance', value: selectedPayroll.mobile_allowance },
                    { label: 'Overtime Pay', value: selectedPayroll.overtime_pay },
                    { label: 'Bonus', value: selectedPayroll.bonus },
                    { label: 'Commission', value: selectedPayroll.commission }
                  ].map((item, idx) => (
                    item.value > 0 && (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-900">
                          {item.value?.toLocaleString()} SAR
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  Deductions
                </h3>
                <div className="space-y-2 bg-red-50 rounded-lg p-4">
                  {[
                    { label: 'GOSI (Employee Share)', value: selectedPayroll.gosi_employee },
                    { label: 'Loan Deduction', value: selectedPayroll.loan_deduction },
                    { label: 'Advance Deduction', value: selectedPayroll.advance_deduction },
                    { label: 'Absence Deduction', value: selectedPayroll.absence_deduction },
                    { label: 'Other Deductions', value: selectedPayroll.other_deductions }
                  ].map((item, idx) => (
                    item.value > 0 && (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-red-600">
                          -{item.value?.toLocaleString()} SAR
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Attendance */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Attendance Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Working Days</p>
                    <p className="text-xl font-bold text-slate-900">{selectedPayroll.working_days}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Present Days</p>
                    <p className="text-xl font-bold text-emerald-600">{selectedPayroll.present_days}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Absent Days</p>
                    <p className="text-xl font-bold text-red-600">{selectedPayroll.absent_days}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}