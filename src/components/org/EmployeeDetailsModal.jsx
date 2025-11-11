import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mail, Phone, Calendar, Briefcase, User, CreditCard, 
  MapPin, Flag, Edit, Users, TrendingUp, Building, Hash
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeeDetailsModal({ employee, manager, subordinates, isOpen, onClose, onEdit }) {
  if (!employee) return null;

  const InfoItem = ({ icon: Icon, label, value, color = "text-slate-600" }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Employee Profile</span>
            <Button onClick={() => onEdit(employee)} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section - Enhanced */}
          <Card className="border-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold text-3xl">
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {employee.first_name} {employee.last_name}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <p className="text-lg text-slate-700 font-medium">{employee.job_title}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1">
                      <Building className="w-3 h-3 mr-1" />
                      {employee.department || 'No Department'}
                    </Badge>
                    <Badge className={
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                      {employee.status}
                    </Badge>
                    {employee.employment_type && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        {employee.employment_type.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Hash className="w-4 h-4" />
                      <span><strong>ID:</strong> {employee.employee_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span><strong>Joined:</strong> {employee.hire_date ? format(new Date(employee.hire_date), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Direct Reports</p>
                    <p className="text-2xl font-bold text-blue-700">{subordinates?.length || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            {manager && (
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 mb-1">Reports To</p>
                      <p className="text-sm font-bold text-purple-700 truncate">
                        {manager.first_name} {manager.last_name}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {employee.hire_date && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-600 mb-1">Tenure</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {Math.floor((new Date() - new Date(employee.hire_date)) / (1000 * 60 * 60 * 24 * 365))} yrs
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5 text-emerald-600" />
              Contact Information
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <InfoItem
                icon={Mail}
                label="Email"
                value={employee.email}
                color="text-blue-600"
              />
              <InfoItem
                icon={Phone}
                label="Phone"
                value={employee.phone}
                color="text-emerald-600"
              />
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              Employment Details
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <InfoItem
                icon={CreditCard}
                label="Employee ID"
                value={employee.employee_id}
                color="text-purple-600"
              />
              <InfoItem
                icon={Calendar}
                label="Hire Date"
                value={employee.hire_date ? format(new Date(employee.hire_date), 'MMM dd, yyyy') : 'N/A'}
                color="text-amber-600"
              />
              <InfoItem
                icon={Briefcase}
                label="Job Title"
                value={employee.job_title}
                color="text-blue-600"
              />
              <InfoItem
                icon={Building}
                label="Department"
                value={employee.department}
                color="text-emerald-600"
              />
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-emerald-600" />
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <InfoItem
                icon={Flag}
                label="Nationality"
                value={employee.nationality}
                color="text-indigo-600"
              />
              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={employee.date_of_birth ? format(new Date(employee.date_of_birth), 'MMM dd, yyyy') : 'N/A'}
                color="text-pink-600"
              />
              <InfoItem
                icon={User}
                label="Gender"
                value={employee.gender}
                color="text-purple-600"
              />
              <InfoItem
                icon={CreditCard}
                label="National ID / Iqama"
                value={employee.national_id}
                color="text-slate-600"
              />
            </div>
          </div>

          {/* Salary Information */}
          {(employee.basic_salary || employee.salary) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Compensation
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {employee.basic_salary && (
                  <InfoItem
                    icon={TrendingUp}
                    label="Basic Salary"
                    value={`${employee.basic_salary.toLocaleString()} SAR`}
                    color="text-emerald-600"
                  />
                )}
                {employee.housing_allowance && (
                  <InfoItem
                    icon={MapPin}
                    label="Housing Allowance"
                    value={`${employee.housing_allowance.toLocaleString()} SAR`}
                    color="text-blue-600"
                  />
                )}
                {employee.transport_allowance && (
                  <InfoItem
                    icon={Briefcase}
                    label="Transport Allowance"
                    value={`${employee.transport_allowance.toLocaleString()} SAR`}
                    color="text-purple-600"
                  />
                )}
              </div>
            </div>
          )}

          {/* Organizational Hierarchy - Enhanced */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-emerald-600" />
              Organizational Hierarchy
            </h3>
            <div className="space-y-3">
              {manager && (
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-xs text-blue-600 mb-2 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Reports To
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-blue-200">
                        <AvatarFallback className="bg-blue-600 text-white font-semibold">
                          {manager.first_name?.[0]}{manager.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {manager.first_name} {manager.last_name}
                        </p>
                        <p className="text-xs text-slate-600">{manager.job_title}</p>
                        <p className="text-xs text-slate-500">{manager.department}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {subordinates && subordinates.length > 0 && (
                <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-xs text-emerald-600 mb-3 font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Direct Reports ({subordinates.length})
                    </p>
                    <div className="grid gap-2">
                      {subordinates.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 p-2 bg-white rounded-lg hover:shadow-md transition-shadow">
                          <Avatar className="w-10 h-10 border-2 border-emerald-100">
                            <AvatarFallback className="bg-emerald-600 text-white text-xs font-semibold">
                              {sub.first_name?.[0]}{sub.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900">
                              {sub.first_name} {sub.last_name}
                            </p>
                            <p className="text-xs text-slate-600">{sub.job_title}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {sub.department}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!manager && (!subordinates || subordinates.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                  No reporting relationships
                </p>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5 text-emerald-600" />
                Emergency Contact
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <InfoItem
                  icon={User}
                  label="Contact Name"
                  value={employee.emergency_contact_name}
                  color="text-red-600"
                />
                <InfoItem
                  icon={Phone}
                  label="Contact Phone"
                  value={employee.emergency_contact_phone}
                  color="text-red-600"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}