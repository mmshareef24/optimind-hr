import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertCircle, Users, Key } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";
import RoleManagement from "@/components/admin/RoleManagement";
import UserRoleAssignment from "@/components/admin/UserRoleAssignment";

export default function UserManagementPage() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user-management'],
    queryFn: () => base44.auth.me()
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('access_denied')}</h2>
            <p className="text-slate-600">{t('no_permission_user_mgmt')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={isRTL ? 'text-right' : ''}>
        <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Shield className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-slate-900">{t('user_access_management')}</h1>
        </div>
        <p className="text-slate-600">{t('user_management_desc')}</p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className={`text-sm text-blue-900 ${isRTL ? 'text-right' : ''}`}>
              <p className="font-semibold mb-1">{t('how_user_access_works')}</p>
              <ul className="space-y-1 list-disc list-inside text-blue-800">
                <li><strong>Employee Link:</strong> Links user accounts to employee records for role-based access</li>
                <li><strong>Managers:</strong> Automatically see their direct reports based on manager_id relationship</li>
                <li><strong>Company/Department Access:</strong> Restrict HR users to specific companies or departments</li>
                <li><strong>Permissions:</strong> Granular control over what actions users can perform</li>
                <li><strong>Admin Role:</strong> Full access to all data and features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Users, Roles, Permissions */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Key className="w-4 h-4" />
            Role Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="assignments">
          <UserRoleAssignment />
        </TabsContent>
      </Tabs>
    </div>
  );
}