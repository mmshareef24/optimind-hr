import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Laptop, Phone, Printer, Car, Package, Monitor, Tablet, Eye, Edit, UserPlus } from "lucide-react";

export default function AssetCard({ asset, employees, onViewDetails, onEdit, onAssign }) {
  const categoryIcons = {
    computer: Laptop,
    laptop: Laptop,
    phone: Phone,
    tablet: Tablet,
    monitor: Monitor,
    printer: Printer,
    vehicle: Car,
    equipment: Package,
    furniture: Package,
    software: Package,
    other: Package
  };

  const Icon = categoryIcons[asset.category] || Package;

  const statusColors = {
    available: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    assigned: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    in_maintenance: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    retired: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    lost: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    damaged: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
  };

  const conditionColors = {
    excellent: 'text-emerald-600',
    good: 'text-blue-600',
    fair: 'text-amber-600',
    poor: 'text-red-600'
  };

  const colors = statusColors[asset.status] || statusColors.available;
  const assignedEmployee = asset.assigned_to ? employees.find(e => e.id === asset.assigned_to) : null;

  return (
    <Card className="border border-slate-200 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{asset.asset_name}</h3>
            <p className="text-sm text-slate-500">{asset.asset_code}</p>
          </div>
        </div>

        {asset.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{asset.description}</p>
        )}

        <div className="space-y-2 mb-4">
          {asset.manufacturer && (
            <div className="text-sm">
              <span className="text-slate-500">Brand:</span>
              <span className="ml-2 font-medium text-slate-900">{asset.manufacturer}</span>
            </div>
          )}
          {asset.model && (
            <div className="text-sm">
              <span className="text-slate-500">Model:</span>
              <span className="ml-2 font-medium text-slate-900">{asset.model}</span>
            </div>
          )}
          {asset.serial_number && (
            <div className="text-sm">
              <span className="text-slate-500">S/N:</span>
              <span className="ml-2 font-medium text-slate-900">{asset.serial_number}</span>
            </div>
          )}
          {asset.location && (
            <div className="text-sm">
              <span className="text-slate-500">Location:</span>
              <span className="ml-2 font-medium text-slate-900">{asset.location}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>
            {asset.status.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="outline" className={conditionColors[asset.condition]}>
            {asset.condition}
          </Badge>
          {asset.category && (
            <Badge variant="outline" className="capitalize">
              {asset.category}
            </Badge>
          )}
        </div>

        {assignedEmployee && (
          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <p className="text-xs text-slate-500 mb-1">Assigned to</p>
            <p className="text-sm font-medium text-slate-900">
              {assignedEmployee.first_name} {assignedEmployee.last_name}
            </p>
          </div>
        )}

        {(asset.current_value || asset.purchase_cost) && (
          <div className="text-sm mb-4">
            <span className="text-slate-500">Value:</span>
            <span className="ml-2 font-bold text-blue-600">
              {(asset.current_value || asset.purchase_cost).toLocaleString()} SAR
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(asset)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          {asset.status === 'available' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssign(asset)}
              className="flex-1"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}