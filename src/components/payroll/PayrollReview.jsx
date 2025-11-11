import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function PayrollReview({ 
  payrolls, 
  employees, 
  onApprove, 
  onReject, 
  onEdit 
}) {
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedPayroll, setEditedPayroll] = useState(null);

  const pendingPayrolls = payrolls.filter(p => 
    p.status === 'calculated' || p.status === 'draft'
  );

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailsDialog(true);
  };

  const handleEdit = (payroll) => {
    setSelectedPayroll(payroll);
    setEditedPayroll({ ...payroll });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    onEdit(editedPayroll);
    setShowEditDialog(false);
    setSelectedPayroll(null);
    setEditedPayroll(null);
  };

  const getEmployee = (employeeId) => {
    return employees.find(e => e.id === employeeId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Review Payroll ({pendingPayrolls.length})
        </h3>
      </div>

      {pendingPayrolls.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No payrolls pending review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingPayrolls.map((payroll) => {
            const employee = getEmployee(payroll.employee_id);
            return (
              <Card key={payroll.id} className="border border-slate-200 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {employee?.first_name} {employee?.last_name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {employee?.employee_id} • {employee?.department}
                          </p>
                        </div>
                        <Badge className={
                          payroll.status === 'calculated' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {payroll.status}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-xs text-slate-500 mb-1">Gross Salary</p>
                          <p className="font-semibold text-slate-900">
                            {payroll.gross_salary?.toLocaleString()} SAR
                          </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-red-500 mb-1">GOSI</p>
                          <p className="font-semibold text-red-700">
                            -{(payroll.gosi_employee || 0).toLocaleString()} SAR
                          </p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="text-xs text-amber-500 mb-1">Total Deductions</p>
                          <p className="font-semibold text-amber-700">
                            -{payroll.total_deductions?.toLocaleString()} SAR
                          </p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg">
                          <p className="text-xs text-emerald-500 mb-1">Net Salary</p>
                          <p className="font-semibold text-emerald-700">
                            {payroll.net_salary?.toLocaleString()} SAR
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(payroll)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(payroll)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onApprove(payroll.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
          </DialogHeader>
          
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Employee</Label>
                  <p className="font-semibold">
                    {getEmployee(selectedPayroll.employee_id)?.first_name} {getEmployee(selectedPayroll.employee_id)?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Month</Label>
                  <p className="font-semibold">{selectedPayroll.month}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Earnings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-medium">{selectedPayroll.basic_salary?.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Housing Allowance</span>
                    <span className="font-medium">{selectedPayroll.housing_allowance?.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transport Allowance</span>
                    <span className="font-medium">{selectedPayroll.transport_allowance?.toLocaleString()} SAR</span>
                  </div>
                  {selectedPayroll.overtime_pay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Overtime Pay</span>
                      <span className="font-medium text-blue-600">{selectedPayroll.overtime_pay?.toLocaleString()} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Gross Salary</span>
                    <span className="font-bold text-emerald-600">{selectedPayroll.gross_salary?.toLocaleString()} SAR</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Deductions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">GOSI (Employee)</span>
                    <span className="font-medium text-red-600">-{selectedPayroll.gosi_employee?.toLocaleString()} SAR</span>
                  </div>
                  {selectedPayroll.absence_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Absence Deduction</span>
                      <span className="font-medium text-red-600">-{selectedPayroll.absence_deduction?.toLocaleString()} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total Deductions</span>
                    <span className="font-bold text-red-600">-{selectedPayroll.total_deductions?.toLocaleString()} SAR</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Net Salary</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {selectedPayroll.net_salary?.toLocaleString()} SAR
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payroll</DialogTitle>
          </DialogHeader>

          {editedPayroll && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Basic Salary</Label>
                  <Input
                    type="number"
                    value={editedPayroll.basic_salary}
                    onChange={(e) => setEditedPayroll({
                      ...editedPayroll,
                      basic_salary: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label>Housing Allowance</Label>
                  <Input
                    type="number"
                    value={editedPayroll.housing_allowance}
                    onChange={(e) => setEditedPayroll({
                      ...editedPayroll,
                      housing_allowance: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label>Transport Allowance</Label>
                  <Input
                    type="number"
                    value={editedPayroll.transport_allowance}
                    onChange={(e) => setEditedPayroll({
                      ...editedPayroll,
                      transport_allowance: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label>Overtime Pay</Label>
                  <Input
                    type="number"
                    value={editedPayroll.overtime_pay}
                    onChange={(e) => setEditedPayroll({
                      ...editedPayroll,
                      overtime_pay: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editedPayroll.notes || ''}
                  onChange={(e) => setEditedPayroll({
                    ...editedPayroll,
                    notes: e.target.value
                  })}
                  placeholder="Add any notes about this payroll..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-emerald-600 hover:bg-emerald-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}