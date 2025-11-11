import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, X, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ShiftAssignmentTab({ 
  shifts = [],
  currentAssignments = [],
  onAssignmentsChange 
}) {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (currentAssignments && currentAssignments.length > 0) {
      setAssignments(currentAssignments);
    }
  }, [currentAssignments]);

  const addAssignment = () => {
    setAssignments([
      ...assignments,
      {
        shift_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_permanent: false,
        status: 'active',
        notes: ''
      }
    ]);
  };

  const removeAssignment = (index) => {
    const newAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
  };

  const updateAssignment = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index] = {
      ...newAssignments[index],
      [field]: value
    };
    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
  };

  const getShift = (shiftId) => {
    return shifts.find(s => s.id === shiftId);
  };

  const getShiftColor = (shift) => {
    return shift?.color_code || '#10b981';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Shift Assignments</h3>
          <p className="text-sm text-slate-600">Assign work shifts to this employee</p>
        </div>
        <Button onClick={addAssignment} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">No shift assignments yet</p>
            <Button onClick={addAssignment} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Shift
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment, index) => {
            const shift = getShift(assignment.shift_id);
            
            return (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: shift ? getShiftColor(shift) : '#10b981' }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-semibold text-slate-900">
                        Shift Assignment {index + 1}
                      </h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssignment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Shift *</Label>
                      <Select
                        value={assignment.shift_id}
                        onValueChange={(val) => updateAssignment(index, 'shift_id', val)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts.map(shift => (
                            <SelectItem key={shift.id} value={shift.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: shift.color_code }}
                                />
                                <span>{shift.shift_name} ({shift.start_time} - {shift.end_time})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {shift && (
                      <div className="md:col-span-2">
                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-sm text-blue-900">
                            <strong>{shift.shift_name}:</strong> {shift.start_time} - {shift.end_time}
                            {shift.working_hours && <> • {shift.working_hours}h</>}
                            {shift.break_duration && <> • {shift.break_duration}min break</>}
                            <br />
                            {shift.working_days && shift.working_days.length > 0 && (
                              <>Working days: {shift.working_days.join(', ')}</>
                            )}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    <div>
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={assignment.start_date}
                        onChange={(e) => updateAssignment(index, 'start_date', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={assignment.end_date}
                        onChange={(e) => updateAssignment(index, 'end_date', e.target.value)}
                        min={assignment.start_date}
                        disabled={assignment.is_permanent}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Leave empty for ongoing assignment
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`permanent-${index}`}
                        checked={assignment.is_permanent}
                        onCheckedChange={(checked) => {
                          updateAssignment(index, 'is_permanent', checked);
                          if (checked) {
                            updateAssignment(index, 'end_date', '');
                          }
                        }}
                      />
                      <label
                        htmlFor={`permanent-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Permanent shift assignment
                      </label>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select
                        value={assignment.status}
                        onValueChange={(val) => updateAssignment(index, 'status', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Input
                        value={assignment.notes}
                        onChange={(e) => updateAssignment(index, 'notes', e.target.value)}
                        placeholder="Additional notes about this assignment"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {assignments.length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-slate-900">
                  {assignments.length} shift {assignments.length === 1 ? 'assignment' : 'assignments'}
                </p>
                <p className="text-sm text-slate-600">
                  {assignments.filter(a => a.is_permanent).length} permanent, {' '}
                  {assignments.filter(a => a.status === 'active').length} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}