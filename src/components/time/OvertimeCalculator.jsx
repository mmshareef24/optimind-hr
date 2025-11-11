import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp } from "lucide-react";

/**
 * Overtime Calculation as per Saudi Labor Law
 * 
 * Regular Working Hours:
 * - 8 hours/day, 48 hours/week (6 days)
 * - During Ramadan: 6 hours/day, 36 hours/week
 * 
 * Overtime Rules:
 * - Overtime Rate: 150% of regular hourly rate (time and a half)
 * - Maximum: 720 hours per year (average 60 hours/month)
 * - Weekly rest: At least 1 day (usually Friday)
 * 
 * Friday/Holiday Work:
 * - If worked on rest day: 150% + compensatory day off
 */

export const calculateOvertimePay = (basicSalary, overtimeHours, workingDaysInMonth = 30) => {
  // Calculate hourly rate based on basic salary
  const hoursPerDay = 8;
  const totalWorkingHours = workingDaysInMonth * hoursPerDay;
  const hourlyRate = basicSalary / totalWorkingHours;
  
  // Overtime rate is 150% (1.5x) of regular hourly rate
  const overtimeRate = hourlyRate * 1.5;
  const overtimePay = overtimeHours * overtimeRate;
  
  return {
    hourlyRate: parseFloat(hourlyRate.toFixed(2)),
    overtimeRate: parseFloat(overtimeRate.toFixed(2)),
    overtimePay: parseFloat(overtimePay.toFixed(2)),
    totalHours: overtimeHours
  };
};

export default function OvertimeCalculator({ employee, overtimeHours, month }) {
  const basicSalary = employee?.basic_salary || 0;
  const overtimeDetails = calculateOvertimePay(basicSalary, overtimeHours);
  
  // Check if overtime exceeds recommended limits
  const monthlyLimit = 60;
  const isExceedingLimit = overtimeHours > monthlyLimit;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Overtime Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Calculation Details */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Regular Hourly Rate</span>
                <span className="font-semibold text-slate-900">
                  {overtimeDetails.hourlyRate.toLocaleString()} SAR/hour
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Overtime Rate (150%)</span>
                <span className="font-semibold text-blue-600">
                  {overtimeDetails.overtimeRate.toLocaleString()} SAR/hour
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-blue-100 pt-3">
                <span className="text-slate-600">Total Overtime Hours</span>
                <span className="font-bold text-slate-900">{overtimeHours.toFixed(2)} hours</span>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-3 mt-3">
                <span className="font-semibold text-slate-900">Overtime Payment</span>
                <span className="font-bold text-xl text-blue-600">
                  {overtimeDetails.overtimePay.toLocaleString()} SAR
                </span>
              </div>
            </div>
          </div>

          {/* Warning if exceeding limits */}
          {isExceedingLimit && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 mb-1">Overtime Limit Warning</p>
                <p className="text-amber-700">
                  This employee has exceeded the recommended monthly overtime limit of {monthlyLimit} hours. 
                  Saudi Labor Law allows maximum 720 hours per year (avg. 60 hours/month).
                </p>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Saudi Labor Law:</strong> Overtime is calculated at 150% of the regular hourly rate. 
              Regular working hours are 8 hours/day, 48 hours/week. Maximum overtime is 720 hours per year.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}