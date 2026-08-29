import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Validate required fields
    if (!body.device_id || !body.event_type || body.event_value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: device_id, event_type, event_value" },
        { status: 400 },
      )
    }

    // Insert event
    const { data, error } = await supabase
      .from("events")
      .insert({
        device_id: body.device_id,
        event_type: body.event_type,
        event_value: body.event_value,
      })
      .select()

    if (error) {
      console.error("Error inserting event data:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error processing event data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    const deviceId = searchParams.get("device_id")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!deviceId) {
      return NextResponse.json({ error: "Missing required parameter: device_id" }, { status: 400 })
    }

    let query = supabase.from("events").select("*").eq("device_id", deviceId).order("created_at", { ascending: true })

    if (from) {
      query = query.gte("created_at", from)
    }

    if (to) {
      query = query.lte("created_at", to)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching events:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
