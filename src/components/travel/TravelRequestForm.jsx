import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Save, X } from "lucide-react";

export default function TravelRequestForm({ request, employee, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(request || {
    employee_id: employee?.id || '',
    request_type: 'domestic',
    purpose: '',
    destination: '',
    departure_date: '',
    return_date: '',
    duration_days: 0,
    estimated_cost: 0,
    flight_required: false,
    hotel_required: false,
    car_rental_required: false,
    flight_cost: 0,
    hotel_cost: 0,
    car_rental_cost: 0,
    other_costs: 0,
    advance_required: false,
    advance_amount: 0,
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    // Calculate duration when dates change
    if (formData.departure_date && formData.return_date) {
      const start = new Date(formData.departure_date);
      const end = new Date(formData.return_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, duration_days: days > 0 ? days : 0 }));
    }
  }, [formData.departure_date, formData.return_date]);

  useEffect(() => {
    // Calculate estimated cost
    const total = 
      (formData.flight_cost || 0) +
      (formData.hotel_cost || 0) +
      (formData.car_rental_cost || 0) +
      (formData.other_costs || 0);
    setFormData(prev => ({ ...prev, estimated_cost: total }));
  }, [formData.flight_cost, formData.hotel_cost, formData.car_rental_cost, formData.other_costs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Travel Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Request Type *</Label>
              <Select
                value={formData.request_type}
                onValueChange={(val) => setFormData({ ...formData, request_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Domestic Travel</SelectItem>
                  <SelectItem value="international">International Travel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Destination *</Label>
              <Input
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="City, Country"
                required
              />
            </div>

            <div>
              <Label>Departure Date *</Label>
              <Input
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Return Date *</Label>
              <Input
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                min={formData.departure_date}
                required
              />
            </div>

            <div>
              <Label>Duration</Label>
              <Input
                type="number"
                value={formData.duration_days}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.duration_days} {formData.duration_days === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          <div>
            <Label>Purpose of Travel *</Label>
            <Textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Describe the purpose and objectives of this trip"
              rows={3}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Services Required</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={formData.flight_required}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, flight_required: checked, flight_cost: checked ? formData.flight_cost : 0 })
                  }
                />
                <div>
                  <Label className="font-medium">Flight Booking</Label>
                  <p className="text-sm text-slate-500">Book flight tickets</p>
                </div>
              </div>
              {formData.flight_required && (
                <Input
                  type="number"
                  value={formData.flight_cost}
                  onChange={(e) => setFormData({ ...formData, flight_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="Estimated cost (SAR)"
                  className="w-40"
                />
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={formData.hotel_required}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, hotel_required: checked, hotel_cost: checked ? formData.hotel_cost : 0 })
                  }
                />
                <div>
                  <Label className="font-medium">Hotel Accommodation</Label>
                  <p className="text-sm text-slate-500">Book hotel stay</p>
                </div>
              </div>
              {formData.hotel_required && (
                <Input
                  type="number"
                  value={formData.hotel_cost}
                  onChange={(e) => setFormData({ ...formData, hotel_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="Estimated cost (SAR)"
                  className="w-40"
                />
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={formData.car_rental_required}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, car_rental_required: checked, car_rental_cost: checked ? formData.car_rental_cost : 0 })
                  }
                />
                <div>
                  <Label className="font-medium">Car Rental</Label>
                  <p className="text-sm text-slate-500">Rent a vehicle</p>
                </div>
              </div>
              {formData.car_rental_required && (
                <Input
                  type="number"
                  value={formData.car_rental_cost}
                  onChange={(e) => setFormData({ ...formData, car_rental_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="Estimated cost (SAR)"
                  className="w-40"
                />
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <Label>Other Expenses (Meals, Transport, etc.)</Label>
              <Input
                type="number"
                value={formData.other_costs}
                onChange={(e) => setFormData({ ...formData, other_costs: parseFloat(e.target.value) || 0 })}
                placeholder="Estimated cost (SAR)"
                className="mt-2"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Total Estimated Cost</Label>
              <span className="text-2xl font-bold text-blue-600">
                {formData.estimated_cost.toLocaleString()} SAR
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Advance Payment</h3>
          
          <div className="flex items-center gap-3 mb-4">
            <Checkbox
              checked={formData.advance_required}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, advance_required: checked, advance_amount: checked ? formData.advance_amount : 0 })
              }
            />
            <Label className="font-medium">Request advance payment for this trip</Label>
          </div>

          {formData.advance_required && (
            <div>
              <Label>Advance Amount (SAR)</Label>
              <Input
                type="number"
                value={formData.advance_amount}
                onChange={(e) => setFormData({ ...formData, advance_amount: parseFloat(e.target.value) || 0 })}
                placeholder="Enter amount"
              />
            </div>
          )}

          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information or special requests"
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
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {request ? 'Update Request' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}