function safeDecodeFilename(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function decodeUtf8HeaderFilename(value: string) {
  // Response header values use an isomorphic (one byte to one code point)
  // representation. Some services put raw UTF-8 bytes in `filename=` instead
  // of using RFC 5987's `filename*=UTF-8''...`, which produces mojibake such
  // as `å...` in the browser. Rebuild those bytes and decode them as UTF-8.
  const codePoints = Array.from(value, (character) => character.charCodeAt(0))
  if (codePoints.some((codePoint) => codePoint > 0xff)) return value

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(codePoints))
  } catch {
    return value
  }
}

export function getDownloadFilename(response: Response, fallbackFilename: string) {
  const disposition = response.headers.get("content-disposition") ?? ""
  const encodedMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  const plainMatch = disposition.match(/filename\s*=\s*"?([^";]+)"?/i)
  const headerFilename = encodedMatch?.[1] ?? plainMatch?.[1]
  const filename = headerFilename
    ? decodeUtf8HeaderFilename(safeDecodeFilename(headerFilename.trim().replace(/^"|"$/g, "")))
    : fallbackFilename
  return filename.replace(/[\\/]/g, "_")
}

export function saveBlobFile(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filename
  link.style.display = "none"
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export function createExcelFallbackFilename(prefix: string) {
  const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-").replace("T", "_")
  return `${prefix}_${timestamp}.xlsx`
}

export function ensureExcelFilename(filename: string) {
  return /\.xlsx?$/i.test(filename) ? filename : `${filename}.xlsx`
}
