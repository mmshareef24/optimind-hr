import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BankDetailsTab({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Bank Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Bank Name *</Label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="e.g., Al Rajhi Bank, SNB, etc."
                required
              />
            </div>

            <div>
              <Label>Account Number *</Label>
              <Input
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="Enter bank account number"
                required
              />
            </div>

            <div>
              <Label>IBAN *</Label>
              <Input
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                placeholder="SA00 0000 0000 0000 0000 0000"
                maxLength={29}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Saudi IBAN format: SA followed by 24 digits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Display */}
      {formData.iban && (
        <Card className={`border-2 ${
          formData.iban.startsWith('SA') && formData.iban.length === 26
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CreditCard className={`w-5 h-5 mt-0.5 ${
                formData.iban.startsWith('SA') && formData.iban.length === 26
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`} />
              <div className="flex-1">
                <p className={`font-semibold mb-1 ${
                  formData.iban.startsWith('SA') && formData.iban.length === 26
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}>
                  IBAN Validation
                </p>
                <p className={`text-sm ${
                  formData.iban.startsWith('SA') && formData.iban.length === 26
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {formData.iban.startsWith('SA') && formData.iban.length === 26
                    ? '✓ Valid Saudi IBAN format'
                    : '⚠ Please enter a valid Saudi IBAN (SA + 24 digits)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Important:</strong> Bank details are required for salary transfers. 
          Ensure all information is accurate to avoid payment delays. 
          The IBAN must be a valid Saudi Arabian bank account.
        </AlertDescription>
      </Alert>
    </div>
  );
}