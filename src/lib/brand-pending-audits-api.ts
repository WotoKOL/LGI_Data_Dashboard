import { authenticatedFetch, registerRequestParameters } from "@/lib/api-client"
import { createExcelFallbackFilename, ensureExcelFilename, getDownloadFilename } from "@/lib/file-download"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

const BRAND_PENDING_AUDITS_API_URL = `${getDashboardApiBaseUrl()}/operations/issues/brand-pending-audits`

export type BrandPendingAuditsDays = 3 | 7 | 30

export type BrandPendingAuditItem = {
  rank: number
  brandId: string
  brandDisplayId: string | null
  brandName: string | null
  brandPlatform: string | null
  brandUserPhone: string | null
  csm: string | null
  latestNoteFollowUpTime: string | null
  noteFollowUpCount: number
  campaignCount: number
  pendingAuditCount: number
}

export type BrandPendingAuditsPage = {
  days: number | null
  total: number
  currentPage: number
  pageSize: number
  rows: BrandPendingAuditItem[]
}

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T | null
  traceId?: string
  success?: boolean
}

export class BrandPendingAuditsApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "BrandPendingAuditsApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    throw new BrandPendingAuditsApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }
  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || payload.data == null) {
    throw new BrandPendingAuditsApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data
}

export async function getBrandPendingAudits({
  days,
  currentPage = 1,
  pageSize = 20,
}: {
  days?: BrandPendingAuditsDays
  currentPage?: number
  pageSize?: number
} = {}) {
  const url = new URL(BRAND_PENDING_AUDITS_API_URL)
  if (days !== undefined) url.searchParams.set("days", String(days))
  url.searchParams.set("currentPage", String(currentPage))
  url.searchParams.set("pageSize", String(pageSize))
  const requestUrl = url.toString()
  registerRequestParameters(requestUrl, { ...(days === undefined ? {} : { days }), currentPage, pageSize })
  const response = await authenticatedFetch(requestUrl)
  return parseResponse<BrandPendingAuditsPage>(response)
}

export async function exportBrandPendingAudits({
  days,
}: {
  days?: BrandPendingAuditsDays
} = {}) {
  const url = new URL(`${BRAND_PENDING_AUDITS_API_URL}/export`)
  if (days !== undefined) url.searchParams.set("days", String(days))
  const requestUrl = url.toString()
  const parameters = days === undefined ? {} : { days }
  registerRequestParameters(requestUrl, parameters)
  const response = await authenticatedFetch(requestUrl)
  if (!response.ok) {
    throw new BrandPendingAuditsApiError(`导出失败（HTTP ${response.status}）`, { status: response.status })
  }
  if (response.headers.get("content-type")?.includes("json")) {
    const payload = await response.json() as ApiEnvelope<unknown>
    throw new BrandPendingAuditsApiError(payload.message || "导出失败", { traceId: payload.traceId })
  }
  return {
    blob: await response.blob(),
    filename: ensureExcelFilename(getDownloadFilename(response, createExcelFallbackFilename("品牌方未审核达人数排行榜"))),
  }
}
