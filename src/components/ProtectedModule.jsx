import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useAccessControl } from './AccessControlContext';
import { useTranslation } from './TranslationContext';

export default function ProtectedModule({ moduleName, children, fallback }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const { hasModuleAccess, isLoading } = useAccessControl();

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const hasAccess = hasModuleAccess(moduleName);

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="p-6 lg:p-8">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">{t('access_denied')}</h2>
            <p className="text-red-700 mb-4">
              You don't have permission to access this module.
            </p>
            <div className={`flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left ${isRTL ? 'text-right' : ''}`}>
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Need Access?</p>
                <p>Contact your system administrator to request access to the <strong>{moduleName}</strong> module.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}