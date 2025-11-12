import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Info } from "lucide-react";

export default function LeavePolicy() {
  const policies = [
    {
      type: 'annual',
      name: 'Annual Leave',
      emoji: '🏖️',
      entitlement: '21 days per year',
      rules: [
        'Employees are entitled to 21 days of paid annual leave per year after completing one year of service',
        'Leave days can be carried forward to next year up to a maximum of 10 days',
        'Leave requests should be submitted at least 2 weeks in advance',
        'Manager approval is required for all annual leave requests'
      ],
      color: 'blue'
    },
    {
      type: 'sick',
      name: 'Sick Leave',
      emoji: '🏥',
      entitlement: '30 days per year (first 3 days unpaid)',
      rules: [
        'First 30 days are paid at 100% of salary',
        'Days 31-60 are paid at 75% of salary',
        'Medical certificate required for absences exceeding 3 days',
        'Notification to manager required on first day of absence',
        'Chronic illness requires medical documentation'
      ],
      color: 'red'
    },
    {
      type: 'maternity',
      name: 'Maternity Leave',
      emoji: '👶',
      entitlement: '10 weeks (70 days)',
      rules: [
        'Female employees are entitled to 10 weeks of fully paid maternity leave',
        'Can be taken before or after delivery',
        'Medical certificate required',
        'Additional unpaid leave may be requested',
        'Protected from termination during maternity leave'
      ],
      color: 'pink'
    },
    {
      type: 'paternity',
      name: 'Paternity Leave',
      emoji: '👨‍👧',
      entitlement: '3 days',
      rules: [
        'Male employees are entitled to 3 days of paid paternity leave',
        'Must be taken within 30 days of child birth',
        'Birth certificate may be required as proof',
        'Can be extended with manager approval'
      ],
      color: 'purple'
    },
    {
      type: 'hajj',
      name: 'Hajj Leave',
      emoji: '🕋',
      entitlement: '10 days (once in employment)',
      rules: [
        'Granted once during the entire period of employment',
        'Fully paid leave',
        'Must provide Hajj permit/visa as proof',
        'Should be requested at least 30 days in advance',
        'Subject to business needs and approval'
      ],
      color: 'emerald'
    },
    {
      type: 'marriage',
      name: 'Marriage Leave',
      emoji: '💍',
      entitlement: '5 days',
      rules: [
        'Employees are entitled to 5 days of paid leave for marriage',
        'Must be taken at the time of marriage',
        'Marriage certificate required as proof',
        'Can be combined with annual leave with approval'
      ],
      color: 'amber'
    },
    {
      type: 'bereavement',
      name: 'Bereavement Leave',
      emoji: '🕊️',
      entitlement: '5 days',
      rules: [
        '5 days for immediate family members (parent, spouse, child, sibling)',
        '3 days for extended family members',
        'Death certificate may be required',
        'Additional unpaid leave can be requested',
        'Immediate leave approval in emergency cases'
      ],
      color: 'slate'
    },
    {
      type: 'emergency',
      name: 'Emergency Leave',
      emoji: '🚨',
      entitlement: 'Up to 3 days',
      rules: [
        'For urgent personal or family emergencies',
        'Manager approval required',
        'Documentation may be required',
        'Can be unpaid or deducted from annual leave balance'
      ],
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    slate: 'from-slate-500 to-slate-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Saudi Arabia Labor Law Compliance</h3>
              <p className="text-sm text-blue-800">
                All leave policies are designed to comply with Saudi Arabian Labor Law. 
                Employees are encouraged to review these policies carefully before submitting leave requests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {policies.map((policy) => (
          <Card key={policy.type} className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[policy.color]} flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{policy.emoji}</span>
                </div>
                <div>
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                  <Badge className={`mt-1 bg-${policy.color}-100 text-${policy.color}-700`}>
                    {policy.entitlement}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {policy.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700">{rule}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            General Leave Guidelines
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm">📋 Request Process</h4>
              <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                <li>Submit requests through the ESS portal</li>
                <li>Include detailed reason for leave</li>
                <li>Attach supporting documents if required</li>
                <li>Check leave balance before submitting</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm">✅ Approval Workflow</h4>
              <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                <li>Direct manager reviews and approves/rejects</li>
                <li>HR department provides final approval</li>
                <li>Employees receive email notifications</li>
                <li>Approved leaves appear in calendar</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm">📅 Important Notes</h4>
              <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                <li>Weekends (Fri-Sat) excluded from leave count</li>
                <li>Public holidays don't count as leave days</li>
                <li>Emergency requests may bypass notice period</li>
                <li>Balance carries forward per company policy</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm">⚠️ Restrictions</h4>
              <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                <li>No overlapping leave requests allowed</li>
                <li>Minimum 2 weeks notice for annual leave</li>
                <li>Cannot exceed available balance</li>
                <li>Blackout periods may apply during peak season</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}