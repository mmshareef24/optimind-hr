import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Mail, Phone, Briefcase, ArrowRight, ChevronDown, 
  ChevronRight, Building, TrendingUp 
} from "lucide-react";

export default function OrgListView({ employees, onEmployeeClick, onManageReporting }) {
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());

  // Group employees by department
  const groupByDepartment = () => {
    const groups = {};
    employees.forEach(emp => {
      const dept = emp.department || 'No Department';
      if (!groups[dept]) {
        groups[dept] = [];
      }
      groups[dept].push(emp);
    });
    return groups;
  };

  const toggleDepartment = (dept) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dept)) {
        newSet.delete(dept);
      } else {
        newSet.add(dept);
      }
      return newSet;
    });
  };

  const getManager = (employee) => {
    return employees.find(e => e.id === employee.manager_id);
  };

  const getSubordinates = (employeeId) => {
    return employees.filter(e => e.manager_id === employeeId);
  };

  const departments = groupByDepartment();

  return (
    <div className="space-y-4">
      {Object.entries(departments).map(([dept, deptEmployees]) => {
        const isExpanded = expandedDepartments.has(dept);
        
        // Calculate department stats
        const managers = deptEmployees.filter(e => 
          getSubordinates(e.id).length > 0
        ).length;
        
        const avgTeamSize = managers > 0 
          ? (deptEmployees.length / managers).toFixed(1) 
          : 0;

        return (
          <Card key={dept} className="border-0 shadow-lg overflow-hidden">
            {/* Department Header */}
            <div 
              className="p-5 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-200 cursor-pointer hover:from-emerald-100 hover:to-blue-100 transition-all"
              onClick={() => toggleDepartment(dept)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{dept}</h3>
                    <p className="text-sm text-slate-600">
                      {deptEmployees.length} employee{deptEmployees.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Department Stats */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center px-4 py-2 bg-white rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500">Managers</p>
                      <p className="text-lg font-bold text-emerald-600">{managers}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-white rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500">Avg Team Size</p>
                      <p className="text-lg font-bold text-blue-600">{avgTeamSize}</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Department Employees */}
            {isExpanded && (
              <CardContent className="p-6">
                <div className="space-y-3">
                  {deptEmployees.map((employee) => {
                    const manager = getManager(employee);
                    const subordinates = getSubordinates(employee.id);

                    return (
                      <Card 
                        key={employee.id} 
                        className="border border-slate-200 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
                        onClick={() => onEmployeeClick(employee)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {/* Avatar */}
                              <Avatar className="w-14 h-14 border-2 border-white shadow-md ring-2 ring-slate-100">
                                <AvatarImage src={employee.profile_picture} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold">
                                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>

                              {/* Employee Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                    {employee.first_name} {employee.last_name}
                                  </h4>
                                  <Badge 
                                    className={
                                      employee.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                      employee.status === 'on_leave' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-700'
                                    }
                                  >
                                    {employee.status}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                  <p className="text-sm text-slate-600">{employee.job_title}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                  {employee.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate max-w-[200px]">{employee.email}</span>
                                    </div>
                                  )}
                                  {employee.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      <span>{employee.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reporting Structure */}
                            <div className="flex flex-col lg:flex-row items-end lg:items-center gap-4">
                              <div className="space-y-2 text-right">
                                {manager && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    <span className="text-slate-600">
                                      Reports to: <span className="font-semibold text-slate-900">
                                        {manager.first_name} {manager.last_name}
                                      </span>
                                    </span>
                                  </div>
                                )}
                                {subordinates.length > 0 && (
                                  <div className="flex items-center justify-end gap-2 text-sm">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span className="text-slate-600">
                                      <span className="font-semibold text-emerald-700">
                                        {subordinates.length}
                                      </span> direct report{subordinates.length === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                )}
                                {!manager && subordinates.length === 0 && (
                                  <span className="text-xs text-slate-400">No reporting structure</span>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEmployeeClick(employee);
                                  }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onManageReporting(employee);
                                  }}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}