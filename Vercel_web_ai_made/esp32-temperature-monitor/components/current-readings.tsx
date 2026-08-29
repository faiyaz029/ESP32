"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SensorReading } from "@/types/database.types"
import { Thermometer, Droplets } from "lucide-react"

interface CurrentReadingsProps {
  latestReading: SensorReading | null
  deviceName?: string
  deviceLocation?: string
}

export function CurrentReadings({ latestReading, deviceName, deviceLocation }: CurrentReadingsProps) {
  if (!latestReading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Readings</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">No sensor readings available yet.</div>
        </CardContent>
      </Card>
    )
  }

  const formattedTime = new Date(latestReading.recorded_at).toLocaleString()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Readings</CardTitle>
        <CardDescription>
          {deviceName || `Device ${latestReading.device_id}`}
          {deviceLocation && ` - ${deviceLocation}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
            <Thermometer className="h-8 w-8 text-blue-500 mb-2" />
            <div className="text-3xl font-bold">{latestReading.temperature}°C</div>
            <div className="text-sm text-muted-foreground">Temperature</div>
          </div>
          <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
            <Droplets className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-3xl font-bold">{latestReading.humidity}%</div>
            <div className="text-sm text-muted-foreground">Humidity</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-center text-muted-foreground">Last updated: {formattedTime}</div>
      </CardContent>
    </Card>
  )
}
