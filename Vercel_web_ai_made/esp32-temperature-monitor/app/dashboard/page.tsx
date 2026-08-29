"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { CurrentReadings } from "@/components/current-readings"
import { EnhancedTemperatureChart } from "@/components/enhanced-temperature-chart"
import { EnhancedHumidityChart } from "@/components/enhanced-humidity-chart"
import { DeviceSelector } from "@/components/device-selector"
import { TimeRangeSelector } from "@/components/time-range-selector"
import { EventControls } from "@/components/event-controls"
import type { SensorReading, Device, Event, EventType } from "@/types/database.types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deviceIdParam = searchParams.get("device_id")

  const [deviceId, setDeviceId] = useState<string | undefined>(deviceIdParam || undefined)
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<Device | null>(null)
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(1) // Default to 1 day
  const [activeTab, setActiveTab] = useState("realtime")

  // Handle device selection
  const handleDeviceChange = (newDeviceId: string) => {
    setDeviceId(newDeviceId)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.set("device_id", newDeviceId)
    router.push(`/dashboard?${params.toString()}`)
  }

  // Handle time range selection
  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days)
  }

  // Handle event change
  const handleEventChange = (eventType: EventType, value: boolean) => {
    // Refresh events
    fetchEvents()
  }

  // Fetch device info
  useEffect(() => {
    if (!deviceId) return

    async function fetchDeviceInfo() {
      try {
        const { data, error } = await supabase.from("devices").select("*").eq("device_id", deviceId).single()

        if (error) throw error
        setDeviceInfo(data)
      } catch (error) {
        console.error("Error fetching device info:", error)
      }
    }

    fetchDeviceInfo()
  }, [deviceId])

  // Fetch latest reading
  useEffect(() => {
    async function fetchLatestReading() {
      try {
        setLoading(true)

        let query = supabase.from("sensor_readings").select("*").order("recorded_at", { ascending: false }).limit(1)

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) throw error

        if (data && data.length > 0) {
          setLatestReading(data[0])

          // If no device ID is set, use the one from the latest reading
          if (!deviceId) {
            setDeviceId(data[0].device_id)
          }
        }
      } catch (error) {
        console.error("Error fetching latest reading:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestReading()

    // Set up real-time subscription for new readings
    const subscription = supabase
      .channel("sensor_readings_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings",
          filter: deviceId ? `device_id=eq.${deviceId}` : undefined,
        },
        (payload) => {
          setLatestReading(payload.new as SensorReading)
          // Also update the readings array
          setReadings((prev) => {
            const newReadings = [...prev, payload.new as SensorReading]
            // Sort by recorded_at
            return newReadings.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
          })
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [deviceId])

  // Fetch historical readings based on device and time range
  useEffect(() => {
    if (!deviceId) return

    async function fetchReadings() {
      try {
        setLoading(true)

        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - timeRange)

        const { data, error } = await supabase
          .from("sensor_readings")
          .select("*")
          .eq("device_id", deviceId)
          .gte("recorded_at", fromDate.toISOString())
          .order("recorded_at", { ascending: true })

        if (error) throw error
        setReadings(data || [])
      } catch (error) {
        console.error("Error fetching readings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReadings()
  }, [deviceId, timeRange])

  // Fetch events
  const fetchEvents = async () => {
    if (!deviceId) return

    try {
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - timeRange)

      const response = await fetch(`/api/events?device_id=${deviceId}&from=${fromDate.toISOString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }

      const { data } = await response.json()
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  // Fetch events when device or time range changes
  useEffect(() => {
    fetchEvents()
  }, [deviceId, timeRange])

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">ESP32 Temperature & Humidity Dashboard</h1>

      <div className="mb-8">
        <DeviceSelector onDeviceChange={handleDeviceChange} selectedDeviceId={deviceId} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="realtime">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="historical">Historical Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-8">
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
            <CurrentReadings
              latestReading={latestReading}
              deviceName={deviceInfo?.name}
              deviceLocation={deviceInfo?.location}
            />

            {deviceId && <EventControls deviceId={deviceId} onEventChange={handleEventChange} />}
          </div>

          <div className="grid gap-8 mt-8 md:grid-cols-1 lg:grid-cols-2">
            <EnhancedTemperatureChart
              readings={readings.slice(-50)}
              events={events}
              title="Recent Temperature"
              description="Last 50 readings with environmental events"
            />
            <EnhancedHumidityChart
              readings={readings.slice(-50)}
              events={events}
              title="Recent Humidity"
              description="Last 50 readings with environmental events"
            />
          </div>
        </TabsContent>

        <TabsContent value="historical" className="space-y-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Historical Data Analysis</h2>
            <TimeRangeSelector onRangeChange={handleTimeRangeChange} currentRange={timeRange} />
            <p className="text-sm text-muted-foreground">
              Showing data for the past {timeRange} day{timeRange > 1 ? "s" : ""} with environmental event markers
            </p>
          </div>

          <div className="grid gap-8 mt-8 md:grid-cols-1 lg:grid-cols-2">
            <EnhancedTemperatureChart
              readings={readings}
              events={events}
              title={`${timeRange}-Day Temperature Trend`}
              description="Temperature with daily variations and events"
              showFullDate={true}
            />
            <EnhancedHumidityChart
              readings={readings}
              events={events}
              title={`${timeRange}-Day Humidity Trend`}
              description="Humidity with daily variations and events"
              showFullDate={true}
            />
          </div>
        </TabsContent>
      </Tabs>

      {loading && <div className="mt-8 text-center text-muted-foreground">Loading data...</div>}
    </main>
  )
}
