import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Calendar, MapPin, DollarSign, Edit } from "lucide-react";
import { format } from "date-fns";

export default function TravelRequestCard({ request, employee, onEdit }) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{request.destination}</h4>
              <p className="text-sm text-slate-500">{request.request_type === 'international' ? 'International' : 'Domestic'}</p>
            </div>
          </div>
          <Badge className={statusColors[request.status]}>
            {request.status}
          </Badge>
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{request.purpose}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Departure</p>
              <p className="font-medium text-slate-900">
                {format(new Date(request.departure_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Return</p>
              <p className="font-medium text-slate-900">
                {format(new Date(request.return_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-900">
              {request.estimated_cost.toLocaleString()} SAR
            </span>
          </div>
          <div className="flex gap-2">
            {request.status === 'pending' && (
              <Button size="sm" variant="outline" onClick={() => onEdit(request)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {request.advance_required && (
          <div className="mt-3 p-2 bg-amber-50 rounded text-sm">
            <p className="text-amber-700">
              <strong>Advance Requested:</strong> {request.advance_amount.toLocaleString()} SAR
            </p>
          </div>
        )}

        {request.rejection_reason && (
          <div className="mt-3 p-2 bg-red-50 rounded text-sm">
            <p className="text-red-700">
              <strong>Rejection Reason:</strong> {request.rejection_reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}