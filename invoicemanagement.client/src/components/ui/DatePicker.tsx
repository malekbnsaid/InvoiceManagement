import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, SelectSingleEventHandler } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./Button"

export interface DatePickerProps {
  label?: string
  views?: ('year' | 'month' | 'day')[]
  selected?: Date
  onSelect?: SelectSingleEventHandler
  disabled?: boolean
  className?: string
}

export function DatePicker({
  label,
  views = ['year', 'month', 'day'],
  selected,
  onSelect,
  disabled = false,
  className,
}: DatePickerProps) {
  const [currentView, setCurrentView] = React.useState<'year' | 'month' | 'day'>('year')
  const [currentDate, setCurrentDate] = React.useState<Date>(selected || new Date())

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(year)
    setCurrentDate(newDate)
    if (views.includes('month')) {
      setCurrentView('month')
    } else if (views.includes('day')) {
      setCurrentView('day')
    }
  }

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(month)
    setCurrentDate(newDate)
    if (views.includes('day')) {
      setCurrentView('day')
    }
  }

  const handleDaySelect: SelectSingleEventHandler = (day) => {
    if (day) {
      setCurrentDate(day)
      onSelect?.(day, day)
    }
  }

  const renderYearView = () => {
    const currentYear = currentDate.getFullYear()
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i)

    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">Select Year</h3>
        <div className="grid grid-cols-3 gap-3">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => handleYearSelect(year)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-16 text-base font-medium rounded-lg transition-all duration-200",
                year === currentYear 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-gray-100 text-gray-700 hover:scale-105"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
          Select Month for {currentDate.getFullYear()}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {months.map((month, index) => (
            <button
              key={month}
              onClick={() => handleMonthSelect(index)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-16 text-base font-medium rounded-lg transition-all duration-200",
                index === currentDate.getMonth() 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-gray-100 text-gray-700 hover:scale-105"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    return (
      <div>
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
          Select Day for {format(currentDate, 'MMMM yyyy')}
        </h3>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          month={currentDate}
          onMonthChange={setCurrentDate}
          disabled={disabled}
          className={cn("p-3", className)}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>
    )
  }

  const renderNavigation = () => {
    if (views.length === 1) return null

    return (
      <div className="flex justify-center space-x-2 p-3 border-b bg-gray-50">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={cn(
              buttonVariants({ variant: currentView === view ? "default" : "ghost" }),
              "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              currentView === view 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-gray-100 text-gray-600"
            )}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'year':
        return renderYearView()
      case 'month':
        return renderMonthView()
      case 'day':
        return renderDayView()
      default:
        return renderDayView()
    }
  }

  return (
    <div className="border rounded-md bg-popover">
      {renderNavigation()}
      {renderCurrentView()}
    </div>
  )
}

DatePicker.displayName = "DatePicker"
