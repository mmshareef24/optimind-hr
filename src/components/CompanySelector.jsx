import React from 'react';
import { Building2, Filter } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useAccessControl } from './AccessControlContext';
import { useTranslation } from './TranslationContext';

export default function CompanySelector({ className = "" }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const { selectedCompanyId, changeSelectedCompany, accessibleCompanies, isAdmin } = useAccessControl();

  // Don't show if user only has access to one company
  if (accessibleCompanies.length <= 1 && !isAdmin) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 min-w-[280px] ${isRTL ? 'flex-row-reverse' : ''} ${className}`}>
      <Filter className="w-5 h-5 text-slate-400" />
      <Select value={selectedCompanyId} onValueChange={changeSelectedCompany}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={t('select_company')} />
        </SelectTrigger>
        <SelectContent>
          {(isAdmin || accessibleCompanies.length > 1) && (
            <SelectItem value="all">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Building2 className="w-4 h-4" />
                <span>{t('all_companies')}</span>
              </div>
            </SelectItem>
          )}
          {accessibleCompanies.map(company => (
            <SelectItem key={company.id} value={company.id}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Building2 className="w-4 h-4" />
                <span>{company.name_en}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}