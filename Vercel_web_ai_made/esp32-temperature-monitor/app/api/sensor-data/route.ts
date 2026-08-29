import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Validate required fields
    if (!body.device_id || body.temperature === undefined || body.humidity === undefined) {
      return NextResponse.json({ error: "Missing required fields: device_id, temperature, humidity" }, { status: 400 })
    }

    // Check if device exists, if not create it
    const { data: deviceExists } = await supabase
      .from("devices")
      .select("device_id")
      .eq("device_id", body.device_id)
      .single()

    if (!deviceExists) {
      await supabase.from("devices").insert({
        device_id: body.device_id,
        name: body.name || `Device ${body.device_id}`,
        location: body.location || "Unknown",
      })
    }

    // Insert sensor reading
    const { data, error } = await supabase
      .from("sensor_readings")
      .insert({
        device_id: body.device_id,
        temperature: body.temperature,
        humidity: body.humidity,
      })
      .select()

    if (error) {
      console.error("Error inserting sensor data:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error processing sensor data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
