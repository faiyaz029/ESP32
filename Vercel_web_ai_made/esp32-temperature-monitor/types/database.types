export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: number
          device_id: string
          name: string | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: number
          device_id: string
          name?: string | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          device_id?: string
          name?: string | null
          location?: string | null
          created_at?: string
        }
      }
      sensor_readings: {
        Row: {
          id: number
          device_id: string
          temperature: number
          humidity: number
          recorded_at: string
        }
        Insert: {
          id?: number
          device_id: string
          temperature: number
          humidity: number
          recorded_at?: string
        }
        Update: {
          id?: number
          device_id?: string
          temperature?: number
          humidity?: number
          recorded_at?: string
        }
      }
      events: {
        Row: {
          id: number
          device_id: string
          event_type: string
          event_value: boolean
          created_at: string
        }
        Insert: {
          id?: number
          device_id: string
          event_type: string
          event_value: boolean
          created_at?: string
        }
        Update: {
          id?: number
          device_id?: string
          event_type?: string
          event_value?: boolean
          created_at?: string
        }
      }
    }
  }
}

export type Device = Database["public"]["Tables"]["devices"]["Row"]
export type SensorReading = Database["public"]["Tables"]["sensor_readings"]["Row"]
export type Event = Database["public"]["Tables"]["events"]["Row"]

export type EventType = "window_open" | "sunlight_blocked" | "fan_on"

export interface EventState {
  window_open: boolean
  sunlight_blocked: boolean
  fan_on: boolean
}
