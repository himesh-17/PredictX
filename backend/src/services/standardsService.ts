import fs from "fs";
import path from "path";
import {
  AssessmentStatus,
  ParameterAssessment,
  ReadingAssessmentResult,
  SensorReading,
} from "../types/index";
import { logger } from "../utils/logger";

const LIMITS_PATH = path.resolve(__dirname, "../../../standards/limits.json");

export class StandardsService {
  private limitsConfig: any = null;

  constructor() {
    this.loadLimits();
  }

  loadLimits() {
    try {
      if (fs.existsSync(LIMITS_PATH)) {
        const raw = fs.readFileSync(LIMITS_PATH, "utf-8");
        this.limitsConfig = JSON.parse(raw);
        logger.info({ limitCount: this.limitsConfig?.limits?.length }, "Standards limits loaded");
      } else {
        this.limitsConfig = { notice: "LIMITS_NOT_CONFIGURED", limits: [] };
      }
    } catch (err) {
      logger.error({ err }, "Failed to load standards limits");
      this.limitsConfig = { notice: "LIMITS_NOT_CONFIGURED", limits: [] };
    }
  }

  getConfig() {
    return this.limitsConfig;
  }

  updateLimits(newLimits: any[], customNotice?: string) {
    try {
      this.limitsConfig = {
        schemaVersion: this.limitsConfig?.schemaVersion || "1.0.0",
        notice: customNotice || "USER MANAGED LIMITS — Custom operating thresholds configured via Predict X Dashboard.",
        limits: newLimits,
      };
      fs.writeFileSync(LIMITS_PATH, JSON.stringify(this.limitsConfig, null, 2), "utf-8");
      logger.info({ limitCount: newLimits.length }, "Standards limits successfully updated and persisted");
      return { success: true, config: this.limitsConfig };
    } catch (err: any) {
      logger.error({ err }, "Failed to persist updated limits to disk");
      throw new Error(`Failed to save limits configuration: ${err.message}`);
    }
  }

  evaluateReading(reading: SensorReading): ReadingAssessmentResult {
    const evaluations: ParameterAssessment[] = [];
    let overallStatus: AssessmentStatus = "WITHIN_CONFIGURED_LIMIT";

    const params: (keyof Pick<SensorReading, "current" | "voltage" | "temperature" | "vibration">)[] = [
      "current",
      "voltage",
      "temperature",
      "vibration",
    ];

    for (const p of params) {
      const sensor = reading[p];
      const val = sensor?.value;
      const unit = sensor?.unit || "";

      const matched = this.limitsConfig?.limits?.find(
        (l: any) => l.parameter?.toLowerCase() === p.toLowerCase() && l.enabled
      );

      if (!matched) {
        evaluations.push({
          parameter: p,
          value: val,
          unit,
          status: "LIMITS_NOT_CONFIGURED",
          explanation: `No verified engineering limit enabled for ${p}.`,
        });
        if (overallStatus === "WITHIN_CONFIGURED_LIMIT") {
          overallStatus = "LIMITS_NOT_CONFIGURED";
        }
        continue;
      }

      if (val === undefined || val === null || isNaN(val)) {
        evaluations.push({
          parameter: p,
          status: "INSUFFICIENT_DATA",
          explanation: `Missing sensor reading for ${p}.`,
          limitConfig: matched,
        });
        overallStatus = "WARNING";
        continue;
      }

      // Check unit
      if (matched.unit && matched.unit.toLowerCase() !== unit.toLowerCase()) {
        evaluations.push({
          parameter: p,
          value: val,
          unit,
          status: "NOT_APPLICABLE",
          explanation: `Unit mismatch: reading is ${unit}, limit expects ${matched.unit}.`,
          limitConfig: matched,
        });
        continue;
      }

      const { lowerLimit, upperLimit, lowerWarning, upperWarning } = matched;

      // Critical Checks
      if (upperLimit !== null && upperLimit !== undefined && val > upperLimit) {
        evaluations.push({
          parameter: p,
          value: val,
          unit,
          status: "OUT_OF_LIMIT",
          explanation: `${p} (${val} ${unit}) exceeded upper limit of ${upperLimit} ${unit} (${matched.sourceTitle}).`,
          limitConfig: matched,
        });
        overallStatus = "OUT_OF_LIMIT";
        continue;
      }

      if (lowerLimit !== null && lowerLimit !== undefined && val < lowerLimit) {
        evaluations.push({
          parameter: p,
          value: val,
          unit,
          status: "OUT_OF_LIMIT",
          explanation: `${p} (${val} ${unit}) fell below lower limit of ${lowerLimit} ${unit} (${matched.sourceTitle}).`,
          limitConfig: matched,
        });
        overallStatus = "OUT_OF_LIMIT";
        continue;
      }

      // Warning Checks
      if (upperWarning !== null && upperWarning !== undefined && val >= upperWarning) {
        evaluations.push({
          parameter: p,
          value: val,
          unit,
          status: "WARNING",
          explanation: `${p} (${val} ${unit}) is in warning band (>= ${upperWarning} ${unit}).`,
          limitConfig: matched,
        });
        if (overallStatus !== "OUT_OF_LIMIT") overallStatus = "WARNING";
        continue;
      }

      if (lowerWarning !== null && lowerWarning !== undefined && val <= lowerWarning) {
        evaluations.push({
          parameter: p,
          value: val,
          unit,
          status: "WARNING",
          explanation: `${p} (${val} ${unit}) is in warning band (<= ${lowerWarning} ${unit}).`,
          limitConfig: matched,
        });
        if (overallStatus !== "OUT_OF_LIMIT") overallStatus = "WARNING";
        continue;
      }

      // Within normal limits
      evaluations.push({
        parameter: p,
        value: val,
        unit,
        status: "WITHIN_CONFIGURED_LIMIT",
        explanation: `${p} (${val} ${unit}) operates within normal configured limits.`,
        limitConfig: matched,
      });
    }

    return {
      timestamp: reading.timestamp,
      overallStatus,
      evaluations,
      notice: this.limitsConfig?.notice || "",
    };
  }
}

export const standardsService = new StandardsService();
