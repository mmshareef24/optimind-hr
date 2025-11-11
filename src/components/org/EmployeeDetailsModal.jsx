import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, Phone, Calendar, Briefcase, User, CreditCard, 
  MapPin, Flag, Edit, Users, TrendingUp
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold text-2xl">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-slate-600 mb-2">{employee.job_title}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
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
                  <Badge variant="outline">
                    {employee.employment_type.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={() => onEdit(employee)} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
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
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
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
                icon={Users}
                label="Department"
                value={employee.department}
                color="text-emerald-600"
              />
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
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
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
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

          {/* Organizational Hierarchy */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Organizational Hierarchy
            </h3>
            <div className="space-y-3">
              {manager && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-slate-500 mb-1">Reports To</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {manager.first_name?.[0]}{manager.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {manager.first_name} {manager.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{manager.job_title}</p>
                    </div>
                  </div>
                </div>
              )}

              {subordinates && subordinates.length > 0 && (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-slate-500 mb-2">
                    Direct Reports ({subordinates.length})
                  </p>
                  <div className="space-y-2">
                    {subordinates.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 p-2 bg-white rounded">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-emerald-600 text-white text-xs">
                            {sub.first_name?.[0]}{sub.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-900">
                            {sub.first_name} {sub.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{sub.job_title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!manager && (!subordinates || subordinates.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No reporting relationships
                </p>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
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