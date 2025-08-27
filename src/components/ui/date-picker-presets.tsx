"use client"

import * as React from "react"
import { addDays, format, startOfMonth, endOfMonth, startOfYesterday, endOfYesterday, startOfWeek, endOfWeek, subMonths } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface DatePickerWithPresetsProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined;
    setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}

export function DatePickerWithPresets({
  className,
  date,
  setDate
}: DatePickerWithPresetsProps) {

  const handlePresetChange = (value: string) => {
    const now = new Date();
    switch (value) {
        case "today":
            setDate({ from: now, to: now });
            break;
        case "yesterday":
            setDate({ from: startOfYesterday(), to: endOfYesterday() });
            break;
        case "this_month":
            setDate({ from: startOfMonth(now), to: endOfMonth(now) });
            break;
        case "last_month":
            const lastMonth = subMonths(now, 1);
            setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
            break;
        default:
             setDate(undefined);
    }
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
        <Select onValueChange={handlePresetChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent position="popper">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="last_month">Last month</SelectItem>
            </SelectContent>
        </Select>
        <Popover>
            <PopoverTrigger asChild>
            <Button
                id="date"
                variant={"outline"}
                className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                date.to ? (
                    <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                    </>
                ) : (
                    format(date.from, "LLL dd, y")
                )
                ) : (
                <span>Custom range</span>
                )}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
            <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
            />
            </PopoverContent>
        </Popover>
    </div>
  )
}
