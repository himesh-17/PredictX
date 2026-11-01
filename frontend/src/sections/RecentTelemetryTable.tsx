import React from "react";
import { Database } from "lucide-react";
import { SensorReading } from "../types";

interface RecentTelemetryTableProps {
  readings: SensorReading[];
}

export const RecentTelemetryTable: React.FC<RecentTelemetryTableProps> = ({ readings }) => {
  const latestTen = readings.slice(-10).reverse();

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#60A5FA]" />
          <h2 className="text-base font-bold text-[#F1F5F9]">
            Recent Ingested Telemetry Feed
          </h2>
          <span className="rounded-full bg-[#172338] px-2 py-0.5 text-xs font-mono text-[#94A3B8]">
            Last 10 Records
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#172338] text-[#94A3B8] border-b border-[#1E293B]">
            <tr>
              <th className="py-2.5 px-3 font-semibold uppercase">Timestamp</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Current</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Voltage</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Temperature</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Vibration (X)</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Data Source</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-[#F1F5F9]">
            {latestTen.map((r, i) => (
              <tr key={i} className="hover:bg-[#172338]/50 transition-colors">
                <td className="py-2.5 px-3 text-[#94A3B8]">
                  {new Date(r.timestamp).toLocaleTimeString()}
                </td>
                <td className="py-2.5 px-3 font-semibold text-[#FBBF24]">
                  {r.current?.value?.toFixed(2)} {r.current?.unit}
                </td>
                <td className="py-2.5 px-3 font-semibold text-[#60A5FA]">
                  {r.voltage?.value?.toFixed(1)} {r.voltage?.unit}
                </td>
                <td className="py-2.5 px-3 font-semibold text-[#F87171]">
                  {r.temperature?.value?.toFixed(1)} {r.temperature?.unit}
                </td>
                <td className="py-2.5 px-3 font-semibold text-[#22D3EE]">
                  {r.vibration?.value?.toFixed(3)} {r.vibration?.unit}
                </td>
                <td className="py-2.5 px-3">
                  <span className="rounded bg-[#FBBF24]/10 border border-[#FBBF24]/30 px-2 py-0.5 text-[10px] text-[#FBBF24] uppercase">
                    {r.source}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center gap-1 text-[#34D399] text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                    {r.quality}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
