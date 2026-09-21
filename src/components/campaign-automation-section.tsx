import { useEffect, useState } from "react"
import { AlertTriangle, BarChart3, Building2, Check, CheckCircle2, ChevronDown, Clock3, Copy, Download, LoaderCircle, MailCheck, NotebookPen, Search, Settings2, Sparkles, UsersRound } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { HtmlEmailEditor } from "@/components/html-email-editor"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  type BrandPlatform,
  type ReminderPeriod,
} from "@/data/automation-data"
import {
  getAutomationTemplate,
  updateAutomationTemplate,
  type AutomationRule,
  type AutomationTemplate,
} from "@/lib/automation-api"
import {
  CampaignNoApplicationApiError,
  exportCampaignNoApplicationCampaigns,
  getCampaignNoApplicationCampaigns,
  setCampaignNoApplicationHandling,
  type CampaignNoApplicationPage,
  type CampaignNoApplicationStatus,
} from "@/lib/campaign-no-application-api"
import {
  CampaignAuditTimeoutApiError,
  exportCampaignAuditTimeoutCampaigns,
  getCampaignAuditTimeoutCampaigns,
  setCampaignAuditTimeoutHandling,
  type CampaignAuditTimeoutPage,
  type CampaignAuditTimeoutStatus,
} from "@/lib/campaign-audit-timeout-api"
import {
  BrandPendingAuditsApiError,
  exportBrandPendingAudits,
  getBrandPendingAudits,
  type BrandPendingAuditsDays,
  type BrandPendingAuditsPage,
} from "@/lib/brand-pending-audits-api"
import { BrandNotesApiError, createBrandNote, getBrandNotes, type BrandNotesPage } from "@/lib/brand-notes-api"
import { hasEmailTemplateContent, normalizeEmailTemplateHtml } from "@/lib/email-template"
import { saveBlobFile } from "@/lib/file-download"
import { cn, formatDateTime, number } from "@/lib/utils"

const periodOptions: { value: ReminderPeriod; label: string }[] = [
  { value: "3d", label: "近 3 天" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "all", label: "全部" },
]

const platformStyles: Record<BrandPlatform, string> = {
  wotohub: "bg-violet-50 text-violet-700",
  wotokol: "bg-emerald-50 text-emerald-700",
  wotopartner: "bg-sky-50 text-sky-700",
}

const noApplicationStatusOptions: { value: CampaignNoApplicationStatus; label: string }[] = [
  { value: "PENDING", label: "待处理" },
  { value: "HANDLED", label: "已处理" },
  { value: "ALL", label: "全部" },
]
const noApplicationPageSize = 10
const auditTimeoutStatusOptions: { value: CampaignAuditTimeoutStatus; label: string }[] = [
  { value: "PENDING", label: "待处理" },
  { value: "HANDLED", label: "已处理" },
  { value: "ALL", label: "全部" },
]

const csmOptions = ["皮丽萍", "邹倩倩", "满柏慧"] as const
type CsmFilter = "" | (typeof csmOptions)[number]

function CampaignListFilters({
  label,
  csm,
  brandId,
  exporting,
  onCsmChange,
  onBrandIdChange,
  onExport,
}: {
  label: string
  csm: CsmFilter
  brandId: string
  exporting: boolean
  onCsmChange: (value: CsmFilter) => void
  onBrandIdChange: (value: string) => void
  onExport: () => void
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 border-t border-border/60 pt-3">
      <div className="relative">
        <select
          aria-label={`${label} CSM 筛选`}
          value={csm}
          onChange={(event) => onCsmChange(event.target.value as CsmFilter)}
          className="h-8 appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-[10px] text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/25"
        >
          <option value="">全部 CSM</option>
          {csmOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className="relative min-w-44 flex-1 sm:max-w-56">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={`${label}品牌方 ID 搜索`}
          placeholder="搜索品牌方 ID"
          value={brandId}
          onChange={(event) => onBrandIdChange(event.target.value)}
          className="h-8 pl-8 text-[10px]"
        />
      </div>
      <Button type="button" variant="outline" size="sm" className="ml-auto" disabled={exporting} onClick={onExport}>
        {exporting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {exporting ? "导出中" : "导出 Excel"}
      </Button>
    </div>
  )
}

function CampaignCover({ src, title }: { src: string | null; title: string }) {
  return <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-white/80 bg-muted shadow-sm"><span className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground">暂无主图</span>{src ? <img src={src} alt={`${title}商单主图`} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none" }} /> : null}</div>
}

function CopyableId({ label, value }: { label: string; value: string }) {
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label}已复制`)
    } catch {
      toast.error(`${label}复制失败`, { description: "请手动选择并复制该 ID" })
    }
  }

  return <span className="ml-1 inline-flex max-w-full items-center gap-0.5 align-middle"><strong className="truncate font-mono font-medium text-foreground">{value}</strong><Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0 rounded-md text-muted-foreground hover:text-foreground" aria-label={`复制${label}`} onClick={() => void copyValue()}><Copy className="h-3 w-3" /></Button></span>
}

function getCampaignNoApplicationErrorMessage(error: unknown) {
  if (error instanceof CampaignNoApplicationApiError && error.traceId) {
    return `${error.message}（Trace ID：${error.traceId}）`
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试"
}

function formatNoApplicationDuration(hours: number) {
  return hours > 72 ? `${Math.floor(hours / 24)} 天无申请` : `${hours} 小时无申请`
}

function getCampaignAuditTimeoutErrorMessage(error: unknown) {
  if (error instanceof CampaignAuditTimeoutApiError && error.traceId) {
    return `${error.message}（Trace ID：${error.traceId}）`
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试"
}

function getBrandPendingAuditsErrorMessage(error: unknown) {
  if (error instanceof BrandPendingAuditsApiError && error.traceId) {
    return `${error.message}（Trace ID：${error.traceId}）`
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试"
}

function getBrandNotesErrorMessage(error: unknown) {
  if (error instanceof BrandNotesApiError && error.traceId) {
    return `${error.message}（Trace ID：${error.traceId}）`
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试"
}

function formatAutomationRate(value: number) {
  if (!Number.isFinite(value)) return "--"
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value)}%`
}

function getAutomationTemplateErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "traceId" in error && typeof error.traceId === "string" && error.traceId) {
    return `${error instanceof Error ? error.message : "请求失败"}（Trace ID：${error.traceId}）`
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试"
}

export function CampaignAutomationSection({
  refreshKey = 0,
  matchingRule,
  onToggleMatchingRule,
  matchingRuleUpdating = false,
  onAction,
}: {
  refreshKey?: number
  matchingRule: AutomationRule | null
  onToggleMatchingRule: (enabled: boolean) => void
  matchingRuleUpdating?: boolean
  onAction: (message: string) => void
}) {
  const [period, setPeriod] = useState<ReminderPeriod>("7d")
  const [templateOpen, setTemplateOpen] = useState(false)
  const [template, setTemplate] = useState<AutomationTemplate | null>(null)
  const [templateDraft, setTemplateDraft] = useState({ subject: "", content: "" })
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState("")
  const [noApplicationStatus, setNoApplicationStatus] = useState<CampaignNoApplicationStatus>("PENDING")
  const [noApplicationCsm, setNoApplicationCsm] = useState<CsmFilter>("")
  const [noApplicationBrandIdInput, setNoApplicationBrandIdInput] = useState("")
  const [noApplicationBrandId, setNoApplicationBrandId] = useState("")
  const [noApplicationExporting, setNoApplicationExporting] = useState(false)
  const [noApplicationPage, setNoApplicationPage] = useState(1)
  const [noApplicationData, setNoApplicationData] = useState<CampaignNoApplicationPage | null>(null)
  const [noApplicationLoading, setNoApplicationLoading] = useState(true)
  const [noApplicationError, setNoApplicationError] = useState("")
  const [noApplicationRequestVersion, setNoApplicationRequestVersion] = useState(0)
  const [handlingCampaignId, setHandlingCampaignId] = useState<string | null>(null)
  const [auditTimeoutStatus, setAuditTimeoutStatus] = useState<CampaignAuditTimeoutStatus>("PENDING")
  const [auditTimeoutCsm, setAuditTimeoutCsm] = useState<CsmFilter>("")
  const [auditTimeoutBrandIdInput, setAuditTimeoutBrandIdInput] = useState("")
  const [auditTimeoutBrandId, setAuditTimeoutBrandId] = useState("")
  const [auditTimeoutExporting, setAuditTimeoutExporting] = useState(false)
  const [auditTimeoutPage, setAuditTimeoutPage] = useState(1)
  const [auditTimeoutData, setAuditTimeoutData] = useState<CampaignAuditTimeoutPage | null>(null)
  const [auditTimeoutLoading, setAuditTimeoutLoading] = useState(true)
  const [auditTimeoutError, setAuditTimeoutError] = useState("")
  const [auditTimeoutRequestVersion, setAuditTimeoutRequestVersion] = useState(0)
  const [handlingAuditCampaignId, setHandlingAuditCampaignId] = useState<string | null>(null)
  const [rankingData, setRankingData] = useState<BrandPendingAuditsPage | null>(null)
  const [rankingLoading, setRankingLoading] = useState(true)
  const [rankingError, setRankingError] = useState("")
  const [rankingPage, setRankingPage] = useState(1)
  const [rankingRequestVersion, setRankingRequestVersion] = useState(0)
  const [rankingExporting, setRankingExporting] = useState(false)
  const [rankingCsmInput, setRankingCsmInput] = useState("")
  const [rankingCsm, setRankingCsm] = useState("")
  const [notesBrandId, setNotesBrandId] = useState<string | null>(null)
  const [notesData, setNotesData] = useState<BrandNotesPage | null>(null)
  const [notesPage, setNotesPage] = useState(1)
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState("")
  const [notesRequestVersion, setNotesRequestVersion] = useState(0)
  const [noteDraft, setNoteDraft] = useState("")
  const [noteSaving, setNoteSaving] = useState(false)
  const noApplicationTotalPages = Math.max(1, Math.ceil((noApplicationData?.total ?? 0) / (noApplicationData?.pageSize || 20)))
  const noApplicationSummary = noApplicationStatus === "PENDING"
    ? `${number.format(noApplicationData?.pendingCount ?? 0)} 个待处理`
    : noApplicationStatus === "HANDLED"
      ? `${number.format(noApplicationData?.total ?? 0)} 个已处理`
      : `共 ${number.format(noApplicationData?.total ?? 0)} 个`
  const auditTimeoutTotalPages = Math.max(1, Math.ceil((auditTimeoutData?.total ?? 0) / (auditTimeoutData?.pageSize || 20)))
  const auditTimeoutSummary = auditTimeoutStatus === "PENDING"
    ? `${number.format(auditTimeoutData?.pendingCount ?? 0)} 个待处理`
    : auditTimeoutStatus === "HANDLED"
      ? `${number.format(auditTimeoutData?.total ?? 0)} 个已处理`
      : `共 ${number.format(auditTimeoutData?.total ?? 0)} 个`
  const rankingDays: BrandPendingAuditsDays | undefined = period === "all" ? undefined : Number(period.replace("d", "")) as BrandPendingAuditsDays
  const rankingTotalPages = Math.max(1, Math.ceil((rankingData?.total ?? 0) / (rankingData?.pageSize || 20)))
  const notesTotalPages = Math.max(1, Math.ceil((notesData?.total ?? 0) / (notesData?.pageSize || 10)))

  useEffect(() => {
    const nextBrandId = noApplicationBrandIdInput.trim()
    const timer = window.setTimeout(() => {
      if (nextBrandId === noApplicationBrandId) return
      setNoApplicationLoading(true)
      setNoApplicationError("")
      setNoApplicationData(null)
      setNoApplicationPage(1)
      setNoApplicationBrandId(nextBrandId)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [noApplicationBrandId, noApplicationBrandIdInput])

  useEffect(() => {
    const nextBrandId = auditTimeoutBrandIdInput.trim()
    const timer = window.setTimeout(() => {
      if (nextBrandId === auditTimeoutBrandId) return
      setAuditTimeoutLoading(true)
      setAuditTimeoutError("")
      setAuditTimeoutData(null)
      setAuditTimeoutPage(1)
      setAuditTimeoutBrandId(nextBrandId)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [auditTimeoutBrandId, auditTimeoutBrandIdInput])

  useEffect(() => {
    const nextCsm = rankingCsmInput.trim()
    const timer = window.setTimeout(() => {
      if (nextCsm === rankingCsm) return
      setRankingLoading(true)
      setRankingError("")
      setRankingData(null)
      setRankingPage(1)
      setRankingCsm(nextCsm)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [rankingCsm, rankingCsmInput])

  useEffect(() => {
    let active = true
    void getCampaignNoApplicationCampaigns({
      status: noApplicationStatus,
      currentPage: noApplicationPage,
      pageSize: noApplicationPageSize,
      csm: noApplicationCsm,
      brandId: noApplicationBrandId,
    }).then((data) => {
      if (active) setNoApplicationData(data)
    }).catch((error: unknown) => {
      if (!active) return
      const message = getCampaignNoApplicationErrorMessage(error)
      setNoApplicationData(null)
      setNoApplicationError(message)
      toast.error("无申请商单加载失败", { description: message })
    }).finally(() => {
      if (active) setNoApplicationLoading(false)
    })
    return () => { active = false }
  }, [noApplicationBrandId, noApplicationCsm, noApplicationPage, noApplicationRequestVersion, noApplicationStatus, refreshKey])

  useEffect(() => {
    let active = true
    void getCampaignAuditTimeoutCampaigns({
      status: auditTimeoutStatus,
      currentPage: auditTimeoutPage,
      pageSize: 20,
      csm: auditTimeoutCsm,
      brandId: auditTimeoutBrandId,
    }).then((data) => {
      if (active) setAuditTimeoutData(data)
    }).catch((error: unknown) => {
      if (!active) return
      const message = getCampaignAuditTimeoutErrorMessage(error)
      setAuditTimeoutData(null)
      setAuditTimeoutError(message)
      toast.error("审核超时商单加载失败", { description: message })
    }).finally(() => {
      if (active) setAuditTimeoutLoading(false)
    })
    return () => { active = false }
  }, [auditTimeoutBrandId, auditTimeoutCsm, auditTimeoutPage, auditTimeoutRequestVersion, auditTimeoutStatus, refreshKey])

  useEffect(() => {
    let active = true
    void getBrandPendingAudits({ days: rankingDays, csm: rankingCsm, currentPage: rankingPage, pageSize: 20 })
      .then((data) => {
        if (active) setRankingData(data)
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = getBrandPendingAuditsErrorMessage(error)
        setRankingData(null)
        setRankingError(message)
        toast.error("品牌方未审核达人数排行榜加载失败", { description: message })
      })
      .finally(() => {
        if (active) setRankingLoading(false)
      })
    return () => { active = false }
  }, [rankingCsm, rankingDays, rankingPage, rankingRequestVersion, refreshKey])

  useEffect(() => {
    if (!notesBrandId) return
    let active = true
    void getBrandNotes({ brandId: notesBrandId, currentPage: notesPage, pageSize: 10 })
      .then((data) => {
        if (active) setNotesData(data)
      })
      .catch((error: unknown) => {
        if (!active) return
        setNotesData(null)
        setNotesError(getBrandNotesErrorMessage(error))
      })
      .finally(() => {
        if (active) setNotesLoading(false)
      })
    return () => { active = false }
  }, [notesBrandId, notesPage, notesRequestVersion])

  async function openMatchingTemplate() {
    if (!matchingRule) return
    setTemplateOpen(true)
    setTemplate(null)
    setTemplateError("")
    setTemplateLoading(true)
    try {
      const nextTemplate = await getAutomationTemplate(matchingRule.ruleCode)
      setTemplate(nextTemplate)
      setTemplateDraft({ subject: nextTemplate.subject, content: normalizeEmailTemplateHtml(nextTemplate.content) })
    } catch (error) {
      setTemplateError(getAutomationTemplateErrorMessage(error))
    } finally {
      setTemplateLoading(false)
    }
  }

  async function saveMatchingTemplate() {
    if (!matchingRule || !template) return
    const subject = templateDraft.subject.trim()
    const content = templateDraft.content.trim()
    if (!subject || !hasEmailTemplateContent(content)) {
      setTemplateError("邮件主题和邮件正文不能为空")
      return
    }
    setTemplateSaving(true)
    setTemplateError("")
    try {
      await updateAutomationTemplate(matchingRule.ruleCode, { subject, content })
      setTemplateOpen(false)
      onAction(`“${matchingRule.ruleName}”邮件模板已保存`)
    } catch (error) {
      setTemplateError(getAutomationTemplateErrorMessage(error))
    } finally {
      setTemplateSaving(false)
    }
  }

  async function exportNoApplicationCampaigns() {
    setNoApplicationExporting(true)
    try {
      const file = await exportCampaignNoApplicationCampaigns({
        status: noApplicationStatus,
        csm: noApplicationCsm,
        brandId: noApplicationBrandIdInput.trim(),
      })
      saveBlobFile(file.blob, file.filename)
      toast.success("无申请商单已导出", { description: file.filename })
    } catch (error) {
      toast.error("无申请商单导出失败", { description: getCampaignNoApplicationErrorMessage(error) })
    } finally {
      setNoApplicationExporting(false)
    }
  }

  async function exportAuditTimeoutCampaigns() {
    setAuditTimeoutExporting(true)
    try {
      const file = await exportCampaignAuditTimeoutCampaigns({
        status: auditTimeoutStatus,
        csm: auditTimeoutCsm,
        brandId: auditTimeoutBrandIdInput.trim(),
      })
      saveBlobFile(file.blob, file.filename)
      toast.success("审核超时商单已导出", { description: file.filename })
    } catch (error) {
      toast.error("审核超时商单导出失败", { description: getCampaignAuditTimeoutErrorMessage(error) })
    } finally {
      setAuditTimeoutExporting(false)
    }
  }

  async function exportPendingAuditRanking() {
    setRankingExporting(true)
    try {
      const file = await exportBrandPendingAudits({ days: rankingDays, csm: rankingCsmInput.trim() })
      saveBlobFile(file.blob, file.filename)
      toast.success("排行榜已导出", { description: file.filename })
    } catch (error) {
      toast.error("排行榜导出失败", { description: getBrandPendingAuditsErrorMessage(error) })
    } finally {
      setRankingExporting(false)
    }
  }

  function openBrandNotes(brandId: string) {
    setNotesBrandId(brandId)
    setNotesData(null)
    setNotesPage(1)
    setNotesLoading(true)
    setNotesError("")
    setNoteDraft("")
  }

  function closeBrandNotes() {
    if (noteSaving) return
    setNotesBrandId(null)
    setNotesData(null)
    setNotesError("")
    setNoteDraft("")
  }

  async function addBrandNote() {
    if (!notesBrandId) return
    const recordContent = noteDraft.trim()
    if (!recordContent) {
      setNotesError("请输入小记内容")
      return
    }
    setNoteSaving(true)
    setNotesError("")
    try {
      await createBrandNote({ brandId: notesBrandId, recordContent })
      setNoteDraft("")
      setNotesData(null)
      setNotesLoading(true)
      setNotesPage(1)
      setNotesRequestVersion((version) => version + 1)
      setRankingLoading(true)
      setRankingRequestVersion((version) => version + 1)
      toast.success("小记已添加")
    } catch (error) {
      setNotesError(getBrandNotesErrorMessage(error))
    } finally {
      setNoteSaving(false)
    }
  }

  async function updateNoApplicationHandling(campaignId: string, title: string, handled: boolean) {
    setHandlingCampaignId(campaignId)
    try {
      const handlingResult = await setCampaignNoApplicationHandling(campaignId, { handled })
      setNoApplicationData((current) => {
        if (!current) return current
        const leavesCurrentFilter = (noApplicationStatus === "PENDING" && handlingResult.handlingStatus === "HANDLED")
          || (noApplicationStatus === "HANDLED" && handlingResult.handlingStatus === "PENDING")
        return {
          ...current,
          pendingCount: Math.max(0, current.pendingCount + (handled ? -1 : 1)),
          total: Math.max(0, current.total - (leavesCurrentFilter ? 1 : 0)),
          rows: leavesCurrentFilter
            ? current.rows.filter((campaign) => campaign.campaignId !== campaignId)
            : current.rows.map((campaign) => campaign.campaignId === campaignId ? {
              ...campaign,
              handlingStatus: handlingResult.handlingStatus,
              handledBy: handlingResult.handledBy,
              handleRemark: handlingResult.handleRemark,
              handledTime: handlingResult.handledTime,
            } : campaign),
        }
      })
      onAction(`“${title}”已标记为${handled ? "已处理" : "未处理"}`)
      setNoApplicationLoading(true)
      try {
        const nextData = await getCampaignNoApplicationCampaigns({
          status: noApplicationStatus,
          currentPage: noApplicationPage,
          pageSize: noApplicationPageSize,
          csm: noApplicationCsm,
          brandId: noApplicationBrandId,
        })
        if (nextData.rows.length === 0 && nextData.total > 0 && noApplicationPage > 1) {
          const previousPage = noApplicationPage - 1
          setNoApplicationData(await getCampaignNoApplicationCampaigns({ status: noApplicationStatus, currentPage: previousPage, pageSize: noApplicationPageSize, csm: noApplicationCsm, brandId: noApplicationBrandId }))
          setNoApplicationPage(previousPage)
        } else {
          setNoApplicationData(nextData)
        }
        setNoApplicationError("")
      } catch (refreshError) {
        toast.error("处理状态已更新，但列表刷新失败", { description: getCampaignNoApplicationErrorMessage(refreshError) })
      }
    } catch (error) {
      toast.error(handled ? "标记已处理失败" : "标记未处理失败", { description: getCampaignNoApplicationErrorMessage(error) })
    } finally {
      setHandlingCampaignId(null)
      setNoApplicationLoading(false)
    }
  }

  async function updateAuditTimeoutHandling(campaignId: string, title: string, handled: boolean) {
    setHandlingAuditCampaignId(campaignId)
    try {
      const handlingResult = await setCampaignAuditTimeoutHandling(campaignId, { handled })
      const leavesCurrentFilter = (auditTimeoutStatus === "PENDING" && handlingResult.handlingStatus === "HANDLED")
        || (auditTimeoutStatus === "HANDLED" && handlingResult.handlingStatus === "PENDING")
      setAuditTimeoutData((current) => current ? {
        ...current,
        pendingCount: Math.max(0, current.pendingCount + (handled ? -1 : 1)),
        total: Math.max(0, current.total - (leavesCurrentFilter ? 1 : 0)),
        rows: leavesCurrentFilter
          ? current.rows.filter((campaign) => campaign.campaignId !== campaignId)
          : current.rows.map((campaign) => campaign.campaignId === campaignId ? {
            ...campaign,
            handlingStatus: handlingResult.handlingStatus,
            handledBy: handlingResult.handledBy,
            handleRemark: handlingResult.handleRemark,
            handledTime: handlingResult.handledTime,
          } : campaign),
      } : current)
      onAction(`“${title}”已标记为${handled ? "已处理" : "未处理"}`)
      setAuditTimeoutLoading(true)
      try {
        const nextData = await getCampaignAuditTimeoutCampaigns({ status: auditTimeoutStatus, currentPage: auditTimeoutPage, pageSize: 20, csm: auditTimeoutCsm, brandId: auditTimeoutBrandId })
        if (nextData.rows.length === 0 && nextData.total > 0 && auditTimeoutPage > 1) {
          const previousPage = auditTimeoutPage - 1
          setAuditTimeoutData(await getCampaignAuditTimeoutCampaigns({ status: auditTimeoutStatus, currentPage: previousPage, pageSize: 20, csm: auditTimeoutCsm, brandId: auditTimeoutBrandId }))
          setAuditTimeoutPage(previousPage)
        } else {
          setAuditTimeoutData(nextData)
        }
        setAuditTimeoutError("")
      } catch (refreshError) {
        toast.error("处理状态已更新，但超时列表刷新失败", { description: getCampaignAuditTimeoutErrorMessage(refreshError) })
      }
    } catch (error) {
      toast.error(handled ? "标记已处理失败" : "标记未处理失败", { description: getCampaignAuditTimeoutErrorMessage(error) })
    } finally {
      setHandlingAuditCampaignId(null)
      setAuditTimeoutLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {matchingRule ? <Card className="border-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><UsersRound className="h-5 w-5" /></span>
            <div className="flex items-center gap-2"><Badge variant={matchingRule.enabled ? "success" : "secondary"}>{matchingRule.enabled ? "已启用" : "已暂停"}</Badge><Switch checked={matchingRule.enabled} disabled={matchingRuleUpdating} onCheckedChange={onToggleMatchingRule} aria-label={`${matchingRule.ruleName}开关`} /></div>
          </div>
          <h3 className="mt-4 text-base font-semibold">{matchingRule.ruleName}</h3>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{matchingRule.description}</p>
          <div className="mt-4 rounded-xl bg-muted/60 p-3"><p className="text-[9px] font-medium text-muted-foreground">触发条件</p><p className="mt-1 text-[11px] font-medium">{matchingRule.triggerDescription}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-muted-foreground"><span>{matchingRule.executionMode}</span><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />最新执行 {formatDateTime(matchingRule.latestExecutionTime, "暂无执行记录")}</span></div></div>
          <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-5 sm:divide-y-0">
            <div className="pb-3 sm:pb-0"><p className="text-[9px] text-muted-foreground">待处理商单</p><p className="mt-1 font-mono text-lg font-bold">{number.format(matchingRule.pendingCount)}</p></div>
            <div className="pb-3 pl-3 sm:pb-0"><p className="text-[9px] text-muted-foreground">累计处理商单</p><p className="mt-1 font-mono text-lg font-bold">{number.format(matchingRule.totalProcessedCount)}</p></div>
            <div className="pb-3 pl-3 pt-3 sm:pb-0 sm:pt-0"><p className="text-[9px] text-muted-foreground">累计申请达人</p><p className="mt-1 font-mono text-lg font-bold">{number.format(matchingRule.totalActivatedCount)}</p></div>
            <div className="pt-3 sm:pl-3 sm:pt-0"><p className="text-[9px] text-muted-foreground">今日匹配达人</p><p className="mt-1 font-mono text-lg font-bold">{number.format(matchingRule.todayProcessedCount)}</p></div>
            <div className="pl-3 pt-3 sm:pt-0"><p className="text-[9px] text-muted-foreground">申请率</p><p className="mt-1 font-mono text-lg font-bold">{formatAutomationRate(matchingRule.activationRate)}</p></div>
          </div>
          <div className="mt-5"><Button type="button" variant="outline" size="sm" onClick={() => void openMatchingTemplate()}><Settings2 className="h-3.5 w-3.5" />邮件模板</Button></div>
        </CardContent>
      </Card> : null}

      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="border-0">
          <CardHeader className="flex-col gap-3">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />新商单 48 小时无申请</CardTitle><CardDescription className="mt-1">系统自动诊断无申请原因，运营确认后可标记为已处理</CardDescription></div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant={noApplicationStatus === "PENDING" ? "warning" : noApplicationStatus === "HANDLED" ? "success" : "secondary"}>{noApplicationLoading && !noApplicationData ? "加载中" : noApplicationSummary}</Badge>
                <div className="flex rounded-full bg-muted p-1" role="radiogroup" aria-label="无申请商单处理状态">
                  {noApplicationStatusOptions.map((option) => <button key={option.value} type="button" role="radio" aria-checked={noApplicationStatus === option.value} onClick={() => { if (noApplicationStatus === option.value) return; setNoApplicationLoading(true); setNoApplicationError(""); setNoApplicationData(null); setNoApplicationStatus(option.value); setNoApplicationPage(1) }} className={cn("rounded-full px-2.5 py-1 text-[9px] font-medium transition-all", noApplicationStatus === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{option.label}</button>)}
                </div>
              </div>
            </div>
            <CampaignListFilters label="无申请商单" csm={noApplicationCsm} brandId={noApplicationBrandIdInput} exporting={noApplicationExporting} onCsmChange={(csm) => { if (csm === noApplicationCsm) return; setNoApplicationLoading(true); setNoApplicationError(""); setNoApplicationData(null); setNoApplicationCsm(csm); setNoApplicationPage(1) }} onBrandIdChange={setNoApplicationBrandIdInput} onExport={() => void exportNoApplicationCampaigns()} />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="max-h-[640px] space-y-3 overflow-y-auto overscroll-y-auto pr-1 [scrollbar-gutter:stable]">
            {noApplicationLoading && !noApplicationData ? Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-2xl border border-border/70 p-3.5"><div className="flex gap-3"><Skeleton className="h-20 w-24 shrink-0 rounded-xl" /><div className="flex-1 space-y-3"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div></div><Skeleton className="mt-3 h-20 w-full rounded-xl" /></div>) : null}
            {noApplicationError ? <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700"><p>{noApplicationError}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { setNoApplicationLoading(true); setNoApplicationError(""); setNoApplicationData(null); setNoApplicationRequestVersion((version) => version + 1) }}>重新加载</Button></div> : null}
            {!noApplicationLoading && !noApplicationError && noApplicationData?.rows.length === 0 ? <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center"><CheckCircle2 className="h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-xs font-medium">暂无{noApplicationStatus === "PENDING" ? "待处理" : noApplicationStatus === "HANDLED" ? "已处理" : ""}无申请商单</p><p className="mt-1 text-[10px] text-muted-foreground">当前筛选条件下没有可展示的数据</p></div> : null}
            {noApplicationData?.rows.map((campaign) => {
              const processed = campaign.handlingStatus === "HANDLED"
              const handling = handlingCampaignId === campaign.campaignId
              return (
                <article key={campaign.campaignId} className={cn("rounded-2xl border border-border/70 p-3.5 transition-opacity", processed && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <CampaignCover src={campaign.campaignMainImg} title={campaign.campaignTitle} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2"><h4 className="min-w-0 text-xs font-semibold leading-5">{campaign.campaignTitle || "未命名商单"}</h4><Badge variant={processed ? "success" : "warning"} className="shrink-0">{processed ? "已处理" : campaign.noApplicationDurationText || formatNoApplicationDuration(campaign.noApplicationHours)}</Badge></div>
                      <div className="mt-2 grid gap-x-3 gap-y-1 text-[9px] text-muted-foreground sm:grid-cols-2">
                        <span>商单 ID <CopyableId label="商单 ID" value={campaign.campaignId} /></span>
                        <span>品牌方 ID <CopyableId label="品牌方 ID" value={campaign.brandId} /></span>
                        <span>子账号 ID {campaign.childBrandId ? <CopyableId label="子账号 ID" value={campaign.childBrandId} /> : <strong className="ml-1 font-medium text-foreground">--</strong>}</span>
                        <span>品牌方平台 <strong className="ml-1 font-medium text-foreground">{campaign.brandPlatformType || "--"}</strong></span>
                        <span>品牌方手机号 <strong className="ml-1 font-mono font-medium text-foreground">{campaign.brandUserPhone || "--"}</strong></span>
                        <span>CSM <strong className="ml-1 font-medium text-foreground">{campaign.csm || "--"}</strong></span>
                        <span>发布时间 <strong className="ml-1 font-medium text-foreground">{campaign.publishTime || "--"}</strong></span>
                        <span>曝光量 <strong className="ml-1 font-mono font-medium text-foreground">{campaign.exposureCount == null ? "--" : number.format(campaign.exposureCount)}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-800"><Sparkles className="h-3.5 w-3.5" />系统诊断分析</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-5 text-amber-900/75">{campaign.aiAnalysisReport || "暂无 AI 诊断分析"}</p>
                  </div>
                  <div className="mt-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><span className="text-[9px] text-muted-foreground">{campaign.handledTime ? `处理于 ${campaign.handledTime}${campaign.handledBy ? ` · ${campaign.handledBy}` : ""}` : campaign.handleRemark || ""}</span><Button type="button" variant="outline" size="sm" disabled={handling} onClick={() => void updateNoApplicationHandling(campaign.campaignId, campaign.campaignTitle, !processed)}>{handling ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{handling ? "处理中" : processed ? "标记未处理" : "标记已处理"}</Button></div>
                </article>
              )
            })}
            </div>
            {noApplicationData && noApplicationData.total > 0 ? <div className="mt-3 flex flex-col justify-between gap-3 border-t border-border/70 pt-3 text-[10px] text-muted-foreground sm:flex-row sm:items-center"><span>共 {number.format(noApplicationData.total)} 条 · 第 {noApplicationData.currentPage} / {noApplicationTotalPages} 页</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={noApplicationLoading || noApplicationPage <= 1} onClick={() => { setNoApplicationLoading(true); setNoApplicationError(""); setNoApplicationData(null); setNoApplicationPage((page) => Math.max(1, page - 1)) }}>上一页</Button><Button type="button" variant="outline" size="sm" disabled={noApplicationLoading || noApplicationPage >= noApplicationTotalPages} onClick={() => { setNoApplicationLoading(true); setNoApplicationError(""); setNoApplicationData(null); setNoApplicationPage((page) => Math.min(noApplicationTotalPages, page + 1)) }}>下一页</Button></div></div> : null}
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardHeader className="flex-col gap-3">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-rose-500" />商单申请审核超时（72小时）</CardTitle><CardDescription className="mt-1">跟踪超过 72 小时审核时限的商单申请，由运营确认处理状态</CardDescription></div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant={auditTimeoutStatus === "PENDING" ? "danger" : auditTimeoutStatus === "HANDLED" ? "success" : "secondary"}>{auditTimeoutLoading && !auditTimeoutData ? "加载中" : auditTimeoutSummary}</Badge>
                <div className="flex rounded-full bg-muted p-1" role="radiogroup" aria-label="审核超时商单处理状态">
                  {auditTimeoutStatusOptions.map((option) => <button key={option.value} type="button" role="radio" aria-checked={auditTimeoutStatus === option.value} onClick={() => { if (auditTimeoutStatus === option.value) return; setAuditTimeoutLoading(true); setAuditTimeoutError(""); setAuditTimeoutData(null); setAuditTimeoutStatus(option.value); setAuditTimeoutPage(1) }} className={cn("rounded-full px-2.5 py-1 text-[9px] font-medium transition-all", auditTimeoutStatus === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{option.label}</button>)}
                </div>
              </div>
            </div>
            <CampaignListFilters label="审核超时商单" csm={auditTimeoutCsm} brandId={auditTimeoutBrandIdInput} exporting={auditTimeoutExporting} onCsmChange={(csm) => { if (csm === auditTimeoutCsm) return; setAuditTimeoutLoading(true); setAuditTimeoutError(""); setAuditTimeoutData(null); setAuditTimeoutCsm(csm); setAuditTimeoutPage(1) }} onBrandIdChange={setAuditTimeoutBrandIdInput} onExport={() => void exportAuditTimeoutCampaigns()} />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="max-h-[640px] space-y-3 overflow-y-auto overscroll-y-auto pr-1 [scrollbar-gutter:stable]">
            {auditTimeoutLoading && !auditTimeoutData ? Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-2xl border border-border/70 p-3.5"><div className="flex gap-3"><Skeleton className="h-20 w-24 shrink-0 rounded-xl" /><div className="flex-1 space-y-3"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div></div><Skeleton className="mt-3 h-16 w-full rounded-xl" /></div>) : null}
            {auditTimeoutError ? <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700"><p>{auditTimeoutError}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { setAuditTimeoutLoading(true); setAuditTimeoutError(""); setAuditTimeoutData(null); setAuditTimeoutRequestVersion((version) => version + 1) }}>重新加载</Button></div> : null}
            {!auditTimeoutLoading && !auditTimeoutError && auditTimeoutData?.rows.length === 0 ? <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center"><CheckCircle2 className="h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-xs font-medium">暂无{auditTimeoutStatus === "PENDING" ? "待处理" : auditTimeoutStatus === "HANDLED" ? "已处理" : ""}审核超时商单</p><p className="mt-1 text-[10px] text-muted-foreground">当前筛选条件下没有可展示的数据</p></div> : null}
            {auditTimeoutData?.rows.map((campaign) => {
              const processed = campaign.handlingStatus === "HANDLED"
              const handling = handlingAuditCampaignId === campaign.campaignId
              return (
                <article key={campaign.campaignId} className={cn("rounded-2xl border p-3.5 transition-opacity", campaign.overdueDays > 3 ? "border-rose-100 bg-rose-50/25" : "border-border/70", processed && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <CampaignCover src={campaign.campaignMainImg} title={campaign.campaignTitle} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2"><h4 className="min-w-0 text-xs font-semibold leading-5">{campaign.campaignTitle || "未命名商单"}</h4><div className="flex shrink-0 flex-wrap justify-end gap-1.5">{processed ? <Badge variant="success">已处理</Badge> : null}<Badge variant="danger">超 {Math.max(1, campaign.overdueDays)} 天</Badge></div></div>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
                        <p>商单 ID <CopyableId label="商单 ID" value={campaign.campaignId} /></p>
                        <p>品牌方 ID <CopyableId label="品牌方 ID" value={campaign.brandId} /></p>
                        <p>子账号 ID {campaign.childBrandId ? <CopyableId label="子账号 ID" value={campaign.childBrandId} /> : <strong className="ml-1 font-medium text-foreground">--</strong>}</p>
                        <p>品牌方平台 <strong className="ml-1 font-medium text-foreground">{campaign.brandPlatformType || "--"}</strong></p>
                        <p>品牌方手机号 <strong className="ml-1 font-mono font-medium text-foreground">{campaign.brandUserPhone || "--"}</strong></p>
                        <p>CSM <strong className="ml-1 font-medium text-foreground">{campaign.csm || "--"}</strong></p>
                        <p>发布时间 <strong className="ml-1 font-medium text-foreground">{campaign.publishTime || "--"}</strong></p>
                        <p>最后审核时间 <strong className="ml-1 font-medium text-foreground">{campaign.lastAuditTime || "--"}</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col justify-between gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center"><span className="text-[10px] text-muted-foreground"><strong className="font-mono text-sm text-foreground">{number.format(campaign.pendingAuditCount)}</strong> 位达人待审核{campaign.handledTime ? ` · 处理于 ${campaign.handledTime}` : ""}</span><Button type="button" variant="outline" size="sm" disabled={handling} onClick={() => void updateAuditTimeoutHandling(campaign.campaignId, campaign.campaignTitle, !processed)}>{handling ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{handling ? "处理中" : processed ? "标记未处理" : "标记已处理"}</Button></div>
                </article>
              )
            })}
            </div>
            {auditTimeoutData && auditTimeoutData.total > 0 ? <div className="mt-3 flex flex-col justify-between gap-3 border-t border-border/70 pt-3 text-[10px] text-muted-foreground sm:flex-row sm:items-center"><span>共 {number.format(auditTimeoutData.total)} 条 · 第 {auditTimeoutData.currentPage} / {auditTimeoutTotalPages} 页</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={auditTimeoutLoading || auditTimeoutPage <= 1} onClick={() => { setAuditTimeoutLoading(true); setAuditTimeoutError(""); setAuditTimeoutData(null); setAuditTimeoutPage((page) => Math.max(1, page - 1)) }}>上一页</Button><Button type="button" variant="outline" size="sm" disabled={auditTimeoutLoading || auditTimeoutPage >= auditTimeoutTotalPages} onClick={() => { setAuditTimeoutLoading(true); setAuditTimeoutError(""); setAuditTimeoutData(null); setAuditTimeoutPage((page) => Math.min(auditTimeoutTotalPages, page + 1)) }}>下一页</Button></div></div> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0">
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start">
          <div><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-violet-600" />品牌方未审核达人数排行榜</CardTitle><CardDescription className="mt-1">按待审核总数量降序排列，优先跟进积压较多的品牌方</CardDescription></div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <div className="flex flex-wrap rounded-full bg-muted p-1" role="radiogroup" aria-label="排行榜时间范围">
              {periodOptions.map((option) => <button key={option.value} type="button" role="radio" aria-checked={period === option.value} onClick={() => { if (period === option.value) return; setRankingLoading(true); setRankingError(""); setRankingData(null); setRankingPage(1); setPeriod(option.value) }} className={cn("rounded-full px-3 py-1.5 text-[10px] font-medium transition-all", period === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{option.label}</button>)}
            </div>
            <div className="relative w-44">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="排行榜 CSM 筛选"
                placeholder="搜索 CSM"
                value={rankingCsmInput}
                onChange={(event) => setRankingCsmInput(event.target.value)}
                className="h-8 pl-8 text-[10px]"
              />
            </div>
            <Button type="button" variant="outline" size="sm" disabled={rankingExporting} onClick={() => void exportPendingAuditRanking()}>{rankingExporting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{rankingExporting ? "导出中" : "导出 Excel"}</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {rankingLoading && !rankingData ? <div className="space-y-2">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : null}
          {rankingError ? <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700"><p>{rankingError}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { setRankingLoading(true); setRankingError(""); setRankingData(null); setRankingRequestVersion((version) => version + 1) }}>重新加载</Button></div> : null}
          {!rankingLoading && !rankingError && rankingData?.rows.length === 0 ? <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"><BarChart3 className="h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-xs font-medium">暂无排行数据</p><p className="mt-1 text-[10px] text-muted-foreground">当前时间范围内没有待审核品牌方</p></div> : null}
          {rankingData && rankingData.rows.length > 0 ? <>
            <div className="overflow-x-auto"><Table className="min-w-max">
              <TableHeader><TableRow><TableHead className="w-20 whitespace-nowrap">排名</TableHead><TableHead className="whitespace-nowrap">品牌方 ID</TableHead><TableHead className="whitespace-nowrap">品牌方平台</TableHead><TableHead className="whitespace-nowrap">手机号</TableHead><TableHead className="whitespace-nowrap">CSM</TableHead><TableHead className="whitespace-nowrap">最新跟进时间</TableHead><TableHead className="whitespace-nowrap text-right">跟进次数</TableHead><TableHead className="whitespace-nowrap text-right">商单总数量</TableHead><TableHead className="whitespace-nowrap text-right">待审核总数量</TableHead><TableHead className="sticky right-0 z-20 whitespace-nowrap bg-card text-right shadow-[-8px_0_10px_-10px_rgba(0,0,0,0.25)]">操作</TableHead></TableRow></TableHeader>
              <TableBody>{rankingData.rows.map((brand, index) => { const platform = (brand.brandPlatform || "unknown").toLowerCase(); const rank = brand.rank || index + 1; return <TableRow key={`${brand.brandId}-${brand.rank}`}><TableCell><span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold", rank === 1 ? "bg-[#d4f76a] text-black" : rank <= 3 ? "bg-violet-50 text-violet-700" : "bg-muted text-muted-foreground")}>{String(rank).padStart(2, "0")}</span></TableCell><TableCell><span className="flex items-center gap-2 whitespace-nowrap font-mono text-xs font-semibold"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{brand.brandId}</span></TableCell><TableCell><Badge className={cn("border-0", platformStyles[platform as BrandPlatform] ?? "bg-muted text-muted-foreground")}>{brand.brandPlatform || "unknown"}</Badge></TableCell><TableCell className="whitespace-nowrap font-mono text-xs">{brand.brandUserPhone || "--"}</TableCell><TableCell className="whitespace-nowrap text-xs">{brand.csm || "--"}</TableCell><TableCell className="whitespace-nowrap text-[10px]">{formatDateTime(brand.latestNoteFollowUpTime)}</TableCell><TableCell className="text-right font-mono text-xs">{number.format(brand.noteFollowUpCount)}</TableCell><TableCell className="text-right font-mono text-xs">{number.format(brand.campaignCount)}</TableCell><TableCell className="text-right"><strong className="font-mono text-sm text-rose-600">{number.format(brand.pendingAuditCount)}</strong></TableCell><TableCell className="sticky right-0 z-10 whitespace-nowrap bg-card text-right shadow-[-8px_0_10px_-10px_rgba(0,0,0,0.2)]"><Button type="button" variant="outline" size="sm" onClick={() => openBrandNotes(brand.brandId)}><NotebookPen className="h-3.5 w-3.5" />添加小记</Button></TableCell></TableRow> })}</TableBody>
            </Table></div>
            </> : null}
          {rankingData && rankingData.total > 0 ? <div className="mt-3 flex flex-col justify-between gap-3 border-t border-border/70 pt-3 text-[10px] text-muted-foreground sm:flex-row sm:items-center"><span>共 {number.format(rankingData.total)} 个品牌方 · 第 {rankingData.currentPage} / {rankingTotalPages} 页</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={rankingLoading || rankingPage <= 1} onClick={() => { setRankingLoading(true); setRankingError(""); setRankingData(null); setRankingPage((page) => Math.max(1, page - 1)) }}>上一页</Button><Button type="button" variant="outline" size="sm" disabled={rankingLoading || rankingPage >= rankingTotalPages} onClick={() => { setRankingLoading(true); setRankingError(""); setRankingData(null); setRankingPage((page) => Math.min(rankingTotalPages, page + 1)) }}>下一页</Button></div></div> : null}
          {rankingData ? <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 text-[10px] text-muted-foreground"><span>共 {number.format(rankingData.total)} 个品牌方需要重点跟进</span><span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-600" />已按待审核数量排序</span></div> : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(notesBrandId)} onOpenChange={(open) => { if (!open) closeBrandNotes() }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>品牌方跟进小记</DialogTitle><DialogDescription>品牌方 ID：{notesBrandId || "--"}</DialogDescription></DialogHeader>
          {notesBrandId ? <div className="mt-5 space-y-5">
            <section className="rounded-xl border border-border/70 p-4">
              <label htmlFor="brand-note-content" className="text-xs font-semibold">添加跟进记录</label>
              <Textarea id="brand-note-content" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="请输入本次审核跟进情况" className="mt-2 min-h-24 text-xs leading-5" />
              {notesError && notesData ? <p role="alert" className="mt-2 text-xs text-rose-600">{notesError}</p> : null}
              <div className="mt-3 flex justify-end"><Button type="button" size="sm" disabled={noteSaving || !noteDraft.trim()} onClick={() => void addBrandNote()}>{noteSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <NotebookPen className="h-3.5 w-3.5" />}{noteSaving ? "添加中" : "添加小记"}</Button></div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between"><h4 className="text-xs font-semibold">全部小记</h4>{notesData ? <span className="text-[10px] text-muted-foreground">共 {number.format(notesData.total)} 条</span> : null}</div>
              {notesLoading && !notesData ? <div className="space-y-2">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)}</div> : null}
              {!notesLoading && notesError && !notesData ? <div role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700"><p>{notesError}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { setNotesLoading(true); setNotesError(""); setNotesData(null); setNotesRequestVersion((version) => version + 1) }}>重新加载</Button></div> : null}
              {!notesLoading && !notesError && notesData?.rows.length === 0 ? <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"><NotebookPen className="h-7 w-7 text-muted-foreground/40" /><p className="mt-2 text-xs font-medium">暂无跟进小记</p></div> : null}
              {notesData?.rows.length ? <div className="max-h-80 space-y-2 overflow-y-auto overscroll-y-auto pr-1 [scrollbar-gutter:stable]">{notesData.rows.map((note) => <article key={note.id} className="rounded-xl border border-border/70 p-3"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"><div><p className="text-[9px] text-muted-foreground">品牌方 ID</p><p className="mt-1 break-all font-mono text-xs font-medium">{note.brandId || "--"}</p></div><div><p className="text-[9px] text-muted-foreground">小记内容</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5">{note.recordContent || "--"}</p></div><div><p className="text-[9px] text-muted-foreground">创建时间</p><p className="mt-1 whitespace-nowrap text-[10px]">{formatDateTime(note.gmtCreate)}</p></div></div></article>)}</div> : null}
              {notesData && notesData.total > 0 ? <div className="mt-3 flex flex-col justify-between gap-3 border-t border-border/70 pt-3 text-[10px] text-muted-foreground sm:flex-row sm:items-center"><span>第 {notesData.currentPage} / {notesTotalPages} 页</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={notesLoading || notesPage <= 1} onClick={() => { setNotesLoading(true); setNotesError(""); setNotesData(null); setNotesPage((page) => Math.max(1, page - 1)) }}>上一页</Button><Button type="button" variant="outline" size="sm" disabled={notesLoading || notesPage >= notesTotalPages} onClick={() => { setNotesLoading(true); setNotesError(""); setNotesData(null); setNotesPage((page) => Math.min(notesTotalPages, page + 1)) }}>下一页</Button></div></div> : null}
            </section>
          </div> : null}
          <DialogFooter><Button type="button" variant="outline" disabled={noteSaving} onClick={closeBrandNotes}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>配置商单推荐邮件模板</DialogTitle><DialogDescription>{template?.ruleName ?? matchingRule?.ruleName ?? "正在读取规则模板"}</DialogDescription></DialogHeader>
          {templateLoading ? <div className="flex min-h-64 items-center justify-center text-xs text-muted-foreground"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />正在加载邮件模板</div> : templateError && !template ? <div role="alert" className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700">{templateError}</div> : template ? <div className="mt-5 space-y-4"><label className="block space-y-2"><span className="text-xs font-medium">邮件主题</span><Input value={templateDraft.subject} onChange={(event) => setTemplateDraft((current) => ({ ...current, subject: event.target.value }))} /></label><div className="space-y-2"><label htmlFor="campaign-recommendation-email-body" className="text-xs font-medium">邮件正文（HTML）</label><HtmlEmailEditor id="campaign-recommendation-email-body" value={templateDraft.content} onChange={(content) => setTemplateDraft((current) => ({ ...current, content }))} /></div><div className="rounded-xl bg-muted p-3 text-[10px] text-muted-foreground">可用变量：<span className="font-mono text-foreground">{template.variables.length ? template.variables.join(" ") : "暂无可用变量"}</span></div>{templateError ? <p role="alert" className="text-xs text-rose-600">{templateError}</p> : null}</div> : null}
          <DialogFooter><Button type="button" variant="outline" disabled={templateSaving} onClick={() => setTemplateOpen(false)}>取消</Button>{templateError && !template ? <Button type="button" variant="outline" onClick={() => void openMatchingTemplate()}><Settings2 className="h-4 w-4" />重试</Button> : null}{template ? <Button type="button" disabled={templateSaving} onClick={() => void saveMatchingTemplate()}>{templateSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}{templateSaving ? "保存中" : "保存模板"}</Button> : null}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
