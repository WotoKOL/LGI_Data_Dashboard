export type DashboardEnvironment = "pre" | "prod"

const TOKEN_STORAGE_KEY = "token"
const ENV_STORAGE_KEY = "lgi_dashboard_env"
const LOGIN_URLS = {
  pre: import.meta.env.VITE_PRE_LOGIN_URL || "https://adpre.lgi365.com/login",
  prod: import.meta.env.VITE_PROD_LOGIN_URL || "https://ad.lgi365.com/login",
} as const

let redirectingToLogin = false

function isDashboardEnvironment(value: string | null): value is DashboardEnvironment {
  return value === "pre" || value === "prod"
}

function environmentFromUrl() {
  if (typeof window === "undefined") return null
  const value = new URL(window.location.href).searchParams.get("env")
  return isDashboardEnvironment(value) ? value : null
}

export function getDashboardEnvironment(): DashboardEnvironment {
  const urlEnvironment = environmentFromUrl()
  if (urlEnvironment) return urlEnvironment

  const storedEnvironment = localStorage.getItem(ENV_STORAGE_KEY)
  if (isDashboardEnvironment(storedEnvironment)) return storedEnvironment

  return import.meta.env.VITE_APP_ENV === "pre" ? "pre" : "prod"
}

export function getDashboardToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)?.trim() || ""
}

export function initializeDashboardAuth() {
  const url = new URL(window.location.href)
  const hasTokenParameter = url.searchParams.has("token")
  const token = url.searchParams.get("token")?.trim() || ""
  const environment = url.searchParams.get("env")

  if (hasTokenParameter) {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  if (isDashboardEnvironment(environment)) {
    localStorage.setItem(ENV_STORAGE_KEY, environment)
  }

  if (hasTokenParameter || url.searchParams.has("env")) {
    url.searchParams.delete("token")
    url.searchParams.delete("env")
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`)
  }

  return Boolean(getDashboardToken())
}

export function redirectToLogin(message = "登录状态已失效，请重新登录") {
  if (redirectingToLogin) return
  redirectingToLogin = true
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.alert(message)
  window.location.replace(LOGIN_URLS[getDashboardEnvironment()])
}
