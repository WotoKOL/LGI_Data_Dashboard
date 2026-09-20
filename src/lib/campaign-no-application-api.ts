import { authenticatedFetch, registerRequestParameters } from "@/lib/api-client"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

const CAMPAIGN_NO_APPLICATION_API_URL = `${getDashboardApiBaseUrl()}/operations/campaign-no-application/campaigns`

export type CampaignNoApplicationStatus = "PENDING" | "HANDLED" | "ALL"

export type CampaignNoApplicationItem = {
  campaignId: string
  campaignDisplayId: string | null
  campaignTitle: string
  campaignMainImg: string | null
  brandId: string
  brandDisplayId: string | null
  brandName: string | null
  publishTime: string | null
  noApplicationHours: number
  noApplicationDays: number
  noApplicationDurationText: string | null
  exposureCount: number | null
  aiAnalysisReport: string | null
  handlingStatus: "PENDING" | "HANDLED"
  handledBy: string | null
  handleRemark: string | null
  handledTime: string | null
}

export type CampaignNoApplicationPage = {
  pendingCount: number
  total: number
  currentPage: number
  pageSize: number
  rows: CampaignNoApplicationItem[]
}

export type CampaignNoApplicationHandlingResult = {
  campaignId: string
  handlingStatus: "PENDING" | "HANDLED"
  handledBy: string | null
  handleRemark: string | null
  handledTime: string | null
  traceId?: string | null
}

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T | null
  traceId?: string
  success?: boolean
}

export class CampaignNoApplicationApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "CampaignNoApplicationApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    throw new CampaignNoApplicationApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }

  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || payload.data == null) {
    throw new CampaignNoApplicationApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data
}

export async function getCampaignNoApplicationCampaigns({
  status = "PENDING",
  currentPage = 1,
  pageSize = 20,
}: {
  status?: CampaignNoApplicationStatus
  currentPage?: number
  pageSize?: number
} = {}) {
  const url = new URL(CAMPAIGN_NO_APPLICATION_API_URL)
  url.searchParams.set("status", status)
  url.searchParams.set("currentPage", String(currentPage))
  url.searchParams.set("pageSize", String(pageSize))
  const requestUrl = url.toString()
  const parameters = { status, currentPage, pageSize }
  registerRequestParameters(requestUrl, parameters)
  const response = await authenticatedFetch(requestUrl)
  return parseResponse<CampaignNoApplicationPage>(response)
}

export async function setCampaignNoApplicationHandling(
  campaignId: string,
  {
    handled,
    operator,
    remark,
  }: {
    handled: boolean
    operator?: string
    remark?: string
  },
) {
  const body = {
    handled,
    ...(operator?.trim() ? { operator: operator.trim() } : {}),
    ...(remark?.trim() ? { remark: remark.trim() } : {}),
  }
  const response = await authenticatedFetch(
    `${CAMPAIGN_NO_APPLICATION_API_URL}/${encodeURIComponent(campaignId)}/handling`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    body,
  )
  return parseResponse<CampaignNoApplicationHandlingResult>(response)
}
