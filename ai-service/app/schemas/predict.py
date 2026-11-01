from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class PhysicalTelemetryInput(BaseModel):
    """
    Physical sensor input collected from the motor/ESP32.
    """
    motorId: str = Field(default="MOTOR-001")
    timestamp: Optional[str] = None
    source: str = Field(default="simulation")
    current: Optional[Dict[str, Any]] = None
    voltage: Optional[Dict[str, Any]] = None
    temperature: Optional[Dict[str, Any]] = None
    vibration: Optional[Dict[str, Any]] = None


class CompatibleSKABInput(BaseModel):
    """
    Direct input matching the 6-feature contract of the SKAB model.
    """
    Accelerometer1RMS: float
    Accelerometer2RMS: float
    Current: float
    Temperature: float
    Thermocouple: float
    Voltage: float


class ModelPredictionResponse(BaseModel):
    status: str = Field(
        description="NORMAL, ANOMALY, MODEL_INPUT_INCOMPATIBLE, MODEL_UNAVAILABLE"
    )
    prediction: Optional[int] = Field(
        default=None, description="0 = Normal, 1 = Anomaly"
    )
    anomalyScore: Optional[float] = Field(
        default=None, description="Isolation Forest decision score"
    )
    threshold: Optional[float] = Field(
        default=-0.5, description="Decision threshold boundary"
    )
    expectedFeatures: List[str]
    missingFeatures: List[str] = Field(default_factory=list)
    explanation: str
    isIntegrationTest: bool = False
    isSimulated: bool = False
    modelInfo: Dict[str, Any] = Field(default_factory=dict)
