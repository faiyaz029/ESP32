"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { DeviceSelector } from "@/components/device-selector"
import { DateRangePicker } from "@/components/date-range-picker"
import type { SensorReading } from "@/types/database.types"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function HistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deviceIdParam = searchParams.get("device_id")

  const [deviceId, setDeviceId] = useState<string | undefined>(deviceIdParam || undefined)
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date(),
  })

  // Handle device selection
  const handleDeviceChange = (newDeviceId: string) => {
    setDeviceId(newDeviceId)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.set("device_id", newDeviceId)
    router.push(`/history?${params.toString()}`)
  }

  // Handle date range selection
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
  }

  // Fetch historical readings based on device and date range
  useEffect(() => {
    if (!deviceId) return

    async function fetchReadings() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("sensor_readings")
          .select("*")
          .eq("device_id", deviceId)
          .gte("recorded_at", dateRange.from.toISOString())
          .lte("recorded_at", dateRange.to.toISOString())
          .order("recorded_at", { ascending: false })

        if (error) throw error
        setReadings(data || [])
      } catch (error) {
        console.error("Error fetching readings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReadings()
  }, [deviceId, dateRange])

  // Define columns for the data table
  const columns: ColumnDef<SensorReading>[] = [
    {
      accessorKey: "recorded_at",
      header: "Timestamp",
      cell: ({ row }) => {
        const date = new Date(row.getValue("recorded_at"))
        return date.toLocaleString()
      },
    },
    {
      accessorKey: "temperature",
      header: "Temperature (°C)",
    },
    {
      accessorKey: "humidity",
      header: "Humidity (%)",
    },
  ]

  // Function to download data as CSV
  const downloadCSV = () => {
    if (readings.length === 0) return

    const headers = ["Timestamp", "Temperature (°C)", "Humidity (%)"]
    const csvData = readings.map((reading) => [
      new Date(reading.recorded_at).toLocaleString(),
      reading.temperature,
      reading.humidity,
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `sensor-data-${deviceId}-${new Date().toISOString().split("T")[0]}.csv`)
    link.click()
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Historical Data</h1>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Select Device</h2>
          <DeviceSelector onDeviceChange={handleDeviceChange} selectedDeviceId={deviceId} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Select Date Range</h2>
          <DateRangePicker onRangeChange={handleDateRangeChange} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Sensor Readings</h2>
        <Button onClick={downloadCSV} disabled={readings.length === 0} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <DataTable columns={columns} data={readings} />

      {loading && <div className="mt-8 text-center text-muted-foreground">Loading data...</div>}
    </main>
  )
}
