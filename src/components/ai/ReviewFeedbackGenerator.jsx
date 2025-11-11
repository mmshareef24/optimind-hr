import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, MessageSquare, Loader2, Star, TrendingUp, TrendingDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ReviewFeedbackGenerator({ employees, goals }) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('');
  const [ratings, setRatings] = useState({
    quality: 3,
    productivity: 3,
    communication: 3,
    teamwork: 3,
    initiative: 3,
    problem_solving: 3,
    reliability: 3,
    leadership: 3
  });
  const [achievements, setAchievements] = useState('');
  const [improvements, setImprovements] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const ratingCategories = [
    { key: 'quality', label: 'Quality of Work', icon: Star },
    { key: 'productivity', label: 'Productivity', icon: TrendingUp },
    { key: 'communication', label: 'Communication', icon: MessageSquare },
    { key: 'teamwork', label: 'Teamwork & Collaboration', icon: Star },
    { key: 'initiative', label: 'Initiative & Proactivity', icon: TrendingUp },
    { key: 'problem_solving', label: 'Problem Solving', icon: Star },
    { key: 'reliability', label: 'Reliability', icon: Star },
    { key: 'leadership', label: 'Leadership', icon: TrendingUp }
  ];

  const getRatingLabel = (value) => {
    const labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
    return labels[value - 1];
  };

  const getRatingColor = (value) => {
    if (value <= 2) return 'text-red-600';
    if (value === 3) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    setIsGenerating(true);
    try {
      // Get employee's goals
      const employeeGoals = goals.filter(g => g.employee_id === selectedEmployee);
      const goalsText = employeeGoals.length > 0 
        ? `Goals:\n${employeeGoals.map(g => `- ${g.title}: ${g.progress || 0}% complete`).join('\n')}`
        : '';

      const ratingsText = Object.entries(ratings)
        .map(([key, value]) => {
          const category = ratingCategories.find(c => c.key === key);
          return `${category?.label}: ${value}/5 (${getRatingLabel(value)})`;
        })
        .join('\n');

      const avgRating = (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length).toFixed(1);

      const prompt = `You are an expert HR professional writing a performance review. Generate comprehensive, constructive, and professional feedback for:

Employee: ${employee.first_name} ${employee.last_name}
Position: ${employee.job_title}
Department: ${employee.department}
Review Period: ${reviewPeriod || 'Current Period'}

Performance Ratings (Scale 1-5):
${ratingsText}

Overall Average Rating: ${avgRating}/5

${goalsText}

Key Achievements & Strengths:
${achievements || 'To be discussed during review'}

Areas for Improvement:
${improvements || 'To be discussed during review'}

Please generate:
1. A comprehensive performance summary (2-3 paragraphs) that:
   - Acknowledges strengths and achievements
   - Discusses performance across all rated dimensions
   - Provides specific, actionable feedback for improvement areas
   - Maintains a balanced, constructive tone
   - References goals and their progress when relevant

2. 3-5 Specific Recommendations for the next review period

3. A concluding statement about overall performance and future potential

Make the feedback professional, specific, actionable, and encouraging while being honest about areas needing improvement.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setFeedback(response);
      toast.success('Review feedback generated successfully!');
    } catch (error) {
      toast.error('Failed to generate feedback: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(feedback);
    toast.success('Feedback copied to clipboard');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <MessageSquare className="w-5 h-5" />
              Review Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select employee" />
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
              <Label>Review Period</Label>
              <Input
                value={reviewPeriod}
                onChange={(e) => setReviewPeriod(e.target.value)}
                placeholder="e.g., Q1 2024, January-March 2024"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Key Achievements & Strengths (Optional)</Label>
              <Textarea
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="List notable achievements, successes, and demonstrated strengths..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Areas for Improvement (Optional)</Label>
              <Textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="List areas where improvement is needed or challenges faced..."
                rows={4}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Star className="w-5 h-5" />
              Performance Ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {ratingCategories.map((category) => (
              <div key={category.key}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">{category.label}</Label>
                  <span className={`font-bold ${getRatingColor(ratings[category.key])}`}>
                    {ratings[category.key]}/5 - {getRatingLabel(ratings[category.key])}
                  </span>
                </div>
                <Slider
                  value={[ratings[category.key]]}
                  onValueChange={(value) => setRatings({ ...ratings, [category.key]: value[0] })}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <span className="font-semibold text-slate-700">Overall Average:</span>
                <span className="text-2xl font-bold text-purple-600">
                  {(Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length).toFixed(1)}/5
                </span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedEmployee}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Feedback...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Review Feedback
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Feedback */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardTitle className="flex items-center justify-between text-emerald-900">
            <span className="flex items-center gap-2">
              📋 Generated Feedback
            </span>
            {feedback && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {feedback ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-inner">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {feedback}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">Your AI-generated review feedback will appear here</p>
              <p className="text-sm text-slate-400">Fill in the employee details, ratings, and click Generate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}