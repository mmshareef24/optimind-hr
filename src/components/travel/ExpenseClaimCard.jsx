import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Calendar, FileText, Edit } from "lucide-react";
import { format } from "date-fns";

export default function ExpenseClaimCard({ claim, employee, travelRequests, onEdit }) {
  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-amber-100 text-amber-700 border-amber-200',
    under_review: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    paid: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const expenseTypeLabels = {
    flight: 'Flight',
    hotel: 'Hotel',
    car_rental: 'Car Rental',
    fuel: 'Fuel',
    meals: 'Meals',
    entertainment: 'Entertainment',
    transportation: 'Transportation',
    office_supplies: 'Office Supplies',
    communication: 'Communication',
    parking: 'Parking',
    other: 'Other'
  };

  const travelRequest = travelRequests?.find(r => r.id === claim.travel_request_id);

  return (
    <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{expenseTypeLabels[claim.expense_type]}</h4>
                <p className="text-sm text-slate-500">{claim.merchant}</p>
              </div>
              <Badge className={statusColors[claim.status]}>
                {claim.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <p className="text-sm text-slate-600 mb-3 line-clamp-1">{claim.description}</p>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium text-slate-900">
                  {format(new Date(claim.expense_date), 'MMM dd, yyyy')}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Amount</p>
                <p className="font-semibold text-emerald-600">
                  {(claim.amount_in_sar || claim.amount).toLocaleString()} SAR
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Payment</p>
                <p className="font-medium text-slate-900 capitalize">
                  {claim.payment_method.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {travelRequest && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                <p className="text-blue-700">
                  <strong>Travel:</strong> {travelRequest.destination}
                </p>
              </div>
            )}

            {claim.receipt_url && (
              <div className="mt-3">
                <a
                  href={claim.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  View Receipt
                </a>
              </div>
            )}

            {claim.rejection_reason && (
              <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                <p className="text-red-700">
                  <strong>Rejection Reason:</strong> {claim.rejection_reason}
                </p>
              </div>
            )}
          </div>

          <div>
            {(claim.status === 'draft' || claim.status === 'submitted') && (
              <Button size="sm" variant="outline" onClick={() => onEdit(claim)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}