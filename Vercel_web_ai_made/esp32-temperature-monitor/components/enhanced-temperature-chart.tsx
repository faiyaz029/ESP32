"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SensorReading, Event } from "@/types/database.types"
import { Chart, registerables, type ChartOptions } from "chart.js"
import { Wind, Sun, AppWindowIcon as Window } from "lucide-react"
import annotationPlugin from "chartjs-plugin-annotation"

Chart.register(...registerables, annotationPlugin)

interface EnhancedTemperatureChartProps {
  readings: SensorReading[]
  events?: Event[]
  title?: string
  description?: string
  showFullDate?: boolean
}

export function EnhancedTemperatureChart({
  readings,
  events = [],
  title = "Temperature History",
  description = "Temperature over time with environmental events",
  showFullDate = false,
}: EnhancedTemperatureChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [activeEvents, setActiveEvents] = useState<Record<string, boolean>>({})

  // Process events to determine active periods
  useEffect(() => {
    if (!events.length) return

    const processedEvents: Record<string, boolean> = {}
    const sortedEvents = [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Track the current state of each event type
    const currentState: Record<string, boolean> = {}

    sortedEvents.forEach((event) => {
      currentState[event.event_type] = event.event_value
      processedEvents[`${event.event_type}_${event.created_at}`] = event.event_value
    })

    setActiveEvents(processedEvents)
  }, [events])

  useEffect(() => {
    if (!chartRef.current || readings.length === 0) return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Sort readings by time
    const sortedReadings = [...readings].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )

    // Prepare data
    const timestamps = sortedReadings.map((reading) => new Date(reading.recorded_at))
    const labels = sortedReadings.map((reading) => {
      const date = new Date(reading.recorded_at)
      return showFullDate ? date.toLocaleString() : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    })

    const temperatureData = sortedReadings.map((reading) => reading.temperature)

    // Create segments based on events
    const datasets = []

    // Default dataset (when no events are active)
    datasets.push({
      label: "Temperature (°C)",
      data: temperatureData,
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      borderWidth: 2,
      tension: 0.3,
      fill: true,
    })

    // Create annotations for events
    const annotations: any = {}

    events.forEach((event, index) => {
      const eventTime = new Date(event.created_at).getTime()

      // Find the closest reading time
      const closestReadingIndex = sortedReadings.findIndex(
        (reading) => new Date(reading.recorded_at).getTime() >= eventTime,
      )

      if (closestReadingIndex !== -1) {
        const eventColor =
          event.event_type === "window_open"
            ? "rgba(59, 130, 246, 0.7)"
            : event.event_type === "sunlight_blocked"
              ? "rgba(245, 158, 11, 0.7)"
              : "rgba(34, 197, 94, 0.7)"

        annotations[`event-${index}`] = {
          type: "line",
          scaleID: "x",
          value: closestReadingIndex,
          borderColor: eventColor,
          borderWidth: 2,
          label: {
            content: `${event.event_type.replace("_", " ")} ${event.event_value ? "started" : "ended"}`,
            enabled: true,
            position: "top",
            backgroundColor: eventColor,
          },
        }
      }
    })

    // Create chart options
    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            afterBody: (context) => {
              const index = context[0].dataIndex
              const time = timestamps[index]

              // Check if any events occurred close to this time
              const eventsAtTime = events.filter((event) => {
                const eventTime = new Date(event.created_at)
                const diff = Math.abs(eventTime.getTime() - time.getTime())
                return diff < 300000 // Within 5 minutes
              })

              if (eventsAtTime.length === 0) return ""

              let result = "\nEvents:"
              eventsAtTime.forEach((event) => {
                const eventName = event.event_type.replace("_", " ")
                result += `\n${eventName}: ${event.event_value ? "On" : "Off"}`
              })

              return result
            },
          },
        },
        annotation: {
          annotations,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: "Temperature (°C)",
          },
        },
        x: {
          title: {
            display: true,
            text: showFullDate ? "Date & Time" : "Time",
          },
        },
      },
    }

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options,
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [readings, events, showFullDate])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {readings.length > 0 ? (
            <canvas ref={chartRef} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
          )}
        </div>
        {events && events.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="text-sm font-medium">Event Legend:</div>
            <div className="flex items-center text-xs">
              <Window className="h-3 w-3 mr-1 text-blue-500" />
              <span>Window</span>
            </div>
            <div className="flex items-center text-xs">
              <Sun className="h-3 w-3 mr-1 text-amber-500" />
              <span>Sunlight</span>
            </div>
            <div className="flex items-center text-xs">
              <Wind className="h-3 w-3 mr-1 text-green-500" />
              <span>Fan</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
