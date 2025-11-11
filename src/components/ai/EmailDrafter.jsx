import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, RefreshCw, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function EmailDrafter({ employees }) {
  const [emailType, setEmailType] = useState('policy_update');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const emailTypes = [
    { value: 'policy_update', label: 'Policy Update Announcement' },
    { value: 'leave_approval', label: 'Leave Request Approval' },
    { value: 'leave_rejection', label: 'Leave Request Rejection' },
    { value: 'payroll_notification', label: 'Payroll Notification' },
    { value: 'performance_review', label: 'Performance Review Invitation' },
    { value: 'goal_setting', label: 'Goal Setting Reminder' },
    { value: 'onboarding', label: 'New Employee Welcome' },
    { value: 'birthday_wishes', label: 'Birthday Wishes' },
    { value: 'work_anniversary', label: 'Work Anniversary' },
    { value: 'general', label: 'General Communication' }
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly & Warm' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'enthusiastic', label: 'Enthusiastic' }
  ];

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error('Please provide some context for the email');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedEmployee = employees.find(e => e.id === recipient);
      const employeeName = selectedEmployee 
        ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
        : 'the recipient';

      const prompt = `You are an expert HR communication specialist. Draft a ${tone} email for the following:

Email Type: ${emailTypes.find(t => t.value === emailType)?.label}
Subject: ${subject || 'To be determined'}
Recipient: ${employeeName}
Context/Details: ${context}

Please generate:
1. A compelling subject line (if not provided)
2. A well-structured email body with proper greeting, main content, and closing
3. Maintain a ${tone} tone throughout
4. Keep it concise yet comprehensive
5. Include appropriate Saudi Arabian workplace context if relevant

Format the output as:
Subject: [subject line]

[email body]`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedEmail(response);
      toast.success('Email drafted successfully!');
    } catch (error) {
      toast.error('Failed to generate email: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast.success('Email copied to clipboard');
  };

  const handleSend = async () => {
    if (!recipient || !generatedEmail) {
      toast.error('Please select a recipient and generate an email first');
      return;
    }

    const selectedEmployee = employees.find(e => e.id === recipient);
    if (!selectedEmployee?.email) {
      toast.error('Selected employee does not have an email address');
      return;
    }

    setIsSending(true);
    try {
      // Extract subject and body from generated email
      const lines = generatedEmail.split('\n');
      const subjectLine = lines.find(l => l.startsWith('Subject:'))?.replace('Subject:', '').trim() || subject;
      const bodyStartIndex = lines.findIndex(l => l.startsWith('Subject:')) + 1;
      const body = lines.slice(bodyStartIndex).join('\n').trim();

      await base44.integrations.Core.SendEmail({
        to: selectedEmployee.email,
        subject: subjectLine,
        body: body
      });

      toast.success(`Email sent to ${selectedEmployee.first_name} ${selectedEmployee.last_name}`);
    } catch (error) {
      toast.error('Failed to send email: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-5 h-5" />
            Email Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Email Type</Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emailTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Recipient (Optional)</Label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select employee or leave empty for general" />
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
            <Label>Subject (Optional)</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="AI will suggest if left empty"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Context & Details *</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide details about what the email should communicate. For example:&#10;- Announce new remote work policy&#10;- Approve 5 days annual leave from June 1-5&#10;- Notify about salary credit for June 2024&#10;- Invite for Q2 performance review meeting"
              rows={8}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              Be specific about dates, amounts, reasons, or any relevant details
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !context.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Email */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardTitle className="flex items-center justify-between text-emerald-900">
            <span className="flex items-center gap-2">
              📧 Generated Email
            </span>
            {generatedEmail && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                {recipient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSend}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {generatedEmail ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-inner">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                  {generatedEmail}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">Your AI-generated email will appear here</p>
              <p className="text-sm text-slate-400">Fill in the details and click Generate Email</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}