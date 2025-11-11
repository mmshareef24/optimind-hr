import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Search, Filter, X, Plus, Save, Upload, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AdvancedSearchFilter({
  onSearch,
  searchableFields = [],
  onClearSearch,
  savedPresets = [],
  onSavePreset,
  onLoadPreset,
  showPresets = true
}) {
  const [searchTerms, setSearchTerms] = useState([]);
  const [currentField, setCurrentField] = useState(searchableFields[0]?.value || '');
  const [currentValue, setCurrentValue] = useState('');
  const [currentOperator, setCurrentOperator] = useState('contains');
  const [presetName, setPresetName] = useState('');
  const [showPresetDialog, setShowPresetDialog] = useState(false);

  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'notContains', label: 'Does Not Contain' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'between', label: 'Between' }
  ];

  const addSearchTerm = () => {
    if (!currentField || !currentValue) {
      toast.error('Please select a field and enter a value');
      return;
    }

    const newTerm = {
      id: Date.now(),
      field: currentField,
      operator: currentOperator,
      value: currentValue,
      label: searchableFields.find(f => f.value === currentField)?.label || currentField
    };

    const updated = [...searchTerms, newTerm];
    setSearchTerms(updated);
    onSearch(updated);
    
    // Reset inputs
    setCurrentValue('');
    toast.success('Search term added');
  };

  const removeSearchTerm = (id) => {
    const updated = searchTerms.filter(term => term.id !== id);
    setSearchTerms(updated);
    onSearch(updated);
  };

  const clearAllSearchTerms = () => {
    setSearchTerms([]);
    onSearch([]);
    onClearSearch?.();
    toast.success('All search terms cleared');
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    if (searchTerms.length === 0) {
      toast.error('No search terms to save');
      return;
    }

    onSavePreset?.({
      name: presetName,
      terms: searchTerms,
      savedAt: new Date().toISOString()
    });

    setPresetName('');
    setShowPresetDialog(false);
    toast.success('Search preset saved');
  };

  const handleLoadPreset = (preset) => {
    setSearchTerms(preset.terms);
    onSearch(preset.terms);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const getOperatorSymbol = (operator) => {
    const symbols = {
      contains: '⊃',
      equals: '=',
      startsWith: '⊲',
      endsWith: '⊳',
      notContains: '⊅',
      greaterThan: '>',
      lessThan: '<',
      between: '↔'
    };
    return symbols[operator] || operator;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="w-5 h-5 text-emerald-600" />
          Advanced Search
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Search Builder */}
        <div className="grid md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs mb-1">Field</Label>
            <Select value={currentField} onValueChange={setCurrentField}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchableFields.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1">Operator</Label>
            <Select value={currentOperator} onValueChange={setCurrentOperator}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs mb-1">Value</Label>
            <Input
              placeholder="Enter search value..."
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addSearchTerm();
                }
              }}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={addSearchTerm} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Active Search Terms */}
        {searchTerms.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700">
                Active Filters ({searchTerms.length})
              </Label>
              <div className="flex gap-2">
                {showPresets && (
                  <Popover open={showPresetDialog} onOpenChange={setShowPresetDialog}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-1" />
                        Save Preset
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Save Search Preset</h4>
                        <Input
                          placeholder="Enter preset name..."
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSavePreset();
                            }
                          }}
                        />
                        <Button onClick={handleSavePreset} className="w-full">
                          Save
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <Button variant="outline" size="sm" onClick={clearAllSearchTerms}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {searchTerms.map(term => (
                <Badge
                  key={term.id}
                  variant="secondary"
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span className="font-medium">{term.label}</span>
                  <span className="mx-1.5 opacity-60">{getOperatorSymbol(term.operator)}</span>
                  <span className="font-semibold">{term.value}</span>
                  <X
                    className="w-3.5 h-3.5 ml-2 cursor-pointer hover:text-emerald-900"
                    onClick={() => removeSearchTerm(term.id)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Saved Presets */}
        {showPresets && savedPresets.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Saved Presets
            </Label>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadPreset(preset)}
                  className="hover:bg-blue-50"
                >
                  {preset.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {preset.terms.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Instructions */}
        {searchTerms.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Select a field, operator, and value to start filtering</p>
            <p className="text-xs mt-1">You can add multiple search terms to refine results</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}