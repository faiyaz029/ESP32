"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wind, Sun, AppWindowIcon as Window } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { EventType, EventState } from "@/types/database.types"

interface EventControlsProps {
  deviceId: string
  onEventChange?: (eventType: EventType, value: boolean) => void
}

export function EventControls({ deviceId, onEventChange }: EventControlsProps) {
  const [eventState, setEventState] = useState<EventState>({
    window_open: false,
    sunlight_blocked: false,
    fan_on: false,
  })
  const [loading, setLoading] = useState(false)

  // Fetch current event states when component mounts
  useEffect(() => {
    async function fetchCurrentEventStates() {
      try {
        // For each event type, get the most recent event
        const eventTypes: EventType[] = ["window_open", "sunlight_blocked", "fan_on"]
        const newState: EventState = {
          window_open: false,
          sunlight_blocked: false,
          fan_on: false,
        }

        for (const eventType of eventTypes) {
          const { data } = await supabase
            .from("events")
            .select("*")
            .eq("device_id", deviceId)
            .eq("event_type", eventType)
            .order("created_at", { ascending: false })
            .limit(1)

          if (data && data.length > 0) {
            newState[eventType] = data[0].event_value
          }
        }

        setEventState(newState)
      } catch (error) {
        console.error("Error fetching event states:", error)
      }
    }

    if (deviceId) {
      fetchCurrentEventStates()
    }
  }, [deviceId])

  const toggleEvent = async (eventType: EventType) => {
    try {
      setLoading(true)
      const newValue = !eventState[eventType]

      // Send event to API
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: deviceId,
          event_type: eventType,
          event_value: newValue,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update event")
      }

      // Update local state
      setEventState((prev) => ({
        ...prev,
        [eventType]: newValue,
      }))

      // Notify parent component
      if (onEventChange) {
        onEventChange(eventType, newValue)
      }
    } catch (error) {
      console.error(`Error toggling ${eventType}:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environmental Controls</CardTitle>
        <CardDescription>Toggle environmental factors to track their impact</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant={eventState.window_open ? "default" : "outline"}
            className={`flex flex-col items-center justify-center h-24 ${
              eventState.window_open ? "bg-blue-500 hover:bg-blue-600" : ""
            }`}
            onClick={() => toggleEvent("window_open")}
            disabled={loading}
          >
            <Window className="h-6 w-6 mb-2" />
            <span>Window {eventState.window_open ? "Open" : "Closed"}</span>
          </Button>

          <Button
            variant={eventState.sunlight_blocked ? "default" : "outline"}
            className={`flex flex-col items-center justify-center h-24 ${
              eventState.sunlight_blocked ? "bg-amber-500 hover:bg-amber-600" : ""
            }`}
            onClick={() => toggleEvent("sunlight_blocked")}
            disabled={loading}
          >
            <Sun className="h-6 w-6 mb-2" />
            <span>Sunlight {eventState.sunlight_blocked ? "Blocked" : "Normal"}</span>
          </Button>

          <Button
            variant={eventState.fan_on ? "default" : "outline"}
            className={`flex flex-col items-center justify-center h-24 ${
              eventState.fan_on ? "bg-green-500 hover:bg-green-600" : ""
            }`}
            onClick={() => toggleEvent("fan_on")}
            disabled={loading}
          >
            <Wind className="h-6 w-6 mb-2" />
            <span>Fan {eventState.fan_on ? "On" : "Off"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
