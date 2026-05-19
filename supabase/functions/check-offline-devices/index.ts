import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: settings } = await supabase.from("settings").select("*").single();
  const cutoff = new Date(Date.now() - settings.device_offline_after_seconds * 1000).toISOString();

  // Find devices that have gone silent
  const { data: staleDevices } = await supabase
    .from("devices")
    .select("*, patients(*)")
    .eq("status", "online")
    .lt("last_seen", cutoff);

  for (const device of staleDevices ?? []) {
    // Mark device offline
    await supabase.from("devices")
      .update({ status: "offline" })
      .eq("device_id", device.device_id);

    // Fire alert if not already active
    const { data: existing } = await supabase.from("alerts")
      .select("id").eq("patient_id", device.patient_id)
      .eq("type", "DEVICE_OFFLINE").eq("status", "active").limit(1);

    if (!existing?.length) {
      await supabase.from("alerts").insert({
        patient_id: device.patient_id,
        patient_name: device.patients?.name ?? "Unknown",
        bed_number: device.bed_number,
        type: "DEVICE_OFFLINE",
        message: `Sensor offline for Bed ${device.bed_number} — no data received in ${settings.device_offline_after_seconds}s`,
        status: "active"
      });
    }
  }

  return new Response(JSON.stringify({ checked: staleDevices?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
