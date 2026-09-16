export const DASHBOARD_API_BASE_URL = (
  import.meta.env.VITE_DASHBOARD_API_BASE_URL ?? "https://apipre.wotohub.com/lgi-admin"
).replace(/\/$/, "")

export type DistributionItem = {
  code: string
  name: string
  description: string | null
  count: number
  percentage: number
}

export type RankingItem = {
  rank: number
  code: string
  name: string
  count: number
  percentage: number
}

export type CreatorsDashboardData = {
  reportDate: string
  totalRegisteredCreatorCount: number
  tiktokRegisteredCreatorCount: number
  googleRegisteredCreatorCount: number
  emailRegisteredCreatorCount: number
  registeredCreatorCount30Days: number
  verifiedCreatorCount30Days: number
  registrationVerificationTrend: Array<{
    date: string
    registeredCount: number
    verifiedCount: number
  }>
  verificationOverview: {
    verifiedCreatorCount: number
    unverifiedCreatorCount: number
    verificationRate: number
    platformDistribution: DistributionItem[]
  }
  registrationSourceRanking: RankingItem[]
  countryRanking: RankingItem[]
  followerTierDistribution: DistributionItem[]
}

export type CategoriesDashboardData = {
  reportDate: string
  classifiedCreatorCount: number
  categoryCount: number
  topCategory: {
    rank: number
    code: string
    name: string
    creatorCount: number
    percentage: number
  } | null
  categories: Array<{
    rank: number
    code: string
    name: string
    creatorCount: number
    percentage: number
  }>
}

export type ActivityDashboardData = {
  reportDate: string
  totalCreatorCount: number
  todayActiveCreatorCount: number
  todayActiveRate: number
  activeCreatorCount7Days: number
  activeRate7Days: number
  activeCreatorCount30Days: number
  activeRate30Days: number
  activeCreatorCount90Days: number
  activeRate90Days: number
  inactiveCreatorCount30Days: number
  inactiveRate30Days: number
}

export type CampaignsDashboardData = {
  reportDate: string
  totalCampaignCount: number
  onShelfCampaignCount: number
  offShelfCampaignCount: number
  pendingReviewCampaignCount: number
  publishingTrend: Array<{
    date: string
    totalCount: number
    wotoHubCount: number
    wotoKolCount: number
    wotoPartnerCount: number
  }>
  sourceDistribution: DistributionItem[]
  cooperationModeDistribution: DistributionItem[]
  applyOverview: {
    totalApplyCount: number
    approvedApplyCount: number
    approvedRate: number
    rejectedApplyCount: number
    rejectedRate: number
    pendingApplyCount: number
    pendingRate: number
  }
  fulfillmentProgress: DistributionItem[]
}

export type BrandMetric = "published" | "pending" | "rejected"

export type BrandsDashboardData = {
  reportDate: string
  metric: BrandMetric
  metricName: string
  items: Array<{
    rank: number
    brandId: string
    brandName: string
    count: number
  }>
}

export type SubscriptionsDashboardData = {
  reportDate: string
  currency: string
  totalSubscriptionAmount: number
  monthOverMonthRate: number
  subscribedCreatorCount: number
  subscriptionOrderCount: number
  autoRenewCreatorCount: number
  autoRenewRate: number
  oneTimeCreatorCount: number
  oneTimeRate: number
  packageDistribution: DistributionItem[]
}

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T
  traceId?: string
  success?: boolean
}

export class DashboardApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "DashboardApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

export function dashboardEndpoint(
  endpoint: "creators" | "categories" | "activity" | "campaigns" | "brands" | "subscriptions",
  params?: Record<string, string | number | undefined>,
) {
  const url = new URL(`${DASHBOARD_API_BASE_URL}/operations/dashboard/${endpoint}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export async function dashboardFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } })
  if (!response.ok) {
    throw new DashboardApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }

  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || !payload.data) {
    throw new DashboardApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data
}
