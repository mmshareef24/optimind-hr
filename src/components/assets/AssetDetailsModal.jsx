import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, UserPlus, Calendar, DollarSign, Wrench } from "lucide-react";
import { format } from "date-fns";

export default function AssetDetailsModal({ 
  open, 
  onOpenChange, 
  asset, 
  employees, 
  assignments, 
  maintenanceRecords,
  onEdit,
  onAssign 
}) {
  const assignedEmployee = asset.assigned_to ? employees.find(e => e.id === asset.assigned_to) : null;
  const activeAssignment = assignments.find(a => a.status === 'active');

  const statusColors = {
    available: 'bg-emerald-100 text-emerald-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_maintenance: 'bg-amber-100 text-amber-700',
    retired: 'bg-slate-100 text-slate-700',
    lost: 'bg-red-100 text-red-700',
    damaged: 'bg-orange-100 text-orange-700'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{asset.asset_name}</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">{asset.asset_code}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(asset)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {asset.status === 'available' && (
                <Button size="sm" onClick={() => onAssign(asset)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Condition */}
          <div className="flex gap-2">
            <Badge className={statusColors[asset.status]}>
              {asset.status.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline">{asset.condition}</Badge>
            <Badge variant="outline" className="capitalize">{asset.category}</Badge>
          </div>

          {/* Description */}
          {asset.description && (
            <Card>
              <CardContent className="p-4">
                <p className="text-slate-700">{asset.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Technical Details</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {asset.manufacturer && (
                  <div>
                    <span className="text-slate-500 block mb-1">Manufacturer</span>
                    <span className="font-medium text-slate-900">{asset.manufacturer}</span>
                  </div>
                )}
                {asset.model && (
                  <div>
                    <span className="text-slate-500 block mb-1">Model</span>
                    <span className="font-medium text-slate-900">{asset.model}</span>
                  </div>
                )}
                {asset.serial_number && (
                  <div>
                    <span className="text-slate-500 block mb-1">Serial Number</span>
                    <span className="font-medium text-slate-900">{asset.serial_number}</span>
                  </div>
                )}
                {asset.location && (
                  <div>
                    <span className="text-slate-500 block mb-1">Location</span>
                    <span className="font-medium text-slate-900">{asset.location}</span>
                  </div>
                )}
                {asset.department && (
                  <div>
                    <span className="text-slate-500 block mb-1">Department</span>
                    <span className="font-medium text-slate-900">{asset.department}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          {(asset.purchase_cost || asset.current_value) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Financial Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {asset.purchase_cost && (
                    <div>
                      <span className="text-slate-500 block mb-1">Purchase Cost</span>
                      <span className="font-semibold text-slate-900">{asset.purchase_cost.toLocaleString()} SAR</span>
                    </div>
                  )}
                  {asset.current_value && (
                    <div>
                      <span className="text-slate-500 block mb-1">Current Value</span>
                      <span className="font-semibold text-emerald-600">{asset.current_value.toLocaleString()} SAR</span>
                    </div>
                  )}
                  {asset.purchase_date && (
                    <div>
                      <span className="text-slate-500 block mb-1">Purchase Date</span>
                      <span className="font-medium text-slate-900">
                        {format(new Date(asset.purchase_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {asset.warranty_expiry && (
                    <div>
                      <span className="text-slate-500 block mb-1">Warranty Expiry</span>
                      <span className="font-medium text-slate-900">
                        {format(new Date(asset.warranty_expiry), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {asset.supplier && (
                    <div>
                      <span className="text-slate-500 block mb-1">Supplier</span>
                      <span className="font-medium text-slate-900">{asset.supplier}</span>
                    </div>
                  )}
                  {asset.invoice_number && (
                    <div>
                      <span className="text-slate-500 block mb-1">Invoice Number</span>
                      <span className="font-medium text-slate-900">{asset.invoice_number}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment Information */}
          {activeAssignment && assignedEmployee && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Current Assignment</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-500 block mb-1">Assigned To</span>
                    <span className="font-semibold text-slate-900">
                      {assignedEmployee.first_name} {assignedEmployee.last_name}
                    </span>
                    <p className="text-sm text-slate-600">{assignedEmployee.job_title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block mb-1">Assigned Date</span>
                      <span className="font-medium text-slate-900">{activeAssignment.assigned_date}</span>
                    </div>
                    {activeAssignment.expected_return_date && (
                      <div>
                        <span className="text-slate-500 block mb-1">Expected Return</span>
                        <span className="font-medium text-slate-900">{activeAssignment.expected_return_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment History */}
          {assignments.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Assignment History
                </h3>
                <div className="space-y-3">
                  {assignments.slice(0, 5).map((assignment) => {
                    const emp = employees.find(e => e.id === assignment.employee_id);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">
                            {emp?.first_name} {emp?.last_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {assignment.assigned_date} to {assignment.actual_return_date || 'Present'}
                          </p>
                        </div>
                        <Badge className={
                          assignment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          assignment.status === 'returned' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }>
                          {assignment.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance History */}
          {maintenanceRecords.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  Maintenance History
                </h3>
                <div className="space-y-3">
                  {maintenanceRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">{record.maintenance_type}</p>
                        <p className="text-sm text-slate-600">{record.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{record.maintenance_date}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          record.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }>
                          {record.status}
                        </Badge>
                        {record.cost > 0 && (
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {record.cost.toLocaleString()} SAR
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {asset.notes && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Notes</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{asset.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}