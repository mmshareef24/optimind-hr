import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from '@/components/TranslationContext';

export default function QIWASyncMonitor({ records, onSyncComplete }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [syncing, setSyncing] = useState(false);
  const [syncingRecord, setSyncingRecord] = useState(null);

  const syncStatuses = {
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Success' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Error' },
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
    never_synced: { icon: AlertTriangle, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Never Synced' }
  };

  const handleSyncWorkPermit = async (recordId) => {
    setSyncingRecord(recordId);
    try {
      const response = await base44.functions.invoke('qiwaSync', {
        action: 'sync_work_permit',
        qiwa_record_id: recordId
      });

      if (response.data.success) {
        toast.success(`Work permit synced. Expires in ${response.data.days_until_expiry} days`);
        onSyncComplete?.();
      } else {
        toast.error(response.data.error || 'Failed to sync work permit');
      }
    } catch (error) {
      toast.error('Error syncing work permit');
    } finally {
      setSyncingRecord(null);
    }
  };

  const handleBulkSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('qiwaSync', {
        action: 'bulk_sync'
      });

      if (response.data.success) {
        const { results } = response.data;
        toast.success(`Bulk sync complete: ${results.success} succeeded, ${results.failed} failed`);
        onSyncComplete?.();
      } else {
        toast.error('Bulk sync failed');
      }
    } catch (error) {
      toast.error('Error during bulk sync');
    } finally {
      setSyncing(false);
    }
  };

  const syncStats = records.reduce((acc, record) => {
    const status = record.sync_status || 'never_synced';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            {language === 'ar' ? 'مراقبة المزامنة' : 'Sync Monitor'}
          </CardTitle>
          <Button
            onClick={handleBulkSync}
            disabled={syncing}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'مزامنة الكل' : 'Sync All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Sync Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(syncStats).map(([status, count]) => {
            const statusConfig = syncStatuses[status];
            const Icon = statusConfig.icon;
            return (
              <div key={status} className={`p-3 rounded-lg ${statusConfig.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${statusConfig.color}`} />
                  <span className="text-xs text-slate-600">{statusConfig.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Sync Activity */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            {language === 'ar' ? 'نشاط المزامنة الأخير' : 'Recent Sync Activity'}
          </h4>
          {records
            .filter(r => r.last_sync_date)
            .sort((a, b) => new Date(b.last_sync_date) - new Date(a.last_sync_date))
            .slice(0, 5)
            .map(record => {
              const statusConfig = syncStatuses[record.sync_status];
              const Icon = statusConfig.icon;
              return (
                <div key={record.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${statusConfig.color}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {record.qiwa_id || record.iqama_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(record.last_sync_date).toLocaleString()}
                      </p>
                      {record.sync_error && (
                        <p className="text-xs text-red-600 mt-1">{record.sync_error}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSyncWorkPermit(record.id)}
                    disabled={syncingRecord === record.id}
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingRecord === record.id ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              );
            })}
          {records.filter(r => r.last_sync_date).length === 0 && (
            <p className="text-center text-slate-500 py-4 text-sm">
              {language === 'ar' ? 'لا توجد عمليات مزامنة بعد' : 'No sync activity yet'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}