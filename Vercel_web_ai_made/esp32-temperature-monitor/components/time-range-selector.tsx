"use client"

import { Button } from "@/components/ui/button"

interface TimeRangeSelectorProps {
  onRangeChange: (days: number) => void
  currentRange: number
}

export function TimeRangeSelector({ onRangeChange, currentRange }: TimeRangeSelectorProps) {
  const ranges = [
    { label: "24 Hours", value: 1 },
    { label: "3 Days", value: 3 },
    { label: "5 Days", value: 5 },
    { label: "7 Days", value: 7 },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={currentRange === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onRangeChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  )
}
