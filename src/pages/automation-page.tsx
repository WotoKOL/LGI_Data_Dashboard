import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  AlertTriangle,
  Clock3,
  FileCode2,
  LoaderCircle,
  MailCheck,
  MessageSquareText,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { SectionHeading } from "@/components/dashboard-primitives"
import { CampaignAutomationSection } from "@/components/campaign-automation-section"
import { CreatorPushNode } from "@/components/creator-push-node"
import {
  feedbackTickets,
  type FeedbackTicket,
} from "@/data/automation-data"
import {
  AutomationApiError,
  getAutomationOverview,
  getAutomationRules,
  getAutomationTemplate,
  setAutomationRuleEnabled,
  updateAutomationTemplate,
  type AutomationOverview,
  type AutomationRule,
  type AutomationRuleCode,
  type AutomationTemplate,
} from "@/lib/automation-api"
import { getFailureLogs, type FailureLog } from "@/lib/failure-logs-api"
import { cn, number } from "@/lib/utils"

const ruleVisuals: Partial<Record<AutomationRuleCode, { icon: LucideIcon; tone: string }>> = {
  NEW_REGISTERED_CREATOR: { icon: UserRoundCheck, tone: "bg-violet-50 text-violet-600" },
  NEW_VERIFIED_CREATOR: { icon: Sparkles, tone: "bg-amber-50 text-amber-600" },
  INACTIVE_CREATOR: { icon: UsersRound, tone: "bg-rose-50 text-rose-600" },
}

function getErrorMessage(error: unknown) {
  if (error instanceof AutomationApiError && error.traceId) {
    return `${error.message}（Trace ID：${error.traceId}）`
  }
  if (error && typeof error === "object" && "traceId" in error && typeof error.traceId === "string" && error.traceId) {
    return `${error instanceof Error ? error.message : "请求失败"}（Trace ID：${error.traceId}）`
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试"
}

function formatRate(value: number) {
  if (!Number.isFinite(value)) return "--"
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value)}%`
}

function formatExecutionTime(value: string | null) {
  if (!value) return "暂无执行记录"
  return value.replace("T", " ").replace(/\.\d+$/, "")
}

function displayValue(value: unknown, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

function formatLogPayload(value: string | null) {
  if (!value) return "--"
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function getCurrentTimestamp() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date()).replaceAll("/", "-")
}

function SummaryCard({ label, value, note, icon: Icon, tone }: { label: string; value: number; note: string; icon: LucideIcon; tone: string }) {
  return (
    <Card className="border-0">
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[-0.04em]">{number.format(value)}</p>
          <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionHeadingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-3 w-80 max-w-full" />
    </div>
  )
}

function RuleCardSkeleton() {
  return (
    <Card className="border-0">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex gap-2"><Skeleton className="h-5 w-12 rounded-full" /><Skeleton className="h-5 w-9 rounded-full" /></div></div>
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>
        <div className="space-y-3 rounded-xl bg-muted/50 p-3"><Skeleton className="h-3 w-14" /><Skeleton className="h-4 w-3/4" /><div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-28" /></div></div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3 w-12" /><Skeleton className="h-6 w-16" /></div>)}</div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </CardContent>
    </Card>
  )
}

function PageSkeleton() {
  return (
    <div role="status" aria-label="正在加载自动化运营数据" className="space-y-8">
      <span className="sr-only">正在加载自动化运营数据</span>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="border-0"><CardContent className="flex items-center gap-4 p-5"><Skeleton className="h-10 w-10 shrink-0 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-20" /><Skeleton className="h-3 w-28 max-w-full" /></div></CardContent></Card>
        ))}
      </div>

      <section className="space-y-4">
        <SectionHeadingSkeleton />
        <div className="grid gap-3 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <RuleCardSkeleton key={index} />)}
        </div>
        <Card className="border-0">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="space-y-2"><Skeleton className="h-5 w-36" /><Skeleton className="h-3 w-72 max-w-full" /></div><Skeleton className="h-8 w-24 rounded-full" /></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</div>
            <div className="grid gap-4 lg:grid-cols-2"><div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div><Skeleton className="h-44 rounded-xl" /></div>
            <div className="flex justify-end"><Skeleton className="h-9 w-28 rounded-full" /></div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeadingSkeleton />
        <RuleCardSkeleton />
        <div className="grid gap-3 xl:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <Card key={index} className="border-0"><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><Skeleton className="h-5 w-44" /><Skeleton className="h-8 w-20 rounded-full" /></div>{Array.from({ length: 3 }, (_, row) => <Skeleton key={row} className="h-24 rounded-xl" />)}</CardContent></Card>)}</div>
        <Card className="border-0"><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><Skeleton className="h-5 w-48" /><Skeleton className="h-8 w-40 rounded-full" /></div>{Array.from({ length: 5 }, (_, row) => <div key={row} className="grid grid-cols-4 gap-4 border-t border-border/60 pt-3"><Skeleton className="h-4 w-10" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16 justify-self-end" /></div>)}</CardContent></Card>
      </section>

      <section className="space-y-4">
        <SectionHeadingSkeleton />
        <Card className="border-0"><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-64 max-w-full" /></div><Skeleton className="h-9 w-44 rounded-full" /></div>{Array.from({ length: 6 }, (_, row) => <div key={row} className="grid grid-cols-3 gap-4 border-t border-border/60 pt-3 sm:grid-cols-7">{Array.from({ length: 7 }, (_, column) => <Skeleton key={column} className={cn("h-4", column > 2 && "hidden sm:block")} />)}</div>)}</CardContent></Card>
      </section>
    </div>
  )
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border border-rose-100 bg-rose-50/50 shadow-none">
      <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div><p className="text-sm font-semibold text-rose-900">自动化运营数据加载失败</p><p className="mt-1 break-all text-xs text-rose-700">{message}</p></div>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw className="h-3.5 w-3.5" />重新加载</Button>
      </CardContent>
    </Card>
  )
}

function AutomationPageHeader({ enabledCount, totalCount, lastUpdatedAt, refreshing, onRefresh }: { enabledCount: number; totalCount: number; lastUpdatedAt: string; refreshing: boolean; onRefresh: () => void }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{enabledCount} / {totalCount} 条达人规则运行中</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">自动化运营</h1>
        <p className="mt-1.5 text-xs text-muted-foreground">以规则和预警驱动达人激活、商单治理与异常问题闭环。</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] text-muted-foreground">{lastUpdatedAt ? `最后更新 ${lastUpdatedAt}` : "尚未获取数据"}</span>
        <Button variant="outline" size="sm" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />{refreshing ? "刷新中" : "刷新"}
        </Button>
      </div>
    </div>
  )
}

export function AutomationPage() {
  const [overview, setOverview] = useState<AutomationOverview | null>(null)
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pageError, setPageError] = useState("")
  const [lastUpdatedAt, setLastUpdatedAt] = useState("")
  const [updatingRules, setUpdatingRules] = useState<Set<AutomationRuleCode>>(() => new Set())
  const [templateRuleCode, setTemplateRuleCode] = useState<AutomationRuleCode | null>(null)
  const [template, setTemplate] = useState<AutomationTemplate | null>(null)
  const [templateDraft, setTemplateDraft] = useState({ subject: "", content: "" })
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState("")
  const [activeIssueTab, setActiveIssueTab] = useState<"logs" | "tickets">("logs")
  const [selectedLog, setSelectedLog] = useState<FailureLog | null>(null)
  const [failureLogs, setFailureLogs] = useState<FailureLog[]>([])
  const [failureLogsPage, setFailureLogsPage] = useState({ currentPage: 1, pageSize: 20, total: 0, days: 10 })
  const [failureLogsLoading, setFailureLogsLoading] = useState(true)
  const [failureLogsError, setFailureLogsError] = useState("")
  const [ticketStatuses, setTicketStatuses] = useState<Record<string, FeedbackTicket["status"]>>(
    () => Object.fromEntries(feedbackTickets.map((ticket) => [ticket.id, ticket.status])) as Record<string, FeedbackTicket["status"]>,
  )
  const templateRequestId = useRef(0)
  const hasPageData = useRef(false)

  const creatorRules = useMemo(() => rules.filter((rule) => Boolean(ruleVisuals[rule.ruleCode])), [rules])
  const campaignRecommendationRule = useMemo(() => rules.find((rule) => rule.ruleCode === "NEW_CAMPAIGN_CREATOR_RECOMMENDATION") ?? null, [rules])
  const enabledRuleCount = useMemo(() => creatorRules.filter((rule) => rule.enabled).length, [creatorRules])

  const loadData = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    setPageError("")
    try {
      const [nextOverview, nextRules] = await Promise.all([getAutomationOverview(), getAutomationRules()])
      setOverview(nextOverview)
      setRules(nextRules)
      hasPageData.current = true
      setLastUpdatedAt(getCurrentTimestamp())
      if (!initial) toast.success("自动化运营数据已刷新")
    } catch (error) {
      const message = getErrorMessage(error)
      if (!hasPageData.current) setPageError(message)
      else toast.error("自动化运营数据刷新失败", { description: message })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadFailureLogs = useCallback(async (page = 1) => {
    setFailureLogsLoading(true)
    setFailureLogsError("")
    try {
      const result = await getFailureLogs({ currentPage: page, pageSize: 20 })
      setFailureLogs(result.rows ?? [])
      setFailureLogsPage({
        currentPage: result.currentPage || page,
        pageSize: result.pageSize || 20,
        total: result.total || 0,
        days: result.days || 10,
      })
    } catch (error) {
      setFailureLogsError(getErrorMessage(error))
    } finally {
      setFailureLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([getAutomationOverview(), getAutomationRules()])
      .then(([nextOverview, nextRules]) => {
        if (!active) return
        setOverview(nextOverview)
        setRules(nextRules)
        hasPageData.current = true
        setLastUpdatedAt(getCurrentTimestamp())
      })
      .catch((error: unknown) => {
        if (active) setPageError(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => void loadFailureLogs(), 0)
    return () => window.clearTimeout(requestId)
  }, [loadFailureLogs])

  async function toggleRule(rule: AutomationRule, enabled: boolean) {
    setUpdatingRules((current) => new Set(current).add(rule.ruleCode))
    try {
      await setAutomationRuleEnabled(rule.ruleCode, enabled)
      setRules((current) => current.map((item) => item.ruleCode === rule.ruleCode ? { ...item, enabled } : item))
      toast.success(`“${rule.ruleName}”已${enabled ? "启用" : "暂停"}`)
    } catch (error) {
      toast.error(`更新“${rule.ruleName}”失败`, { description: getErrorMessage(error) })
    } finally {
      setUpdatingRules((current) => {
        const next = new Set(current)
        next.delete(rule.ruleCode)
        return next
      })
    }
  }

  async function openTemplate(rule: AutomationRule) {
    const requestId = templateRequestId.current + 1
    templateRequestId.current = requestId
    setTemplateRuleCode(rule.ruleCode)
    setTemplate(null)
    setTemplateError("")
    setTemplateLoading(true)
    try {
      const nextTemplate = await getAutomationTemplate(rule.ruleCode)
      if (templateRequestId.current !== requestId) return
      setTemplate(nextTemplate)
      setTemplateDraft({ subject: nextTemplate.subject, content: nextTemplate.content })
    } catch (error) {
      if (templateRequestId.current === requestId) setTemplateError(getErrorMessage(error))
    } finally {
      if (templateRequestId.current === requestId) setTemplateLoading(false)
    }
  }

  function closeTemplate() {
    templateRequestId.current += 1
    setTemplateRuleCode(null)
    setTemplate(null)
    setTemplateError("")
    setTemplateLoading(false)
  }

  async function saveTemplate() {
    if (!templateRuleCode || !template) return
    const subject = templateDraft.subject.trim()
    const content = templateDraft.content.trim()
    if (!subject || !content) {
      setTemplateError("邮件主题和邮件正文不能为空")
      return
    }
    setTemplateSaving(true)
    setTemplateError("")
    try {
      await updateAutomationTemplate(templateRuleCode, { subject, content })
      const ruleName = template.ruleName
      closeTemplate()
      toast.success(`“${ruleName}”邮件模板已保存`)
    } catch (error) {
      setTemplateError(getErrorMessage(error))
    } finally {
      setTemplateSaving(false)
    }
  }

  function showAction(message: string) {
    toast.success(message)
  }

  function advanceTicket(ticketId: string) {
    setTicketStatuses((current) => {
      const nextStatus = current[ticketId] === "待处理" ? "处理中" : "已解决"
      toast.success(`工单 ${ticketId} 已更新为“${nextStatus}”`)
      return { ...current, [ticketId]: nextStatus }
    })
  }

  return (
    <div className="space-y-8 pb-10">
      <AutomationPageHeader enabledCount={enabledRuleCount} totalCount={creatorRules.length} lastUpdatedAt={lastUpdatedAt} refreshing={refreshing} onRefresh={() => void loadData()} />

      {loading ? <PageSkeleton /> : pageError ? <ErrorPanel message={pageError} onRetry={() => void loadData(true)} /> : overview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="运行中规则" value={enabledRuleCount} note={`共 ${creatorRules.length} 条达人规则`} icon={Zap} tone="bg-violet-50 text-violet-600" />
            <SummaryCard label="待激活达人" value={overview.pendingActivationCreatorCount} note={`今日新增 ${number.format(overview.newPendingCreatorCount)} 人`} icon={UsersRound} tone="bg-amber-50 text-amber-600" />
            <SummaryCard label="待处理商单预警" value={overview.pendingCampaignWarningCount} note={`${number.format(overview.overdueCampaignWarningCount)} 个已超过 7 天`} icon={AlertTriangle} tone="bg-rose-50 text-rose-600" />
            <SummaryCard label="异常与待办工单" value={overview.exceptionAndTodoCount} note={`${number.format(overview.todayErrorCount)} 条今日错误 · ${number.format(overview.ticketCount)} 个工单`} icon={ShieldAlert} tone="bg-sky-50 text-sky-600" />
          </div>

          <section className="space-y-4">
            <SectionHeading eyebrow="Creator automation" title="达人自动化运营" description="按达人生命周期节点自动触达，并对沉默达人进行批量激活" />
            {creatorRules.length ? (
              <div className="grid gap-3 xl:grid-cols-3">
                {creatorRules.map((rule) => {
                  const visual = ruleVisuals[rule.ruleCode]
                  const Icon = visual?.icon ?? Zap
                  const updating = updatingRules.has(rule.ruleCode)
                  return (
                    <Card key={rule.ruleCode} className="border-0">
                      <CardContent className="flex h-full flex-col p-5">
                        <div className="flex items-start justify-between gap-4">
                          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", visual?.tone ?? "bg-slate-50 text-slate-600")}><Icon className="h-5 w-5" /></span>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.enabled ? "success" : "secondary"}>{updating ? "更新中" : rule.enabled ? "已启用" : "已暂停"}</Badge>
                            <Switch checked={rule.enabled} disabled={updating} onCheckedChange={(checked) => void toggleRule(rule, checked)} aria-label={`${rule.ruleName}开关`} />
                          </div>
                        </div>
                        <h3 className="mt-4 text-base font-semibold">{rule.ruleName}</h3>
                        <p className="mt-1.5 min-h-10 text-xs leading-5 text-muted-foreground">{rule.description}</p>
                        <div className="mt-4 rounded-xl bg-muted/60 p-3">
                          <p className="text-[9px] font-medium text-muted-foreground">触发条件</p>
                          <p className="mt-1 text-[11px] font-medium">{rule.triggerDescription}</p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-muted-foreground">
                            <span>{rule.executionMode}</span>
                            <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />最新执行 {formatExecutionTime(rule.latestExecutionTime)}</span>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-y-4 divide-x-0 sm:grid-cols-4 sm:divide-x sm:divide-border">
                          <div><p className="text-[9px] text-muted-foreground">待处理</p><p className="mt-1 font-mono text-lg font-bold">{number.format(rule.pendingCount)}</p></div>
                          <div className="sm:pl-3"><p className="text-[9px] text-muted-foreground">累计处理</p><p className="mt-1 font-mono text-lg font-bold">{number.format(rule.totalProcessedCount)}</p></div>
                          <div className="sm:pl-3"><p className="text-[9px] text-muted-foreground">今日处理</p><p className="mt-1 font-mono text-lg font-bold">{number.format(rule.todayProcessedCount)}</p></div>
                          <div className="sm:pl-3"><p className="text-[9px] text-muted-foreground">激活率</p><p className="mt-1 font-mono text-lg font-bold">{formatRate(rule.activationRate)}</p></div>
                        </div>
                        <div className="mt-auto flex flex-wrap gap-2 pt-5">
                          <Button variant="outline" size="sm" onClick={() => void openTemplate(rule)}><Settings2 className="h-3.5 w-3.5" />邮件模板</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="border-0"><CardContent className="p-8 text-center text-sm text-muted-foreground">当前没有可展示的达人自动化规则</CardContent></Card>
            )}
            <CreatorPushNode onAction={showAction} />
          </section>
        </>
      ) : null}

      {!loading && !pageError ? (
        <>
          <section className="space-y-4">
            <SectionHeading eyebrow="Campaign operations" title="品牌方/商单自动化运营" description="聚合无申请商单与品牌方审核超时问题，由运营人工确认处理" />
            <CampaignAutomationSection matchingRule={campaignRecommendationRule} matchingRuleUpdating={campaignRecommendationRule ? updatingRules.has(campaignRecommendationRule.ruleCode) : false} onToggleMatchingRule={(enabled) => { if (campaignRecommendationRule) void toggleRule(campaignRecommendationRule, enabled) }} onAction={showAction} />
          </section>

          <section className="space-y-4">
            <SectionHeading eyebrow="Issue center" title="异常问题与反馈处理" description="查看达人端错误请求，跟进反馈工单并更新处理状态" />
            <Card className="border-0">
              <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center">
                <div><CardTitle>{activeIssueTab === "logs" ? "达人错误日志" : "达人反馈工单"}</CardTitle><CardDescription className="mt-1">{activeIssueTab === "logs" ? "点击操作标题查看接口请求与错误详情" : "根据优先级处理用户反馈并跟踪状态"}</CardDescription></div>
                <div className="flex rounded-full bg-muted p-1">
                  <button type="button" onClick={() => setActiveIssueTab("logs")} className={cn("rounded-full px-3 py-1.5 text-[11px] font-medium transition-all", activeIssueTab === "logs" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}><FileCode2 className="mr-1.5 inline h-3.5 w-3.5" />错误日志</button>
                  <button type="button" onClick={() => setActiveIssueTab("tickets")} className={cn("rounded-full px-3 py-1.5 text-[11px] font-medium transition-all", activeIssueTab === "tickets" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}><MessageSquareText className="mr-1.5 inline h-3.5 w-3.5" />反馈工单</button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {activeIssueTab === "logs" ? (
                  <div className="space-y-4">
                    {failureLogsLoading ? (
                      <div role="status" aria-label="正在加载错误日志" className="space-y-3">
                        <span className="sr-only">正在加载错误日志</span>
                        {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
                      </div>
                    ) : failureLogsError ? (
                      <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 text-xs text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{failureLogsError}</div>
                        <Button variant="outline" size="sm" onClick={() => void loadFailureLogs(failureLogsPage.currentPage)}><RefreshCw className="h-3.5 w-3.5" />重试</Button>
                      </div>
                    ) : failureLogs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">近 {failureLogsPage.days || 10} 天暂无失败日志</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>操作标题</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead><TableHead>请求 IP</TableHead><TableHead>用户 ID</TableHead><TableHead>创建时间</TableHead></TableRow></TableHeader>
                            <TableBody>{failureLogs.map((log) => <TableRow key={log.id}><TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{displayValue(log.id)}</TableCell><TableCell><button type="button" onClick={() => setSelectedLog(log)} className="max-w-64 truncate text-left text-xs font-medium text-rose-600 hover:underline">{displayValue(log.title, "未命名操作")}</button></TableCell><TableCell className="whitespace-nowrap text-xs">{displayValue(log.operaTypeName || log.operaType)}</TableCell><TableCell><Badge variant="danger">{displayValue(log.statusName, "失败")}</Badge></TableCell><TableCell className="whitespace-nowrap font-mono text-[10px]">{displayValue(log.reqIp)}</TableCell><TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{displayValue(log.userId)}</TableCell><TableCell className="whitespace-nowrap text-[10px] text-muted-foreground">{displayValue(log.gmtCreate || log.sendTime)}</TableCell></TableRow>)}</TableBody>
                          </Table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                          <p className="text-[11px] text-muted-foreground">共 {number.format(failureLogsPage.total)} 条 · 近 {failureLogsPage.days || 10} 天</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">第 {failureLogsPage.currentPage} / {Math.max(1, Math.ceil(failureLogsPage.total / failureLogsPage.pageSize))} 页</span>
                            <Button variant="outline" size="sm" disabled={failureLogsLoading || failureLogsPage.currentPage <= 1} onClick={() => void loadFailureLogs(failureLogsPage.currentPage - 1)}>上一页</Button>
                            <Button variant="outline" size="sm" disabled={failureLogsLoading || failureLogsPage.currentPage >= Math.ceil(failureLogsPage.total / failureLogsPage.pageSize)} onClick={() => void loadFailureLogs(failureLogsPage.currentPage + 1)}>下一页</Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>工单 ID</TableHead><TableHead>反馈标题</TableHead><TableHead>达人</TableHead><TableHead>类别</TableHead><TableHead>优先级</TableHead><TableHead>状态</TableHead><TableHead>更新时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                    <TableBody>{feedbackTickets.map((ticket) => {
                      const status = ticketStatuses[ticket.id]
                      return <TableRow key={ticket.id}><TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{ticket.id}</TableCell><TableCell className="min-w-56 text-xs font-medium">{ticket.title}</TableCell><TableCell className="whitespace-nowrap text-xs">{ticket.creator}</TableCell><TableCell><Badge variant="secondary">{ticket.category}</Badge></TableCell><TableCell><Badge variant={ticket.priority === "高" ? "danger" : ticket.priority === "中" ? "warning" : "secondary"}>{ticket.priority}</Badge></TableCell><TableCell><Badge variant={status === "已解决" ? "success" : status === "处理中" ? "warning" : "secondary"}>{status}</Badge></TableCell><TableCell className="whitespace-nowrap text-[10px] text-muted-foreground">{ticket.updatedAt}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" disabled={status === "已解决"} onClick={() => advanceTicket(ticket.id)}>{status === "待处理" ? "开始处理" : status === "处理中" ? "标记解决" : "已完成"}</Button></TableCell></TableRow>
                    })}</TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      <Dialog open={Boolean(templateRuleCode)} onOpenChange={(open) => { if (!open) closeTemplate() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>配置激活邮件模板</DialogTitle>
            <DialogDescription>{template?.ruleName ?? "正在读取规则模板"}{template ? " · 修改后将用于下一次自动触达" : ""}</DialogDescription>
          </DialogHeader>
          {templateLoading ? (
            <div className="flex min-h-64 items-center justify-center text-xs text-muted-foreground"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />正在加载邮件模板</div>
          ) : templateError && !template ? (
            <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700">{templateError}</div>
          ) : template ? (
            <div className="mt-5 space-y-4">
              <label className="block space-y-2"><span className="text-xs font-medium">邮件主题</span><Input value={templateDraft.subject} onChange={(event) => setTemplateDraft((current) => ({ ...current, subject: event.target.value }))} /></label>
              <label className="block space-y-2"><span className="text-xs font-medium">邮件正文</span><Textarea value={templateDraft.content} onChange={(event) => setTemplateDraft((current) => ({ ...current, content: event.target.value }))} className="min-h-52 font-mono text-xs leading-5" /></label>
              <div className="rounded-xl bg-muted p-3 text-[10px] text-muted-foreground">可用变量：<span className="font-mono text-foreground">{template.variables.length ? template.variables.join(" ") : "暂无可用变量"}</span></div>
              {templateError ? <p role="alert" className="text-xs text-rose-600">{templateError}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={templateSaving} onClick={closeTemplate}>取消</Button>
            {templateError && !template ? <Button variant="outline" onClick={() => { const rule = rules.find((item) => item.ruleCode === templateRuleCode); if (rule) void openTemplate(rule) }}><RefreshCw className="h-4 w-4" />重试</Button> : null}
            {template ? <Button disabled={templateSaving} onClick={() => void saveTemplate()}>{templateSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}{templateSaving ? "保存中" : "保存模板"}</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => { if (!open) setSelectedLog(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>请求详情</DialogTitle><DialogDescription>{displayValue(selectedLog?.title, "未命名操作")} · {displayValue(selectedLog?.gmtCreate || selectedLog?.sendTime)}</DialogDescription></DialogHeader>
          {selectedLog ? <div className="mt-5 space-y-4"><div className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"><div><p className="text-[10px] text-muted-foreground">日志 ID</p><p className="mt-1 break-all font-mono text-xs">{displayValue(selectedLog.id)}</p></div><div><p className="text-[10px] text-muted-foreground">请求地址</p><p className="mt-1 break-all font-mono text-xs">{displayValue(selectedLog.url)}</p></div><div><p className="text-[10px] text-muted-foreground">操作类型</p><p className="mt-1 text-xs">{displayValue(selectedLog.operaTypeName || selectedLog.operaType)}</p></div><div><p className="text-[10px] text-muted-foreground">状态</p><Badge variant="danger" className="mt-1">{displayValue(selectedLog.statusName, "失败")}</Badge></div><div><p className="text-[10px] text-muted-foreground">请求 IP / 用户 ID</p><p className="mt-1 font-mono text-xs">{displayValue(selectedLog.reqIp)} / {displayValue(selectedLog.userId)}</p></div><div><p className="text-[10px] text-muted-foreground">来源数据库 / 门户</p><p className="mt-1 text-xs">{displayValue(selectedLog.sourceDatabase)} / {displayValue(selectedLog.portalSource)}</p></div><div><p className="text-[10px] text-muted-foreground">创建时间 / 发送时间</p><p className="mt-1 text-xs">{displayValue(selectedLog.gmtCreate)} / {displayValue(selectedLog.sendTime)}</p></div><div><p className="text-[10px] text-muted-foreground">Trace ID</p><p className="mt-1 break-all font-mono text-xs">{displayValue(selectedLog.traceId)}</p></div></div><div><p className="mb-2 text-xs font-semibold">输入参数</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#f5f6f8] p-4 font-mono text-xs leading-5 text-slate-700">{formatLogPayload(selectedLog.inParam)}</pre></div><div><p className="mb-2 text-xs font-semibold">输出结果</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#171c24] p-4 font-mono text-xs leading-5 text-slate-200">{formatLogPayload(selectedLog.outResult)}</pre></div>{selectedLog.remark ? <div><p className="mb-2 text-xs font-semibold">备注</p><p className="rounded-xl bg-muted p-3 text-xs leading-5">{selectedLog.remark}</p></div> : null}</div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedLog(null)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
