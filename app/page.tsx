'use client';

import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, differenceInHours } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, Zap, Leaf } from 'lucide-react';
import {
  generateSampleData,
  calculateEmissions,
  calculateCleanPercentage,
  isCleanHour,
  EMISSION_FACTORS,
  type HourlyFuelMix,
} from '@/lib/nyiso-data-generator';

export default function UseCase1Page() {
  const [dateRange, setDateRange] = useState(30); // days
  const [selectedMetric, setSelectedMetric] = useState<'emissions' | 'generation'>('emissions');

  // Generate data (will be replaced with real data)
  const fuelMixData = useMemo(() => generateSampleData(dateRange), [dateRange]);

  // Calculate emissions for each hour
  const emissionsData = useMemo(() => {
    return fuelMixData.map((record) => ({
      ...record,
      emissions: calculateEmissions(record) / 1000, // Convert to metric tons
      cleanPercentage: calculateCleanPercentage(record),
      isClean: isCleanHour(record),
    }));
  }, [fuelMixData]);

  // Aggregate by day
  const dailyData = useMemo(() => {
    const dailyMap = new Map<string, {
      date: string;
      totalEmissions: number;
      avgCleanPercentage: number;
      cleanHours: number;
      dirtyHours: number;
      totalGeneration: number;
    }>();

    emissionsData.forEach((record) => {
      const dateKey = format(record.timestamp, 'yyyy-MM-dd');
      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        totalEmissions: 0,
        avgCleanPercentage: 0,
        cleanHours: 0,
        dirtyHours: 0,
        totalGeneration: 0,
      };

      dailyMap.set(dateKey, {
        date: dateKey,
        totalEmissions: existing.totalEmissions + record.emissions,
        avgCleanPercentage: existing.avgCleanPercentage + record.cleanPercentage,
        cleanHours: existing.cleanHours + (record.isClean ? 1 : 0),
        dirtyHours: existing.dirtyHours + (record.isClean ? 0 : 1),
        totalGeneration: existing.totalGeneration + record.total,
      });
    });

    return Array.from(dailyMap.values()).map((day) => ({
      ...day,
      avgCleanPercentage: day.avgCleanPercentage / 24, // Average over 24 hours
    }));
  }, [emissionsData]);

  // Calculate trends
  const trends = useMemo(() => {
    if (dailyData.length < 2) return { dayOverDay: 0, weekOverWeek: 0, monthOverMonth: 0 };

    const today = dailyData[dailyData.length - 1];
    const yesterday = dailyData[dailyData.length - 2];
    const lastWeek = dailyData[Math.max(0, dailyData.length - 8)];
    const lastMonth = dailyData[0];

    return {
      dayOverDay: today && yesterday
        ? ((today.totalEmissions - yesterday.totalEmissions) / yesterday.totalEmissions) * 100
        : 0,
      weekOverWeek: today && lastWeek
        ? ((today.totalEmissions - lastWeek.totalEmissions) / lastWeek.totalEmissions) * 100
        : 0,
      monthOverMonth: today && lastMonth
        ? ((today.totalEmissions - lastMonth.totalEmissions) / lastMonth.totalEmissions) * 100
        : 0,
    };
  }, [dailyData]);

  // High emissions alerts
  const alerts = useMemo(() => {
    const avgEmissions =
      emissionsData.reduce((sum, r) => sum + r.emissions, 0) / emissionsData.length;
    const threshold = avgEmissions * 1.3; // 30% above average

    return emissionsData
      .filter((record) => record.emissions > threshold)
      .slice(-10) // Last 10 high-emission periods
      .map((record) => ({
        timestamp: record.timestamp,
        emissions: record.emissions,
        cleanPercentage: record.cleanPercentage,
      }));
  }, [emissionsData]);

  // Fuel mix breakdown (latest hour)
  const latestFuelMix = useMemo(() => {
    if (fuelMixData.length === 0) return [];
    const latest = fuelMixData[fuelMixData.length - 1];

    return [
      { name: 'Natural Gas', value: latest.natural_gas, color: '#fbbf24' },
      { name: 'Nuclear', value: latest.nuclear, color: '#8b5cf6' },
      { name: 'Hydro', value: latest.hydro, color: '#3b82f6' },
      { name: 'Wind', value: latest.wind, color: '#10b981' },
      { name: 'Solar', value: latest.solar, color: '#f59e0b' },
      { name: 'Dual Fuel', value: latest.dual_fuel, color: '#ef4444' },
      { name: 'Other Renewables', value: latest.other_renewables, color: '#22c55e' },
      { name: 'Other Fossil', value: latest.other_fossil_fuels, color: '#6b7280' },
    ].filter((item) => item.value > 0);
  }, [fuelMixData]);

  // Clean vs Dirty hours
  const cleanVsDirty = useMemo(() => {
    const clean = emissionsData.filter((r) => r.isClean).length;
    const dirty = emissionsData.length - clean;
    return [
      { name: 'Clean Hours (>60% clean energy)', value: clean, color: '#22c55e' },
      { name: 'Dirty Hours (<60% clean energy)', value: dirty, color: '#ef4444' },
    ];
  }, [emissionsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Zap className="w-10 h-10 text-yellow-400" />
            NYISO/NYPA Real-Time Energy Emission Profiler
          </h1>
          <p className="text-slate-300 text-lg">
            Monitor energy emissions trends and clean vs. dirty hour comparisons for New York State
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'emissions' | 'generation')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
          >
            <option value="emissions">Emissions View</option>
            <option value="generation">Generation View</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Day-over-Day</h3>
              {trends.dayOverDay > 0 ? (
                <TrendingUp className="w-5 h-5 text-red-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-400" />
              )}
            </div>
            <p className={`text-3xl font-bold ${trends.dayOverDay > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {trends.dayOverDay.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm mt-1">Emissions change</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Week-over-Week</h3>
              {trends.weekOverWeek > 0 ? (
                <TrendingUp className="w-5 h-5 text-red-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-400" />
              )}
            </div>
            <p className={`text-3xl font-bold ${trends.weekOverWeek > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {trends.weekOverWeek.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm mt-1">Emissions change</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Month-over-Month</h3>
              {trends.monthOverMonth > 0 ? (
                <TrendingUp className="w-5 h-5 text-red-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-400" />
              )}
            </div>
            <p className={`text-3xl font-bold ${trends.monthOverMonth > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {trends.monthOverMonth.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm mt-1">Emissions change</p>
          </div>
        </div>

        {/* Emissions Trend Chart */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Daily Emissions Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" label={{ value: 'Metric Tons CO2', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="totalEmissions" stroke="#ef4444" fillOpacity={1} fill="url(#emissionsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Fuel Mix */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Current Fuel Mix</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={latestFuelMix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / fuelMixData[fuelMixData.length - 1]?.total) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {latestFuelMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Clean vs Dirty Hours */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Leaf className="w-6 h-6 text-green-400" />
              Clean vs Dirty Hours
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cleanVsDirty}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cleanVsDirty.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-slate-400 text-sm mt-4 text-center">
              Clean hours have &gt;60% renewable/nuclear energy
            </p>
          </div>
        </div>

        {/* High Emissions Alerts */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            High Emissions Alerts (Last 10)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Emissions (MT CO2)</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Clean Energy %</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, index) => (
                  <tr key={index} className="border-b border-slate-700/50">
                    <td className="py-3 px-4">{format(alert.timestamp, 'MMM dd, yyyy HH:mm')}</td>
                    <td className="py-3 px-4 text-red-400 font-semibold">{alert.emissions.toFixed(2)}</td>
                    <td className="py-3 px-4">{alert.cleanPercentage.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                        High Alert
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emission Factors Reference */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">EPA Emission Factors (kg CO2/MWh)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(EMISSION_FACTORS).map(([fuel, factor]) => (
              <div key={fuel} className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm capitalize">{fuel.replace('_', ' ')}</p>
                <p className="text-2xl font-bold">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
