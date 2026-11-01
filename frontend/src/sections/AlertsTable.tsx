import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Bell, Check, Info } from "lucide-react";
import { Alert } from "../types";

interface AlertsTableProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({ alerts, onAcknowledge }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const filtered = alerts.filter((a) => {
    if (filterSeverity === "all") return true;
    if (filterSeverity === "unacknowledged") return !a.acknowledged;
    return a.severity === filterSeverity;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#F87171]/20 border border-[#F87171]/40 px-2 py-0.5 text-[11px] font-bold text-[#F87171]">
            <AlertCircle className="h-3 w-3" /> CRITICAL
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#FBBF24]/20 border border-[#FBBF24]/40 px-2 py-0.5 text-[11px] font-bold text-[#FBBF24]">
            <AlertTriangle className="h-3 w-3" /> WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#60A5FA]/20 border border-[#60A5FA]/40 px-2 py-0.5 text-[11px] font-bold text-[#60A5FA]">
            <Info className="h-3 w-3" /> INFO
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#FBBF24]" />
          <h2 className="text-base font-bold text-[#F1F5F9]">
            Alerts & Event History Log
          </h2>
          <span className="rounded-full bg-[#172338] px-2 py-0.5 text-xs font-mono text-[#94A3B8]">
            {alerts.length} total
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#94A3B8] mr-1">Filter:</span>
          {["all", "unacknowledged", "critical", "warning"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterSeverity(f)}
              className={`rounded px-2.5 py-1 capitalize font-medium transition-all ${
                filterSeverity === f
                  ? "bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40"
                  : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#172338] text-[#94A3B8] border-b border-[#1E293B]">
            <tr>
              <th className="py-2.5 px-3 font-semibold uppercase">Timestamp</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Severity</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Category</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Parameter / Value</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Limit / Rule</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Description</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-[#F1F5F9]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#94A3B8] font-sans">
                  No alerts found matching current filter criteria.
                </td>
              </tr>
            ) : (
              filtered.slice(0, 15).map((a) => (
                <tr key={a.id} className="hover:bg-[#172338]/50 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap text-[#94A3B8]">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">{getSeverityBadge(a.severity)}</td>
                  <td className="py-2.5 px-3 font-medium capitalize text-[#60A5FA]">
                    {a.category.replace("_", " ")}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#F1F5F9]">
                    {a.parameter}
                    {a.observedValue !== undefined && (
                      <span className="ml-1 text-[#94A3B8] font-normal">
                        ({a.observedValue} {a.unit})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#94A3B8] max-w-[140px] truncate">
                    {a.limitOrRule || "N/A"}
                  </td>
                  <td className="py-2.5 px-3 text-[#94A3B8] font-sans text-xs max-w-[280px]">
                    {a.explanation}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {a.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#34D399]">
                        <Check className="h-3 w-3" /> Acked
                      </span>
                    ) : (
                      <button
                        onClick={() => onAcknowledge(a.id)}
                        className="rounded bg-[#172338] border border-[#1E293B] px-2 py-1 text-[11px] font-semibold text-[#22D3EE] hover:border-[#22D3EE]/50 hover:bg-[#22D3EE]/10 transition-all"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
