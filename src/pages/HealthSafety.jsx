import React from "react";
import { useTranslation } from '@/components/TranslationContext';
import { Shield } from "lucide-react";

export default function HealthSafety() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 lg:p-8">
      <div className={`max-w-4xl mx-auto text-center py-20 ${isRTL ? 'text-right' : ''}`}>
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('health_safety')}</h1>
        <p className="text-xl text-slate-600 mb-8">{t('health_safety_desc')}</p>
      </div>
    </div>
  );
}