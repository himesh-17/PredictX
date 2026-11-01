import React, { useState } from "react";
import {
  Sliders,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Power,
  Play,
  Pause,
  KeyRound,
  User,
  Radio,
  Check,
} from "lucide-react";
import { verifyAdminApi } from "../services/api";

interface LimitManagerProps {
  standardsConfig: any;
  onSaveLimits: (limits: any[], notice?: string) => Promise<any>;
  simulationRunning: boolean;
  isPaused: boolean;
  onToggleSimulation: () => void;
  onTogglePause: () => void;
  showSimulationTab: boolean;
  onToggleShowSimulationTab: () => void;
}

export const LimitManager: React.FC<LimitManagerProps> = ({
  standardsConfig,
  onSaveLimits,
  simulationRunning,
  isPaused,
  onToggleSimulation,
  onTogglePause,
  showSimulationTab,
  onToggleShowSimulationTab,
}) => {
  // Authentication State (Persisted in sessionStorage during browser session)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("predictx_admin_auth") === "true";
  });
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Limits Configuration State
  const [limits, setLimits] = useState<any[]>(standardsConfig?.limits || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const res = await verifyAdminApi(adminId.trim(), adminPassword);
      if (res.authenticated) {
        setIsAuthenticated(true);
        sessionStorage.setItem("predictx_admin_auth", "true");
        if (res.token) {
          sessionStorage.setItem("predictx_admin_token", res.token);
        }
      } else {
        setAuthError(res.message || "Invalid Admin ID or Password");
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || "Authentication failed. Check your ID/Password configured in .env");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("predictx_admin_auth");
    sessionStorage.removeItem("predictx_admin_token");
    setAdminPassword("");
    setAuthError(null);
  };

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

  // --------------------------------------------------------------------------
  // LOCKED SCREEN: Shown when the user is NOT authenticated
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 rounded-2xl border border-[#1E293B] bg-[#111B2E] p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24] shadow-inner">
            <Lock className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F1F5F9] tracking-tight">
              Restricted Access: System Administration
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              This control surface manages physical safety trip boundaries, standards limits, and simulation telemetry modes.
              Please authenticate with your Admin ID and Password.
            </p>
          </div>
        </div>

        {authError && (
          <div className="rounded-lg bg-[#F87171]/15 border border-[#F87171]/40 p-3 text-xs text-[#F87171] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#94A3B8]">
              Admin ID / Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="e.g. admin"
                className="w-full rounded-lg bg-[#0B1220] border border-[#1E293B] pl-9 pr-3 py-2 text-xs text-[#F1F5F9] focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#94A3B8]">
              Admin Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg bg-[#0B1220] border border-[#1E293B] pl-9 pr-10 py-2 text-xs text-[#F1F5F9] focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#F1F5F9]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#22D3EE] hover:bg-[#22D3EE]/90 text-[#0B1220] font-bold py-2.5 text-xs transition-all shadow-md disabled:opacity-50"
          >
            {isAuthenticating ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                <span>Unlock Control Panel</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[#1E293B] text-center">
          <span className="text-[11px] text-[#64748B] font-mono">
            Protected via ADMIN_ID & ADMIN_PASSWORD in system .env
          </span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // UNLOCKED SCREEN: Shown when the user IS authenticated
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Admin Status & Lock Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#34D399]/30 bg-[#34D399]/5 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#34D399]/20 flex items-center justify-center text-[#34D399]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F1F5F9]">Admin Control Mode Active</span>
              <span className="rounded-full bg-[#34D399]/20 text-[#34D399] px-2 py-0.5 text-[10px] font-mono font-semibold">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Authorized to modify motor safety limits and toggle simulation telemetry visibility.
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-[#172338] border border-[#1E293B] hover:border-[#F87171]/40 px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F87171] transition-all"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Lock / Sign Out</span>
        </button>
      </div>

      {/* 1. SIMULATION CONTROLS & NAVBAR VISIBILITY CARD */}
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#FBBF24]" />
              Simulation Engine & Navbar Visibility Controls
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Control the synthetic motor telemetry generator and configure whether the simulation page appears in the navbar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card A: Simulation Run State */}
          <div className="rounded-lg border border-[#1E293B] bg-[#172338]/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F1F5F9] block">
                  Simulation Engine State
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Status:{" "}
                  <span
                    className={`font-mono font-bold ${
                      simulationRunning ? "text-[#34D399]" : "text-[#F87171]"
                    }`}
                  >
                    {simulationRunning ? "RUNNING (1000ms)" : "STOPPED"}
                  </span>
                  {simulationRunning && isPaused && " — PAUSED"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSimulation}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                    simulationRunning
                      ? "bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/40 hover:bg-[#F87171]/30"
                      : "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 hover:bg-[#34D399]/30"
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  {simulationRunning ? "Stop Sim" : "Start Sim"}
                </button>

                <button
                  onClick={onTogglePause}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                    isPaused
                      ? "bg-[#60A5FA]/20 text-[#60A5FA] border-[#60A5FA]/40 hover:bg-[#60A5FA]/30"
                      : "bg-[#172338] text-[#94A3B8] border-[#1E293B] hover:text-[#F1F5F9]"
                  }`}
                >
                  {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  {isPaused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Controls the background Node.js mathematical telemetry generator for testing trip thresholds and AI isolation forest detection.
            </p>
          </div>

          {/* Card B: Simulation Page Visibility in Navbar */}
          <div className="rounded-lg border border-[#1E293B] bg-[#172338]/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F1F5F9] block">
                  Navbar Simulation Page
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Visibility:{" "}
                  <span
                    className={`font-mono font-bold ${
                      showSimulationTab ? "text-[#22D3EE]" : "text-[#94A3B8]"
                    }`}
                  >
                    {showSimulationTab ? "VISIBLE IN NAVBAR" : "HIDDEN (HARDWARE-ONLY FOCUS)"}
                  </span>
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSimulationTab}
                  onChange={onToggleShowSimulationTab}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#CBD5E1] after:border-[#1E293B] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22D3EE]"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Toggle this OFF to hide the "Telemetry & Charts (Simulation)" tab from the navbar, presenting a streamlined interface dedicated to real ESP32 hardware.
            </p>
          </div>
        </div>
      </div>

      {/* 2. CONFIGURABLE STANDARDS & LIMITS MANAGER */}
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E293B] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#22D3EE]" />
              Configurable Standards & Trip Limits Manager
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
    </div>
  );
};
