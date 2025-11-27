import React from 'react';
import { useTranslation } from '@/components/TranslationContext';
import { FileText, Sparkles } from "lucide-react";
import DocumentGenerator from '../components/documents/DocumentGenerator';

export default function HRDocumentGenerator() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className={isRTL ? 'text-right' : ''}>
        <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'ar' ? 'مولد مستندات الموارد البشرية بالذكاء الاصطناعي' : 'AI HR Document Generator'}
            </h1>
            <p className="text-slate-600">
              {language === 'ar' 
                ? 'إنشاء خطابات العروض والعقود وخطابات إنهاء الخدمة والمزيد باستخدام الذكاء الاصطناعي'
                : 'Generate offer letters, contracts, termination letters, and more using AI'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Badge */}
      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <span className="text-sm text-purple-700 font-medium">
          {language === 'ar' 
            ? 'مدعوم بالذكاء الاصطناعي - يضمن الامتثال القانوني والدقة في جميع المستندات'
            : 'AI-Powered - Ensures legal compliance and accuracy in all documents'}
        </span>
      </div>

      {/* Document Generator Component */}
      <DocumentGenerator />
    </div>
  );
}