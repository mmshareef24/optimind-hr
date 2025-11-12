import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { FileText, Mail, Download, DollarSign, CheckCircle, Clock, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function PayrollList() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: payrollRecords = [], isLoading } = useQuery({
    queryKey: ['payroll-records', selectedMonth],
    queryFn: async () => {
      const records = await base44.entities.Payroll.filter({ month: selectedMonth }, '-created_date');
      
      // Fetch employees to enrich
      const employees = await base44.entities.Employee.list();
      
      return records.map(record => {
        const employee = employees.find(e => e.id === record.employee_id);
        return {
          ...record,
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
          employee_code: employee?.employee_id,
          employee_department: employee?.department
        };
      });
    }
  });

  const generatePayslipMutation = useMutation({
    mutationFn: async ({ payroll_id, send_email, format = 'pdf' }) => {
      if (format === 'pdf') {
        const response = await base44.functions.invoke('generatePDFPayslip', {
          payroll_id,
          send_email
        });
        return { format: 'pdf', data: response.data };
      } else {
        const response = await base44.functions.invoke('generatePayslip', {
          payroll_id,
          send_email
        });
        return { format: 'text', data: response.data };
      }
    },
    onSuccess: (result, variables) => {
      if (variables.send_email) {
        toast.success('Payslip sent via email');
      } else {
        if (result.format === 'pdf') {
          // Download PDF
          const blob = new Blob([result.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payslip-${variables.payroll_id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          toast.success('PDF Payslip downloaded');
        } else {
          // Download text
          const blob = new Blob([result.data.payslip_text], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payslip-${result.data.payslip.payslip_id}.txt`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          toast.success('Payslip downloaded');
        }
      }
    },
    onError: () => {
      toast.error('Failed to generate payslip');
    }
  });

  const approvePayrollMutation = useMutation({
    mutationFn: (payroll_id) => base44.entities.Payroll.update(payroll_id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payroll-records']);
      toast.success('Payroll approved');
    }
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (payroll_id) => base44.entities.Payroll.update(payroll_id, {
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payroll-records']);
      toast.success('Payroll marked as paid');
    }
  });

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      calculated: 'bg-blue-100 text-blue-700',
      approved: 'bg-emerald-100 text-emerald-700',
      processed: 'bg-purple-100 text-purple-700',
      paid: 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="calculated">Calculated</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Employee name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Records */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">No payroll records found for the selected criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{record.employee_name}</h3>
                        <p className="text-sm text-slate-500">{record.employee_code} • {record.employee_department}</p>
                      </div>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Gross Salary</p>
                        <p className="font-semibold text-slate-900">{record.gross_salary.toLocaleString()} SAR</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Deductions</p>
                        <p className="font-semibold text-red-600">{record.total_deductions.toLocaleString()} SAR</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Net Salary</p>
                        <p className="font-bold text-emerald-600 text-lg">{record.net_salary.toLocaleString()} SAR</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Days</p>
                        <p className="font-semibold text-slate-900">{record.present_days}/{record.working_days}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generatePayslipMutation.mutate({ payroll_id: record.id, send_email: false, format: 'pdf' })}
                      disabled={generatePayslipMutation.isPending}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generatePayslipMutation.mutate({ payroll_id: record.id, send_email: true, format: 'pdf' })}
                      disabled={generatePayslipMutation.isPending}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </Button>
                    {record.status === 'calculated' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => approvePayrollMutation.mutate(record.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {record.status === 'approved' && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => markAsPaidMutation.mutate(record.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}