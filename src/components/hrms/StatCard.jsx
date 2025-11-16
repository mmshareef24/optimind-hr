import React from 'react';
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, trend, trendValue, bgColor = "from-red-700 to-red-800" }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div className={`w-full h-full bg-gradient-to-br ${bgColor} rounded-full transform translate-x-12 -translate-y-12`} />
      </div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${bgColor} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <ArrowUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendValue}
            </span>
            <span className="text-sm text-slate-500">vs last month</span>
          </div>
        )}
      </div>
    </Card>
  );
}