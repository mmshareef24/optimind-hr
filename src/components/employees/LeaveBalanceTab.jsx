import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calendar, Plus, Edit2, Trash2, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from '@/components/TranslationContext';

export default function LeaveBalanceTab({ employeeId }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [editingBalance, setEditingBalance] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['leave-balances', employeeId],
    queryFn: () => base44.entities.LeaveBalance.filter({ employee_id: employeeId }, '-year'),
    enabled: !!employeeId
  });

  const createBalanceMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveBalance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-balances', employeeId]);
      setShowForm(false);
      setEditingBalance(null);
      toast.success('Leave balance created successfully');
    },
    onError: () => toast.error('Failed to create leave balance')
  });

  const updateBalanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveBalance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-balances', employeeId]);
      setShowForm(false);
      setEditingBalance(null);
      toast.success('Leave balance updated successfully');
    },
    onError: () => toast.error('Failed to update leave balance')
  });

  const deleteBalanceMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaveBalance.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-balances', employeeId]);
      toast.success('Leave balance deleted successfully');
    },
    onError: () => toast.error('Failed to delete leave balance')
  });

  const LeaveBalanceForm = ({ balance, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(balance || {
      employee_id: employeeId,
      leave_type: 'annual',
      year: new Date().getFullYear(),
      total_entitled: 0,
      used: 0,
      pending: 0,
      remaining: 0,
      carried_forward: 0,
      notes: ''
    });

    // Auto-calculate remaining
    React.useEffect(() => {
      const remaining = (formData.total_entitled || 0) + (formData.carried_forward || 0) - (formData.used || 0) - (formData.pending || 0);
      setFormData(prev => ({ ...prev, remaining }));
    }, [formData.total_entitled, formData.used, formData.pending, formData.carried_forward]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Leave Type *</Label>
            <Select
              value={formData.leave_type}
              onValueChange={(val) => setFormData({...formData, leave_type: val})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="maternity">Maternity Leave</SelectItem>
                <SelectItem value="paternity">Paternity Leave</SelectItem>
                <SelectItem value="hajj">Hajj Leave</SelectItem>
                <SelectItem value="emergency">Emergency Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Year *</Label>
            <Input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Total Entitled (Days) *</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.total_entitled}
              onChange={(e) => setFormData({...formData, total_entitled: parseFloat(e.target.value)})}
              required
            />
          </div>
          <div>
            <Label>Carried Forward (Days)</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.carried_forward}
              onChange={(e) => setFormData({...formData, carried_forward: parseFloat(e.target.value)})}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Used (Days)</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.used}
              onChange={(e) => setFormData({...formData, used: parseFloat(e.target.value)})}
            />
          </div>
          <div>
            <Label>Pending (Days)</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.pending}
              onChange={(e) => setFormData({...formData, pending: parseFloat(e.target.value)})}
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900">Remaining Days:</span>
            <span className="text-2xl font-bold text-blue-600">{formData.remaining.toFixed(1)}</span>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            {balance ? 'Update' : 'Create'} Balance
          </Button>
        </div>
      </form>
    );
  };

  const leaveTypeColors = {
    annual: 'bg-blue-100 text-blue-700',
    sick: 'bg-amber-100 text-amber-700',
    maternity: 'bg-pink-100 text-pink-700',
    paternity: 'bg-purple-100 text-purple-700',
    hajj: 'bg-emerald-100 text-emerald-700',
    emergency: 'bg-red-100 text-red-700'
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-lg font-semibold text-slate-900">Leave Balances</h3>
          <p className="text-sm text-slate-600">Manage employee leave entitlements and balances</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => { setEditingBalance(null); setShowForm(!showForm); }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Balance
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <LeaveBalanceForm
              balance={editingBalance}
              onSubmit={(data) => {
                if (editingBalance) {
                  updateBalanceMutation.mutate({ id: editingBalance.id, data });
                } else {
                  createBalanceMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingBalance(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {balances.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-2">No leave balances configured</p>
            <p className="text-sm text-slate-400 mb-4">Add leave balances to track employee entitlements</p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Balance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {balances.map((balance) => (
            <Card key={balance.id} className="border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={leaveTypeColors[balance.leave_type]}>
                        {balance.leave_type.replace('_', ' ')}
                      </Badge>
                      <span className="font-semibold text-slate-700">{balance.year}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingBalance(balance);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this leave balance?')) {
                          deleteBalanceMutation.mutate(balance.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 mb-1">Entitled</p>
                    <p className="text-lg font-bold text-blue-900">{balance.total_entitled}</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-700 mb-1">Carried Fwd</p>
                    <p className="text-lg font-bold text-emerald-900">{balance.carried_forward}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-700 mb-1">Used</p>
                    <p className="text-lg font-bold text-red-900">{balance.used}</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-700 mb-1">Pending</p>
                    <p className="text-lg font-bold text-amber-900">{balance.pending}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="text-xs text-purple-700 mb-1">Remaining</p>
                    <p className="text-lg font-bold text-purple-900">{balance.remaining}</p>
                  </div>
                </div>

                {balance.notes && (
                  <p className="text-xs text-slate-500 mt-3 italic">{balance.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}