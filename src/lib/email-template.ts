const htmlElementPattern = /<(?:[a-z][\w:-]*)(?:\s[^>]*)?>/i
const meaningfulHtmlElementPattern = /<(?:img|table|hr|iframe)\b/i

export function normalizeEmailTemplateHtml(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue || htmlElementPattern.test(trimmedValue)) return trimmedValue

  const escapedValue = trimmedValue
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

  return escapedValue
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br>")}</p>`)
    .join("")
}

export function hasEmailTemplateContent(value: string) {
  if (meaningfulHtmlElementPattern.test(value)) return true
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim().length > 0
}
