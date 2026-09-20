import { authenticatedFetch, registerRequestParameters } from "@/lib/api-client"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

const FAILURE_LOGS_API_URL = `${getDashboardApiBaseUrl()}/operations/issues/failure-logs`

export type FailureLog = {
  id: string
  sourceDatabase: string | null
  title: string | null
  functionName: string | null
  url: string | null
  inParam: string | null
  outResult: string | null
  operaType: string | null
  operaTypeName: string | null
  status: number | string | null
  statusName: string | null
  reqIp: string | null
  userId: string | null
  parentUserId: string | null
  traceId: string | null
  msgId: string | null
  remark: string | null
  portalId: number | null
  portalSource: string | null
  gmtCreate: string | null
  sendTime: string | null
}

export type FailureLogPage = {
  days: number | null
  total: number
  currentPage: number
  pageSize: number
  rows: FailureLog[]
}

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T | null
  traceId?: string
  success?: boolean
}

export class FailureLogsApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "FailureLogsApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    throw new FailureLogsApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }

  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || payload.data == null) {
    throw new FailureLogsApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data
}

export async function getFailureLogs({ currentPage = 1, pageSize = 20 }: { currentPage?: number; pageSize?: number } = {}) {
  const url = new URL(FAILURE_LOGS_API_URL)
  url.searchParams.set("currentPage", String(currentPage))
  url.searchParams.set("pageSize", String(pageSize))
  const requestUrl = url.toString()
  registerRequestParameters(requestUrl, { currentPage, pageSize })
  const response = await authenticatedFetch(requestUrl)
  return parseResponse<FailureLogPage>(response)
}
