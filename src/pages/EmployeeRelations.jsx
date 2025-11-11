import React from "react";
import { MessageSquare } from "lucide-react";

export default function EmployeeRelations() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Employee Relations</h1>
        <p className="text-xl text-slate-600 mb-8">Handle grievances and employee communications</p>
      </div>
    </div>
  );
}