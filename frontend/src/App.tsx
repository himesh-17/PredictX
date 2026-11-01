import React, { useState } from "react";
import { useTelemetry } from "./hooks/useTelemetry";
import { Header, NavTab } from "./sections/Header";
import { StatusOverview } from "./sections/StatusOverview";
import { SensorCards } from "./sections/SensorCards";
import { LiveCharts } from "./sections/LiveCharts";
import { StandardsAssessmentSection } from "./sections/StandardsAssessmentSection";
import { AIAnomalySection } from "./sections/AIAnomalySection";
import { AlertsTable } from "./sections/AlertsTable";
import { RecentTelemetryTable } from "./sections/RecentTelemetryTable";
import { RealESP32View } from "./sections/RealESP32View";
import { LimitManager } from "./sections/LimitManager";
import { AboutProject } from "./sections/AboutProject";
import { TeamPage } from "./sections/TeamPage";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("live_esp32");

  const {
    simHistory,
    latestSimReading,
    simAssessment,
    hardwareHistory,
    latestHardwareReading,
    hardwareAssessment,
    aiPrediction,
    alerts,
    modelCard,
    standardsConfig,
    backendConnected,
    aiServiceOnline,
    simulationRunning,
    isPaused,
    activeDisturbance,
    disturbanceSeconds,
    lastUpdated,
    toggleSimulation,
    togglePause,
    injectDisturbance,
    acknowledgeAlert,
    runIntegrationTest,
    updateLimitsConfig,
  } = useTelemetry();

  const unacknowledgedAlertCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F1F5F9] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header & Navigation Bar */}
      <Header
        motorId="MOTOR-001"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendConnected={backendConnected}
        aiServiceOnline={aiServiceOnline}
        simulationRunning={simulationRunning}
        isPaused={isPaused}
        lastUpdated={lastUpdated}
        onToggleSimulation={toggleSimulation}
        onTogglePause={togglePause}
        unreadAlertCount={unacknowledgedAlertCount}
      />

      {/* Main Feature Content Container */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: REAL ESP32 HARDWARE STREAM */}
        {activeTab === "live_esp32" && (
          <div className="space-y-6 animate-fadeIn">
            <RealESP32View
              latestReading={latestHardwareReading}
              readingsHistory={hardwareHistory}
              standardsAssessment={hardwareAssessment}
            />
          </div>
        )}

        {/* TAB 2: SIMULATION TELEMETRY & LIVE CHARTS */}
        {activeTab === "sim_telemetry" && (
          <div className="space-y-6 animate-fadeIn">
            <StatusOverview
              latestReading={latestSimReading}
              standardsAssessment={simAssessment}
              aiPrediction={aiPrediction}
              activeAlertCount={unacknowledgedAlertCount}
              activeDisturbance={activeDisturbance}
              disturbanceSeconds={disturbanceSeconds}
              onInjectDisturbance={injectDisturbance}
            />

            <SensorCards
              latestReading={latestSimReading}
              readingsHistory={simHistory}
              standardsAssessment={simAssessment}
            />

            <LiveCharts readingsHistory={simHistory} />
          </div>
        )}

        {/* TAB 3: STANDARDS ASSESSMENT & AI PIPELINE */}
        {activeTab === "standards_ai" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Standards Assessment Section (Uses active hardware reading if available, else simulation) */}
            <StandardsAssessmentSection
              assessment={latestHardwareReading ? hardwareAssessment : simAssessment}
              standardsConfig={standardsConfig}
            />

            {/* AI Anomaly Detection Pipeline */}
            <AIAnomalySection
              prediction={aiPrediction}
              modelCard={modelCard}
              onRunIntegrationTest={runIntegrationTest}
            />
          </div>
        )}

        {/* TAB 4: ALERTS, EVENT HISTORY & RECENT FEED */}
        {activeTab === "alerts_history" && (
          <div className="space-y-6 animate-fadeIn">
            <AlertsTable alerts={alerts} onAcknowledge={acknowledgeAlert} />

            <RecentTelemetryTable
              readings={hardwareHistory.length > 0 ? hardwareHistory : simHistory}
            />
          </div>
        )}

        {/* TAB 5: MANAGE LIMITS */}
        {activeTab === "manage_limits" && (
          <div className="space-y-6 animate-fadeIn">
            <LimitManager
              standardsConfig={standardsConfig}
              onSaveLimits={updateLimitsConfig}
            />
          </div>
        )}

        {/* TAB 6: ABOUT THE PROJECT & ARCHITECTURE */}
        {activeTab === "about_project" && (
          <div className="space-y-6 animate-fadeIn">
            <AboutProject />
          </div>
        )}

        {/* TAB 7: TEAM MEMBERS & MENTORS */}
        {activeTab === "team" && (
          <div className="space-y-6 animate-fadeIn">
            <TeamPage />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] bg-[#111B2E] py-4 px-6 text-center text-xs text-[#94A3B8]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <div>
            Predict X — IoT Predictive Maintenance Platform for Three-Phase AC Induction Motors
          </div>
          <div className="font-mono text-[11px] text-[#64748B]">
            Firmware: hardware/esp32_firmware.ino | Backend: Node.js/Express:5000 | AI: FastAPI:8000
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
