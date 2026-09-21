import { authenticatedFetch, registerRequestParameters } from "@/lib/api-client"
import { createExcelFallbackFilename, ensureExcelFilename, getDownloadFilename } from "@/lib/file-download"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

const CAMPAIGN_AUDIT_TIMEOUT_API_URL = `${getDashboardApiBaseUrl()}/operations/campaign-audit-timeout/campaigns`

export type CampaignAuditTimeoutStatus = "PENDING" | "HANDLED" | "ALL"

export type CampaignAuditTimeoutItem = {
  campaignId: string
  campaignDisplayId: string | null
  campaignTitle: string
  campaignMainImg: string | null
  brandId: string
  brandDisplayId: string | null
  brandName: string | null
  brandPlatformType: string | null
  brandUserPhone: string | null
  csm: string | null
  childBrandId: string | null
  publishTime: string | null
  oldestPendingApplyTime: string | null
  lastAuditTime: string | null
  overdueDays: number
  pendingAuditCount: number
  aiAnalysisReport: string | null
  handlingStatus: "PENDING" | "HANDLED"
  handledBy: string | null
  handleRemark: string | null
  handledTime: string | null
}

export type CampaignAuditTimeoutPage = {
  pendingCount: number
  total: number
  currentPage: number
  pageSize: number
  rows: CampaignAuditTimeoutItem[]
}

export type CampaignAuditTimeoutHandlingResult = {
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

export class CampaignAuditTimeoutApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "CampaignAuditTimeoutApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    throw new CampaignAuditTimeoutApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }
  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || payload.data == null) {
    throw new CampaignAuditTimeoutApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data
}

export async function getCampaignAuditTimeoutCampaigns({
  status = "PENDING",
  currentPage = 1,
  pageSize = 20,
  csm,
  brandId,
}: {
  status?: CampaignAuditTimeoutStatus
  currentPage?: number
  pageSize?: number
  csm?: string
  brandId?: string
} = {}) {
  const url = new URL(CAMPAIGN_AUDIT_TIMEOUT_API_URL)
  url.searchParams.set("status", status)
  url.searchParams.set("currentPage", String(currentPage))
  url.searchParams.set("pageSize", String(pageSize))
  if (csm?.trim()) url.searchParams.set("csm", csm.trim())
  if (brandId?.trim()) url.searchParams.set("brandId", brandId.trim())
  const requestUrl = url.toString()
  registerRequestParameters(requestUrl, {
    status,
    currentPage,
    pageSize,
    ...(csm?.trim() ? { csm: csm.trim() } : {}),
    ...(brandId?.trim() ? { brandId: brandId.trim() } : {}),
  })
  const response = await authenticatedFetch(requestUrl)
  return parseResponse<CampaignAuditTimeoutPage>(response)
}

export async function exportCampaignAuditTimeoutCampaigns({
  status = "PENDING",
  csm,
  brandId,
}: {
  status?: CampaignAuditTimeoutStatus
  csm?: string
  brandId?: string
} = {}) {
  const url = new URL(`${CAMPAIGN_AUDIT_TIMEOUT_API_URL}/export`)
  url.searchParams.set("status", status)
  if (csm?.trim()) url.searchParams.set("csm", csm.trim())
  if (brandId?.trim()) url.searchParams.set("brandId", brandId.trim())
  const requestUrl = url.toString()
  const parameters = {
    status,
    ...(csm?.trim() ? { csm: csm.trim() } : {}),
    ...(brandId?.trim() ? { brandId: brandId.trim() } : {}),
  }
  registerRequestParameters(requestUrl, parameters)
  const response = await authenticatedFetch(requestUrl)
  if (!response.ok) {
    throw new CampaignAuditTimeoutApiError(`导出失败（HTTP ${response.status}）`, { status: response.status })
  }
  if (response.headers.get("content-type")?.includes("json")) {
    const payload = await response.json() as ApiEnvelope<unknown>
    throw new CampaignAuditTimeoutApiError(payload.message || "导出失败", { traceId: payload.traceId })
  }
  return {
    blob: await response.blob(),
    filename: ensureExcelFilename(getDownloadFilename(response, createExcelFallbackFilename("商单申请审核超时"))),
  }
}

export async function setCampaignAuditTimeoutHandling(campaignId: string, { handled, operator, remark }: { handled: boolean; operator?: string; remark?: string }) {
  const body = {
    handled,
    ...(operator?.trim() ? { operator: operator.trim() } : {}),
    ...(remark?.trim() ? { remark: remark.trim() } : {}),
  }
  const response = await authenticatedFetch(
    `${CAMPAIGN_AUDIT_TIMEOUT_API_URL}/${encodeURIComponent(campaignId)}/handling`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    body,
  )
  return parseResponse<CampaignAuditTimeoutHandlingResult>(response)
}
