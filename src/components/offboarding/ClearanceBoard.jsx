import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, DollarSign, CheckCircle2, Clock, AlertCircle, Upload, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const departmentIcons = {
  warehouse: Package,
  finance_loans: DollarSign,
  finance_customer_balances: DollarSign,
  hr_manager: CheckCircle2
};

const departmentColors = {
  warehouse: "from-amber-500 to-orange-600",
  finance_loans: "from-emerald-500 to-emerald-600",
  finance_customer_balances: "from-blue-500 to-blue-600",
  hr_manager: "from-purple-500 to-purple-600"
};

const statusColors = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  cleared: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending_action: "bg-amber-100 text-amber-700 border-amber-200"
};

export default function ClearanceBoard({ clearanceItems, employee, onUpdate }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    clearance_notes: '',
    outstanding_amount: 0,
    document_url: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      status: item.status,
      clearance_notes: item.clearance_notes || '',
      outstanding_amount: item.outstanding_amount || 0,
      document_url: item.document_url || ''
    });
    setDialogOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, document_url: file_url });
      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const updateData = {
        ...formData,
        cleared_by: formData.status === 'cleared' ? (await base44.auth.me()).email : selectedItem.cleared_by,
        clearance_date: formData.status === 'cleared' ? new Date().toISOString().split('T')[0] : selectedItem.clearance_date
      };
      
      await onUpdate(selectedItem.id, updateData);
      setDialogOpen(false);
      toast.success("Clearance updated successfully");
    } catch (error) {
      toast.error("Failed to update clearance");
    }
  };

  const groupedItems = clearanceItems.reduce((acc, item) => {
    if (!acc[item.department]) acc[item.department] = [];
    acc[item.department].push(item);
    return acc;
  }, {});

  const totalCleared = clearanceItems.filter(i => i.status === 'cleared').length;
  const totalPending = clearanceItems.filter(i => i.status === 'pending' || i.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Cleared</p>
                <p className="text-2xl font-bold text-emerald-900">{totalCleared}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-900">{totalPending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Items</p>
                <p className="text-2xl font-bold text-blue-900">{clearanceItems.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clearance Columns */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(groupedItems).map(([dept, items]) => {
          const Icon = departmentIcons[dept];
          const deptName = dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          return (
            <Card key={dept} className="border-0 shadow-lg">
              <CardHeader className={`bg-gradient-to-r ${departmentColors[dept]} text-white p-4`}>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="w-5 h-5" />
                  {deptName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {items.map(item => (
                  <Card key={item.id} className="border border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenDialog(item)}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-slate-900">{item.clearance_type}</h4>
                        <Badge className={statusColors[item.status]}>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-slate-600 mb-2">{item.description}</p>
                      )}

                      {item.outstanding_amount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600 font-semibold mb-2">
                          <AlertCircle className="w-3 h-3" />
                          Outstanding: {item.outstanding_amount.toLocaleString()} SAR
                        </div>
                      )}

                      {item.status === 'cleared' && (
                        <div className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Cleared by {item.cleared_by?.split('@')[0]} on {item.clearance_date}
                        </div>
                      )}

                      {item.requires_documentation && !item.document_url && item.status !== 'cleared' && (
                        <div className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Documentation required
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Clearance - {selectedItem?.clearance_type}</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <p className="text-sm font-semibold text-slate-900">{employee?.first_name} {employee?.last_name}</p>
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_action">Pending Action</option>
                  <option value="cleared">Cleared</option>
                </select>
              </div>

              {selectedItem.department.includes('finance') && (
                <div>
                  <Label>Outstanding Amount (SAR)</Label>
                  <Input
                    type="number"
                    value={formData.outstanding_amount}
                    onChange={(e) => setFormData({ ...formData, outstanding_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div>
                <Label>Clearance Notes</Label>
                <Textarea
                  value={formData.clearance_notes}
                  onChange={(e) => setFormData({ ...formData, clearance_notes: e.target.value })}
                  rows={3}
                  placeholder="Add notes about this clearance..."
                />
              </div>

              {selectedItem.requires_documentation && (
                <div>
                  <Label>Supporting Document</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById(`clearance-doc-${selectedItem.id}`).click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                    <input
                      id={`clearance-doc-${selectedItem.id}`}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                    />
                    {formData.document_url && (
                      <a 
                        href={formData.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        View Document
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                  Update Clearance
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}