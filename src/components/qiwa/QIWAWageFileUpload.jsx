import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function QIWAWageFileUpload({ companies }) {
  const { language } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === 'ar' ? 'رفع ملفات الأجور' : 'Wage File Upload'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 mb-4">
            {language === 'ar' 
              ? 'اسحب وأفلت ملف الأجور هنا، أو انقر للاستعراض' 
              : 'Drag and drop wage file here, or click to browse'}
          </p>
          <Button variant="outline">
            {language === 'ar' ? 'اختر ملف' : 'Choose File'}
          </Button>
        </div>

        <div className="text-sm text-slate-600 space-y-2">
          <p className="font-semibold">{language === 'ar' ? 'متطلبات الملف:' : 'File Requirements:'}</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>{language === 'ar' ? 'تنسيق: Excel (.xlsx) أو CSV' : 'Format: Excel (.xlsx) or CSV'}</li>
            <li>{language === 'ar' ? 'يجب أن يحتوي على: رقم الإقامة، الاسم، الراتب الأساسي، البدلات' : 'Must include: Iqama number, name, basic salary, allowances'}</li>
            <li>{language === 'ar' ? 'الحد الأقصى لحجم الملف: 10 ميجابايت' : 'Max file size: 10MB'}</li>
          </ul>
        </div>

        <Button className="w-full" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'تنزيل القالب' : 'Download Template'}
        </Button>
      </CardContent>
    </Card>
  );
}