import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Sparkles, Download, Send, Check, Loader2, 
  AlertCircle, Eye, Edit, RefreshCw, Copy, Printer
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

const DOCUMENT_TYPES = [
  { value: 'offer_letter', label: 'Offer Letter', icon: '📧' },
  { value: 'employment_contract', label: 'Employment Contract', icon: '📝' },
  { value: 'termination_letter', label: 'Termination Letter', icon: '📤' },
  { value: 'promotion_letter', label: 'Promotion Letter', icon: '🎉' },
  { value: 'salary_revision', label: 'Salary Revision Letter', icon: '💰' },
  { value: 'experience_certificate', label: 'Experience Certificate', icon: '🏆' },
  { value: 'warning_letter', label: 'Warning Letter', icon: '⚠️' },
  { value: 'policy_update', label: 'Policy Update', icon: '📋' }
];

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [additionalData, setAdditionalData] = useState({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [editMode, setEditMode] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-docs'],
    queryFn: () => base44.entities.Employee.list()
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['document-templates'],
    queryFn: () => base44.entities.DocumentTemplate.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-docs'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: generatedDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['generated-documents'],
    queryFn: () => base44.entities.GeneratedDocument.list('-created_date', 20)
  });

  const saveDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.GeneratedDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['generated-documents']);
      toast.success('Document saved successfully');
    }
  });

  const filteredTemplates = templates.filter(t => 
    t.document_type === selectedType && t.status === 'active'
  );

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  const getAdditionalFields = () => {
    const fields = [];
    if (selectedType === 'offer_letter' || selectedType === 'salary_revision') {
      fields.push({ key: 'new_salary', label: 'New Salary (SAR)', type: 'number' });
      fields.push({ key: 'effective_date', label: 'Effective Date', type: 'date' });
    }
    if (selectedType === 'termination_letter') {
      fields.push({ key: 'termination_date', label: 'Termination Date', type: 'date' });
      fields.push({ key: 'termination_reason', label: 'Reason for Termination', type: 'text' });
      fields.push({ key: 'notice_period', label: 'Notice Period (days)', type: 'number' });
    }
    if (selectedType === 'promotion_letter') {
      fields.push({ key: 'new_position', label: 'New Position', type: 'text' });
      fields.push({ key: 'new_salary', label: 'New Salary (SAR)', type: 'number' });
      fields.push({ key: 'effective_date', label: 'Effective Date', type: 'date' });
    }
    if (selectedType === 'warning_letter') {
      fields.push({ key: 'warning_reason', label: 'Reason for Warning', type: 'textarea' });
      fields.push({ key: 'incident_date', label: 'Incident Date', type: 'date' });
    }
    return fields;
  };

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    if (!selectedType) {
      toast.error('Please select a document type');
      return;
    }

    setIsGenerating(true);
    
    const employee = selectedEmployeeData;
    const company = companies.find(c => c.id === employee?.company_id) || companies[0];
    const template = selectedTemplateData;

    const prompt = `Generate a professional HR ${selectedType.replace(/_/g, ' ')} document.

EMPLOYEE INFORMATION:
- Full Name: ${employee?.first_name} ${employee?.last_name}
- Employee ID: ${employee?.employee_id}
- Position: ${employee?.job_title || 'N/A'}
- Department: ${employee?.department || 'N/A'}
- Hire Date: ${employee?.hire_date || 'N/A'}
- Email: ${employee?.email}
- Current Salary: ${employee?.basic_salary || 'N/A'} SAR
- Nationality: ${employee?.nationality || 'N/A'}
- National ID: ${employee?.national_id || 'N/A'}

COMPANY INFORMATION:
- Company Name: ${company?.name_en || 'Company'}
- Company Name (Arabic): ${company?.name_ar || ''}
- CR Number: ${company?.cr_number || 'N/A'}
- Address: ${company?.address || 'N/A'}

ADDITIONAL DETAILS:
${Object.entries(additionalData).map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`).join('\n')}

${template?.content ? `USE THIS TEMPLATE AS A BASE:\n${template.content}` : ''}

REQUIREMENTS:
1. Use formal, professional language appropriate for Saudi Arabia
2. Include today's date: ${new Date().toLocaleDateString('en-GB')}
3. Include all legally required clauses for Saudi labor law compliance
4. Format the document with proper headers, sections, and signature lines
5. Include both English content
6. Add appropriate disclaimers and terms where needed
7. Ensure all monetary values are clearly stated with currency (SAR)

Generate the complete document ready for review and signature.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            document_content: { type: "string" },
            compliance_notes: { type: "string" },
            missing_information: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedContent(response.document_content);
      
      if (response.missing_information?.length > 0) {
        toast.warning(`Note: Some information may be missing: ${response.missing_information.join(', ')}`);
      }
      
      toast.success('Document generated successfully!');
    } catch (error) {
      toast.error('Failed to generate document. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedContent) {
      toast.error('No document to save');
      return;
    }

    saveDocumentMutation.mutate({
      document_name: `${selectedType.replace(/_/g, ' ')} - ${selectedEmployeeData?.first_name} ${selectedEmployeeData?.last_name}`,
      document_type: selectedType,
      template_id: selectedTemplate || null,
      employee_id: selectedEmployee,
      content: generatedContent,
      additional_data: JSON.stringify(additionalData),
      status: 'draft'
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Document copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType}_${selectedEmployeeData?.employee_id || 'document'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Document downloaded');
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!generatedContent) {
      toast.error('No document to download');
      return;
    }

    setIsDownloadingPDF(true);
    try {
      const employee = selectedEmployeeData;
      const company = companies.find(c => c.id === employee?.company_id) || companies[0];

      const response = await base44.functions.invoke('generateDocumentPDF', {
        content: generatedContent,
        companyId: company?.id,
        employeeName: `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim(),
        documentType: selectedType
      });

      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}_${employee?.employee_id || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const employee = selectedEmployeeData;
    const company = companies.find(c => c.id === employee?.company_id) || companies[0];
    
    const cleanContent = generatedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedType?.replace(/_/g, ' ')} - ${employee?.first_name} ${employee?.last_name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .logo { 
            max-width: 150px; 
            max-height: 80px; 
            margin-bottom: 15px; 
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin: 10px 0 5px 0; 
          }
          .company-name-ar { 
            font-size: 20px; 
            margin-bottom: 10px; 
          }
          .company-info { 
            font-size: 12px; 
            color: #666; 
          }
          .content { 
            margin-top: 20px; 
            text-align: justify;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 10px;
            color: #666;
            text-align: center;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${company?.logo_url ? `<img src="${company.logo_url}" class="logo" alt="Company Logo" />` : ''}
          <div class="company-name">${company?.name_en || 'Company'}</div>
          ${company?.name_ar ? `<div class="company-name-ar">${company.name_ar}</div>` : ''}
          <div class="company-info">
            ${company?.address ? company.address + '<br/>' : ''}
            ${[company?.phone, company?.email].filter(Boolean).join(' | ')}<br/>
            ${company?.cr_number ? 'CR: ' + company.cr_number : ''}
          </div>
        </div>
        <div class="content">${cleanContent}</div>
        <div class="footer">
          Generated on ${new Date().toLocaleDateString('en-GB')} | ${company?.name_en || 'Company'}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Document
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="w-4 h-4" />
            Document History
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Edit className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Document Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Type Selection */}
                <div>
                  <Label>Document Type *</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Selection */}
                <div>
                  <Label>Employee *</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Selection (Optional) */}
                {filteredTemplates.length > 0 && (
                  <div>
                    <Label>Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Use default or select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Use AI Default</SelectItem>
                        {filteredTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.template_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Additional Fields */}
                {getAdditionalFields().map(field => (
                  <div key={field.key}>
                    <Label>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={additionalData[field.key] || ''}
                        onChange={(e) => setAdditionalData({...additionalData, [field.key]: e.target.value})}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={additionalData[field.key] || ''}
                        onChange={(e) => setAdditionalData({...additionalData, [field.key]: e.target.value})}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}

                {/* Selected Employee Preview */}
                {selectedEmployeeData && (
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-2">Employee Details</h4>
                      <div className="text-sm space-y-1 text-slate-600">
                        <p><strong>Name:</strong> {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}</p>
                        <p><strong>Position:</strong> {selectedEmployeeData.job_title || 'N/A'}</p>
                        <p><strong>Department:</strong> {selectedEmployeeData.department || 'N/A'}</p>
                        <p><strong>Hire Date:</strong> {selectedEmployeeData.hire_date || 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedType || !selectedEmployee}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Document Preview
                  </CardTitle>
                  {generatedContent && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                        <Edit className="w-4 h-4 mr-1" />
                        {editMode ? 'Preview' : 'Edit'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    {editMode ? (
                      <Textarea
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    ) : (
                      <div className="bg-white border rounded-lg p-6 min-h-[400px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none">
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSave} className="flex-1">
                        <Check className="w-4 h-4 mr-2" />
                        Save as Draft
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={handleDownloadPDF}
                        disabled={isDownloadingPDF}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDownloadingPDF ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        PDF
                      </Button>
                      <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Button variant="outline" onClick={handleGenerate}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                    <FileText className="w-16 h-16 mb-4" />
                    <p>Select document type and employee, then click Generate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Generated Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <p>Loading...</p>
              ) : generatedDocs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p>No documents generated yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generatedDocs.map(doc => {
                    const employee = employees.find(e => e.id === doc.employee_id);
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{doc.document_name}</h4>
                            <p className="text-sm text-slate-500">
                              {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'} • {new Date(doc.created_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                            {doc.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager templates={templates} queryClient={queryClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateManager({ templates, queryClient }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    document_type: '',
    content: '',
    description: '',
    compliance_notes: '',
    language: 'en',
    status: 'active'
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['document-templates']);
      setShowForm(false);
      setFormData({ template_name: '', document_type: '', content: '', description: '', compliance_notes: '', language: 'en', status: 'active' });
      toast.success('Template created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['document-templates']);
      setShowForm(false);
      setEditingTemplate(null);
      toast.success('Template updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['document-templates']);
      toast.success('Template deleted');
    }
  });

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      document_type: template.document_type,
      content: template.content,
      description: template.description || '',
      compliance_notes: template.compliance_notes || '',
      language: template.language || 'en',
      status: template.status || 'active'
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Document Templates</h3>
        <Button onClick={() => { setEditingTemplate(null); setFormData({ template_name: '', document_type: '', content: '', description: '', compliance_notes: '', language: 'en', status: 'active' }); setShowForm(true); }}>
          Add Template
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Template Name *</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                  placeholder="e.g., Standard Offer Letter"
                />
              </div>
              <div>
                <Label>Document Type *</Label>
                <Select value={formData.document_type} onValueChange={(val) => setFormData({...formData, document_type: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="When to use this template"
              />
            </div>
            <div>
              <Label>Template Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Use placeholders like {{employee.first_name}}, {{company.name}}, etc."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Available placeholders: {`{{employee.first_name}}, {{employee.last_name}}, {{employee.job_title}}, {{employee.department}}, {{employee.salary}}, {{company.name}}, {{effective_date}}, etc.`}
              </p>
            </div>
            <div>
              <Label>Compliance Notes</Label>
              <Textarea
                value={formData.compliance_notes}
                onChange={(e) => setFormData({...formData, compliance_notes: e.target.value})}
                placeholder="Legal requirements and compliance notes"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSubmit}>
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingTemplate(null); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{template.template_name}</h4>
                  <p className="text-sm text-slate-500">{template.document_type?.replace(/_/g, ' ')}</p>
                  {template.description && (
                    <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                  )}
                </div>
                <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                  {template.status}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteMutation.mutate(template.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}