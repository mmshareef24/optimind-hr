import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function MaintenanceSchedule({ assets, maintenanceRecords, onScheduleMaintenance }) {
  const upcomingMaintenance = maintenanceRecords
    .filter(m => m.status === 'scheduled' && new Date(m.maintenance_date) > new Date())
    .sort((a, b) => new Date(a.maintenance_date) - new Date(b.maintenance_date));

  const overdueMaintenance = maintenanceRecords
    .filter(m => m.status === 'scheduled' && new Date(m.maintenance_date) < new Date());

  const completedMaintenance = maintenanceRecords
    .filter(m => m.status === 'completed')
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Overdue Maintenance */}
      {overdueMaintenance.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Overdue Maintenance ({overdueMaintenance.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueMaintenance.map(record => {
                const asset = assets.find(a => a.id === record.asset_id);
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{asset?.asset_name}</p>
                      <p className="text-sm text-slate-600 capitalize">{record.maintenance_type}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Due: {format(new Date(record.maintenance_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Maintenance ({upcomingMaintenance.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMaintenance.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No upcoming maintenance scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMaintenance.map(record => {
                const asset = assets.find(a => a.id === record.asset_id);
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{asset?.asset_name}</p>
                      <p className="text-sm text-slate-600 capitalize">{record.maintenance_type}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(record.maintenance_date), 'MMM dd, yyyy')}
                      </p>
                      {record.description && (
                        <p className="text-xs text-slate-500 mt-1">{record.description}</p>
                      )}
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            Recent Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedMaintenance.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No maintenance history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedMaintenance.map(record => {
                const asset = assets.find(a => a.id === record.asset_id);
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{asset?.asset_name}</p>
                      <p className="text-sm text-slate-600 capitalize">{record.maintenance_type}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(record.maintenance_date), 'MMM dd, yyyy')}
                      </p>
                      {record.description && (
                        <p className="text-xs text-slate-500 mt-1">{record.description}</p>
                      )}
                      {record.performed_by && (
                        <p className="text-xs text-slate-500 mt-1">By: {record.performed_by}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
                      {record.cost > 0 && (
                        <p className="text-sm font-semibold text-slate-900 mt-2">
                          {record.cost.toLocaleString()} SAR
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}