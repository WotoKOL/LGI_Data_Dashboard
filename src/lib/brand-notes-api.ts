import { authenticatedFetch, registerRequestParameters } from "@/lib/api-client"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

const BRAND_NOTES_API_URL = `${getDashboardApiBaseUrl()}/operations/brand-notes`

export type BrandNoteItem = {
  id: string
  brandId: string
  recordContent: string
  gmtCreate: string | null
}

export type BrandNotesPage = {
  brandId: string
  total: number
  currentPage: number
  pageSize: number
  rows: BrandNoteItem[]
}

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T | null
  traceId?: string
  success?: boolean
}

export class BrandNotesApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "BrandNotesApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

async function parseResponse<T>(response: Response, allowNullData = false) {
  if (!response.ok) {
    throw new BrandNotesApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }
  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || (!allowNullData && payload.data == null)) {
    throw new BrandNotesApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data as T
}

export async function getBrandNotes({
  brandId,
  currentPage = 1,
  pageSize = 10,
}: {
  brandId: string
  currentPage?: number
  pageSize?: number
}) {
  const url = new URL(BRAND_NOTES_API_URL)
  url.searchParams.set("brandId", brandId)
  url.searchParams.set("currentPage", String(currentPage))
  url.searchParams.set("pageSize", String(pageSize))
  const requestUrl = url.toString()
  const parameters = { brandId, currentPage, pageSize }
  registerRequestParameters(requestUrl, parameters)
  const response = await authenticatedFetch(requestUrl)
  return parseResponse<BrandNotesPage>(response)
}

export async function createBrandNote({
  brandId,
  recordContent,
}: {
  brandId: string
  recordContent: string
}) {
  const body = {
    brandId,
    priRecordTypeCode: "business_progress",
    subRecordTypeCode: "audit_progress",
    recordContent: recordContent.trim(),
  }
  const response = await authenticatedFetch(
    BRAND_NOTES_API_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    body,
  )
  return parseResponse<BrandNoteItem | null>(response, true)
}
