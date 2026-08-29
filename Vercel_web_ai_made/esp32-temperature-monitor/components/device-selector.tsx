"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Device } from "@/types/database.types"
import { supabase } from "@/lib/supabase/client"

interface DeviceSelectorProps {
  onDeviceChange: (deviceId: string) => void
  selectedDeviceId?: string
}

export function DeviceSelector({ onDeviceChange, selectedDeviceId }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDevices() {
      try {
        const { data, error } = await supabase.from("devices").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setDevices(data || [])

        // If we have devices and no selected device, select the first one
        if (data && data.length > 0 && !selectedDeviceId) {
          onDeviceChange(data[0].device_id)
        }
      } catch (error) {
        console.error("Error fetching devices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [onDeviceChange, selectedDeviceId])

  return (
    <div className="w-full max-w-xs">
      <Select disabled={loading || devices.length === 0} value={selectedDeviceId} onValueChange={onDeviceChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading devices..." : "Select a device"} />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.device_id} value={device.device_id}>
              {device.name || `Device ${device.device_id}`}
              {device.location && ` (${device.location})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
