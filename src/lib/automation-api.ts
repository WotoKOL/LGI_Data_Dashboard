import { authenticatedFetch } from "@/lib/api-client"
import { getDashboardApiBaseUrl } from "@/lib/runtime-config"

const AUTOMATION_API_BASE_URL = `${getDashboardApiBaseUrl()}/operations/automation`

export type AutomationRuleCode =
  | "NEW_REGISTERED_CREATOR"
  | "NEW_VERIFIED_CREATOR"
  | "INACTIVE_CREATOR"
  | "NEW_CAMPAIGN_CREATOR_RECOMMENDATION"

export type AutomationOverview = {
  pendingActivationCreatorCount: number
  newPendingCreatorCount: number
  auditTimeoutCampaignWarningCount: number
  noApplicationCampaignWarningCount: number
  exceptionAndTodoCount: number
  todayErrorCount: number
  ticketCount: number
}

export type AutomationRule = {
  ruleCode: AutomationRuleCode
  ruleName: string
  description: string
  enabled: boolean
  triggerDescription: string
  executionMode: string
  pendingCount: number
  totalProcessedCount: number
  totalActivatedCount: number
  todayProcessedCount: number
  activationRate: number
  latestExecutionTime: string | null
  latestExecutionStatus: string | null
}

export type AutomationTemplate = {
  ruleCode: AutomationRuleCode
  ruleName: string
  subject: string
  content: string
  variables: string[]
}

type ApiEnvelope<T> = {
  code: string
  message: string
  data: T | null
  traceId?: string
  success?: boolean
}

export class AutomationApiError extends Error {
  status?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; traceId?: string }) {
    super(message)
    this.name = "AutomationApiError"
    this.status = options?.status
    this.traceId = options?.traceId
  }
}

async function parseResponse<T>(response: Response, allowNullData = false) {
  if (!response.ok) {
    throw new AutomationApiError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
  }

  const payload = await response.json() as ApiEnvelope<T>
  if (payload.code !== "0" || payload.success === false || (!allowNullData && payload.data == null)) {
    throw new AutomationApiError(payload.message || "接口返回异常", { traceId: payload.traceId })
  }
  return payload.data as T
}

export async function getAutomationOverview() {
  const response = await authenticatedFetch(`${AUTOMATION_API_BASE_URL}/overview`)
  return parseResponse<AutomationOverview>(response)
}

export async function getAutomationRules() {
  const response = await authenticatedFetch(`${AUTOMATION_API_BASE_URL}/rules`)
  return parseResponse<AutomationRule[]>(response)
}

export async function setAutomationRuleEnabled(ruleCode: AutomationRuleCode, enabled: boolean) {
  const body = { enabled }
  const response = await authenticatedFetch(
    `${AUTOMATION_API_BASE_URL}/rules/${ruleCode}/enabled`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    body,
  )
  await parseResponse<null>(response, true)
}

export async function getAutomationTemplate(ruleCode: AutomationRuleCode) {
  const response = await authenticatedFetch(`${AUTOMATION_API_BASE_URL}/rules/${ruleCode}/template`)
  return parseResponse<AutomationTemplate>(response)
}

export async function updateAutomationTemplate(
  ruleCode: AutomationRuleCode,
  template: Pick<AutomationTemplate, "subject" | "content">,
) {
  const response = await authenticatedFetch(
    `${AUTOMATION_API_BASE_URL}/rules/${ruleCode}/template`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    },
    template,
  )
  await parseResponse<null>(response, true)
}
