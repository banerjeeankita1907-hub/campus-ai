'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { SensorData, AnomalyDetector, forecastTemperature } from '@/lib/sensor-simulator';
import dynamic from 'next/dynamic';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, Activity, Thermometer, Droplets, Users, Volume2, TrendingUp,
} from 'lucide-react';

const Campus3D = dynamic(() => import('@/components/Campus3D'), { ssr: false });

const TYPE_ICONS: Record<string, any> = {
  temperature: Thermometer,
  humidity: Droplets,
  occupancy: Users,
  noise: Volume2,
};

export default function Dashboard() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [anomalies, setAnomalies] = useState<SensorData[]>([]);
  const [chartData, setChartData] = useState<{ time: string; temp: number }[]>([]);
  const [forecast, setForecast] = useState<number | null>(null);
  const detector = useRef(new AnomalyDetector());

  useEffect(() => {
    const eventSource = new EventSource('/api/sensors');
    eventSource.onmessage = (event) => {
      const data: SensorData[] = JSON.parse(event.data);
      const analyzed = detector.current.detect(data);
      setSensors(analyzed);

      // Anomaly log
      setAnomalies((prev) => {
        const newAnomalies = analyzed.filter((s) => s.anomaly);
        return [...prev, ...newAnomalies].slice(-20);
      });

      // Average temperature for chart
      const temps = analyzed.filter((s) => s.type === 'temperature');
      const avg = temps.reduce((sum, s) => sum + s.value, 0) / (temps.length || 1);
      setChartData((prev) => {
        const newPoint = { time: new Date().toLocaleTimeString(), temp: Math.round(avg * 10) / 10 };
        const updated = [...prev, newPoint].slice(-30);
        // Forecast next value using the last 10 temperature averages
        const tempValues = updated.map((d) => d.temp);
        if (tempValues.length >= 5) setForecast(forecastTemperature(tempValues));
        return updated;
      });
    };
    return () => eventSource.close();
  }, []);

  const anomalyCount = sensors.filter((s) => s.anomaly).length;

  return (
    <div className="p-4 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            CampusAI Digital Twin
          </h1>
          <p className="text-slate-400">Real‑time IoT monitoring with on‑device ML</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="glass px-4 py-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="font-mono">{sensors.length} sensors</span>
          </div>
          {anomalyCount > 0 && (
            <div className="glass px-4 py-2 flex items-center gap-2 border border-red-500/30 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{anomalyCount} anomalies</span>
            </div>
          )}
          {forecast !== null && (
            <div className="glass px-4 py-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="font-mono text-blue-300">Next temp: {forecast}°C</span>
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass h-[500px] relative overflow-hidden">
          <Campus3D sensors={sensors} />
          <div className="absolute bottom-4 left-4 text-xs text-slate-400 bg-black/40 px-2 py-1 rounded">
            Green = normal | Red = anomaly (Z‑score &gt; 2.5σ)
          </div>
        </div>
        <div className="glass p-4 overflow-y-auto max-h-[500px]">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" /> Anomaly Log
          </h3>
          {anomalies.length === 0 && (
            <p className="text-slate-500 text-sm">No anomalies detected.</p>
          )}
          {anomalies.map((s, i) => {
            const Icon = TYPE_ICONS[s.type];
            return (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/50 text-sm">
                <Icon className="w-4 h-4 text-red-400" />
                <div>
                  <p className="font-medium">{s.building} – {s.type}</p>
                  <p className="text-slate-400">
                    {s.value} (at {new Date(s.timestamp).toLocaleTimeString()})
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 glass p-4">
        <h3 className="text-lg font-semibold mb-4">Average Temperature (last 30 readings) & Forecast</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="temp" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        {forecast !== null && (
          <div className="mt-2 text-sm text-cyan-300">
            Predicted next value (linear regression): {forecast}°C
          </div>
        )}
      </div>
    </div>
  );
}
