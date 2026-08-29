import * as React from 'react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string // 'HH:mm'
  onChange?: (value: string) => void
  className?: string
}

export function TimePicker({ value = '08:00', onChange, className }: TimePickerProps) {
  const [hour, minute] = value.split(':')

  const handleHour = (h: string) => {
    const newVal = `${h.padStart(2, '0')}:${(minute || '00').padStart(2, '0')}`
    onChange?.(newVal)
  }

  const handleMinute = (m: string) => {
    const newVal = `${(hour || '00').padStart(2, '0')}:${m.padStart(2, '0')}`
    onChange?.(newVal)
  }

  return (
    <div className={cn('flex gap-2 items-center', className)}>
      <select value={hour} onChange={(e) => handleHour(e.target.value)} className="rounded-lg border px-3 py-2 bg-transparent">
        {Array.from({ length: 24 }).map((_, i) => {
          const v = i.toString().padStart(2, '0')
          return <option key={v} value={v}>{v}</option>
        })}
      </select>
      <span className="text-sm text-muted-foreground">:</span>
      <select value={minute} onChange={(e) => handleMinute(e.target.value)} className="rounded-lg border px-3 py-2 bg-transparent">
        {Array.from({ length: 60 }).map((_, i) => {
          const v = i.toString().padStart(2, '0')
          return <option key={v} value={v}>{v}</option>
        })}
      </select>
    </div>
  )
}

export default TimePicker
