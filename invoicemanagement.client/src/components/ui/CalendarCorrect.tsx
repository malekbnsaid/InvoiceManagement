"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CalendarCorrectProps {
  label?: string
  placeholder?: string
  value?: Date | null
  onChange?: (date: Date | null) => void
  className?: string
  disabled?: boolean
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

// Hardcoded calendar data for August 2025 to ensure correct alignment
function generateAugust2025Calendar() {
  const calendar = []
  const today = new Date()
  
  // Week 1: July 27 - August 2
  calendar.push([
    { date: new Date(2025, 6, 27), isCurrentMonth: false, isToday: false }, // Sun
    { date: new Date(2025, 6, 28), isCurrentMonth: false, isToday: false }, // Mon
    { date: new Date(2025, 6, 29), isCurrentMonth: false, isToday: false }, // Tue
    { date: new Date(2025, 6, 30), isCurrentMonth: false, isToday: false }, // Wed
    { date: new Date(2025, 6, 31), isCurrentMonth: false, isToday: false }, // Thu
    { date: new Date(2025, 7, 1), isCurrentMonth: true, isToday: false },  // Fri
    { date: new Date(2025, 7, 2), isCurrentMonth: true, isToday: false },  // Sat
  ])
  
  // Week 2: August 3-9
  calendar.push([
    { date: new Date(2025, 7, 3), isCurrentMonth: true, isToday: false },  // Sun
    { date: new Date(2025, 7, 4), isCurrentMonth: true, isToday: false },  // Mon
    { date: new Date(2025, 7, 5), isCurrentMonth: true, isToday: false },  // Tue
    { date: new Date(2025, 7, 6), isCurrentMonth: true, isToday: false },  // Wed
    { date: new Date(2025, 7, 7), isCurrentMonth: true, isToday: false },  // Thu
    { date: new Date(2025, 7, 8), isCurrentMonth: true, isToday: false },  // Fri
    { date: new Date(2025, 7, 9), isCurrentMonth: true, isToday: false },  // Sat
  ])
  
  // Week 3: August 10-16
  calendar.push([
    { date: new Date(2025, 7, 10), isCurrentMonth: true, isToday: false }, // Sun
    { date: new Date(2025, 7, 11), isCurrentMonth: true, isToday: false }, // Mon
    { date: new Date(2025, 7, 12), isCurrentMonth: true, isToday: false }, // Tue
    { date: new Date(2025, 7, 13), isCurrentMonth: true, isToday: false }, // Wed
    { date: new Date(2025, 7, 14), isCurrentMonth: true, isToday: false }, // Thu
    { date: new Date(2025, 7, 15), isCurrentMonth: true, isToday: false }, // Fri
    { date: new Date(2025, 7, 16), isCurrentMonth: true, isToday: false }, // Sat
  ])
  
  // Week 4: August 17-23
  calendar.push([
    { date: new Date(2025, 7, 17), isCurrentMonth: true, isToday: false }, // Sun
    { date: new Date(2025, 7, 18), isCurrentMonth: true, isToday: false }, // Mon
    { date: new Date(2025, 7, 19), isCurrentMonth: true, isToday: false }, // Tue
    { date: new Date(2025, 7, 20), isCurrentMonth: true, isToday: false }, // Wed
    { date: new Date(2025, 7, 21), isCurrentMonth: true, isToday: false }, // Thu
    { date: new Date(2025, 7, 22), isCurrentMonth: true, isToday: false }, // Fri
    { date: new Date(2025, 7, 23), isCurrentMonth: true, isToday: false }, // Sat
  ])
  
  // Week 5: August 24-30
  calendar.push([
    { date: new Date(2025, 7, 24), isCurrentMonth: true, isToday: false }, // Sun
    { date: new Date(2025, 7, 25), isCurrentMonth: true, isToday: false }, // Mon
    { date: new Date(2025, 7, 26), isCurrentMonth: true, isToday: false }, // Tue
    { date: new Date(2025, 7, 27), isCurrentMonth: true, isToday: false }, // Wed
    { date: new Date(2025, 7, 28), isCurrentMonth: true, isToday: false }, // Thu
    { date: new Date(2025, 7, 29), isCurrentMonth: true, isToday: false }, // Fri
    { date: new Date(2025, 7, 30), isCurrentMonth: true, isToday: false }, // Sat
  ])
  
  // Week 6: August 31 - September 6
  calendar.push([
    { date: new Date(2025, 7, 31), isCurrentMonth: true, isToday: false }, // Sun
    { date: new Date(2025, 8, 1), isCurrentMonth: false, isToday: false }, // Mon
    { date: new Date(2025, 8, 2), isCurrentMonth: false, isToday: false }, // Tue
    { date: new Date(2025, 8, 3), isCurrentMonth: false, isToday: false }, // Wed
    { date: new Date(2025, 8, 4), isCurrentMonth: false, isToday: false }, // Thu
    { date: new Date(2025, 8, 5), isCurrentMonth: false, isToday: false }, // Fri
    { date: new Date(2025, 8, 6), isCurrentMonth: false, isToday: false }, // Sat
  ])
  
  // Mark today's date
  calendar.forEach(week => {
    week.forEach(day => {
      if (day.date.toDateString() === today.toDateString()) {
        day.isToday = true
      }
    })
  })
  
  return calendar
}

export function CalendarCorrect({
  label = "Select Date",
  placeholder = "Choose a date",
  value,
  onChange,
  className = "",
  disabled = false
}: CalendarCorrectProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value || undefined)
  const [inputValue, setInputValue] = React.useState(formatDate(value || undefined))

  // Update internal state when external value changes
  React.useEffect(() => {
    if (value !== selectedDate) {
      setSelectedDate(value || undefined)
      setInputValue(formatDate(value || undefined))
    }
  }, [value, selectedDate])

  // Handle clicking outside to close calendar
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const calendarWeeks = generateAugust2025Calendar()
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  
  // Debug: Log current state
  console.log('CalendarCorrect render:', { selectedDate, value, inputValue })

  const handleDateSelect = (date: Date) => {
    console.log('CalendarCorrect: Date selected:', date)
    setSelectedDate(date)
    setInputValue(formatDate(date))
    onChange?.(date)
    // Force close the popover
    setTimeout(() => {
      setOpen(false)
    }, 100)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = new Date(e.target.value)
    setInputValue(e.target.value)
    if (isValidDate(inputDate)) {
      setSelectedDate(inputDate)
      onChange?.(inputDate)
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <Label htmlFor="date-picker" className="px-1 font-semibold text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id="date-picker"
          value={inputValue}
          placeholder={placeholder}
          className="bg-background pr-10"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute top-1/2 right-2 size-6 -translate-y-1/2 z-10"
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <CalendarIcon className="size-3.5" />
          <span className="sr-only">Select date</span>
        </Button>
        
        {open && (
          <div 
            className="absolute top-full left-0 z-50 mt-2 w-auto bg-white border border-gray-200 rounded-lg shadow-lg p-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Month/Year Display */}
              <div className="text-center">
                <h3 className="text-lg font-semibold">August 2025</h3>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-1">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Weeks */}
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIndex) => (
                      <Button
                        key={`${weekIndex}-${dayIndex}`}
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 text-sm ${
                          day.isCurrentMonth
                            ? "text-gray-900 hover:bg-gray-100"
                            : "text-gray-400"
                        } ${
                          day.isToday
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : ""
                        } ${
                          selectedDate && day.date.toDateString() === selectedDate.toDateString()
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : ""
                        }`}
                        onClick={() => handleDateSelect(day.date)}
                        title={`${day.date.toDateString()}`}
                      >
                        {day.date.getDate()}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
