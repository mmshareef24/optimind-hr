import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, User } from "lucide-react";

export default function OrgListView({ employees, onEmployeeClick, onManageReporting }) {
  const getManager = (employee) => {
    return employees.find(e => e.id === employee.manager_id);
  };

  const getSubordinates = (employeeId) => {
    return employees.filter(e => e.manager_id === employeeId);
  };

  const groupedByDepartment = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDepartment).map(([department, deptEmployees]) => (
        <Card key={department} className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">{department}</h3>
              <Badge variant="outline" className="ml-auto">
                {deptEmployees.length} employees
              </Badge>
            </div>

            <div className="space-y-3">
              {deptEmployees.map(employee => {
                const manager = getManager(employee);
                const subordinates = getSubordinates(employee.id);

                return (
                  <Card 
                    key={employee.id} 
                    className="border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onEmployeeClick(employee)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-emerald-100">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {employee.first_name} {employee.last_name}
                          </h4>
                          <p className="text-sm text-slate-600">{employee.job_title}</p>
                          
                          {/* Reporting Info */}
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            {manager && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <ChevronRight className="w-3 h-3" />
                                <span>Reports to: {manager.first_name} {manager.last_name}</span>
                              </div>
                            )}
                            {subordinates.length > 0 && (
                              <div className="flex items-center gap-1 text-emerald-600">
                                <Users className="w-3 h-3" />
                                <span>{subordinates.length} direct report{subordinates.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={
                            employee.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }>
                            {employee.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onManageReporting(employee);
                            }}
                          >
                            <User className="w-4 h-4 mr-1" />
                            Manage Reporting
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}