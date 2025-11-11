import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, FileText, Loader2, List, AlignLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PolicySummarizer({ policies }) {
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [customText, setCustomText] = useState('');
  const [summaryType, setSummaryType] = useState('brief');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const summaryTypes = [
    { value: 'brief', label: 'Brief Summary (2-3 sentences)', icon: AlignLeft },
    { value: 'detailed', label: 'Detailed Summary (Key points)', icon: List },
    { value: 'bullet', label: 'Bullet Points', icon: List },
    { value: 'employee_friendly', label: 'Employee-Friendly Language', icon: FileText }
  ];

  const handleGenerate = async () => {
    let textToSummarize = customText;

    if (selectedPolicy && !customText) {
      const policy = policies.find(p => p.id === selectedPolicy);
      if (policy) {
        textToSummarize = `Title: ${policy.title}\nCategory: ${policy.category}\n\nContent:\n${policy.content || policy.description || ''}`;
      }
    }

    if (!textToSummarize.trim()) {
      toast.error('Please select a policy or enter custom text to summarize');
      return;
    }

    setIsGenerating(true);
    try {
      let prompt = '';
      
      switch (summaryType) {
        case 'brief':
          prompt = `Provide a brief, concise summary (2-3 sentences) of the following policy/document. Focus on the most important points:\n\n${textToSummarize}`;
          break;
        case 'detailed':
          prompt = `Provide a detailed summary of the following policy/document. Include:
1. Main purpose and scope
2. Key points and requirements
3. Important deadlines or conditions
4. Who it affects

Policy/Document:
${textToSummarize}`;
          break;
        case 'bullet':
          prompt = `Summarize the following policy/document in clear bullet points. Each bullet should capture a key point, requirement, or important detail:

${textToSummarize}`;
          break;
        case 'employee_friendly':
          prompt = `Rewrite the following policy/document in simple, employee-friendly language. Make it easy to understand, conversational, and highlight what employees need to know and do:

${textToSummarize}`;
          break;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setSummary(response);
      toast.success('Summary generated successfully!');
    } catch (error) {
      toast.error('Failed to generate summary: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard');
  };

  const activePolicies = policies.filter(p => p.is_active);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <FileText className="w-5 h-5" />
            Document to Summarize
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Select Existing Policy</Label>
            <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a policy" />
              </SelectTrigger>
              <SelectContent>
                {activePolicies.length === 0 ? (
                  <SelectItem value="none" disabled>No active policies found</SelectItem>
                ) : (
                  activePolicies.map(policy => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.title} - {policy.category}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedPolicy && (
              <div className="mt-2">
                {(() => {
                  const policy = policies.find(p => p.id === selectedPolicy);
                  return policy ? (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {policy.category}
                        </Badge>
                        <span className="text-xs text-slate-500">Version {policy.version}</span>
                      </div>
                      {policy.description && (
                        <p className="text-sm text-slate-600">{policy.description}</p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              OR
            </div>
            <div className="border-t border-slate-200"></div>
          </div>

          <div>
            <Label>Or Enter Custom Text</Label>
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste any policy document, email, or lengthy text that you want to summarize..."
              rows={10}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              {customText.length} characters
            </p>
          </div>

          <div>
            <Label>Summary Type</Label>
            <Select value={summaryType} onValueChange={setSummaryType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {summaryTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!selectedPolicy && !customText.trim())}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="flex items-center justify-between text-blue-900">
            <span className="flex items-center gap-2">
              📝 Generated Summary
            </span>
            {summary && (
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
          {summary ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-inner">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">Your AI-generated summary will appear here</p>
              <p className="text-sm text-slate-400">Select a policy or enter text and click Generate Summary</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}