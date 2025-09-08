"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePicker28Props {
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

export function DatePicker28({
  label = "Select Date",
  placeholder = "Choose a date",
  value,
  onChange,
  className = "",
  disabled = false
}: DatePicker28Props) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value || undefined)
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState(formatDate(date))

  // Update internal state when external value changes
  React.useEffect(() => {
    if (value !== date) {
      setDate(value || undefined)
      setMonth(value || undefined)
      setInputValue(formatDate(value || undefined))
    }
  }, [value, date])

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    setMonth(newDate)
    setInputValue(formatDate(newDate))
    onChange?.(newDate || null)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = new Date(e.target.value)
    setInputValue(e.target.value)
    if (isValidDate(inputDate)) {
      setDate(inputDate)
      setMonth(inputDate)
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
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateChange}
              showOutsideDays={true}
              fixedWeeks={true}
              weekStartsOn={0}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
