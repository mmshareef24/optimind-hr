import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Save, X } from "lucide-react";

export default function AssetForm({ asset, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(asset || {
    asset_code: '',
    asset_name: '',
    category: 'equipment',
    description: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: 0,
    current_value: 0,
    warranty_expiry: '',
    status: 'available',
    condition: 'good',
    location: '',
    department: '',
    supplier: '',
    invoice_number: '',
    maintenance_schedule: 'none',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Asset Code *</Label>
              <Input
                value={formData.asset_code}
                onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                placeholder="e.g., LAP-001"
                required
              />
            </div>

            <div>
              <Label>Asset Name *</Label>
              <Input
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                placeholder="e.g., Dell Laptop"
                required
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="computer">Computer</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                  <SelectItem value="printer">Printer</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_maintenance">In Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(val) => setFormData({ ...formData, condition: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Floor 2, Room 205"
              />
            </div>

            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., IT Department"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the asset"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Technical Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Manufacturer/Brand</Label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Dell, HP, Apple"
              />
            </div>

            <div>
              <Label>Model</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., Latitude 5520"
              />
            </div>

            <div>
              <Label>Serial Number</Label>
              <Input
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Unique serial number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Information */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Purchase Information</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Purchase Cost (SAR)</Label>
              <Input
                type="number"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Current Value (SAR)</Label>
              <Input
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Warranty Expiry</Label>
              <Input
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
              />
            </div>

            <div>
              <Label>Supplier</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier/vendor name"
              />
            </div>

            <div>
              <Label>Invoice Number</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="Invoice/PO number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Maintenance Schedule</Label>
              <Select
                value={formData.maintenance_schedule}
                onValueChange={(val) => setFormData({ ...formData, maintenance_schedule: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {asset ? 'Update Asset' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
}