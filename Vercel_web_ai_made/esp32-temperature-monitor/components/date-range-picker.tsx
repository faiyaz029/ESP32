"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface DateRangePickerProps {
  onRangeChange: (range: { from: Date; to: Date }) => void
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [date, setDate] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to last 24 hours
    to: new Date(),
  })

  const handleSelect = (range: { from: Date; to?: Date }) => {
    if (range.from && range.to) {
      setDate({ from: range.from, to: range.to })
      onRangeChange({ from: range.from, to: range.to })
    }
  }

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[300px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "PPP")} - {format(date.to, "PPP")}
                </>
              ) : (
                format(date.from, "PPP")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date.from}
            selected={{ from: date.from, to: date.to }}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
