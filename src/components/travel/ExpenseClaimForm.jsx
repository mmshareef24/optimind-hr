import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Save, X, Upload, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ExpenseClaimForm({ claim, employee, travelRequests = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState(claim || {
    employee_id: employee?.id || '',
    travel_request_id: '',
    claim_date: new Date().toISOString().split('T')[0],
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'meals',
    description: '',
    merchant: '',
    amount: 0,
    currency: 'SAR',
    exchange_rate: 1,
    amount_in_sar: 0,
    receipt_url: '',
    payment_method: 'cash',
    reimbursable: true,
    status: 'draft',
    category: '',
    billable_to_client: false,
    notes: ''
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, receipt_url: file_url });
      toast.success('Receipt uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleAmountChange = (amount) => {
    const amountInSar = amount * (formData.exchange_rate || 1);
    setFormData({ ...formData, amount, amount_in_sar: amountInSar });
  };

  const handleExchangeRateChange = (rate) => {
    const amountInSar = (formData.amount || 0) * rate;
    setFormData({ ...formData, exchange_rate: rate, amount_in_sar: amountInSar });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Expense Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Expense Type *</Label>
              <Select
                value={formData.expense_type}
                onValueChange={(val) => setFormData({ ...formData, expense_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="car_rental">Car Rental</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="office_supplies">Office Supplies</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Expense Date *</Label>
              <Input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Merchant/Vendor *</Label>
              <Input
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                placeholder="Name of merchant or vendor"
                required
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Personal Credit Card</SelectItem>
                  <SelectItem value="company_card">Company Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about this expense"
              rows={3}
              required
            />
          </div>

          {travelRequests.length > 0 && (
            <div>
              <Label>Related Travel Request (Optional)</Label>
              <Select
                value={formData.travel_request_id}
                onValueChange={(val) => setFormData({ ...formData, travel_request_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select travel request" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {travelRequests.map(req => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.destination} - {req.departure_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Amount Details</h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(val) => setFormData({ ...formData, currency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Exchange Rate</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.exchange_rate}
                onChange={(e) => handleExchangeRateChange(parseFloat(e.target.value) || 1)}
                disabled={formData.currency === 'SAR'}
              />
            </div>
          </div>

          {formData.currency !== 'SAR' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Amount in SAR: <span className="text-lg">{formData.amount_in_sar.toFixed(2)} SAR</span>
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Category/Cost Center</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Marketing, Sales, R&D"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.reimbursable}
                onCheckedChange={(checked) => setFormData({ ...formData, reimbursable: checked })}
              />
              <Label>Reimbursable</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.billable_to_client}
                onCheckedChange={(checked) => setFormData({ ...formData, billable_to_client: checked })}
              />
              <Label>Billable to Client</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Receipt Upload</h3>
          
          <div>
            <Label>Receipt/Invoice</Label>
            <div className="mt-2">
              {formData.receipt_url ? (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-emerald-50">
                  <FileText className="w-8 h-8 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-900">Receipt uploaded</p>
                    <a 
                      href={formData.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      View receipt
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, receipt_url: '' })}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <Upload className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload receipt'}
                  </p>
                  <p className="text-xs text-slate-500">PDF, PNG, JPG (max 10MB)</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={() => setFormData({ ...formData, status: 'draft' })}
          variant="outline"
        >
          Save as Draft
        </Button>
        <Button
          type="submit"
          onClick={() => setFormData({ ...formData, status: 'submitted' })}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Submit Claim
        </Button>
      </div>
    </form>
  );
}