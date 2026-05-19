import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // bypasses RLS
  );

  // 1. Validate API key
  const apiKey = req.headers.get("x-api-key");
  const { data: settings } = await supabase
    .from("settings").select("*").single();
    
  if (apiKey !== settings.esp_api_key) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // 2. Parse body
  let { device_id, weight_grams } = await req.json();

  // 2.5 Smart Tare: Clear out sensor drift or negative values when bag is removed
  // If weight is near zero (below 5g) or negative, force to 0.
  if (weight_grams < 5) {
    weight_grams = 0;
  }

  // 3. Look up device → patient
  const { data: device } = await supabase
    .from("devices")
    .select("*, patients(*)")
    .eq("device_id", device_id)
    .single();

  if (!device) return new Response(JSON.stringify({ error: "Device not found" }), { status: 404 });

  // Skip everything if patient is discharged
  const patient = device.patients;
  if (!patient || patient.status === 'discharged') {
    return new Response(JSON.stringify({ ok: true, skipped: "patient_discharged" }), { status: 200 });
  }

  // 4. Update device last_seen + status
  await supabase.from("devices").update({
    last_seen: new Date().toISOString(),
    status: "online"
  }).eq("device_id", device_id);

  // 5. Find active session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("patient_id", device.patient_id)
    .eq("status", "active")
    .single();

  let percentage = null;
  let drip_rate_ml_hr = null;

  if (session) {
    // 6. Compute percentage
    const raw = (weight_grams / session.initial_weight_grams) * 100;
    percentage = Math.min(100, Math.max(0, raw));

    // 7. Compute drip rate from previous reading
    const { data: prevReading } = await supabase
      .from("readings")
      .select("weight_grams, timestamp")
      .eq("patient_id", device.patient_id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    let deltaGrams = 0;
    if (prevReading) {
      deltaGrams = prevReading.weight_grams - weight_grams;
      const deltaHours =
        (Date.now() - new Date(prevReading.timestamp).getTime()) / 3600000;
      if (deltaHours > 0) {
        drip_rate_ml_hr = Math.max(0, deltaGrams / deltaHours);
      }

      // Check for sudden drop regardless of time (instantaneous loss)
      const suddenDropThreshold = settings.sudden_drop_threshold || 50;
      if (deltaGrams >= suddenDropThreshold) {
        await fireAlert("SUDDEN_WEIGHT_DROP", 
          `Sudden weight drop of ${deltaGrams.toFixed(0)}g detected on Bed ${device.bed_number} (${patient.name})`
        );
      }
    }

    // 8. Update session current weight
    await supabase.from("sessions")
      .update({ current_weight_grams: weight_grams })
      .eq("id", session.id);
  }

  // 9. Insert reading
  await supabase.from("readings").insert({
    device_id,
    patient_id: device.patient_id,
    session_id: session?.id ?? null,
    weight_grams,
    percentage,
    drip_rate_ml_hr,
    timestamp: new Date().toISOString()
  });

  // 10. Run alert checks
  if (session && percentage !== null) {
    const patient = device.patients;

    async function hasActiveAlert(type: string) {
      const { data } = await supabase.from("alerts")
        .select("id").eq("patient_id", device.patient_id)
        .eq("type", type).eq("status", "active").limit(1);
      return data && data.length > 0;
    }

    async function fireAlert(type: string, message: string) {
      if (await hasActiveAlert(type)) return;
      await supabase.from("alerts").insert({
        patient_id: device.patient_id,
        patient_name: patient.name,
        bed_number: device.bed_number,
        type,
        message,
        percentage,
        status: "active"
      });
      
      // Also update patient status to critical if it's a sudden drop or empty
      if (type === "BAG_EMPTY" || type === "SUDDEN_WEIGHT_DROP") {
        await supabase.from("patients").update({ status: "critical" }).eq("id", device.patient_id);
      }
    }

    if (percentage <= 0) {
      await fireAlert("BAG_EMPTY", `IV bag is empty for ${patient.name} — Bed ${device.bed_number}`);
    } else if (percentage <= settings.critical_percent) {
      await fireAlert("LOW_IV_CRITICAL", `IV critically low (${percentage.toFixed(1)}%) for ${patient.name} — Bed ${device.bed_number}`);
    } else if (percentage <= settings.warning_percent) {
      await fireAlert("LOW_IV_WARNING", `IV low (${percentage.toFixed(1)}%) for ${patient.name} — Bed ${device.bed_number}`);
    }

    // Fix: check prescribed rate even if it is 0
    const prescribed = patient.prescribed_drip_rate_ml_hr;
    if (drip_rate_ml_hr !== null && prescribed !== undefined && prescribed !== null) {
      const deviation = prescribed === 0 
        ? (drip_rate_ml_hr > 10 ? 100 : 0) // If prescribed 0, any rate > 10ml/hr is 100% deviation
        : Math.abs(drip_rate_ml_hr - prescribed) / prescribed * 100;
        
      if (deviation > settings.drip_rate_deviation_percent) {
        await fireAlert("DRIP_RATE_ANOMALY",
          `Drip rate anomaly on Bed ${device.bed_number}: actual ${drip_rate_ml_hr.toFixed(0)} ml/hr vs prescribed ${prescribed} ml/hr`
        );
      }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    percentage,
    drip_rate_ml_hr,
    session_active: !!session
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
