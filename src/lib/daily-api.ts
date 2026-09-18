import { authenticatedFetch, registerRequestParameters } from "@/lib/api-client"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

export const DAILY_API_BASE_URL = getDashboardApiBaseUrl()

export type DailySummaryData = {
  reportDate: string
  registeredCreatorCount: number
  verifiedSocialCount: number
  activeCreatorCount: number
  campaignApplyCount: number
  pendingReviewApplyCount: number
  approvedApplyCount: number
  rejectedApplyCount: number
  completedCooperationCount: number
  publishedCampaignCount: number
}

export type DailyHourlyTrendData = {
  reportDate: string
  registeredCreatorCount: number
  points: Array<{
    hour: number
    time: string
    registeredCreatorCount: number
    verifiedSocialCount: number
    activeCreatorCount: number
  }>
}

export type DailyDistributionItem = {
  code: string
  name: string
  count: number
  percentage: number
}

export type DailyDistributionsData = {
  reportDate: string
  registeredCreatorCount: number
  verifiedSocialCount: number
  verificationRate: number
  registrationMethods: DailyDistributionItem[]
  verifiedPlatforms: DailyDistributionItem[]
}

export type DailyEvent = {
  eventType: string
  eventName: string
  subjectId: string
  subjectName: string
  subjectAvatar: string | null
  description: string
  platform: string | null
  campaignId: string | null
  campaignTitle: string | null
  occurredAt: string
}

export type DailyEventsData = {
  reportDate: string
  events: DailyEvent[]
}

export type DailyCampaign = {
  campaignId: string
  campaignTitle: string
  brandName: string
  brandLogo: string | null
  productName: string
  campaignMainImg: string | null
  productLink: string | null
  platforms: string[]
  budgetMin: number | null
  budgetMax: number | null
  budgetCurrency: string
  fixedCompensationMin: number | null
  fixedCompensationMax: number | null
  commissionRateMin: number | null
  commissionRateMax: number | null
  publishedTime: string
}

export type DailyCampaignsData = {
  reportDate: string
  total: number
  campaigns: DailyCampaign[]
}

export type DailyCreator = {
  lgiUserId: string
  avatar: string | null
  nickname: string
  countryCode: string | null
  countryName: string | null
  registrationMethod: string
  registrationMethodName: string
  verifiedSocialPlatforms: string[]
  registeredTime: string
}

export type DailyCreatorsData = {
  reportDate: string
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
  rows: DailyCreator[]
}

export type DailyEndpoint = "summary" | "hourly-trend" | "distributions" | "events" | "campaigns" | "creators"

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T | null
  traceId?: string
  success?: boolean
}

export class DailyApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "DailyApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

export function dailyEndpoint(
  endpoint: DailyEndpoint,
  params?: Record<string, string | number | undefined>,
) {
  const url = new URL(`${DAILY_API_BASE_URL}/operations/daily/${endpoint}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
  })
  const requestUrl = url.toString()
  registerRequestParameters(requestUrl, params)
  return requestUrl
}

export async function dailyFetcher<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url)
  if (!response.ok) {
    throw new DailyApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }

  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || payload.data == null) {
    throw new DailyApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data
}
