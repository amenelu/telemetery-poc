-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(50) PRIMARY KEY,
    vehicle_vin VARCHAR(17) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Default Device
INSERT INTO devices (device_id, vehicle_vin)
VALUES ('OBD2-NODE-8821', '1FA6P8CF0H1000000')
ON CONFLICT DO NOTHING;

-- Telemetry Logs Table
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    engine_rpm INT,
    coolant_temp_c INT,
    battery_voltage NUMERIC(4,2),
    dtc_code VARCHAR(10),
    is_fault BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time-Series Index
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time
ON telemetry_logs (device_id, recorded_at DESC);
