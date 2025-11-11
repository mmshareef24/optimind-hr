import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";

export default function ReportFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  filterConfig = []
}) {
  const hasActiveFilters = Object.values(filters).some(v => 
    v !== '' && v !== 'all' && v !== null && v !== undefined
  );

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const renderFilterControl = (config) => {
    const { key, label, type, options, min, max } = config;

    switch (type) {
      case 'select':
        return (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Select
              value={filters[key] || 'all'}
              onValueChange={(val) => handleFilterChange(key, val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'date':
        return (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Input
              type="date"
              value={filters[key] || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              max={max}
              min={min}
              className="h-9"
            />
          </div>
        );

      case 'number':
        return (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Input
              type="number"
              value={filters[key] || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
              min={min}
              max={max}
              className="h-9"
            />
          </div>
        );

      case 'text':
        return (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Input
              type="text"
              value={filters[key] || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="h-9"
            />
          </div>
        );

      case 'month':
        return (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Input
              type="month"
              value={filters[key] || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              max={max}
              min={min}
              className="h-9"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filterConfig.map(config => renderFilterControl(config))}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-blue-200">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === 'all') return null;
              
              const config = filterConfig.find(c => c.key === key);
              if (!config) return null;

              return (
                <Badge key={key} variant="secondary" className="gap-1">
                  {config.label}: {value}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleFilterChange(key, '')}
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}