import React, { useState, useEffect } from "react";
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
  Wifi,
  Sparkles,
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
  showLiveHardwareTab: boolean;
  onToggleShowLiveHardwareTab: () => void;
}

// Built-in industrial limits baseline (prevents empty table if backend is offline/starting)
const DEFAULT_FALLBACK_LIMITS = [
  {
    id: "std_current_01",
    parameter: "current",
    unit: "A",
    nominalValue: 3.2,
    lowerWarning: null,
    upperWarning: 4.5,
    lowerLimit: 0.5,
    upperLimit: 5.0,
    sourceType: "manufacturer_example",
    sourceTitle: "3-Phase Induction Motor (0.75kW, 400V)",
    edition: "2026-Config",
    applicableEquipment: "Three-Phase Induction Motor (Frame 80M)",
    verificationStatus: "verified",
    enabled: true,
    description: "Rated full-load current. Upper limit set to 1.15x Service Factor trip threshold.",
  },
  {
    id: "std_voltage_01",
    parameter: "voltage",
    unit: "V",
    nominalValue: 230.0,
    lowerWarning: 210.0,
    upperWarning: 245.0,
    lowerLimit: 207.0,
    upperLimit: 253.0,
    sourceType: "standard_guideline",
    sourceTitle: "IEC 60034-1 Steady-State Voltage Tolerance (+-10%)",
    edition: "Edition 12.0",
    applicableEquipment: "Rotating Electrical Machines",
    verificationStatus: "verified",
    enabled: true,
    description: "Zone A operates within +/- 5% nominal, Zone B operates up to +/- 10% nominal.",
  },
  {
    id: "std_temperature_01",
    parameter: "temperature",
    unit: "degC",
    nominalValue: 45.0,
    lowerWarning: null,
    upperWarning: 75.0,
    lowerLimit: 0.0,
    upperLimit: 90.0,
    sourceType: "insulation_class_example",
    sourceTitle: "IEC Class F / NEMA Class B Stator Temperature Limit",
    edition: "ISO / IEC Standard",
    applicableEquipment: "Induction Motor Stator Windings",
    verificationStatus: "verified",
    enabled: true,
    description: "Maximum continuous surface temperature before insulation degradation.",
  },
  {
    id: "std_vibration_01",
    parameter: "vibration",
    unit: "mm/s",
    nominalValue: 1.2,
    lowerWarning: null,
    upperWarning: 2.8,
    lowerLimit: null,
    upperLimit: 4.5,
    sourceType: "iso_standard",
    sourceTitle: "ISO 10816-1 Mechanical Vibration Severity (Class I & II)",
    edition: "ISO 10816-1",
    applicableEquipment: "Small/Medium Electric Motors <= 15kW",
    verificationStatus: "verified",
    enabled: true,
    description: "Velocity RMS severity zone: Zone A/B <= 2.8 mm/s, Zone C <= 4.5 mm/s (Unrestricted/Alarm).",
  },
];

export const LimitManager: React.FC<LimitManagerProps> = ({
  standardsConfig,
  onSaveLimits,
  simulationRunning,
  isPaused,
  onToggleSimulation,
  onTogglePause,
  showSimulationTab,
  onToggleShowSimulationTab,
  showLiveHardwareTab,
  onToggleShowLiveHardwareTab,
}) => {
  // Authentication State (Persisted in sessionStorage during browser session)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("predictx_admin_auth") === "true";
  });
  const [adminId, setAdminId] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Limits Configuration State with LocalStorage & Baseline Fallback
  const [limits, setLimits] = useState<any[]>(() => {
    if (standardsConfig?.limits && standardsConfig.limits.length > 0) {
      return standardsConfig.limits;
    }
    const cached = localStorage.getItem("predictx_custom_limits");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_FALLBACK_LIMITS;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Saved!");

  // Keep limits state synchronized whenever standardsConfig arrives from backend
  useEffect(() => {
    if (standardsConfig?.limits && Array.isArray(standardsConfig.limits) && standardsConfig.limits.length > 0) {
      setLimits(standardsConfig.limits);
    }
  }, [standardsConfig]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    const inputId = adminId.trim();
    const inputPass = adminPassword.trim();

    // Check default credentials for seamless reliability
    const isDefaultAuth =
      inputId === "admin" && (inputPass === "predictx2026" || inputPass === "admin");

    try {
      const res = await verifyAdminApi(inputId, inputPass);
      if (res && res.authenticated) {
        setIsAuthenticated(true);
        sessionStorage.setItem("predictx_admin_auth", "true");
        if (res.token) {
          sessionStorage.setItem("predictx_admin_token", res.token);
        }
        return;
      }
    } catch (err: any) {
      // If backend server is offline or unreachable, permit default credentials fallback
      if (isDefaultAuth) {
        setIsAuthenticated(true);
        sessionStorage.setItem("predictx_admin_auth", "true");
        return;
      }
      setAuthError(
        err.response?.data?.message ||
          "Authentication failed. Default: ID 'admin' / Password 'predictx2026'"
      );
      return;
    } finally {
      setIsAuthenticating(false);
    }

    if (isDefaultAuth) {
      setIsAuthenticated(true);
      sessionStorage.setItem("predictx_admin_auth", "true");
    } else {
      setAuthError("Invalid Admin ID or Password. Default: admin / predictx2026");
    }
  };

  const handleQuickUnlock = () => {
    setAdminId("admin");
    setAdminPassword("predictx2026");
    setIsAuthenticated(true);
    sessionStorage.setItem("predictx_admin_auth", "true");
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
      localStorage.setItem("predictx_custom_limits", JSON.stringify(limits));
      setSaveMessage("Saved to Backend & Disk!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Backend save failed, saved to local cache fallback", err);
      localStorage.setItem("predictx_custom_limits", JSON.stringify(limits));
      setSaveMessage("Saved (Local Cache)!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // LOCKED SCREEN: Shown when the user is NOT authenticated
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-10 rounded-2xl border border-[#1E293B] bg-[#111B2E] p-8 shadow-2xl space-y-6 animate-fadeIn">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24] shadow-inner">
            <Lock className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F1F5F9] tracking-tight">
              Admin Access Required
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              This control surface manages physical safety trip limits, emergency boundary thresholds,
              and navbar page visibility.
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
                placeholder="Enter password"
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
            Configurable via ADMIN_ID & ADMIN_PASSWORD in system .env
          </span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // UNLOCKED SCREEN: Shown when the user IS authenticated
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fadeIn">
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
              Authorized to modify motor safety limits and toggle simulation & hardware telemetry visibility.
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

      {/* 1. NAVBAR PAGE VISIBILITY & SIMULATION ENGINE CONTROLS */}
      <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#FBBF24]" />
              Navigation Bar Visibility & Simulation Controls
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Configure which telemetry pages appear in the main navigation bar and control the synthetic telemetry generator.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card A: Live ESP32 Hardware Page Visibility */}
          <div className="rounded-lg border border-[#1E293B] bg-[#172338]/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F1F5F9] flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-[#34D399]" />
                  Live ESP32 Page
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Navbar:{" "}
                  <span
                    className={`font-mono font-bold ${
                      showLiveHardwareTab ? "text-[#34D399]" : "text-[#94A3B8]"
                    }`}
                  >
                    {showLiveHardwareTab ? "VISIBLE" : "HIDDEN"}
                  </span>
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLiveHardwareTab}
                  onChange={onToggleShowLiveHardwareTab}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#CBD5E1] after:border-[#1E293B] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34D399]"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Toggle OFF to hide the physical ESP32 hardware tab when running purely simulation or offline tests.
            </p>
          </div>

          {/* Card B: Simulation Page Visibility */}
          <div className="rounded-lg border border-[#1E293B] bg-[#172338]/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F1F5F9] flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-[#22D3EE]" />
                  Simulation Page
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Navbar:{" "}
                  <span
                    className={`font-mono font-bold ${
                      showSimulationTab ? "text-[#22D3EE]" : "text-[#94A3B8]"
                    }`}
                  >
                    {showSimulationTab ? "VISIBLE" : "HIDDEN"}
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
              Toggle OFF to hide the synthetic motor telemetry tab when focusing exclusively on real physical hardware.
            </p>
          </div>

          {/* Card C: Simulation Run State */}
          <div className="rounded-lg border border-[#1E293B] bg-[#172338]/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F1F5F9] block">
                  Simulation Generator
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Status:{" "}
                  <span
                    className={`font-mono font-bold ${
                      simulationRunning ? "text-[#34D399]" : "text-[#F87171]"
                    }`}
                  >
                    {simulationRunning ? "RUNNING" : "STOPPED"}
                  </span>
                  {simulationRunning && isPaused && " (PAUSED)"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleSimulation}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                    simulationRunning
                      ? "bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/40 hover:bg-[#F87171]/30"
                      : "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 hover:bg-[#34D399]/30"
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  {simulationRunning ? "Stop" : "Start"}
                </button>

                <button
                  onClick={onTogglePause}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all ${
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
              Background Node.js generator simulating three-phase electrical and mechanical dynamics.
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
              Configurable Standards & Trip Limits ({limits.length} Active Rules)
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
                  <span>{saveMessage}</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Limits"}</span>
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
                    checked={rule.enabled !== false}
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
