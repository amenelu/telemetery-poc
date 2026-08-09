Markdown

# Automotive Telemetry & Diagnostic Ingestion System Specification

## 1. Project Overview

A production-ready telemetry ingestion layer and real-time diagnostic dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, and PostgreSQL (Supabase). The application receives HTTP POST payloads simulating OBD-II hardware gateways, evaluates physical domain thresholds (coolant temperature, battery voltage, DTC codes), logs records to PostgreSQL, triggers external webhooks on faults, and renders a live technical dashboard.

---

## 2. Directory & File Structure

Generate the following file tree:

telemetry-poc/
├── schema.sql
├── .env.local.example
├── src/
│ ├── types/
│ │ └── telemetry.ts
│ ├── lib/
│ │ └── supabase.ts
│ └── app/
│ ├── layout.tsx
│ ├── page.tsx
│ └── api/
│ └── v1/
│ └── telemetry/
│ └── route.ts

---

## 3. Database Schema (`schema.sql`)

Write a SQL script containing:

```sql
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
4. TypeScript Types (src/types/telemetry.ts)
Define explicit interfaces for:

TelemetryPayload: { device_id: string; engine_rpm?: number; coolant_temp_c?: number; battery_voltage?: number; dtc_code?: string; }

TelemetryRecord: Matches the database table fields including id, is_fault, and recorded_at.

ApiResponse: Standardized status response wrapper.

5. Supabase Client (src/lib/supabase.ts)
Initialize and export a Supabase client using @supabase/supabase-js powered by environment variables:

process.env.NEXT_PUBLIC_SUPABASE_URL

process.env.SUPABASE_SERVICE_ROLE_KEY

6. API Route (src/app/api/v1/telemetry/route.ts)
Create a Next.js App Router POST request handler that executes the following sequence:

Parse the incoming JSON body into TelemetryPayload.

Validation: Check if device_id exists. If missing, return a 400 Bad Request.

Automotive Domain Logic:
Compute is_fault = (coolant_temp_c > 105) || (battery_voltage < 11.8) || Boolean(dtc_code).

Database Insertion: Insert the payload and computed is_fault state into telemetry_logs using Supabase.

Webhook Dispatch:
If is_fault === true AND process.env.N8N_WEBHOOK_URL is set, fire an asynchronous, non-blocking fetch() POST request containing the fault record payload to N8N_WEBHOOK_URL.

Return Response: Return HTTP 201 JSON with { status: 'SUCCESS', processed_at: ISOString, fault_detected: boolean, record: TelemetryRecord }.

7. Dashboard UI (src/app/page.tsx)
Build a Next.js Server Component page with a dark-mode industrial theme (Tailwind CSS):

Data Fetching: Fetch the top 20 rows from telemetry_logs ordered by recorded_at DESC. Revalidate or opt out of caching as needed (export const revalidate = 0).

Top Metric Cards:

Total Ingested Logs count.

Active Fault Count (is_fault === true).

Latest Device ID logged.

Telemetry Table:

Columns: ID, Device ID, Engine RPM, Coolant Temp (°C), Battery (V), DTC Code, Status, Recorded At.

Conditional Styling: Highlight fault rows with a subtle red background (bg-red-950/30 or border-red-500/50) and a prominent red status badge (FAULT DETECTED). Normal rows display a green badge (NORMAL).

8. Environment File (.env.local.example)
Code snippet
NEXT_PUBLIC_SUPABASE_URL=[https://your-supabase-project.supabase.co](https://your-supabase-project.supabase.co)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
N8N_WEBHOOK_URL=[https://your-n8n-instance.com/webhook/diagnostic-alert](https://your-n8n-instance.com/webhook/diagnostic-alert)
```
