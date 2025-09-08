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

interface CalendarManualProps {
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

// Manual calendar generation without Date manipulation
function generateCalendarDays(year: number, month: number) {
  const days = []
  const today = new Date()
  
  // Get the first day of the month and what day of the week it falls on
  const firstDayOfMonth = new Date(year, month, 1)
  const firstDayWeekday = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate how many days we need from the previous month
  const daysFromPrevMonth = firstDayWeekday
  
  // Get the number of days in the previous month
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  
  // Add days from previous month
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i
    const date = new Date(prevYear, prevMonth, dayNumber)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.toDateString() === today.toDateString()
    })
  }
  
  // Add days from current month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date = new Date(year, month, day)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString()
    })
  }
  
  // Add days from next month to fill the grid (always 6 weeks = 42 days)
  const totalDays = 42
  const remainingDays = totalDays - days.length
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(nextYear, nextMonth, day)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.toDateString() === today.toDateString()
    })
  }
  
  return days
}

export function CalendarManual({
  label = "Select Date",
  placeholder = "Choose a date",
  value,
  onChange,
  className = "",
  disabled = false
}: CalendarManualProps) {
  const [open, setOpen] = React.useState(false)
  const [currentDate, setCurrentDate] = React.useState(value || new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value || undefined)
  const [inputValue, setInputValue] = React.useState(formatDate(value || undefined))

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const calendarDays = generateCalendarDays(currentYear, currentMonth)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setInputValue(formatDate(date))
    onChange?.(date)
    setOpen(false)
  }

  const handleMonthChange = (monthIndex: number) => {
    setCurrentDate(new Date(currentYear, monthIndex, 1))
  }

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentMonth, 1))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = new Date(e.target.value)
    setInputValue(e.target.value)
    if (isValidDate(inputDate)) {
      setSelectedDate(inputDate)
      setCurrentDate(inputDate)
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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 z-10"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end" alignOffset={-8} sideOffset={10}>
            <div className="space-y-4">
              {/* Month/Year Selectors */}
              <div className="flex gap-2">
                <Select value={currentMonth.toString()} onValueChange={(value) => handleMonthChange(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={currentYear.toString()} onValueChange={(value) => handleYearChange(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 50 }, (_, i) => currentYear - 25 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Weekday Headers */}
                {weekDays.map((day) => (
                  <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, index) => (
                  <Button
                    key={index}
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
                    title={`${day.date.toDateString()} (Day ${day.date.getDay()})`}
                  >
                    {day.date.getDate()}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
