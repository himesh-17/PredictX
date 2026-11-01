import React from "react";
import {
  Activity,
  Cpu,
  Play,
  Pause,
  Power,
  Radio,
  RefreshCw,
  Server,
  LineChart,
  ShieldAlert,
  Bell,
  Sliders,
  Wifi,
  BookOpen,
  Users,
} from "lucide-react";

export type NavTab = "live_esp32" | "sim_telemetry" | "standards_ai" | "alerts_history" | "manage_limits" | "about_project" | "team";

interface HeaderProps {
  motorId: string;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendConnected: boolean;
  aiServiceOnline: boolean;
  simulationRunning: boolean;
  isPaused: boolean;
  lastUpdated: string;
  unreadAlertCount: number;
  showSimulationTab?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  motorId,
  activeTab,
  onTabChange,
  backendConnected,
  aiServiceOnline,
  simulationRunning,
  isPaused,
  lastUpdated,
  unreadAlertCount,
  showSimulationTab = true,
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : "--:--:--";

  return (
    <header className="border-b border-[#1E293B] bg-[#111B2E] px-4 py-3 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] shadow-sm">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#F1F5F9]">
                Predict <span className="text-[#22D3EE]">X</span>
              </h1>
              <span className="rounded bg-[#172338] px-2 py-0.5 text-xs font-mono font-medium text-[#22D3EE] border border-[#22D3EE]/20">
                v1.2-IoT
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Predictive Maintenance & Standards Assessment for 3-Phase AC Induction Motor
            </p>
          </div>
        </div>

        {/* Center / System Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Motor Pill */}
          <div className="flex items-center gap-2 rounded-md bg-[#172338] px-3 py-1.5 border border-[#1E293B] text-xs">
            <Cpu className="h-3.5 w-3.5 text-[#60A5FA]" />
            <span className="text-[#94A3B8]">Unit:</span>
            <span className="font-mono font-semibold text-[#F1F5F9]">{motorId}</span>
          </div>

          {/* Backend Connection */}
          <div className="flex items-center gap-1.5 rounded-md bg-[#172338] border border-[#1E293B] px-3 py-1.5 text-xs">
            <Server className="h-3.5 w-3.5 text-[#94A3B8]" />
            <span className="text-[#94A3B8]">Backend:</span>
            {backendConnected ? (
              <span className="flex items-center gap-1 font-medium text-[#34D399]">
                <span className="h-2 w-2 rounded-full bg-[#34D399]"></span> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-[#F87171]">
                <span className="h-2 w-2 rounded-full bg-[#F87171]"></span> Offline
              </span>
            )}
          </div>

          {/* AI Service Status */}
          <div className="flex items-center gap-1.5 rounded-md bg-[#172338] border border-[#1E293B] px-3 py-1.5 text-xs">
            <span className="text-[#94A3B8]">AI Engine:</span>
            {aiServiceOnline ? (
              <span className="font-medium text-[#22D3EE]">Online</span>
            ) : (
              <span className="font-medium text-[#FBBF24]">Offline</span>
            )}
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-1.5 rounded-md bg-[#172338] border border-[#1E293B] px-3 py-1.5 text-xs font-mono text-[#94A3B8]">
            <RefreshCw className="h-3 w-3" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* System Status Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md bg-[#172338] border border-[#1E293B] px-3 py-1.5 text-xs font-mono text-[#94A3B8]">
            <Radio className="h-3 w-3 text-[#22D3EE] animate-pulse" />
            <span>Telemetry Bus Active</span>
          </div>
        </div>
      </div>

      {/* Navigation Bar with Feature Tabs */}
      <nav className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#1E293B]/70 pt-3">
        <button
          onClick={() => onTabChange("live_esp32")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "live_esp32"
              ? "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/50 shadow-sm"
              : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9] hover:bg-[#172338]/80"
          }`}
        >
          <Wifi className="h-3.5 w-3.5" />
          <span>Live ESP32 Hardware</span>
          <span className="rounded-full bg-[#34D399]/20 text-[#34D399] px-1.5 py-0.2 text-[10px]">Real</span>
        </button>

        {showSimulationTab && (
          <button
            onClick={() => onTabChange("sim_telemetry")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "sim_telemetry"
                ? "bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/50 shadow-sm"
                : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9] hover:bg-[#172338]/80"
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            <span>Telemetry & Charts</span>
            <span className="rounded-full bg-[#FBBF24]/20 text-[#FBBF24] px-1.5 py-0.2 text-[10px]">Simulation</span>
          </button>
        )}

        <button
          onClick={() => onTabChange("standards_ai")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "standards_ai"
              ? "bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/50 shadow-sm"
              : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9] hover:bg-[#172338]/80"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Standards & AI Pipeline</span>
        </button>

        <button
          onClick={() => onTabChange("alerts_history")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "alerts_history"
              ? "bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/50 shadow-sm"
              : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9] hover:bg-[#172338]/80"
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Alerts & Recent Feed</span>
          {unreadAlertCount > 0 && (
            <span className="rounded-full bg-[#F87171] text-white px-1.5 py-0.2 text-[10px] font-bold">
              {unreadAlertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange("manage_limits")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "manage_limits"
              ? "bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/50 shadow-sm"
              : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9] hover:bg-[#172338]/80"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Manage Limits</span>
        </button>

        <button
          onClick={() => onTabChange("about_project")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "about_project"
              ? "bg-[#A855F7]/20 text-[#C084FC] border border-[#A855F7]/50 shadow-sm"
              : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9] hover:bg-[#172338]/80"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>About Project & Architecture</span>
        </button>

        <button
          onClick={() => onTabChange("team")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "team"
              ? "bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/50 shadow-sm"
              : "bg-[#172338] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9] hover:bg-[#172338]/80"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team & Mentors</span>
        </button>
      </nav>
    </header>
  );
};
