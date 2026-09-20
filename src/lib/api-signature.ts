import CryptoJS from "crypto-js"
import { JSEncrypt } from "jsencrypt"

const SIGN_APP_KEY = "guYWz5RPs6muOHzD"
const SIGN_SECRET = "hoSA59LcWfCz5"
const RSA_PUBLIC_KEY = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAPWZswFK/6++m2Kx72j8q7LKCxi72MZGnk7vQAz9Ed4SJ67juHT7Km7kdTklfaAsYCeQbhDr7CdWFleQtVKM6mMCAwEAAQ=="
const NONCE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

export type RequestParameters = Record<string, unknown>

function sortedEntries(value: Record<string, unknown>, descending = false) {
  const keys = Object.keys(value).sort()
  if (descending) keys.reverse()
  return keys.map((key) => [key, value[key]] as const)
}

function createNonce(length = 20) {
  const randomValues = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(randomValues, (value) => NONCE_CHARACTERS[value % NONCE_CHARACTERS.length]).join("")
}

function createRequestKey() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const values = crypto.getRandomValues(new Uint8Array(16))
  values[6] = (values[6] & 0x0f) | 0x40
  values[8] = (values[8] & 0x3f) | 0x80
  const hex = Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function encryptRequestKey(requestKey: string) {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(RSA_PUBLIC_KEY)
  const encryptedKey = encryptor.encrypt(requestKey)
  if (!encryptedKey) throw new Error("请求签名初始化失败")
  return encryptedKey
}

function getRequestParameters(url: URL): RequestParameters | null {
  if (!url.searchParams.size) return null
  const parameters: RequestParameters = {}
  url.searchParams.forEach((value, key) => {
    parameters[key] = value
  })
  return parameters
}

function createCookieId(
  path: string,
  nonce: string,
  timestamp: number,
  parameters: RequestParameters | null,
  requestKey: string,
  method: string,
) {
  const signatureValues: Record<string, unknown> = {
    s: path,
    nonce,
    timestamp,
    ...(method.toUpperCase() === "GET"
      ? (parameters ?? {})
      : { p: JSON.stringify(parameters ?? {}) }),
  }
  const signatureText = sortedEntries(signatureValues)
    .map(([key, value]) => `${key}=${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join("&")
  return CryptoJS.HmacSHA256(signatureText, requestKey).toString()
}

function createLegacySign(parameters: RequestParameters | null) {
  const signatureValues: Record<string, unknown> = {
    appkey: SIGN_APP_KEY,
    timestamp: Date.now(),
    ...(parameters ? { p: JSON.stringify(parameters) } : {}),
  }
  const signatureText = sortedEntries(signatureValues, true)
    .map(([key, value]) => `${String(value).replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, "")}=${key}`)
    .join("&")
  return CryptoJS.HmacSHA512(signatureText, SIGN_SECRET).toString()
}

export function createSignedHeaders(
  rawUrl: string,
  token: string,
  requestParameters?: RequestParameters | null,
  method = "GET",
) {
  const url = new URL(rawUrl)
  const timestamp = Date.now()
  const nonce = `${createNonce()}${timestamp}`
  const requestKey = createRequestKey()
  const parameters = requestParameters === undefined ? getRequestParameters(url) : requestParameters

  return {
    Accept: "application/json",
    appkey: encryptRequestKey(requestKey),
    timestamp: String(timestamp),
    nonce,
    cookieid: createCookieId(url.pathname, nonce, timestamp, parameters, requestKey, method),
    sign: createLegacySign(parameters),
    token,
  }
}
