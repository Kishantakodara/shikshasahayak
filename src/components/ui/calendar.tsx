import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

export interface CalendarProps {
  className?: string
  classNames?: {
    months?: string
    month?: string
    caption?: string
    caption_label?: string
    nav?: string
    nav_button?: string
    nav_button_previous?: string
    nav_button_next?: string
    table?: string
    head_row?: string
    head_cell?: string
    row?: string
    cell?: string
    day?: string
    day_selected?: string
    day_today?: string
    day_outside?: string
    day_disabled?: string
    day_range_middle?: string
    day_hidden?: string
  }
  showOutsideDays?: boolean
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode = "single",
  selected,
  onSelect,
  disabled,
  ...props
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(selected || new Date())
  
  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }
  
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day)
    if (disabled && disabled(clickedDate)) return
    onSelect?.(clickedDate)
  }
  
  const renderCalendarDays = () => {
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      if (showOutsideDays) {
        const prevMonthDay = new Date(currentYear, currentMonth - 1, 0).getDate() - (firstDayOfWeek - i - 1)
        days.push(
          <button
            key={`prev-${prevMonthDay}`}
            className={cn(
              "h-9 w-9 p-0 font-normal text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              classNames?.day,
              classNames?.day_outside
            )}
            onClick={() => {
              const date = new Date(currentYear, currentMonth - 1, prevMonthDay)
              onSelect?.(date)
            }}
          >
            {prevMonthDay}
          </button>
        )
      } else {
        days.push(<div key={`empty-${i}`} className="h-9 w-9" />)
      }
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = selected && date.toDateString() === selected.toDateString()
      const isDisabled = disabled && disabled(date)
      
      days.push(
        <button
          key={day}
          className={cn(
            "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            isToday && !isSelected && "bg-accent text-accent-foreground",
            isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed",
            classNames?.day,
            isSelected && classNames?.day_selected,
            isToday && classNames?.day_today,
            isDisabled && classNames?.day_disabled
          )}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
        >
          {day}
        </button>
      )
    }
    
    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - days.length // 6 rows × 7 days = 42 cells
    if (showOutsideDays) {
      for (let i = 1; i <= remainingCells; i++) {
        days.push(
          <button
            key={`next-${i}`}
            className={cn(
              "h-9 w-9 p-0 font-normal text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              classNames?.day,
              classNames?.day_outside
            )}
            onClick={() => {
              const date = new Date(currentYear, currentMonth + 1, i)
              onSelect?.(date)
            }}
          >
            {i}
          </button>
        )
      }
    }
    
    return days
  }
  
  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={goToPreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={goToNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="h-9 w-9 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {dayName}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }