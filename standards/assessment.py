"""
Standards-Based Measurement Assessment Engine
Evaluates electromechanical parameters against configured limits without AI inference.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class StandardsAssessor:
    """
    Evaluates readings against configured engineering limits.
    Possible statuses:
      - WITHIN_CONFIGURED_LIMIT
      - WARNING
      - OUT_OF_LIMIT
      - LIMITS_NOT_CONFIGURED
      - NOT_APPLICABLE
      - INSUFFICIENT_DATA
    """

    def __init__(self, limits_config_path: Optional[Path] = None):
        if limits_config_path is None:
            limits_config_path = Path(__file__).parent / "limits.json"
        self.config_path = limits_config_path
        self.limits: List[Dict[str, Any]] = []
        self.notice: str = ""
        self.load_config()

    def load_config(self):
        if self.config_path.exists():
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.limits = data.get("limits", [])
                self.notice = data.get("notice", "")
        else:
            self.limits = []
            self.notice = "LIMITS_NOT_CONFIGURED"

    def evaluate_parameter(
        self, parameter: str, value: Optional[float], unit: str
    ) -> Dict[str, Any]:
        """
        Assesses a single parameter value.
        """
        if value is None:
            return {
                "parameter": parameter,
                "status": "INSUFFICIENT_DATA",
                "explanation": f"No sensor reading provided for {parameter}.",
                "limitConfig": None,
            }

        # Find matching enabled limit
        matched_limit = next(
            (
                lim
                for lim in self.limits
                if lim.get("parameter", "").lower() == parameter.lower()
                and lim.get("enabled", False)
            ),
            None,
        )

        if not matched_limit:
            return {
                "parameter": parameter,
                "value": value,
                "unit": unit,
                "status": "LIMITS_NOT_CONFIGURED",
                "explanation": f"No active verified engineering limit configured for {parameter}.",
                "limitConfig": None,
            }

        # Check unit compatibility
        cfg_unit = matched_limit.get("unit", "").lower()
        if cfg_unit and unit.lower() != cfg_unit:
            return {
                "parameter": parameter,
                "value": value,
                "unit": unit,
                "status": "NOT_APPLICABLE",
                "explanation": f"Unit mismatch: reading is in '{unit}' but limit expects '{cfg_unit}'. Conversion required.",
                "limitConfig": matched_limit,
            }

        lower_lim = matched_limit.get("lowerLimit")
        upper_lim = matched_limit.get("upperLimit")
        lower_warn = matched_limit.get("lowerWarning")
        upper_warn = matched_limit.get("upperWarning")

        # Check Critical Limits
        if upper_lim is not None and value > upper_lim:
            return {
                "parameter": parameter,
                "value": value,
                "unit": unit,
                "status": "OUT_OF_LIMIT",
                "explanation": f"Value {value} {unit} exceeds upper limit of {upper_lim} {unit} ({matched_limit.get('sourceTitle')}).",
                "limitConfig": matched_limit,
            }

        if lower_lim is not None and value < lower_lim:
            return {
                "parameter": parameter,
                "value": value,
                "unit": unit,
                "status": "OUT_OF_LIMIT",
                "explanation": f"Value {value} {unit} is below lower limit of {lower_lim} {unit} ({matched_limit.get('sourceTitle')}).",
                "limitConfig": matched_limit,
            }

        # Check Warning Limits
        if upper_warn is not None and value >= upper_warn:
            return {
                "parameter": parameter,
                "value": value,
                "unit": unit,
                "status": "WARNING",
                "explanation": f"Value {value} {unit} is in warning zone (>= {upper_warn} {unit}).",
                "limitConfig": matched_limit,
            }

        if lower_warn is not None and value <= lower_warn:
            return {
                "parameter": parameter,
                "value": value,
                "unit": unit,
                "status": "WARNING",
                "explanation": f"Value {value} {unit} is in warning zone (<= {lower_warn} {unit}).",
                "limitConfig": matched_limit,
            }

        return {
            "parameter": parameter,
            "value": value,
            "unit": unit,
            "status": "WITHIN_CONFIGURED_LIMIT",
            "explanation": f"Value {value} {unit} is within normal configured operating boundaries.",
            "limitConfig": matched_limit,
        }

    def evaluate_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assesses an entire multi-channel sensor payload.
        """
        evaluations = []
        overall_status = "WITHIN_CONFIGURED_LIMIT"

        for param in ["current", "voltage", "temperature", "vibration"]:
            sensor_obj = reading.get(param, {})
            val = sensor_obj.get("value") if isinstance(sensor_obj, dict) else sensor_obj
            unit = sensor_obj.get("unit", "") if isinstance(sensor_obj, dict) else ""
            res = self.evaluate_parameter(param, val, unit)
            evaluations.append(res)

            # Escalate overall status
            if res["status"] == "OUT_OF_LIMIT":
                overall_status = "OUT_OF_LIMIT"
            elif res["status"] == "WARNING" and overall_status != "OUT_OF_LIMIT":
                overall_status = "WARNING"
            elif res["status"] == "LIMITS_NOT_CONFIGURED" and overall_status == "WITHIN_CONFIGURED_LIMIT":
                overall_status = "LIMITS_NOT_CONFIGURED"

        return {
            "timestamp": reading.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "overallStatus": overall_status,
            "evaluations": evaluations,
            "notice": self.notice,
        }
