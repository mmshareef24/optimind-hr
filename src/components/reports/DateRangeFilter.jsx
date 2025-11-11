import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export default function DateRangeFilter({ 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange,
  onClear,
  label = "Date Range",
  showQuickFilters = true
}) {
  const today = new Date();
  const maxDate = format(today, 'yyyy-MM-dd');

  const quickFilters = [
    { label: 'Today', from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') },
    { label: 'Last 7 Days', from: format(subDays(today, 7), 'yyyy-MM-dd'), to: maxDate },
    { label: 'Last 30 Days', from: format(subDays(today, 30), 'yyyy-MM-dd'), to: maxDate },
    { label: 'This Month', from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') },
    { label: 'Last Month', from: format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd') },
    { label: 'This Year', from: format(startOfYear(today), 'yyyy-MM-dd'), to: format(endOfYear(today), 'yyyy-MM-dd') },
    { label: 'Last Year', from: format(startOfYear(subMonths(today, 12)), 'yyyy-MM-dd'), to: format(endOfYear(subMonths(today, 12)), 'yyyy-MM-dd') }
  ];

  const handleQuickFilter = (filter) => {
    onDateFromChange(filter.from);
    onDateToChange(filter.to);
  };

  const handleClear = () => {
    onDateFromChange('');
    onDateToChange('');
    onClear?.();
  };

  const isActive = dateFrom || dateTo;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {label}
          </CardTitle>
          {isActive && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Date Inputs */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-2 block">From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              max={dateTo || maxDate}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              min={dateFrom}
              max={maxDate}
              className="w-full"
            />
          </div>
        </div>

        {/* Quick Filters */}
        {showQuickFilters && (
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilter(filter)}
                  className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Active Range Display */}
        {isActive && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700">
              <strong>Active Range:</strong>{' '}
              {dateFrom ? format(new Date(dateFrom), 'MMM dd, yyyy') : 'Start'} → {' '}
              {dateTo ? format(new Date(dateTo), 'MMM dd, yyyy') : 'End'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}