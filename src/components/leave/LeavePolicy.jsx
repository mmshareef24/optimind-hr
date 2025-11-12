import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LeavePolicy() {
  const policies = [
    {
      type: 'Annual Leave',
      icon: '🏖️',
      color: 'from-blue-500 to-blue-600',
      entitlement: '21 days per year',
      rules: [
        'Earned after completing one year of service',
        'Can be carried forward to the next year (max 30 days accumulated)',
        'Must be taken within 6 months of entitlement',
        'Employer determines timing, considering business needs',
        'Cannot be replaced by compensation except upon end of service'
      ]
    },
    {
      type: 'Sick Leave',
      icon: '🏥',
      color: 'from-red-500 to-red-600',
      entitlement: '30 days per year',
      rules: [
        'First 30 days: Full pay',
        'Next 60 days: 75% of wage',
        'Following 30 days: No pay',
        'Medical certificate required after 3 consecutive days',
        'Total sick leave cannot exceed 120 days per year',
        'Includes work-related injuries and illnesses'
      ]
    },
    {
      type: 'Maternity Leave',
      icon: '👶',
      color: 'from-pink-500 to-pink-600',
      entitlement: '10 weeks (70 days)',
      rules: [
        'Fully paid by employer',
        'Can be taken before or after delivery',
        'Must provide medical certificate',
        'Additional unpaid leave available if needed for health reasons',
        'Protection from dismissal during pregnancy and maternity leave'
      ]
    },
    {
      type: 'Paternity Leave',
      icon: '👨‍👧',
      color: 'from-purple-500 to-purple-600',
      entitlement: '3 days',
      rules: [
        'Fully paid',
        'Must be taken within one week of child birth',
        'Applicable for childbirth only',
        'Birth certificate may be required'
      ]
    },
    {
      type: 'Hajj Leave',
      icon: '🕋',
      color: 'from-emerald-500 to-emerald-600',
      entitlement: '10 days (once in employment)',
      rules: [
        'Granted once during entire service period',
        'Unpaid leave',
        'Must provide proof of Hajj visa/permit',
        'Timing subject to employer approval',
        'Does not count towards annual leave entitlement'
      ]
    },
    {
      type: 'Marriage Leave',
      icon: '💍',
      color: 'from-amber-500 to-amber-600',
      entitlement: '5 days',
      rules: [
        'Fully paid',
        'Granted once during service period',
        'Marriage certificate required',
        'Should be taken around marriage date',
        'Not deducted from annual leave'
      ]
    },
    {
      type: 'Bereavement Leave',
      icon: '🕊️',
      color: 'from-slate-500 to-slate-600',
      entitlement: '5 days',
      rules: [
        'Fully paid',
        'For death of spouse: 15 days for Muslim women (Iddah period)',
        'For death of family members: up to 5 days',
        'Death certificate may be required',
        'Additional unpaid leave may be granted'
      ]
    },
    {
      type: 'Emergency Leave',
      icon: '🚨',
      color: 'from-orange-500 to-orange-600',
      entitlement: 'As per company policy',
      rules: [
        'Granted for urgent personal matters',
        'Subject to manager approval',
        'May be paid or unpaid based on circumstances',
        'Valid reason and documentation required',
        'Should not exceed reasonable duration'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Leave Policies</h2>
              <p className="text-slate-600 mb-4">
                Comprehensive guide to leave entitlements as per Saudi Arabia Labor Law
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-100 text-emerald-700">Saudi Labor Law Compliant</Badge>
                <Badge className="bg-blue-100 text-blue-700">Updated 2024</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Important:</strong> All leave policies follow Saudi Arabia Labor Law regulations. 
          Some benefits may vary based on your employment contract and company policy.
        </AlertDescription>
      </Alert>

      {/* Policy Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {policies.map((policy, index) => (
          <Card key={index} className="border-2 border-slate-200 hover:shadow-xl transition-all">
            <CardHeader className={`bg-gradient-to-r ${policy.color} text-white rounded-t-lg`}>
              <CardTitle className="flex items-center gap-3">
                <span className="text-3xl">{policy.icon}</span>
                <div>
                  <h3 className="text-xl font-bold">{policy.type}</h3>
                  <p className="text-sm font-medium opacity-90">{policy.entitlement}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {policy.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* General Guidelines */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <AlertCircle className="w-6 h-6" />
            General Leave Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Leave Request Process
              </h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>Submit request through ESS portal with valid reason</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>Manager reviews and approves/rejects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>HR processes approved requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Leave balance automatically updated</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Important Notes
              </h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Friday and Saturday are official weekends (not counted)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Public holidays are not deducted from leave balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Leave must be approved before starting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Advance notice recommended (minimum 3-7 days)</span>
                </li>
              </ul>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>Restrictions:</strong> You cannot submit overlapping leave requests. 
              Emergency situations may be handled on a case-by-case basis with proper documentation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-white">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Need Assistance?</h3>
            <p className="text-slate-600 mb-4">
              For questions about leave policies or special circumstances, please contact:
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <div>
                <p className="font-semibold text-slate-900">HR Department</p>
                <p className="text-slate-600">hr@company.com</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <p className="font-semibold text-slate-900">Your Manager</p>
                <p className="text-slate-600">For leave approvals</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}