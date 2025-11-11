import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Mail, FileText, MessageSquare, Target, TrendingUp, Users, FileCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "../components/hrms/StatCard";
import EmailDrafter from "../components/ai/EmailDrafter";
import PolicySummarizer from "../components/ai/PolicySummarizer";
import ReviewFeedbackGenerator from "../components/ai/ReviewFeedbackGenerator";
import GoalAssistant from "../components/ai/GoalAssistant";

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('email');

  // Fetch data for context
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['policies'],
    queryFn: () => base44.entities.CompanyPolicy.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.PerformanceReview?.list() || [],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.PerformanceGoal?.list() || [],
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
          </div>
          <p className="text-slate-600">Your intelligent HR companion for drafting, summarizing, and generating content</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Employees"
          value={employees.length}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Policies"
          value={policies.filter(p => p.is_active).length}
          icon={FileText}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Goals"
          value={goals.length}
          icon={Target}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Reviews"
          value={reviews.length}
          icon={FileCheck}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Info Card */}
      <Card className="border-0 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                ✨ AI-Powered HR Assistant
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Our AI assistant helps you draft professional communications, summarize complex documents, 
                generate meaningful performance feedback, and create SMART goals. Simply provide the context 
                or data, and let AI do the heavy lifting while maintaining your organization's tone and standards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 p-1 h-auto">
          <TabsTrigger
            value="email"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white flex flex-col sm:flex-row items-center gap-2 py-3"
          >
            <Mail className="w-4 h-4" />
            <span>Draft Emails</span>
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white flex flex-col sm:flex-row items-center gap-2 py-3"
          >
            <FileText className="w-4 h-4" />
            <span>Summarize</span>
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white flex flex-col sm:flex-row items-center gap-2 py-3"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Review Feedback</span>
          </TabsTrigger>
          <TabsTrigger
            value="goal"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-700 data-[state=active]:text-white flex flex-col sm:flex-row items-center gap-2 py-3"
          >
            <Target className="w-4 h-4" />
            <span>Goal Descriptions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <EmailDrafter employees={employees} />
        </TabsContent>

        <TabsContent value="policy" className="mt-6">
          <PolicySummarizer policies={policies} />
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          <ReviewFeedbackGenerator employees={employees} goals={goals} />
        </TabsContent>

        <TabsContent value="goal" className="mt-6">
          <GoalAssistant employees={employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}