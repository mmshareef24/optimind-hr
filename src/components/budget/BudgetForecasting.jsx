import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, Users, Percent } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function BudgetForecasting({ budgets, employees, departments, positions }) {
  const currentYear = new Date().getFullYear();
  
  const [forecastParams, setForecastParams] = useState({
    scenario: "realistic",
    forecastPeriod: 12, // months
    inflationRate: 3.5,
    expectedHeadcountChange: 0,
    salaryGrowthRate: 5,
    targetDepartment: "all"
  });

  // Scenario multipliers
  const scenarioSettings = {
    optimistic: {
      label: "Optimistic",
      inflationMultiplier: 0.7,
      growthMultiplier: 0.8,
      description: "Lower costs, moderate growth"
    },
    realistic: {
      label: "Realistic",
      inflationMultiplier: 1.0,
      growthMultiplier: 1.0,
      description: "Expected market conditions"
    },
    pessimistic: {
      label: "Pessimistic",
      inflationMultiplier: 1.3,
      growthMultiplier: 1.2,
      description: "Higher costs, aggressive growth"
    }
  };

  // Calculate historical trends
  const historicalData = useMemo(() => {
    const filteredBudgets = forecastParams.targetDepartment === "all" 
      ? budgets 
      : budgets.filter(b => b.department === forecastParams.targetDepartment);

    const monthlyData = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      
      const monthBudgets = filteredBudgets.filter(b => 
        b.budget_period && b.budget_period.startsWith(monthKey)
      );

      const totalBudgeted = monthBudgets.reduce((sum, b) => sum + (b.total_budgeted_cost || 0), 0);
      const totalActual = monthBudgets.reduce((sum, b) => sum + (b.total_actual_cost || 0), 0);
      const totalHeadcount = monthBudgets.reduce((sum, b) => sum + (b.actual_headcount || 0), 0);

      monthlyData.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        budgeted: totalBudgeted,
        actual: totalActual,
        variance: totalBudgeted - totalActual,
        headcount: totalHeadcount
      });
    }

    return monthlyData;
  }, [budgets, forecastParams.targetDepartment]);

  // Calculate forecast
  const forecastData = useMemo(() => {
    const scenario = scenarioSettings[forecastParams.scenario];
    const lastMonth = historicalData[historicalData.length - 1];
    const avgActual = historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length;
    const avgHeadcount = historicalData.reduce((sum, d) => sum + d.headcount, 0) / historicalData.length;
    
    // Calculate growth trend
    const recentMonths = historicalData.slice(-3);
    const growthRate = recentMonths.length > 1 
      ? (recentMonths[recentMonths.length - 1].actual - recentMonths[0].actual) / recentMonths[0].actual / recentMonths.length
      : 0;

    const forecast = [];
    let currentValue = lastMonth?.actual || avgActual;
    let currentHeadcount = lastMonth?.headcount || avgHeadcount;

    for (let i = 1; i <= forecastParams.forecastPeriod; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      
      // Apply inflation
      const inflationFactor = 1 + (forecastParams.inflationRate / 100 / 12) * scenario.inflationMultiplier;
      
      // Apply growth
      const growthFactor = 1 + (growthRate * scenario.growthMultiplier);
      
      // Apply salary growth
      const salaryGrowthFactor = i % 12 === 0 ? 1 + (forecastParams.salaryGrowthRate / 100) : 1;
      
      // Apply headcount changes
      const headcountFactor = 1 + (forecastParams.expectedHeadcountChange / 100 / 12);
      
      currentValue = currentValue * inflationFactor * growthFactor * salaryGrowthFactor;
      currentHeadcount = currentHeadcount * headcountFactor;

      forecast.push({
        month: futureDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        forecasted: Math.round(currentValue),
        headcount: Math.round(currentHeadcount),
        isForecast: true
      });
    }

    return forecast;
  }, [historicalData, forecastParams, scenarioSettings]);

  // Combine historical and forecast
  const combinedData = [...historicalData, ...forecastData];

  // Calculate insights
  const insights = useMemo(() => {
    const currentTotal = historicalData[historicalData.length - 1]?.actual || 0;
    const forecastedTotal = forecastData[forecastData.length - 1]?.forecasted || 0;
    const totalIncrease = forecastedTotal - currentTotal;
    const percentIncrease = currentTotal > 0 ? (totalIncrease / currentTotal) * 100 : 0;

    const avgHistorical = historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length;
    const avgForecast = forecastData.reduce((sum, d) => sum + d.forecasted, 0) / forecastData.length;
    
    const totalBudgetAllocated = budgets
      .filter(b => forecastParams.targetDepartment === "all" || b.department === forecastParams.targetDepartment)
      .reduce((sum, b) => sum + (b.total_budgeted_cost || 0), 0);

    const projectedShortfall = forecastedTotal > totalBudgetAllocated;

    return {
      currentMonthly: currentTotal,
      forecastedMonthly: forecastedTotal,
      totalIncrease,
      percentIncrease,
      avgHistorical,
      avgForecast,
      projectedShortfall,
      shortfallAmount: projectedShortfall ? forecastedTotal - totalBudgetAllocated : 0,
      surplusAmount: !projectedShortfall ? totalBudgetAllocated - forecastedTotal : 0
    };
  }, [historicalData, forecastData, budgets, forecastParams.targetDepartment]);

  return (
    <div className="space-y-6">
      {/* Forecast Parameters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-purple-50/30">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Budget Forecasting & Scenario Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Scenario
              </Label>
              <Select 
                value={forecastParams.scenario} 
                onValueChange={(value) => setForecastParams(prev => ({ ...prev, scenario: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(scenarioSettings).map(([key, setting]) => (
                    <SelectItem key={key} value={key}>
                      {setting.label} - {setting.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                Department
              </Label>
              <Select 
                value={forecastParams.targetDepartment} 
                onValueChange={(value) => setForecastParams(prev => ({ ...prev, targetDepartment: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(budgets.map(b => b.department).filter(Boolean))).map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                Forecast Period (Months)
              </Label>
              <Input
                type="number"
                value={forecastParams.forecastPeriod}
                onChange={(e) => setForecastParams(prev => ({ ...prev, forecastPeriod: parseInt(e.target.value) || 12 }))}
                min="1"
                max="36"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4" />
                Expected Inflation Rate (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={forecastParams.inflationRate}
                onChange={(e) => setForecastParams(prev => ({ ...prev, inflationRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                Expected Headcount Change (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={forecastParams.expectedHeadcountChange}
                onChange={(e) => setForecastParams(prev => ({ ...prev, expectedHeadcountChange: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" />
                Annual Salary Growth Rate (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={forecastParams.salaryGrowthRate}
                onChange={(e) => setForecastParams(prev => ({ ...prev, salaryGrowthRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Current Monthly</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {insights.currentMonthly.toLocaleString()} SAR
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Forecasted Monthly</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {insights.forecastedMonthly.toLocaleString()} SAR
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Projected Change</span>
              {insights.percentIncrease >= 0 ? (
                <TrendingUp className="w-4 h-4 text-amber-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className={`text-2xl font-bold ${insights.percentIncrease >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {insights.percentIncrease >= 0 ? '+' : ''}{insights.percentIncrease.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Budget Status</span>
              {insights.projectedShortfall ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className={`text-xl font-bold ${insights.projectedShortfall ? 'text-red-600' : 'text-emerald-600'}`}>
              {insights.projectedShortfall ? 'Shortfall' : 'Surplus'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {insights.projectedShortfall 
                ? `${insights.shortfallAmount.toLocaleString()} SAR`
                : `${insights.surplusAmount.toLocaleString()} SAR`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {insights.projectedShortfall && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Budget Shortfall Predicted</h3>
                <p className="text-sm text-red-700">
                  Based on {forecastParams.scenario} scenario, your budget is projected to fall short by{' '}
                  <strong>{insights.shortfallAmount.toLocaleString()} SAR</strong> within the next{' '}
                  {forecastParams.forecastPeriod} months. Consider reviewing headcount plans or salary increases.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Visualization */}
      <Tabs defaultValue="trend" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="trend">Budget Trend & Forecast</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
          <TabsTrigger value="headcount">Headcount Projection</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Budget Trend Analysis & Forecast</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={combinedData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value?.toLocaleString()} SAR`} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    name="Historical Actual"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="forecasted" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorForecast)" 
                    name="Forecasted"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(scenarioSettings).map(([key, setting]) => {
                  const scenarioMultiplier = setting.inflationMultiplier * setting.growthMultiplier;
                  const projectedCost = insights.forecastedMonthly * scenarioMultiplier;
                  
                  return (
                    <div key={key} className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{setting.label} Scenario</h3>
                          <p className="text-sm text-slate-500">{setting.description}</p>
                        </div>
                        <Badge variant={key === forecastParams.scenario ? "default" : "outline"}>
                          {key === forecastParams.scenario && "Active"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500">Projected Monthly</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {projectedCost.toLocaleString()} SAR
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Increase</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {((projectedCost - insights.currentMonthly) / insights.currentMonthly * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Annual Impact</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {(projectedCost * 12).toLocaleString()} SAR
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="headcount">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Headcount Projection</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="headcount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Headcount"
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}