'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';


interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined;
    setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}

export function DatePickerWithRange({ className, date, setDate }: DatePickerWithRangeProps) {
    const handlePresetChange = (value: string) => {
        const now = new Date();
        switch (value) {
            case 'today':
                setDate({ from: now, to: now });
                break;
            case 'this_week':
                 setDate({ from: startOfWeek(now), to: endOfWeek(now) });
                break;
            case 'this_month':
                setDate({ from: startOfMonth(now), to: endOfMonth(now) });
                break;
            case 'last_month':
                const lastMonth = subMonths(now, 1);
                setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
                break;
        }
    }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2">
                 <Select onValueChange={handlePresetChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a preset..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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
  );
}
