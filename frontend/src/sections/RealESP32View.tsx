import React, { useState } from "react";
import { Cpu, Wifi, WifiOff, RefreshCw, Send, CheckCircle2, ShieldCheck, FileCode } from "lucide-react";
import { SensorReading, ReadingAssessmentResult } from "../types";
import { SensorCards } from "./SensorCards";
import { LiveCharts } from "./LiveCharts";
import axios from "axios";

interface RealESP32ViewProps {
  latestReading: SensorReading | null;
  readingsHistory: SensorReading[];
  standardsAssessment: ReadingAssessmentResult | null;
}

export const RealESP32View: React.FC<RealESP32ViewProps> = ({
  latestReading,
  readingsHistory,
  standardsAssessment,
}) => {
  const [isInjectingManual, setIsInjectingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Manual test values to verify hardware ingestion endpoint directly from browser
  const [mCurrent, setMCurrent] = useState(3.24);
  const [mVoltage, setMVoltage] = useState(230.5);
  const [mTemp, setMTemp] = useState(44.2);
  const [mVib, setMVib] = useState(0.125);

  const hasHardwareData = readingsHistory.length > 0;
  const lastSeenSecondsAgo = latestReading
    ? Math.max(0, Math.floor((Date.now() - new Date(latestReading.timestamp).getTime()) / 1000))
    : null;

  const isHardwareLive = lastSeenSecondsAgo !== null && lastSeenSecondsAgo < 10;

  const handleSimulateHardwarePacket = async () => {
    setIsInjectingManual(true);
    try {
      await axios.post("/api/v1/readings", {
        motorId: "MOTOR-001",
        source: "hardware_esp32",
        quality: "valid",
        current: { value: parseFloat(mCurrent.toString()), unit: "A" },
        voltage: { value: parseFloat(mVoltage.toString()), unit: "V" },
        temperature: { value: parseFloat(mTemp.toString()), unit: "degC" },
        vibration: { value: parseFloat(mVib.toString()), unit: "g_rms", axis: "X" },
      });
      setManualSuccess(true);
      setTimeout(() => setManualSuccess(false), 2500);
    } catch (e) {
      console.error(e);
      alert("Failed to send test hardware telemetry.");
    } finally {
      setIsInjectingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hardware Connection Banner */}
      <div className={`rounded-xl border p-5 transition-all ${
        isHardwareLive
          ? "border-[#34D399]/40 bg-[#34D399]/10"
          : "border-[#60A5FA]/40 bg-[#172338]/90"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
              isHardwareLive
                ? "border-[#34D399]/50 bg-[#34D399]/20 text-[#34D399]"
                : "border-[#60A5FA]/50 bg-[#60A5FA]/20 text-[#60A5FA]"
            }`}>
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#F1F5F9]">
                  Physical Motor Telemetry Channel (ESP32)
                </h3>
                {isHardwareLive ? (
                  <span className="flex items-center gap-1 rounded bg-[#34D399]/20 border border-[#34D399]/40 px-2 py-0.5 text-xs font-bold text-[#34D399]">
                    <Wifi className="h-3.5 w-3.5" /> LIVE CONNECTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded bg-[#FBBF24]/20 border border-[#FBBF24]/40 px-2 py-0.5 text-xs font-bold text-[#FBBF24]">
                    <WifiOff className="h-3.5 w-3.5" /> AWAITING HARDWARE STREAM
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Target Node: ESP32 DevKit V1 (Xtensa 32-bit) | Target Ingestion:{" "}
                <code className="text-[#22D3EE] bg-[#0B1220] px-1.5 py-0.5 rounded font-mono">
                  POST /api/v1/readings
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="text-right">
              <div className="text-[#94A3B8]">Telemetry Packets:</div>
              <div className="font-bold text-[#F1F5F9] text-sm">
                {readingsHistory.length} received
              </div>
            </div>
            {lastSeenSecondsAgo !== null && (
              <div className="text-right border-l border-[#1E293B] pl-3">
                <div className="text-[#94A3B8]">Last Packet:</div>
                <div className={`font-bold text-sm ${isHardwareLive ? "text-[#34D399]" : "text-[#FBBF24]"}`}>
                  {lastSeenSecondsAgo}s ago
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Sensor Cards */}
      <SensorCards
        latestReading={latestReading}
        readingsHistory={readingsHistory}
        standardsAssessment={standardsAssessment}
      />

      {/* Real Live Animated Charts */}
      <LiveCharts readingsHistory={readingsHistory} />

      {/* Manual Hardware Test Simulator & Code Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Test Injection Box */}
        <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
            <h4 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-1.5">
              <Send className="h-4 w-4 text-[#22D3EE]" />
              Test Hardware Ingestion API
            </h4>
            <span className="text-[11px] text-[#94A3B8]">
              Verify ESP32 backend route
            </span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Transmit a simulated hardware packet directly to <code>POST /api/v1/readings</code> with <code>source: "hardware_esp32"</code> to test your charts before powering on the physical motor.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
            <div>
              <label className="text-[10px] text-[#94A3B8] block">Current (A)</label>
              <input
                type="number"
                step="0.01"
                value={mCurrent}
                onChange={(e) => setMCurrent(parseFloat(e.target.value) || 0)}
                className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2 py-1 text-xs text-[#F1F5F9]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#94A3B8] block">Voltage (V)</label>
              <input
                type="number"
                step="0.1"
                value={mVoltage}
                onChange={(e) => setMVoltage(parseFloat(e.target.value) || 0)}
                className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2 py-1 text-xs text-[#F1F5F9]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#94A3B8] block">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={mTemp}
                onChange={(e) => setMTemp(parseFloat(e.target.value) || 0)}
                className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2 py-1 text-xs text-[#F1F5F9]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#94A3B8] block">Vibration (g)</label>
              <input
                type="number"
                step="0.005"
                value={mVib}
                onChange={(e) => setMVib(parseFloat(e.target.value) || 0)}
                className="w-full rounded bg-[#0B1220] border border-[#1E293B] px-2 py-1 text-xs text-[#F1F5F9]"
              />
            </div>
          </div>

          <button
            onClick={handleSimulateHardwarePacket}
            disabled={isInjectingManual}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#22D3EE]/20 border border-[#22D3EE]/40 py-2 text-xs font-bold text-[#22D3EE] hover:bg-[#22D3EE]/30 transition-all disabled:opacity-50"
          >
            {manualSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                Hardware Telemetry Packet Ingested!
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isInjectingManual ? "Ingesting..." : "Send Test ESP32 Reading to Live Feed"}
              </>
            )}
          </button>
        </div>

        {/* ESP32 Code Reference Card */}
        <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
            <h4 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-[#60A5FA]" />
              ESP32 Arduino Firmware Ready
            </h4>
            <span className="text-[11px] font-mono text-[#34D399]">
              hardware/esp32_firmware.ino
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Your microcontroller code is generated at <code className="text-[#F1F5F9] bg-[#0B1220] px-1 rounded">hardware/esp32_firmware.ino</code>. It includes:
          </p>
          <ul className="text-xs text-[#94A3B8] space-y-1 list-disc list-inside">
            <li>True RMS calculation over 1000 ADC samples (1 kHz sampling rate)</li>
            <li>MPU6050 I2C accelerometer acceleration RMS computation</li>
            <li>DS18B20 1-Wire temperature acquisition</li>
            <li>WiFi client HTTP POST transmission to backend <code>/api/v1/readings</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
