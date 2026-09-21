import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const number = new Intl.NumberFormat("zh-CN")

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

export function formatDateTime(value: string | Date | null | undefined, fallback = "--") {
  if (!value) return fallback
  const normalizedValue = typeof value === "string" && /^\d{4}-\d{2}-\d{2} /.test(value)
    ? value.replace(" ", "T")
    : value
  const date = value instanceof Date ? value : new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return fallback

  const parts = Object.fromEntries(
    dateTimeFormatter.formatToParts(date).map(({ type, value: partValue }) => [type, partValue]),
  )
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
}

export function percent(value: number, total: number) {
  return `${((value / total) * 100).toFixed(1)}%`
}
