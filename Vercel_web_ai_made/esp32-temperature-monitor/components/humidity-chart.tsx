"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SensorReading } from "@/types/database.types"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface HumidityChartProps {
  readings: SensorReading[]
  title?: string
  description?: string
}

export function HumidityChart({
  readings,
  title = "Humidity History",
  description = "Last 24 hours",
}: HumidityChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

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
    const labels = sortedReadings.map((reading) =>
      new Date(reading.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    )

    const humidityData = sortedReadings.map((reading) => reading.humidity)

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Humidity (%)",
            data: humidityData,
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Humidity (%)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [readings])

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
      </CardContent>
    </Card>
  )
}
