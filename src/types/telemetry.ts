export interface TelemetryPayload {
  device_id: string;
  engine_rpm?: number;
  coolant_temp_c?: number;
  battery_voltage?: number;
  dtc_code?: string;
}

export interface TelemetryRecord {
  id: number;
  device_id: string;
  engine_rpm: number | null;
  coolant_temp_c: number | null;
  battery_voltage: number | null;
  dtc_code: string | null;
  is_fault: boolean;
  recorded_at: string;
}

export interface ApiResponse<T = TelemetryRecord> {
  status: "SUCCESS" | "ERROR";
  processed_at: string;
  fault_detected?: boolean;
  record?: T;
  message?: string;
}
