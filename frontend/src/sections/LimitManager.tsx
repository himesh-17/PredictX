import React, { useState } from "react";
import { Sliders, Save, Plus, Trash2, CheckCircle2, RotateCcw } from "lucide-react";

interface LimitManagerProps {
  standardsConfig: any;
  onSaveLimits: (limits: any[], notice?: string) => Promise<any>;
}

export const LimitManager: React.FC<LimitManagerProps> = ({
  standardsConfig,
  onSaveLimits,
}) => {
  const [limits, setLimits] = useState<any[]>(standardsConfig?.limits || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFieldChange = (index: number, field: string, value: any) => {
    const updated = [...limits];
    updated[index] = { ...updated[index], [field]: value };
    setLimits(updated);
  };

  const handleToggleEnable = (index: number) => {
    const updated = [...limits];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setLimits(updated);
  };

  const handleAddRule = () => {
    const newRule = {
      id: `custom_std_${Date.now()}`,
      parameter: "current",
      unit: "A",
      nominalValue: 3.2,
      lowerWarning: null,
      upperWarning: 4.5,
      lowerLimit: 0.5,
      upperLimit: 5.0,
      sourceType: "user_configured",
      sourceTitle: "Custom User Limit",
      edition: "2026-Config",
      applicableEquipment: "3-Phase Induction Motor",
      verificationStatus: "user_verified",
      enabled: true,
      description: "User customized threshold rule",
    };
    setLimits([...limits, newRule]);
  };

  const handleDeleteRule = (index: number) => {
    setLimits(limits.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveLimits(limits);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save limits configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E293B] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#22D3EE]" />
            Configurable Standards & Limits Manager
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Directly set and manage your motor operational limits, warning levels, and trip boundaries in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRule}
            className="flex items-center gap-1.5 rounded-lg bg-[#172338] border border-[#1E293B] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#22D3EE]/40 transition-all"
          >
            <Plus className="h-3.5 w-3.5 text-[#22D3EE]" />
            Add Rule
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#22D3EE]/20 border border-[#22D3EE]/40 px-3.5 py-1.5 text-xs font-bold text-[#22D3EE] hover:bg-[#22D3EE]/30 transition-all disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399]" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Saving..." : "Save Limits"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Limits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {limits.map((rule, idx) => (
          <div
            key={rule.id || idx}
            className={`rounded-lg border p-4 transition-all ${
              rule.enabled
                ? "border-[#1E293B] bg-[#172338]/80"
                : "border-[#1E293B]/50 bg-[#172338]/30 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-[#1E293B] pb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggleEnable(idx)}
                  className="rounded border-[#1E293B] text-[#22D3EE] focus:ring-0"
                />
                <span className="font-bold text-sm text-[#F1F5F9] uppercase font-mono">
                  {rule.parameter}
                </span>
                <span className="text-xs text-[#94A3B8]">({rule.unit})</span>
              </div>

              <button
                onClick={() => handleDeleteRule(idx)}
                className="text-[#94A3B8] hover:text-[#F87171] transition-colors p-1"
                title="Delete rule"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-[#94A3B8] block mb-1">
                  Lower Limit (Trip Min)
                </label>
                <input
                  type="number"
                  step="any"
                  value={rule.lowerLimit ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      idx,
                      "lowerLimit",
                      e.target.value === "" ? null : parseFloat(e.target.value)
                    )
                  }
                  placeholder="None"
                  className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 text-xs text-[#F1F5F9] font-mono focus:border-[#22D3EE] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#94A3B8] block mb-1">
                  Upper Limit (Trip Max)
                </label>
                <input
                  type="number"
                  step="any"
                  value={rule.upperLimit ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      idx,
                      "upperLimit",
                      e.target.value === "" ? null : parseFloat(e.target.value)
                    )
                  }
                  placeholder="None"
                  className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 text-xs text-[#F1F5F9] font-mono focus:border-[#22D3EE] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#94A3B8] block mb-1">
                  Lower Warning
                </label>
                <input
                  type="number"
                  step="any"
                  value={rule.lowerWarning ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      idx,
                      "lowerWarning",
                      e.target.value === "" ? null : parseFloat(e.target.value)
                    )
                  }
                  placeholder="None"
                  className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 text-xs text-[#F1F5F9] font-mono focus:border-[#22D3EE] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#94A3B8] block mb-1">
                  Upper Warning
                </label>
                <input
                  type="number"
                  step="any"
                  value={rule.upperWarning ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      idx,
                      "upperWarning",
                      e.target.value === "" ? null : parseFloat(e.target.value)
                    )
                  }
                  placeholder="None"
                  className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 text-xs text-[#F1F5F9] font-mono focus:border-[#22D3EE] outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[11px] text-[#94A3B8] block mb-1">
                Standard / Nameplate Reference Title
              </label>
              <input
                type="text"
                value={rule.sourceTitle || ""}
                onChange={(e) => handleFieldChange(idx, "sourceTitle", e.target.value)}
                placeholder="e.g. IEC 60034-1 or Motor Nameplate Service Factor"
                className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 text-xs text-[#F1F5F9] focus:border-[#22D3EE] outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
