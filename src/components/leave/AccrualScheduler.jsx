import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Play, Settings, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccrualScheduler({ onRunNow, isProcessing }) {
  const [autoAccrual, setAutoAccrual] = useState(true);

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardHeader className="border-b border-emerald-100">
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          Automated Accrual Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Auto Accrual Toggle */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Label className="font-semibold text-slate-900">Automatic Monthly Processing</Label>
              <p className="text-xs text-slate-600 mt-1">
                Auto-process on 1st of each month at 00:00 AST
              </p>
            </div>
          </div>
          <Switch checked={autoAccrual} onCheckedChange={setAutoAccrual} />
        </div>

        {/* Next Schedule */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-2">Next Scheduled Run</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-600">Date</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Time</p>
                  <p className="font-semibold text-slate-900">00:00 AST</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Processing */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Manual Processing</h4>
          <Alert className="mb-3 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 text-sm">
              You can manually trigger accrual processing for any month. This is useful for:
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Initial setup and backfilling</li>
                <li>Processing missed periods</li>
                <li>Testing new policies</li>
              </ul>
            </AlertDescription>
          </Alert>
          <Button
            onClick={onRunNow}
            disabled={isProcessing}
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            {isProcessing ? 'Processing...' : 'Run Accrual Now'}
          </Button>
        </div>

        {/* Processing Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 text-sm">System Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">Automation Status</span>
              <Badge className={autoAccrual ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                {autoAccrual ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Enabled</>
                ) : (
                  <><AlertCircle className="w-3 h-3 mr-1" /> Disabled</>
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">Last Run</span>
              <span className="text-sm font-semibold text-slate-900">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}