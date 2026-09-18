import { createSignedHeaders, type RequestParameters } from "@/lib/api-signature"
import { getDashboardToken, redirectToLogin } from "@/lib/auth"

const INVALID_TOKEN_CODES = new Set(["401", "1006", "40002", "TOKEN_EXPIRED", "TOKEN_INVALID"])
const requestParametersByUrl = new Map<string, RequestParameters | null>()

export function registerRequestParameters(url: string, parameters?: Record<string, string | number | undefined>) {
  if (!parameters) {
    requestParametersByUrl.set(url, null)
    return
  }
  const normalizedParameters = Object.fromEntries(
    Object.entries(parameters).filter((entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== ""),
  )
  requestParametersByUrl.set(url, Object.keys(normalizedParameters).length ? normalizedParameters : null)
}

function isInvalidTokenPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return false
  const value = payload as { code?: unknown; message?: unknown }
  const code = value.code == null ? "" : String(value.code)
  const message = value.message == null ? "" : String(value.message)
  return INVALID_TOKEN_CODES.has(code)
    || /not logged in|token.*(?:invalid|expired)|(?:invalid|expired).*token|未登录|token失效|token过期/i.test(message)
}

export async function authenticatedFetch(url: string) {
  const token = getDashboardToken()
  if (!token) {
    redirectToLogin("未获取到登录信息，请从 LGI 后台重新进入")
    throw new Error("缺少登录 token")
  }

  const response = await fetch(url, {
    headers: createSignedHeaders(url, token, requestParametersByUrl.get(url)),
  })
  if (response.status === 401) {
    redirectToLogin("登录状态已失效，请重新登录")
    return response
  }

  try {
    const payload: unknown = await response.clone().json()
    if (isInvalidTokenPayload(payload)) {
      redirectToLogin("登录状态已失效，请重新登录")
    }
  } catch {
    // 非 JSON 响应交由具体请求处理。
  }

  return response
}
