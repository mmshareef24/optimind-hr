import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date'),
  });

  const filteredEmployees = employees.filter(e =>
    e.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_id?.includes(searchTerm) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Management</h1>
          <p className="text-slate-600">Manage your workforce efficiently</p>
        </div>
        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No employees found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border-2 border-emerald-100">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{employee.first_name} {employee.last_name}</h3>
                        <p className="text-sm text-slate-500">{employee.job_title} • {employee.department}</p>
                        <p className="text-xs text-slate-400 mt-1">ID: {employee.employee_id}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <p className="text-sm text-slate-500">Status</p>
                          <Badge className={
                            employee.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            employee.status === 'on_leave' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }>
                            {employee.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}