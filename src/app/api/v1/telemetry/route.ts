import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ApiResponse, TelemetryPayload, TelemetryRecord } from "@/types/telemetry";

export async function POST(request: Request) {
  const processedAt = new Date().toISOString();
  let payload: TelemetryPayload;

  try {
    payload = (await request.json()) as TelemetryPayload;
  } catch {
    return NextResponse.json<ApiResponse>(
      { status: "ERROR", processed_at: processedAt, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!payload.device_id || typeof payload.device_id !== "string") {
    return NextResponse.json<ApiResponse>(
      { status: "ERROR", processed_at: processedAt, message: "device_id is required." },
      { status: 400 },
    );
  }

  const isFault =
    (payload.coolant_temp_c !== undefined && payload.coolant_temp_c > 105) ||
    (payload.battery_voltage !== undefined && payload.battery_voltage < 11.8) ||
    Boolean(payload.dtc_code);

  const { data, error } = await supabase
    .from("telemetry_logs")
    .insert({ ...payload, is_fault: isFault })
    .select()
    .single<TelemetryRecord>();

  if (error) {
    console.error("Telemetry insertion failed:", error.message);
    return NextResponse.json<ApiResponse>(
      { status: "ERROR", processed_at: processedAt, message: "Unable to persist telemetry." },
      { status: 500 },
    );
  }

  if (isFault && process.env.N8N_WEBHOOK_URL) {
    void fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((webhookError: unknown) => {
      console.error("Fault webhook dispatch failed:", webhookError);
    });
  }

  return NextResponse.json<ApiResponse>(
    { status: "SUCCESS", processed_at: processedAt, fault_detected: isFault, record: data },
    { status: 201 },
  );
}
