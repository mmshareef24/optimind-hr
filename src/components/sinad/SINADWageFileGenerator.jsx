import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from '@/components/TranslationContext';
import { format } from "date-fns";

export default function SINADWageFileGenerator({ companies, payrolls }) {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    company_id: '',
    submission_month: format(new Date(), 'yyyy-MM'),
    payment_date: '',
    bank_name: ''
  });

  const generateMutation = useMutation({
    mutationFn: (data) => base44.entities.SINADRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sinad-records']);
      toast.success('SINAD wage file generated successfully');
    },
    onError: () => toast.error('Failed to generate wage file')
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    
    // Calculate totals from payrolls
    const monthPayrolls = payrolls.filter(p => p.month === formData.submission_month);
    const totalWages = monthPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
    
    const data = {
      ...formData,
      total_employees: monthPayrolls.length,
      total_wages: totalWages,
      status: 'generated',
      submission_date: new Date().toISOString().split('T')[0]
    };

    generateMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === 'ar' ? 'إنشاء ملف أجور سند' : 'Generate SINAD Wage File'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Company *</Label>
              <Select value={formData.company_id} onValueChange={(val) => setFormData({...formData, company_id: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Month *</Label>
              <Input
                type="month"
                value={formData.submission_month}
                onChange={(e) => setFormData({...formData, submission_month: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Bank Name</Label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                placeholder="e.g., Al Rajhi Bank"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            <FileText className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'إنشاء ملف الأجور' : 'Generate Wage File'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}