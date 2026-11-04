export type QualityStatus = "valid" | "degraded" | "invalid" | "partial";
export type DataSource = "simulation" | "hardware_esp32";

export interface SensorValue {
  value: number;
  unit: string;
  axis?: string;
}

export interface SensorReading {
  id?: string;
  motorId: string;
  timestamp: string;
  source: DataSource;
  quality: QualityStatus;
  current: SensorValue;
  voltage: SensorValue;
  temperature: SensorValue;
  vibration: SensorValue;
  syntheticDisturbance?: string;
}

export type AssessmentStatus =
  | "WITHIN_CONFIGURED_LIMIT"
  | "WARNING"
  | "OUT_OF_LIMIT"
  | "LIMITS_NOT_CONFIGURED"
  | "NOT_APPLICABLE"
  | "INSUFFICIENT_DATA";

export interface ParameterAssessment {
  parameter: string;
  value?: number;
  unit?: string;
  status: AssessmentStatus;
  explanation: string;
  limitConfig?: any;
}

export interface ReadingAssessmentResult {
  timestamp: string;
  overallStatus: AssessmentStatus;
  evaluations: ParameterAssessment[];
  notice: string;
}

export type AIModelStatus =
  | "NORMAL"
  | "ANOMALY"
  | "MODEL_INPUT_INCOMPATIBLE"
  | "MODEL_UNAVAILABLE"
  | "MODEL_ERROR";

export interface AIPredictionResult {
  status: AIModelStatus;
  prediction: number | null;
  anomalyScore: number | null;
  threshold: number | null;
  expectedFeatures: string[];
  missingFeatures: string[];
  explanation: string;
  isIntegrationTest: boolean;
  isSimulated: boolean;
  modelInfo?: any;
}

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCategory = "standards" | "ai_anomaly" | "sensor_error" | "system" | "simulation";

export interface Alert {
  id: string;
  timestamp: string;
  motorId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  parameter: string;
  observedValue?: number;
  unit?: string;
  limitOrRule?: string;
  explanation: string;
  source: DataSource;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface MotorInfo {
  motorId: string;
  name: string;
  model: string;
  type: string;
  ratedPowerKw: number;
  ratedVoltageV: number;
  ratedCurrentA: number;
  ratedSpeedRpm: number;
  poles: number;
  insulationClass: string;
  mounting: string;
  sensorsInstalled: string[];
}
