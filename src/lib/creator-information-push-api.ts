import { authenticatedFetch, registerRequestParameters } from "@/lib/api-client"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

const CREATOR_PUSH_API_BASE_URL = `${getDashboardApiBaseUrl()}/operations/creator-information-push`

export type CreatorPushOption = { value: string; label: string }

export type CreatorPushOptions = {
  categories: CreatorPushOption[]
  countries: CreatorPushOption[]
  memberships: CreatorPushOption[]
  platforms: CreatorPushOption[]
  templateVariables: string[]
}

export type CreatorPushTargetType = "ALL" | "SPECIFIED_IDS" | "MEMBERSHIP" | "CUSTOM"

export type CreatorPushTarget = {
  targetType: CreatorPushTargetType
  creatorIds?: string[]
  creatorIdText?: string
  membershipIds?: number[]
  categoryCodes?: string[]
  countries?: string[]
  minFollowers?: number
  maxFollowers?: number
  platforms?: string[]
  minAverageViews?: number
  maxAverageViews?: number
}

export type CreatorPushMatchCount = {
  targetType: CreatorPushTargetType
  inputCount: number | null
  validCount: number | null
  invalidIds: string[]
  matchedCount: number
}

export type CreatorPushChannel = "STATION" | "EMAIL"
export type CreatorPushSendType = "IMMEDIATE" | "SCHEDULED"

export type CreateCreatorPushTaskRequest = {
  target: CreatorPushTarget
  channels: CreatorPushChannel[]
  stationTitle?: string
  stationContent?: string
  emailSubject?: string
  emailContent?: string
  sendType: CreatorPushSendType
  scheduledTime?: string
}

export type CreateCreatorPushTaskResult = {
  taskId: string | number
  status: string
  matchedCount: number
  scheduledTime: string | null
}

export type CreatorPushTask = {
  taskId: string | number
  targetType: CreatorPushTargetType
  target: CreatorPushTarget
  matchedCount: number
  channels: CreatorPushChannel[]
  stationTitle: string | null
  stationContent: string | null
  emailSubject: string | null
  emailContent: string | null
  sendType: CreatorPushSendType
  scheduledTime: string | null
  status: string
  successCount: number
  failedCount: number
  skippedCount: number
  errorMessage: string | null
  startTime: string | null
  endTime: string | null
  createTime: string
}

export type CreatorPushTasksPage = {
  total: number
  rows: CreatorPushTask[]
  currentPage: number
  pageSize: number
}

export type CreatorPushRecipient = {
  id: string | number
  lgiId: string
  nickname: string | null
  membershipId: number | null
  membershipName: string | null
  toEmail: string | null
  stationStatus: string | null
  emailStatus: string | null
  stationRetryCount: number
  emailRetryCount: number
  stationErrorMessage: string | null
  emailErrorMessage: string | null
  stationSentTime: string | null
  emailSentTime: string | null
}

export type CreatorPushRecipientsPage = {
  total: number
  rows: CreatorPushRecipient[]
  currentPage: number
  pageSize: number
}

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T | null
  traceId?: string
  success?: boolean
}

export class CreatorInformationPushApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "CreatorInformationPushApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

function parseResponse<T>(response: Response, allowNullData: true): Promise<T | null>
function parseResponse<T>(response: Response, allowNullData?: false): Promise<T>
async function parseResponse<T>(response: Response, allowNullData = false): Promise<T | null> {
  if (!response.ok) {
    throw new CreatorInformationPushApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }
  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || (!allowNullData && payload.data == null)) {
    throw new CreatorInformationPushApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data as T | null
}

async function postJson<T>(path: string, body: Record<string, unknown>) {
  const response = await authenticatedFetch(
    `${CREATOR_PUSH_API_BASE_URL}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    body,
  )
  return parseResponse<T>(response)
}

export async function getCreatorPushOptions() {
  const response = await authenticatedFetch(`${CREATOR_PUSH_API_BASE_URL}/options`)
  return parseResponse<CreatorPushOptions>(response)
}

export function getCreatorPushMatchCount(target: CreatorPushTarget) {
  return postJson<CreatorPushMatchCount>("/match-count", target)
}

export function createCreatorPushTask(request: CreateCreatorPushTaskRequest) {
  return postJson<CreateCreatorPushTaskResult>("/tasks", request)
}

export async function getCurrentCreatorPushTask() {
  const response = await authenticatedFetch(`${CREATOR_PUSH_API_BASE_URL}/tasks/current`)
  return parseResponse<CreatorPushTask>(response, true)
}

export async function getCreatorPushTasks(currentPage = 1, pageSize = 20) {
  const url = new URL(`${CREATOR_PUSH_API_BASE_URL}/tasks`)
  url.searchParams.set("currentPage", String(currentPage))
  url.searchParams.set("pageSize", String(pageSize))
  const requestUrl = url.toString()
  registerRequestParameters(requestUrl, { currentPage, pageSize })
  const response = await authenticatedFetch(requestUrl)
  return parseResponse<CreatorPushTasksPage>(response)
}

export async function getCreatorPushTask(taskId: string) {
  const response = await authenticatedFetch(`${CREATOR_PUSH_API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`)
  return parseResponse<CreatorPushTask>(response)
}

export async function cancelCreatorPushTask(taskId: string) {
  const body = {}
  const response = await authenticatedFetch(
    `${CREATOR_PUSH_API_BASE_URL}/tasks/${encodeURIComponent(taskId)}/cancel`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
    body,
  )
  await parseResponse<null>(response, true)
}

export async function getCreatorPushRecipients(taskId: string, currentPage = 1, pageSize = 20) {
  const url = new URL(`${CREATOR_PUSH_API_BASE_URL}/tasks/${encodeURIComponent(taskId)}/recipients`)
  url.searchParams.set("currentPage", String(currentPage))
  url.searchParams.set("pageSize", String(pageSize))
  const requestUrl = url.toString()
  registerRequestParameters(requestUrl, { currentPage, pageSize })
  const response = await authenticatedFetch(requestUrl)
  return parseResponse<CreatorPushRecipientsPage>(response)
}
