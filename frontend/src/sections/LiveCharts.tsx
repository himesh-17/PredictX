import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { SensorReading } from "../types";

interface LiveChartsProps {
  readingsHistory: SensorReading[];
}

export const LiveCharts: React.FC<LiveChartsProps> = ({ readingsHistory }) => {
  const [windowSize, setWindowSize] = useState<number>(60);

  const chartData = readingsHistory.slice(-windowSize).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString(),
    current: r.current?.value,
    voltage: r.voltage?.value,
    temperature: r.temperature?.value,
    vibration: r.vibration?.value,
    disturbance: r.syntheticDisturbance,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-[#1E293B] bg-[#111B2E] p-2.5 shadow-xl text-xs font-mono">
          <div className="font-semibold text-[#F1F5F9] mb-1">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[#94A3B8] capitalize">{entry.name}:</span>
              <span className="font-bold text-[#F1F5F9]">{entry.value}</span>
            </div>
          ))}
          {data.disturbance && (
            <div className="mt-1.5 text-[11px] text-[#F87171] font-bold border-t border-[#1E293B] pt-1">
              Event: {data.disturbance}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-8 text-center text-[#94A3B8]">
        No telemetry data available. Start the backend simulator to stream live charts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#F1F5F9]">
            Live Animated Telemetry Streams
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Real-time rolling sensor telemetry received from backend WebSocket feed
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#94A3B8]">Window:</span>
          {[30, 60, 90].map((sz) => (
            <button
              key={sz}
              onClick={() => setWindowSize(sz)}
              className={`rounded px-2 py-0.5 font-mono text-xs transition-all ${
                windowSize === sz
                  ? "bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 font-semibold"
                  : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9]"
              }`}
            >
              {sz}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CHART 1: CURRENT */}
        <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#F1F5F9]">
              Phase Current (A) vs Time
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse"></span> STREAMING
              </span>
              <span className="text-[11px] font-mono text-[#FBBF24]">Limit: 5.0 A</span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#64748B", fontSize: 10 }} minTickGap={20} />
                <YAxis domain={[0, 6]} tick={{ fill: "#64748B", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={5.0} stroke="#F87171" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="current" name="Current (A)" stroke="#FBBF24" strokeWidth={2} fillOpacity={1} fill="url(#currentGrad)" isAnimationActive={true} animationDuration={450} animationEasing="ease-in-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: VOLTAGE */}
        <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#F1F5F9]">
              Line Voltage (V) vs Time
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse"></span> STREAMING
              </span>
              <span className="text-[11px] font-mono text-[#60A5FA]">Tol: 207 - 253 V</span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="voltageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#64748B", fontSize: 10 }} minTickGap={20} />
                <YAxis domain={[180, 260]} tick={{ fill: "#64748B", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={253} stroke="#F87171" strokeDasharray="3 3" />
                <ReferenceLine y={207} stroke="#F87171" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="voltage" name="Voltage (V)" stroke="#60A5FA" strokeWidth={2} fillOpacity={1} fill="url(#voltageGrad)" isAnimationActive={true} animationDuration={450} animationEasing="ease-in-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: TEMPERATURE */}
        <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#F1F5F9]">
              Stator/Frame Temperature (°C) vs Time
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse"></span> STREAMING
              </span>
              <span className="text-[11px] font-mono text-[#F87171]">Ambient: ~25°C, Warn: 75°C</span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#64748B", fontSize: 10 }} minTickGap={20} />
                <YAxis domain={[15, 60]} tick={{ fill: "#64748B", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={75} stroke="#FBBF24" strokeDasharray="3 3" />
                <ReferenceLine y={90} stroke="#F87171" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#F87171" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" isAnimationActive={true} animationDuration={450} animationEasing="ease-in-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: VIBRATION */}
        <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#F1F5F9]">
              Vibration Acceleration (g RMS) vs Time
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse"></span> STREAMING
              </span>
              <span className="text-[11px] font-mono text-[#22D3EE]">Max: 0.50 g</span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#64748B", fontSize: 10 }} minTickGap={20} />
                <YAxis domain={[0, 0.7]} tick={{ fill: "#64748B", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0.35} stroke="#FBBF24" strokeDasharray="3 3" />
                <ReferenceLine y={0.50} stroke="#F87171" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="vibration" name="Vibration (g)" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#vibGrad)" isAnimationActive={true} animationDuration={450} animationEasing="ease-in-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
