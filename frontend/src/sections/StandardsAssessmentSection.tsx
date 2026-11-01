import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ShieldAlert } from "lucide-react";
import { ReadingAssessmentResult } from "../types";

interface StandardsAssessmentSectionProps {
  assessment: ReadingAssessmentResult | null;
  standardsConfig: any;
}

export const StandardsAssessmentSection: React.FC<StandardsAssessmentSectionProps> = ({
  assessment,
  standardsConfig,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WITHIN_CONFIGURED_LIMIT":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#34D399]/20 border border-[#34D399]/40 px-2.5 py-0.5 text-xs font-semibold text-[#34D399]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            WITHIN LIMIT
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#FBBF24]/20 border border-[#FBBF24]/40 px-2.5 py-0.5 text-xs font-semibold text-[#FBBF24]">
            <AlertTriangle className="h-3.5 w-3.5" />
            WARNING
          </span>
        );
      case "OUT_OF_LIMIT":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#F87171]/20 border border-[#F87171]/40 px-2.5 py-0.5 text-xs font-semibold text-[#F87171]">
            <XCircle className="h-3.5 w-3.5" />
            OUT OF LIMIT
          </span>
        );
      case "LIMITS_NOT_CONFIGURED":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#172338] border border-[#1E293B] px-2.5 py-0.5 text-xs font-medium text-[#94A3B8]">
            <HelpCircle className="h-3.5 w-3.5" />
            NOT CONFIGURED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#172338] border border-[#1E293B] px-2.5 py-0.5 text-xs font-medium text-[#94A3B8]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1E293B] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#22D3EE]" />
            Standards-Based Engineering Assessment
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Deterministic assessment against documented electromechanical limits (Independent of AI heuristics)
          </p>
        </div>
        <div className="text-xs font-mono text-[#94A3B8]">
          Last Eval: {assessment?.timestamp ? new Date(assessment.timestamp).toLocaleTimeString() : "--:--:--"}
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/10 p-3 text-xs text-[#FBBF24]">
        <div className="font-semibold mb-0.5">ENGINEERING NOTICE:</div>
        <div>
          {standardsConfig?.notice ||
            "DEMO CONFIGURATION — NOT AN OFFICIAL STANDARD. Limits must be verified against motor nameplate and manufacturer engineering data."}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#172338] text-[#94A3B8] border-b border-[#1E293B]">
            <tr>
              <th className="py-2.5 px-3 font-semibold uppercase">Parameter</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Observed Value</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Applicable Limit</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Source / Standard</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Status</th>
              <th className="py-2.5 px-3 font-semibold uppercase">Engineering Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-[#F1F5F9]">
            {assessment?.evaluations?.map((ev, i) => {
              const cfg = ev.limitConfig;
              return (
                <tr key={i} className="hover:bg-[#172338]/50 transition-colors">
                  <td className="py-3 px-3 font-bold capitalize text-[#22D3EE]">
                    {ev.parameter}
                  </td>
                  <td className="py-3 px-3 font-bold text-sm">
                    {ev.value !== undefined ? ev.value.toFixed(2) : "--"}{" "}
                    <span className="text-xs font-normal text-[#94A3B8]">{ev.unit}</span>
                  </td>
                  <td className="py-3 px-3 text-[#94A3B8]">
                    {cfg?.lowerLimit !== null && cfg?.lowerLimit !== undefined
                      ? `${cfg.lowerLimit} - ${cfg.upperLimit} ${cfg.unit}`
                      : cfg?.upperLimit !== null && cfg?.upperLimit !== undefined
                      ? `Max: ${cfg.upperLimit} ${cfg.unit}`
                      : "Unconfigured"}
                  </td>
                  <td className="py-3 px-3 text-[#94A3B8]">
                    <div>{cfg?.sourceTitle || "Unverified Demo"}</div>
                    <div className="text-[10px] text-[#64748B]">{cfg?.edition || ""}</div>
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(ev.status)}</td>
                  <td className="py-3 px-3 text-[#94A3B8] font-sans text-xs">
                    {ev.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
