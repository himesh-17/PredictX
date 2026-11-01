import React from "react";
import { Activity, Gauge, Thermometer, Zap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { ReadingAssessmentResult, SensorReading } from "../types";

interface SensorCardsProps {
  latestReading: SensorReading | null;
  readingsHistory: SensorReading[];
  standardsAssessment: ReadingAssessmentResult | null;
}

export const SensorCards: React.FC<SensorCardsProps> = ({
  latestReading,
  readingsHistory,
  standardsAssessment,
}) => {
  // Compute previous reading to derive delta
  const prevReading =
    readingsHistory.length >= 2 ? readingsHistory[readingsHistory.length - 2] : null;

  const getDelta = (curr?: number, prev?: number) => {
    if (curr === undefined || prev === undefined) return "+0.00";
    const diff = curr - prev;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(2)}`;
  };

  const getParamAssessment = (param: string) => {
    return standardsAssessment?.evaluations?.find(
      (e) => e.parameter.toLowerCase() === param.toLowerCase()
    );
  };

  const getBadgeStyle = (status?: string) => {
    switch (status) {
      case "OUT_OF_LIMIT":
        return "bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40";
      case "WARNING":
        return "bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40";
      case "WITHIN_CONFIGURED_LIMIT":
        return "bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40";
      case "LIMITS_NOT_CONFIGURED":
        return "bg-[#172338] text-[#94A3B8] border-[#1E293B]";
      default:
        return "bg-[#172338] text-[#94A3B8] border-[#1E293B]";
    }
  };

  const sparklineData = readingsHistory.slice(-20).map((r, i) => ({
    idx: i,
    current: r.current?.value,
    voltage: r.voltage?.value,
    temperature: r.temperature?.value,
    vibration: r.vibration?.value,
  }));

  const currentEval = getParamAssessment("current");
  const voltageEval = getParamAssessment("voltage");
  const tempEval = getParamAssessment("temperature");
  const vibEval = getParamAssessment("vibration");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. CURRENT CARD */}
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            <Zap className="h-4 w-4 text-[#FBBF24]" />
            <span>Motor Current</span>
          </div>
          <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-medium ${getBadgeStyle(currentEval?.status)}`}>
            {currentEval?.status || "CHECKING"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-[#F1F5F9]">
            {latestReading?.current?.value?.toFixed(2) ?? "--"}
            <span className="ml-1 text-sm font-normal text-[#94A3B8]">A</span>
          </div>
          <div className="text-xs font-mono text-[#94A3B8]">
            Δ {getDelta(latestReading?.current?.value, prevReading?.current?.value)} A
          </div>
        </div>

        {/* Sparkline */}
        <div className="mt-3 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <YAxis domain={["auto", "auto"]} hide />
              <Line type="monotone" dataKey="current" stroke="#FBBF24" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#1E293B]/60 pt-2">
          <span>Rated: 3.20 A</span>
          <span>Lim: 5.00 A</span>
        </div>
      </div>

      {/* 2. VOLTAGE CARD */}
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            <Gauge className="h-4 w-4 text-[#60A5FA]" />
            <span>Supply Voltage</span>
          </div>
          <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-medium ${getBadgeStyle(voltageEval?.status)}`}>
            {voltageEval?.status || "CHECKING"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-[#F1F5F9]">
            {latestReading?.voltage?.value?.toFixed(1) ?? "--"}
            <span className="ml-1 text-sm font-normal text-[#94A3B8]">V</span>
          </div>
          <div className="text-xs font-mono text-[#94A3B8]">
            Δ {getDelta(latestReading?.voltage?.value, prevReading?.voltage?.value)} V
          </div>
        </div>

        {/* Sparkline */}
        <div className="mt-3 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <YAxis domain={["auto", "auto"]} hide />
              <Line type="monotone" dataKey="voltage" stroke="#60A5FA" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#1E293B]/60 pt-2">
          <span>Nominal: 230 V</span>
          <span>Tol: ±10%</span>
        </div>
      </div>

      {/* 3. TEMPERATURE CARD */}
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            <Thermometer className="h-4 w-4 text-[#F87171]" />
            <span>Temperature</span>
          </div>
          <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-medium ${getBadgeStyle(tempEval?.status)}`}>
            {tempEval?.status || "CHECKING"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-[#F1F5F9]">
            {latestReading?.temperature?.value?.toFixed(1) ?? "--"}
            <span className="ml-1 text-sm font-normal text-[#94A3B8]">°C</span>
          </div>
          <div className="text-xs font-mono text-[#94A3B8]">
            Δ {getDelta(latestReading?.temperature?.value, prevReading?.temperature?.value)} °C
          </div>
        </div>

        {/* Sparkline */}
        <div className="mt-3 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <YAxis domain={["auto", "auto"]} hide />
              <Line type="monotone" dataKey="temperature" stroke="#F87171" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#1E293B]/60 pt-2">
          <span>Warn: 75.0 °C</span>
          <span>Max: 90.0 °C</span>
        </div>
      </div>

      {/* 4. VIBRATION CARD */}
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            <Activity className="h-4 w-4 text-[#22D3EE]" />
            <span>Vibration (Axis X)</span>
          </div>
          <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-medium ${getBadgeStyle(vibEval?.status)}`}>
            {vibEval?.status || "CHECKING"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-[#F1F5F9]">
            {latestReading?.vibration?.value?.toFixed(3) ?? "--"}
            <span className="ml-1 text-sm font-normal text-[#94A3B8]">g RMS</span>
          </div>
          <div className="text-xs font-mono text-[#94A3B8]">
            Δ {getDelta(latestReading?.vibration?.value, prevReading?.vibration?.value)} g
          </div>
        </div>

        {/* Sparkline */}
        <div className="mt-3 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <YAxis domain={["auto", "auto"]} hide />
              <Line type="monotone" dataKey="vibration" stroke="#22D3EE" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#1E293B]/60 pt-2">
          <span>Warn: 0.35 g</span>
          <span>Max: 0.50 g</span>
        </div>
      </div>
    </div>
  );
};
