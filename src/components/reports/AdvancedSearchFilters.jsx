import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter, Calendar, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function AdvancedSearchFilters({
  filters,
  onFilterChange,
  onClearFilters,
  filterConfig = [],
  searchConfig = [],
  dateRangeConfig = []
}) {
  const [searchField, setSearchField] = useState(searchConfig[0]?.key || '');
  const [searchValue, setSearchValue] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle adding a search term
  const handleAddSearch = () => {
    if (searchValue.trim() && searchField) {
      const currentSearches = filters.searches || [];
      const newSearches = [...currentSearches, { field: searchField, value: searchValue }];
      onFilterChange({ ...filters, searches: newSearches });
      setSearchValue('');
    }
  };

  // Remove a search term
  const handleRemoveSearch = (index) => {
    const currentSearches = filters.searches || [];
    const newSearches = currentSearches.filter((_, i) => i !== index);
    onFilterChange({ ...filters, searches: newSearches });
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'searches') return (value || []).length > 0;
    if (key === 'dateFrom' || key === 'dateTo') return value !== '';
    return value !== 'all' && value !== '';
  }).length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-emerald-600" />
            Advanced Filters & Search
            {activeFilterCount > 0 && (
              <Badge className="bg-emerald-600 text-white">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button onClick={onClearFilters} variant="ghost" size="sm">
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Quick Search */}
        {searchConfig.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700">Search</Label>
            <div className="flex gap-2">
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {searchConfig.map(config => (
                    <SelectItem key={config.key} value={config.key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={`Search by ${searchConfig.find(c => c.key === searchField)?.label || 'field'}...`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddSearch} disabled={!searchValue.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Active Searches */}
            {filters.searches && filters.searches.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.searches.map((search, index) => (
                  <Badge key={index} variant="secondary" className="gap-2 px-3 py-1">
                    <span className="font-medium">
                      {searchConfig.find(c => c.key === search.field)?.label}:
                    </span>
                    <span>{search.value}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => handleRemoveSearch(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Date Range Filters */}
        {dateRangeConfig.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              {dateRangeConfig.map(config => (
                <div key={config.key} className="space-y-2">
                  <Label className="text-xs text-slate-600">{config.label}</Label>
                  <Input
                    type={config.type || 'date'}
                    value={filters[config.key] || ''}
                    onChange={(e) => onFilterChange({ ...filters, [config.key]: e.target.value })}
                    max={config.max}
                    min={config.min}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standard Filters */}
        {filterConfig.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700">Filters</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Show Less' : 'Show More'}
              </Button>
            </div>

            <div className={`grid md:grid-cols-${showAdvanced ? '3' : '2'} gap-4 transition-all`}>
              {filterConfig.slice(0, showAdvanced ? filterConfig.length : 4).map(config => (
                <div key={config.key} className="space-y-2">
                  <Label className="text-xs text-slate-600">{config.label}</Label>
                  {config.type === 'select' ? (
                    <Select
                      value={filters[config.key] || 'all'}
                      onValueChange={(value) => onFilterChange({ ...filters, [config.key]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {config.label}</SelectItem>
                        {config.options?.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={config.type || 'text'}
                      value={filters[config.key] || ''}
                      onChange={(e) => onFilterChange({ ...filters, [config.key]: e.target.value })}
                      placeholder={config.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                <strong>{activeFilterCount}</strong> filter{activeFilterCount !== 1 ? 's' : ''} applied
              </p>
              <Button onClick={onClearFilters} variant="outline" size="sm">
                Reset All Filters
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}