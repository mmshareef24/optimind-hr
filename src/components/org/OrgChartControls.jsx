import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Grid, List, Users, Download, RefreshCw, Filter,
  Layers, TrendingUp, Building
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

export default function OrgChartControls({ 
  searchTerm, 
  onSearchChange, 
  viewMode,
  onViewModeChange,
  onRefresh,
  onExport,
  employees = []
}) {
  // Calculate statistics
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const managers = new Set(employees.map(e => e.manager_id).filter(Boolean)).size;
  const topLevel = employees.filter(e => !e.manager_id || !employees.find(emp => emp.id === e.manager_id)).length;

  return (
    <Card className="border-0 shadow-xl mb-6 bg-gradient-to-r from-white to-slate-50">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Search and View Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search employees by name, title, or department..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 border-slate-300"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange('chart')}
                  className={`rounded-none ${viewMode === 'chart' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50'}`}
                >
                  <Grid className="w-4 h-4 mr-2" />
                  Chart
                </Button>
                <div className="w-px bg-slate-300" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className={`rounded-none ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50'}`}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                title="Refresh"
                className="border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                title="Export Org Chart"
                className="border-slate-300 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">{employees.length}</span>
              <span className="text-xs text-blue-600">Total Employees</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">{managers}</span>
              <span className="text-xs text-purple-600">Managers</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <Building className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">{departments.length}</span>
              <span className="text-xs text-emerald-600">Departments</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">{topLevel}</span>
              <span className="text-xs text-amber-600">Top Level</span>
            </div>
          </div>

          {/* Department Filter (Optional - can be expanded) */}
          {departments.length > 1 && (
            <div className="flex items-center gap-2 pt-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Departments:</span>
              <div className="flex flex-wrap gap-1">
                {departments.map(dept => (
                  <Badge key={dept} variant="outline" className="text-xs">
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}