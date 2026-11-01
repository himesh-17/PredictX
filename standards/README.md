# Engineering Standards & Measurement Assessment Module

## Overview
This module provides an independent, deterministic engineering assessment layer for AC induction motor parameters. It evaluates incoming telemetry against documented thresholds without relying on machine learning heuristics.

### Critical Engineering Principles:
1. **No Universal Thresholds:** A vibration limit for a 500 kW rigid-mount pump motor (ISO 10816-3 Class III) does **not** apply to a 1 kW flexible-mount laboratory motor.
2. **Measurement Quantity Compatibility:**
   - **Velocity RMS ($mm/s$ RMS)**: Standard metric for ISO 10816/20816 (general mechanical imbalance and misalignment).
   - **Acceleration RMS ($g$ RMS or $m/s^2$ RMS)**: Standard metric for high-frequency bearing impacting and gearmesh.
   - These units **cannot be compared directly** without frequency integration.
3. **Thermal Limits:** Stator winding insulation classes (Class B: 130°C, Class F: 155°C, Class H: 180°C) define internal winding hotspot limits, whereas external frame temperature sensors measure lower, thermal-lagged surface temperatures.
4. **Demo Configurations:** The provided `limits.json` is explicitly marked as a **DEMO CONFIGURATION — NOT AN OFFICIAL STANDARD**. Production deployments require manufacturer nameplate verification.
