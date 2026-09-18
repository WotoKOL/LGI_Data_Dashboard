import { getDashboardEnvironment } from "@/lib/auth"

const API_BASE_URLS = {
  pre: import.meta.env.VITE_PRE_API_BASE_URL || "https://apipre.wotohub.com/lgi-admin",
  prod: import.meta.env.VITE_PROD_API_BASE_URL || "https://api-prd.wotohub.com/lgi-admin",
} as const

export function getDashboardApiBaseUrl() {
  return API_BASE_URLS[getDashboardEnvironment()].replace(/\/$/, "")
}
