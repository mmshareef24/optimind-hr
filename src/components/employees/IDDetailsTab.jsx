import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { differenceInDays } from "date-fns";

export default function IDDetailsTab({ formData, setFormData }) {
  const checkExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) return { status: 'expired', message: 'Expired', color: 'red' };
    if (daysUntilExpiry < 30) return { status: 'critical', message: `Expires in ${daysUntilExpiry} days`, color: 'red' };
    if (daysUntilExpiry < 90) return { status: 'warning', message: `Expires in ${daysUntilExpiry} days`, color: 'amber' };
    return { status: 'valid', message: `Valid (${daysUntilExpiry} days remaining)`, color: 'green' };
  };

  const iqamaStatus = checkExpiry(formData.national_id_expiry);
  const passportStatus = checkExpiry(formData.passport_expiry);

  return (
    <div className="space-y-6">
      {/* Iqama / National ID */}
      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Iqama / National ID
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>National ID / Iqama Number *</Label>
              <Input
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                placeholder="Enter ID number"
                required
              />
            </div>
            <div>
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={formData.national_id_expiry}
                onChange={(e) => setFormData({ ...formData, national_id_expiry: e.target.value })}
                required
              />
            </div>
          </div>

          {iqamaStatus && (
            <Alert 
              className={`mt-4 ${
                iqamaStatus.color === 'red' ? 'border-red-200 bg-red-50' :
                iqamaStatus.color === 'amber' ? 'border-amber-200 bg-amber-50' :
                'border-green-200 bg-green-50'
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${
                iqamaStatus.color === 'red' ? 'text-red-600' :
                iqamaStatus.color === 'amber' ? 'text-amber-600' :
                'text-green-600'
              }`} />
              <AlertDescription className={
                iqamaStatus.color === 'red' ? 'text-red-700' :
                iqamaStatus.color === 'amber' ? 'text-amber-700' :
                'text-green-700'
              }>
                <strong>Iqama Status:</strong> {iqamaStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Passport */}
      <Card className="border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Passport Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Passport Number</Label>
              <Input
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                placeholder="Enter passport number"
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.passport_expiry}
                onChange={(e) => setFormData({ ...formData, passport_expiry: e.target.value })}
              />
            </div>
          </div>

          {passportStatus && (
            <Alert 
              className={`mt-4 ${
                passportStatus.color === 'red' ? 'border-red-200 bg-red-50' :
                passportStatus.color === 'amber' ? 'border-amber-200 bg-amber-50' :
                'border-green-200 bg-green-50'
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${
                passportStatus.color === 'red' ? 'text-red-600' :
                passportStatus.color === 'amber' ? 'text-amber-600' :
                'text-green-600'
              }`} />
              <AlertDescription className={
                passportStatus.color === 'red' ? 'text-red-700' :
                passportStatus.color === 'amber' ? 'text-amber-700' :
                'text-green-700'
              }>
                <strong>Passport Status:</strong> {passportStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Important Note */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Important:</strong> Ensure all ID documents are valid and up-to-date. 
          Expired documents may affect the employee's legal status and employment eligibility in Saudi Arabia.
        </AlertDescription>
      </Alert>
    </div>
  );
}