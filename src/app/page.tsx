import { Activity, AlertTriangle, Database, Radio, Server } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TelemetryRecord } from "@/types/telemetry";

export const revalidate = 0;

function displayValue(value: string | number | null, suffix = "") {
  return value === null ? <span className="text-zinc-600">--</span> : `${value}${suffix}`;
}

export default async function DashboardPage() {
  const { data, error } = await supabase
    .from("telemetry_logs")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(20)
    .returns<TelemetryRecord[]>();

  const records = data ?? [];
  const faultCount = records.filter((record) => record.is_fault).length;
  const latestDevice = records[0]?.device_id ?? "NO SIGNAL";

  return (
    <main className="min-h-screen bg-[#090b0d]">
      <header className="border-b border-zinc-800 bg-[#0d1013]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center border border-amber-500/50 bg-amber-500/10">
              <Activity className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold uppercase tracking-normal text-zinc-100 sm:text-base">Telemetry Control</h1>
              <p className="text-xs text-zinc-500">Automotive diagnostics / live ingestion</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Radio className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-3" aria-label="Telemetry metrics">
          <Metric icon={Database} label="Total ingested logs" value={records.length.toLocaleString()} accent="text-amber-400" />
          <Metric icon={AlertTriangle} label="Active faults" value={faultCount.toLocaleString()} accent={faultCount ? "text-red-400" : "text-emerald-400"} />
          <Metric icon={Server} label="Latest device" value={latestDevice} accent="text-cyan-400" compact />
        </section>

        <section aria-labelledby="feed-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase text-amber-500">Live data stream</p>
              <h2 id="feed-heading" className="text-xl font-semibold text-zinc-100">Diagnostic feed</h2>
            </div>
            <span className="font-mono text-xs text-zinc-500">LAST 20 RECORDS</span>
          </div>

          {error ? (
            <div className="border border-red-900 bg-red-950/30 px-4 py-8 text-center text-sm text-red-300" role="alert">
              Telemetry data is unavailable. Check the database connection.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-800">
              <table className="w-full min-w-[980px] border-collapse text-left font-mono text-xs">
                <thead className="bg-zinc-900 text-[11px] uppercase text-zinc-500">
                  <tr>{["ID", "Device ID", "Engine RPM", "Coolant temp (°C)", "Battery (V)", "DTC code", "Status", "Recorded at"].map((heading) => <th key={heading} className="border-b border-zinc-800 px-4 py-3 font-semibold">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {records.map((record) => (
                    <tr key={record.id} className={record.is_fault ? "border-l-2 border-l-red-500 bg-red-950/30" : "border-l-2 border-l-transparent bg-[#0d1013] hover:bg-zinc-900/80"}>
                      <td className="px-4 py-3 text-zinc-500">#{record.id}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-200">{record.device_id}</td>
                      <td className="px-4 py-3 text-zinc-300">{displayValue(record.engine_rpm)}</td>
                      <td className={record.coolant_temp_c !== null && record.coolant_temp_c > 105 ? "px-4 py-3 font-bold text-red-400" : "px-4 py-3 text-zinc-300"}>{displayValue(record.coolant_temp_c)}</td>
                      <td className={record.battery_voltage !== null && record.battery_voltage < 11.8 ? "px-4 py-3 font-bold text-red-400" : "px-4 py-3 text-zinc-300"}>{displayValue(record.battery_voltage)}</td>
                      <td className="px-4 py-3 text-zinc-300">{displayValue(record.dtc_code)}</td>
                      <td className="px-4 py-3"><span className={record.is_fault ? "inline-flex whitespace-nowrap border border-red-500/50 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400" : "inline-flex whitespace-nowrap border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400"}>{record.is_fault ? "FAULT DETECTED" : "NORMAL"}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{new Date(record.recorded_at).toLocaleString("en-US", { timeZone: "UTC", hour12: false })} UTC</td>
                    </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan={8} className="bg-[#0d1013] px-4 py-16 text-center text-zinc-500">Awaiting telemetry transmission.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

type MetricProps = { icon: typeof Activity; label: string; value: string; accent: string; compact?: boolean };

function Metric({ icon: Icon, label, value, accent, compact }: MetricProps) {
  return <div className="flex min-w-0 items-center gap-4 bg-[#0d1013] p-5"><Icon className={`h-5 w-5 shrink-0 ${accent}`} aria-hidden="true" /><div className="min-w-0"><p className="text-[11px] font-bold uppercase text-zinc-500">{label}</p><p className={`${compact ? "truncate text-lg" : "text-3xl"} mt-1 font-mono font-semibold text-zinc-100`}>{value}</p></div></div>;
}
