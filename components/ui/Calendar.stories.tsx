import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Calendar } from './calendar'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { CalendarIcon } from 'lucide-react'

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A calendar component for date selection.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Calendar
      mode="single"
      className="rounded-md border"
    />
  ),
}

export const WithSelection: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    )
  },
}

export const Range: Story = {
  render: () => {
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
      from: new Date(),
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    })
    
    return (
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={setDateRange}
        className="rounded-md border"
      />
    )
  },
}

export const Multiple: Story = {
  render: () => {
    const [dates, setDates] = React.useState<Date[] | undefined>([
      new Date(),
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ])
    
    return (
      <Calendar
        mode="multiple"
        selected={dates}
        onSelect={setDates}
        className="rounded-md border"
      />
    )
  },
}

export const InPopover: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? date.toLocaleDateString() : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  },
}

export const WithDisabledDates: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    const disabledDates = [
      new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    ]
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={disabledDates}
        className="rounded-md border"
      />
    )
  },
}

export const WithMinMax: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    const minDate = new Date()
    const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        fromDate={minDate}
        toDate={maxDate}
        className="rounded-md border"
      />
    )
  },
}

export const WithWeekStartsOn: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        weekStartsOn={1} // Monday
        className="rounded-md border"
      />
    )
  },
}

export const WithCustomModifiers: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    const modifiers = {
      today: new Date(),
      weekend: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
      holiday: [
        new Date(2024, 0, 1), // New Year
        new Date(2024, 6, 4), // Independence Day
        new Date(2024, 11, 25), // Christmas
      ],
    }
    
    const modifiersClassNames = {
      today: "bg-blue-100 text-blue-900 font-bold",
      weekend: "bg-gray-100 text-gray-600",
      holiday: "bg-red-100 text-red-900 font-bold",
    }
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="rounded-md border"
      />
    )
  },
}

export const DatePicker: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Date</label>
          <p className="text-sm text-muted-foreground">Choose a date for your appointment</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? date.toLocaleDateString() : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {date && (
          <p className="text-sm text-muted-foreground">
            Selected: {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        )}
      </div>
    )
  },
}

export const DateRangePicker: Story = {
  render: () => {
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
      from: undefined,
      to: undefined,
    })
    
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Date Range</label>
          <p className="text-sm text-muted-foreground">Choose a date range for your booking</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                ) : (
                  dateRange.from.toLocaleDateString()
                )
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dateRange.from && dateRange.to && (
          <p className="text-sm text-muted-foreground">
            Duration: {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
        )}
      </div>
    )
  },
}

export const Compact: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border w-fit"
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
          row: "flex w-full mt-1",
          cell: "h-8 w-8 text-center text-sm relative p-0 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
    )
  },
}
