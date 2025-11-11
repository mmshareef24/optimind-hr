import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Target, Loader2, CheckCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function GoalAssistant({ employees }) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('individual');
  const [context, setContext] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [generatedGoal, setGeneratedGoal] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    { value: 'individual', label: 'Individual Performance' },
    { value: 'team', label: 'Team Collaboration' },
    { value: 'organizational', label: 'Organizational Impact' },
    { value: 'development', label: 'Professional Development' },
    { value: 'technical', label: 'Technical Skills' },
    { value: 'leadership', label: 'Leadership & Management' }
  ];

  const handleGenerate = async () => {
    if (!goalTitle.trim()) {
      toast.error('Please provide a goal title');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);

    setIsGenerating(true);
    try {
      const prompt = `You are an expert in performance management and goal setting. Generate a comprehensive SMART goal based on:

Goal Title/Topic: ${goalTitle}
${employee ? `Employee: ${employee.first_name} ${employee.last_name} - ${employee.job_title} (${employee.department})` : 'General Goal'}
Category: ${categories.find(c => c.value === goalCategory)?.label}
Timeframe: ${timeframe || 'To be determined'}
Additional Context: ${context || 'None provided'}

Please generate:

1. **SMART Goal Description** (2-3 sentences)
   - Make it Specific, Measurable, Achievable, Relevant, and Time-bound
   - Clear and actionable

2. **Success Criteria** (3-5 bullet points)
   - Concrete, measurable outcomes
   - Clear indicators of success

3. **Key Performance Indicators (KPIs)** (2-3 metrics)
   - Quantifiable metrics to track progress
   - Include target values if applicable

4. **Action Steps** (4-6 steps)
   - Specific actions to achieve the goal
   - Prioritized and sequential

5. **Potential Challenges & Mitigation** (2-3 points)
   - Anticipated obstacles
   - Strategies to overcome them

6. **Required Resources/Support**
   - What the employee needs to succeed

Format the output in a clear, structured way with these sections.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedGoal({
        content: response,
        metadata: {
          title: goalTitle,
          category: goalCategory,
          employee: employee ? `${employee.first_name} ${employee.last_name}` : null,
          timeframe: timeframe
        }
      });
      toast.success('Goal description generated successfully!');
    } catch (error) {
      toast.error('Failed to generate goal: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedGoal) return;
    const textToCopy = `${generatedGoal.metadata.title}\n\n${generatedGoal.content}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('Goal copied to clipboard');
  };

  const handleGenerateAnother = () => {
    setGeneratedGoal(null);
    setGoalTitle('');
    setContext('');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-amber-100">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Target className="w-5 h-5" />
            Goal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Employee (Optional)</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select employee or leave empty for general goal" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Goal Title/Topic *</Label>
            <Input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g., Improve customer satisfaction, Complete certification, Increase sales"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Goal Category</Label>
            <Select value={goalCategory} onValueChange={setGoalCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Timeframe</Label>
            <Input
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="e.g., Q2 2024, Next 6 months, By December 2024"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Additional Context (Optional)</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide any additional details, current situation, specific targets, or constraints..."
              rows={6}
              className="mt-2"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Will Generate:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✓ SMART goal description</li>
              <li>✓ Clear success criteria</li>
              <li>✓ Measurable KPIs</li>
              <li>✓ Action steps</li>
              <li>✓ Challenges & solutions</li>
            </ul>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !goalTitle.trim()}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating SMART Goal...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Goal Description
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Goal */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardTitle className="flex items-center justify-between text-emerald-900">
            <span className="flex items-center gap-2">
              🎯 Generated Goal
            </span>
            {generatedGoal && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAnother}
                >
                  <Target className="w-4 h-4 mr-2" />
                  New Goal
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {generatedGoal ? (
            <div className="space-y-4">
              {/* Goal Metadata */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {generatedGoal.metadata.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-600 text-white">
                    {categories.find(c => c.value === generatedGoal.metadata.category)?.label}
                  </Badge>
                  {generatedGoal.metadata.employee && (
                    <Badge variant="outline">
                      {generatedGoal.metadata.employee}
                    </Badge>
                  )}
                  {generatedGoal.metadata.timeframe && (
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      {generatedGoal.metadata.timeframe}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Goal Content */}
              <div className="prose prose-sm max-w-none">
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-inner">
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {generatedGoal.content}
                  </div>
                </div>
              </div>

              {/* SMART Badge */}
              <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-slate-700">
                  ✓ SMART Goal: Specific • Measurable • Achievable • Relevant • Time-bound
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">Your AI-generated goal will appear here</p>
              <p className="text-sm text-slate-400">Provide goal details and click Generate Goal Description</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}