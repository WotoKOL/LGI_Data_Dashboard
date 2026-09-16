import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const number = new Intl.NumberFormat("zh-CN")

export function percent(value: number, total: number) {
  return `${((value / total) * 100).toFixed(1)}%`
}
