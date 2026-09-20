import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Crown,
  Globe2,
  Hash,
  History,
  LoaderCircle,
  Mail,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  CreatorInformationPushApiError,
  cancelCreatorPushTask,
  createCreatorPushTask,
  getCreatorPushMatchCount,
  getCreatorPushOptions,
  getCreatorPushRecipients,
  getCreatorPushTask,
  getCurrentCreatorPushTask,
  type CreatorPushMatchCount,
  type CreatorPushOption,
  type CreatorPushOptions,
  type CreatorPushRecipientsPage,
  type CreatorPushTarget,
  type CreatorPushTask,
} from "@/lib/creator-information-push-api"
import { cn, number } from "@/lib/utils"

type TargetMode = "all" | "ids" | "membership" | "custom"
type MessageChannel = "inbox" | "email"
type DeliveryMode = "immediate" | "scheduled"
type RangeValue = { min?: number; max?: number }

const creatorIdSeparatorPattern = /[\s,，;；]+/
const terminalStatuses = new Set(["SUCCESS", "COMPLETED", "FAILED", "CANCELLED", "CANCELED", "PARTIAL_SUCCESS"])
const followerPresets = [
  { label: "1 万以下", max: 9_999 },
  { label: "1 万–10 万", min: 10_000, max: 99_999 },
  { label: "10 万–50 万", min: 100_000, max: 499_999 },
  { label: "50 万–100 万", min: 500_000, max: 999_999 },
  { label: "100 万以上", min: 1_000_000 },
]
const viewPresets = [
  { label: "1 万以下", max: 9_999 },
  { label: "1 万–5 万", min: 10_000, max: 49_999 },
  { label: "5 万–10 万", min: 50_000, max: 99_999 },
  { label: "10 万–50 万", min: 100_000, max: 499_999 },
  { label: "50 万以上", min: 500_000 },
]

const statusLabels: Record<string, string> = {
  CREATED: "已创建",
  PENDING: "等待执行",
  WAITING: "等待执行",
  SCHEDULED: "定时等待",
  RUNNING: "执行中",
  SUCCESS: "已完成",
  COMPLETED: "已完成",
  PARTIAL_SUCCESS: "部分成功",
  FAILED: "失败",
  CANCELLED: "已取消",
  CANCELED: "已取消",
  SKIPPED: "已跳过",
}

function getErrorMessage(error: unknown) {
  if (error instanceof CreatorInformationPushApiError && error.traceId) {
    return `${error.message}（Trace ID：${error.traceId}）`
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试"
}

function toggleValue(current: string[], value: string) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="block min-w-0 space-y-2"><span className="block text-[10px] font-medium text-muted-foreground">{label}</span>{children}</div>
}

function MultiSelect({ label, options, value, onChange, searchable = false, loading = false }: { label: string; options: CreatorPushOption[]; value: string[]; onChange: (value: string[]) => void; searchable?: boolean; loading?: boolean }) {
  const [query, setQuery] = useState("")
  const filteredOptions = options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(query.trim().toLowerCase()))
  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label)
  return (
    <Field label={label}>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={loading} aria-label={`${label}：${selectedLabels.length ? selectedLabels.join("、") : "不限"}`} className="h-10 w-full justify-between rounded-xl px-3 font-normal">
            <span className="truncate">{loading ? "正在加载" : selectedLabels.length ? selectedLabels.join("、") : "不限"}</span>
            {loading ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2">
          {searchable ? <div className="relative mb-2"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`搜索${label}`} className="h-9 pl-8 text-xs" /></div> : null}
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {filteredOptions.length ? filteredOptions.map((option) => {
              const selected = value.includes(option.value)
              return (
                <button key={option.value} type="button" role="checkbox" aria-checked={selected} onClick={() => onChange(toggleValue(value, option.value))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-muted">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", selected ? "border-black bg-black text-white" : "border-border bg-card")}>{selected ? <Check className="h-3 w-3" /> : null}</span>
                  <span>{option.label}</span>
                  {label === "达人国家" ? <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">{option.value}</span> : null}
                </button>
              )
            }) : <p className="py-6 text-center text-xs text-muted-foreground">暂无选项</p>}
          </div>
          <div className="mt-2 flex items-center justify-between border-t px-2 pt-2 text-[10px] text-muted-foreground"><span>已选 {value.length} 个</span><button type="button" disabled={!value.length} className="font-medium text-foreground disabled:opacity-40" onClick={() => onChange([])}>清空</button></div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}

function RangeSelect({ label, value, presets, onChange }: { label: string; value: RangeValue; presets: { label: string; min?: number; max?: number }[]; onChange: (value: RangeValue) => void }) {
  const [open, setOpen] = useState(false)
  const [draftMin, setDraftMin] = useState("")
  const [draftMax, setDraftMax] = useState("")
  const activePreset = presets.find((preset) => preset.min === value.min && preset.max === value.max)
  const display = activePreset?.label ?? (value.min === undefined && value.max === undefined ? "不限" : `${value.min === undefined ? "0" : number.format(value.min)} – ${value.max === undefined ? "不限" : number.format(value.max)}`)

  function applyRange() {
    const min = draftMin === "" ? undefined : Math.max(0, Number(draftMin))
    const max = draftMax === "" ? undefined : Math.max(0, Number(draftMax))
    onChange(min !== undefined && max !== undefined && min > max ? { min: max, max: min } : { min, max })
    setOpen(false)
  }

  return (
    <Field label={label}>
      <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) { setDraftMin(value.min?.toString() ?? ""); setDraftMax(value.max?.toString() ?? "") } }}>
        <PopoverTrigger asChild><Button type="button" variant="outline" aria-label={`${label}：${display}`} className="h-10 w-full justify-between rounded-xl px-3 font-normal"><span className="truncate">{display}</span><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /></Button></PopoverTrigger>
        <PopoverContent className="w-72 p-3">
          <div className="space-y-1">
            {[{ label: "不限" }, ...presets].map((preset) => {
              const selected = preset.min === value.min && preset.max === value.max
              return <button type="button" key={preset.label} onClick={() => { onChange({ min: preset.min, max: preset.max }); setOpen(false) }} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-muted", selected && "bg-muted font-medium")}>{preset.label}{selected ? <Check className="h-3.5 w-3.5" /> : null}</button>
            })}
          </div>
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 text-[10px] font-medium text-muted-foreground">自定义范围</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><Input type="number" min={0} value={draftMin} onChange={(event) => setDraftMin(event.target.value)} placeholder="最小值" className="h-9 text-xs" /><span className="text-muted-foreground">—</span><Input type="number" min={0} value={draftMax} onChange={(event) => setDraftMax(event.target.value)} placeholder="最大值" className="h-9 text-xs" /></div>
            <div className="mt-3 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => { setDraftMin(""); setDraftMax("") }}>清空</Button><Button type="button" size="sm" onClick={applyRange}>应用</Button></div>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}

function toLocalDateTimeValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function createDefaultScheduledAt() {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  date.setSeconds(0, 0)
  return toLocalDateTimeValue(date)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--"
  return value.replace("T", " ").replace(/\.\d+(?=Z|[+-]\d\d:\d\d|$)/, "").replace(/Z$/, "")
}

function statusVariant(status: string | null) {
  if (!status) return "secondary" as const
  if (["SUCCESS", "COMPLETED", "SENT"].includes(status)) return "success" as const
  if (["FAILED", "ERROR"].includes(status)) return "danger" as const
  if (["RUNNING", "PARTIAL_SUCCESS", "RETRYING"].includes(status)) return "warning" as const
  return "secondary" as const
}

function taskCanBeCancelled(task: CreatorPushTask) {
  return task.sendType === "SCHEDULED" && !task.startTime && !terminalStatuses.has(task.status)
}

function DetailItem({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={cn("min-w-0", className)}><p className="text-[9px] text-muted-foreground">{label}</p><div className="mt-1 break-words text-xs font-medium">{children}</div></div>
}

function CreatorPushCurrentTask({ task, loading, onRefresh, onCancel, onDetail }: { task: CreatorPushTask | null; loading: boolean; onRefresh: () => void; onCancel: (task: CreatorPushTask) => void; onDetail: (taskId: string) => void }) {
  if (loading) return <div className="rounded-xl border border-border/70 p-4"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-56 max-w-full" /></div></div></div>
  if (!task) return null
  const taskId = String(task.taskId)
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/45 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold">当前推送任务 #{taskId}</p><Badge variant={statusVariant(task.status)}>{statusLabels[task.status] ?? task.status}</Badge><Badge variant="outline">{task.sendType === "SCHEDULED" ? "定时推送" : "立即推送"}</Badge></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-3.5 w-3.5" />刷新</Button><Button type="button" variant="outline" size="sm" onClick={() => onDetail(taskId)}><History className="h-3.5 w-3.5" />发送详情</Button>{taskCanBeCancelled(task) ? <Button type="button" variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => onCancel(task)}><XCircle className="h-3.5 w-3.5" />取消定时任务</Button> : null}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4 xl:grid-cols-7">
        <DetailItem label="匹配达人"><span className="font-mono text-base font-bold">{number.format(task.matchedCount)}</span> 位</DetailItem>
        <DetailItem label="推送渠道">{task.channels.map((channel) => channel === "STATION" ? "站内信" : "邮件").join("、") || "--"}</DetailItem>
        <DetailItem label="创建时间">{formatDateTime(task.createTime)}</DetailItem>
        <DetailItem label="成功"><span className="font-mono text-base font-bold">{number.format(task.successCount)}</span></DetailItem>
        <DetailItem label="失败"><span className="font-mono text-base font-bold">{number.format(task.failedCount)}</span></DetailItem>
        <DetailItem label="跳过"><span className="font-mono text-base font-bold">{number.format(task.skippedCount)}</span></DetailItem>
        <DetailItem label="计划时间">{formatDateTime(task.scheduledTime)}</DetailItem>
      </div>
      {task.errorMessage ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[10px] text-rose-700">{task.errorMessage}</p> : null}
    </div>
  )
}

export function CreatorPushNode({ onAction }: { onAction: (message: string) => void }) {
  const [targetMode, setTargetMode] = useState<TargetMode>("all")
  const [creatorIds, setCreatorIds] = useState("")
  const [memberTargets, setMemberTargets] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [followers, setFollowers] = useState<RangeValue>({})
  const [avgViews, setAvgViews] = useState<RangeValue>({})
  const [channels, setChannels] = useState<MessageChannel[]>(["inbox", "email"])
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("immediate")
  const [scheduledAt, setScheduledAt] = useState(createDefaultScheduledAt)
  const [minimumScheduledAt] = useState(() => toLocalDateTimeValue(new Date()))
  const [inboxDraft, setInboxDraft] = useState({ title: "", content: "" })
  const [emailDraft, setEmailDraft] = useState({ subject: "", content: "" })
  const [options, setOptions] = useState<CreatorPushOptions | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState("")
  const [matchResult, setMatchResult] = useState<CreatorPushMatchCount | null>(null)
  const [matchLoading, setMatchLoading] = useState(true)
  const [matchError, setMatchError] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [currentTask, setCurrentTask] = useState<CreatorPushTask | null>(null)
  const [currentTaskLoading, setCurrentTaskLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<CreatorPushTask | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyTaskId, setHistoryTaskId] = useState("")
  const [historyResultTaskId, setHistoryResultTaskId] = useState("")
  const [historyRecipients, setHistoryRecipients] = useState<CreatorPushRecipientsPage | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTaskId, setDetailTaskId] = useState("")
  const [detailTask, setDetailTask] = useState<CreatorPushTask | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")

  const parsedCreatorIds = useMemo(() => Array.from(new Set(creatorIds.split(creatorIdSeparatorPattern).map((item) => item.trim()).filter(Boolean))), [creatorIds])
  const target = useMemo<CreatorPushTarget>(() => {
    if (targetMode === "ids") return { targetType: "SPECIFIED_IDS", creatorIdText: creatorIds }
    if (targetMode === "membership") return { targetType: "MEMBERSHIP", membershipIds: memberTargets.map(Number) }
    if (targetMode === "custom") return {
      targetType: "CUSTOM",
      ...(selectedCategories.length ? { categoryCodes: selectedCategories } : {}),
      ...(selectedCountries.length ? { countries: selectedCountries } : {}),
      ...(selectedMemberships.length ? { membershipIds: selectedMemberships.map(Number) } : {}),
      ...(selectedPlatforms.length ? { platforms: selectedPlatforms } : {}),
      ...(followers.min !== undefined ? { minFollowers: followers.min } : {}),
      ...(followers.max !== undefined ? { maxFollowers: followers.max } : {}),
      ...(avgViews.min !== undefined ? { minAverageViews: avgViews.min } : {}),
      ...(avgViews.max !== undefined ? { maxAverageViews: avgViews.max } : {}),
    }
    return { targetType: "ALL" }
  }, [avgViews.max, avgViews.min, creatorIds, followers.max, followers.min, memberTargets, selectedCategories, selectedCountries, selectedMemberships, selectedPlatforms, targetMode])

  const activeCount = matchResult?.matchedCount ?? 0
  const hasValidSchedule = deliveryMode === "immediate" || scheduledAt > minimumScheduledAt
  const totalHistoryPages = Math.max(1, Math.ceil((historyRecipients?.total ?? 0) / (historyRecipients?.pageSize || 20)))

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true)
    setOptionsError("")
    try {
      setOptions(await getCreatorPushOptions())
    } catch (error) {
      const message = getErrorMessage(error)
      setOptionsError(message)
      toast.error("达人筛选项加载失败", { description: message })
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  const refreshCurrentTask = useCallback(async () => {
    setCurrentTaskLoading(true)
    try {
      setCurrentTask(await getCurrentCreatorPushTask())
    } catch (error) {
      toast.error("当前推送任务加载失败", { description: getErrorMessage(error) })
    } finally {
      setCurrentTaskLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([getCreatorPushOptions(), getCurrentCreatorPushTask()])
      .then(([nextOptions, nextTask]) => {
        if (!active) return
        setOptions(nextOptions)
        setCurrentTask(nextTask)
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = getErrorMessage(error)
        setOptionsError(message)
        toast.error("达人信息推送数据加载失败", { description: message })
      })
      .finally(() => {
        if (!active) return
        setOptionsLoading(false)
        setCurrentTaskLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      setMatchLoading(true)
      setMatchError("")
      void getCreatorPushMatchCount(target)
        .then((result) => { if (active) setMatchResult(result) })
        .catch((error: unknown) => {
          if (!active) return
          setMatchResult(null)
          setMatchError(getErrorMessage(error))
        })
        .finally(() => { if (active) setMatchLoading(false) })
    }, 350)
    return () => { active = false; window.clearTimeout(timeout) }
  }, [target])

  function toggleChannel(channel: MessageChannel) {
    setChannels((current) => toggleValue(current, channel) as MessageChannel[])
  }

  function validateTask() {
    if (targetMode === "ids" && !parsedCreatorIds.length) return "请输入至少一个达人 ID"
    if (targetMode === "membership" && !memberTargets.length) return "请至少选择一个达人会员版本"
    if (!channels.length) return "请至少选择一个推送渠道"
    if (channels.includes("inbox") && (!inboxDraft.title.trim() || !inboxDraft.content.trim())) return "请填写完整的站内信标题和正文"
    if (channels.includes("email") && (!emailDraft.subject.trim() || !emailDraft.content.trim())) return "请填写完整的邮件主题和正文"
    if (!hasValidSchedule) return "计划推送时间必须晚于当前时间"
    if (matchError) return "当前匹配人数计算失败，请稍后重试"
    if (!activeCount) return "当前条件没有匹配到达人"
    if (currentTask) return "当前已有未结束的推送任务，请等待任务结束后再创建"
    return ""
  }

  async function createPush() {
    const validationMessage = validateTask()
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }
    setCreateLoading(true)
    try {
      const result = await createCreatorPushTask({
        target,
        channels: channels.map((channel) => channel === "inbox" ? "STATION" : "EMAIL"),
        ...(channels.includes("inbox") ? { stationTitle: inboxDraft.title.trim(), stationContent: inboxDraft.content.trim() } : {}),
        ...(channels.includes("email") ? { emailSubject: emailDraft.subject.trim(), emailContent: emailDraft.content.trim() } : {}),
        sendType: deliveryMode === "immediate" ? "IMMEDIATE" : "SCHEDULED",
        ...(deliveryMode === "scheduled" ? { scheduledTime: new Date(scheduledAt).toISOString() } : {}),
      })
      onAction(`达人信息推送任务 #${result.taskId} 已创建，匹配 ${number.format(result.matchedCount)} 位达人`)
      await refreshCurrentTask()
    } catch (error) {
      toast.error("创建达人信息推送失败", { description: getErrorMessage(error) })
    } finally {
      setCreateLoading(false)
    }
  }

  async function confirmCancelTask() {
    if (!cancelTarget || !taskCanBeCancelled(cancelTarget)) return
    setCancelLoading(true)
    try {
      await cancelCreatorPushTask(String(cancelTarget.taskId))
      toast.success(`定时推送任务 #${cancelTarget.taskId} 已取消`)
      setCancelTarget(null)
      await refreshCurrentTask()
    } catch (error) {
      toast.error("取消定时推送任务失败", { description: getErrorMessage(error) })
    } finally {
      setCancelLoading(false)
    }
  }

  const loadHistory = useCallback(async (taskId: string, page = 1) => {
    const normalizedTaskId = taskId.trim()
    if (!normalizedTaskId) {
      setHistoryError("请输入任务 ID")
      return
    }
    setHistoryLoading(true)
    setHistoryError("")
    try {
      setHistoryRecipients(await getCreatorPushRecipients(normalizedTaskId, page, 20))
      setHistoryTaskId(normalizedTaskId)
      setHistoryResultTaskId(normalizedTaskId)
    } catch (error) {
      setHistoryRecipients(null)
      setHistoryResultTaskId("")
      setHistoryError(getErrorMessage(error))
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  function openHistory(taskId = "") {
    setHistoryOpen(true)
    setHistoryTaskId(taskId)
    setHistoryResultTaskId("")
    setHistoryRecipients(null)
    setHistoryError("")
    if (taskId) void loadHistory(taskId)
  }

  const openTaskDetail = useCallback(async (taskId: string) => {
    const normalizedTaskId = taskId.trim()
    if (!normalizedTaskId) return
    setDetailOpen(true)
    setDetailTaskId(normalizedTaskId)
    setDetailTask(null)
    setDetailError("")
    setDetailLoading(true)
    try {
      setDetailTask(await getCreatorPushTask(normalizedTaskId))
    } catch (error) {
      setDetailError(getErrorMessage(error))
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const modeOptions = [
    { value: "all" as const, title: "全域达人", description: "覆盖全部有效达人", icon: Globe2 },
    { value: "ids" as const, title: "指定达人 ID", description: "支持批量粘贴达人 ID", icon: Hash },
    { value: "membership" as const, title: "会员版本", description: "按会员等级批量推送", icon: Crown },
    { value: "custom" as const, title: "自定义筛选", description: "组合画像与数据条件", icon: SlidersHorizontal },
  ]

  return (
    <Card className="overflow-hidden border-0">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Send className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">达人信息推送</h3><Badge variant="secondary">手动执行</Badge></div><p className="mt-1 text-xs text-muted-foreground">选择目标达人和消息渠道，向匹配人群批量推送运营信息</p></div></div>
          <div className="flex flex-wrap items-center gap-3"><p className="whitespace-nowrap text-[10px] text-muted-foreground">当前匹配 {matchLoading ? <LoaderCircle className="mx-1 inline h-4 w-4 animate-spin" /> : <strong className="font-mono text-xl text-foreground">{number.format(activeCount)}</strong>} 位达人</p><Button type="button" variant="outline" size="sm" onClick={() => openHistory()}><History className="h-3.5 w-3.5" />推送记录</Button></div>
        </div>

        <div className="space-y-6 p-5">
          <CreatorPushCurrentTask task={currentTask} loading={currentTaskLoading} onRefresh={() => void refreshCurrentTask()} onCancel={setCancelTarget} onDetail={(taskId) => void openTaskDetail(taskId)} />

          {optionsError ? <div className="flex flex-col justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700 sm:flex-row sm:items-center"><span>筛选项加载失败：{optionsError}</span><Button type="button" variant="outline" size="sm" onClick={() => void loadOptions()}><RefreshCw className="h-3.5 w-3.5" />重新加载</Button></div> : null}

          <section>
            <div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-semibold">1. 选择目标达人</h4><p className="mt-1 text-[10px] text-muted-foreground">切换模式或筛选条件后实时查询匹配人数</p></div><Badge className="border-0 bg-[#e9f9ba] text-[#304600]">{matchLoading ? "匹配中" : matchError ? "匹配失败" : `匹配 ${number.format(activeCount)} 人`}</Badge></div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="目标达人模式">
              {modeOptions.map((option) => {
                const selected = targetMode === option.value
                const Icon = option.icon
                return <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => setTargetMode(option.value)} className={cn("rounded-xl border p-3 text-left transition-all hover:border-foreground/20", selected ? "border-black bg-black text-white shadow-sm" : "border-border/80 bg-card")}><Icon className={cn("h-4 w-4", selected ? "text-[#d4f76a]" : "text-muted-foreground")} /><p className="mt-3 text-xs font-semibold">{option.title}</p><p className={cn("mt-1 text-[9px]", selected ? "text-white/60" : "text-muted-foreground")}>{option.description}</p></button>
              })}
            </div>

            <div className="mt-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
              {targetMode === "all" ? <div className="flex items-center gap-3 py-2"><Globe2 className="h-5 w-5 text-violet-500" /><div><p className="text-xs font-semibold">将推送给全部有效达人</p><p className="mt-1 text-[10px] text-muted-foreground">具体覆盖人数以接口实时匹配结果为准</p></div></div> : null}
              {targetMode === "ids" ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]"><Field label="达人 ID（支持换行、逗号或空格分隔）"><Textarea aria-label="达人 ID" value={creatorIds} onChange={(event) => setCreatorIds(event.target.value)} className="min-h-28 bg-card font-mono text-xs leading-5" placeholder="输入达人 ID，每行一个" /></Field><div className="rounded-xl bg-card p-4"><p className="text-[10px] text-muted-foreground">接口识别结果</p><p className="mt-2 font-mono text-2xl font-bold">{matchLoading ? "--" : number.format(matchResult?.validCount ?? 0)}</p><p className="mt-1 text-[10px] text-muted-foreground">输入 {matchResult?.inputCount ?? parsedCreatorIds.length} 个 · 无效 {matchResult?.invalidIds.length ?? 0} 个</p>{matchResult?.invalidIds.length ? <p className="mt-2 break-all text-[9px] text-rose-600">未识别：{matchResult.invalidIds.join("、")}</p> : null}</div></div> : null}
              {targetMode === "membership" ? <div><MultiSelect label="达人会员版本（支持多选）" options={options?.memberships ?? []} value={memberTargets} onChange={setMemberTargets} loading={optionsLoading} /><p className="mt-3 text-[10px] text-muted-foreground">会员版本来自接口配置，多个版本的匹配结果会自动去重。</p></div> : null}
              {targetMode === "custom" ? <div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><MultiSelect label="达人分类" options={options?.categories ?? []} value={selectedCategories} onChange={setSelectedCategories} searchable loading={optionsLoading} /><MultiSelect label="达人国家" options={options?.countries ?? []} value={selectedCountries} onChange={setSelectedCountries} searchable loading={optionsLoading} /><RangeSelect label="达人粉丝数" value={followers} presets={followerPresets} onChange={setFollowers} /><MultiSelect label="达人会员版本" options={options?.memberships ?? []} value={selectedMemberships} onChange={setSelectedMemberships} loading={optionsLoading} /><MultiSelect label="达人社媒平台" options={options?.platforms ?? []} value={selectedPlatforms} onChange={setSelectedPlatforms} loading={optionsLoading} /><RangeSelect label="达人平均观看量" value={avgViews} presets={viewPresets} onChange={setAvgViews} /></div><div className="mt-4 flex items-center justify-between gap-3 px-1"><span className={cn("text-[10px]", matchError ? "text-rose-600" : "text-muted-foreground")}>{matchError || "匹配人数随筛选条件实时更新，未设置的条件默认为不限"}</span><strong className="shrink-0 whitespace-nowrap font-mono text-sm">{matchLoading ? "计算中" : `${number.format(activeCount)} 位达人`}</strong></div></div> : null}
            </div>
          </section>

          <section className="border-t border-border/70 pt-5">
            <div className="mb-3"><h4 className="text-xs font-semibold">2. 选择推送渠道</h4><p className="mt-1 text-[10px] text-muted-foreground">支持多选，选中渠道后填写对应消息内容</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[{ value: "inbox" as const, title: "站内信消息", description: "发送至达人 LGI 消息中心", icon: Bell }, { value: "email" as const, title: "邮件", description: "发送至达人注册邮箱", icon: Mail }].map((channel) => {
                const selected = channels.includes(channel.value)
                const Icon = channel.icon
                return <button key={channel.value} type="button" role="checkbox" aria-checked={selected} onClick={() => toggleChannel(channel.value)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", selected ? "border-emerald-200 bg-emerald-50/70" : "border-border/80 bg-card")}><span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", selected ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-xs">{channel.title}</strong><small className="mt-0.5 block text-[9px] text-muted-foreground">{channel.description}</small></span><span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-border")}>{selected ? <Check className="h-3 w-3" /> : null}</span></button>
              })}
            </div>
          </section>

          {channels.length ? <section className="grid gap-4 border-t border-border/70 pt-5 xl:grid-cols-2">
            {channels.includes("inbox") ? <div className="rounded-2xl border border-border/70 p-4"><div className="mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-emerald-600" /><h4 className="text-xs font-semibold">站内信内容</h4><Badge variant="secondary">已启用</Badge></div><div className="space-y-4"><Field label="消息标题"><Input aria-label="消息标题" value={inboxDraft.title} onChange={(event) => setInboxDraft((current) => ({ ...current, title: event.target.value }))} placeholder="请输入站内信标题" /></Field><Field label="消息正文"><Textarea aria-label="消息正文" value={inboxDraft.content} onChange={(event) => setInboxDraft((current) => ({ ...current, content: event.target.value }))} className="min-h-36 text-xs leading-5" placeholder="请输入站内信正文" /></Field></div></div> : null}
            {channels.includes("email") ? <div className="rounded-2xl border border-border/70 p-4"><div className="mb-4 flex items-center gap-2"><Mail className="h-4 w-4 text-sky-600" /><h4 className="text-xs font-semibold">邮件内容</h4><Badge variant="secondary">已启用</Badge></div><div className="space-y-4"><Field label="邮件主题"><Input aria-label="邮件主题" value={emailDraft.subject} onChange={(event) => setEmailDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="请输入邮件主题" /></Field><Field label="邮件正文"><Textarea aria-label="邮件正文" value={emailDraft.content} onChange={(event) => setEmailDraft((current) => ({ ...current, content: event.target.value }))} className="min-h-36 font-mono text-xs leading-5" placeholder="请输入邮件正文" /></Field></div></div> : null}
            <p className="text-[9px] text-muted-foreground xl:col-span-2">可用变量：<span className="font-mono text-foreground">{optionsLoading ? "正在读取" : options?.templateVariables.length ? options.templateVariables.join(" ") : "暂无可用变量"}</span></p>
          </section> : <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">请至少选择一个推送渠道。</div>}

          <section className="border-t border-border/70 pt-5">
            <div className="mb-3"><h4 className="text-xs font-semibold">3. 设置推送时间</h4><p className="mt-1 text-[10px] text-muted-foreground">选择立即发送，或指定未来时间自动执行推送</p></div>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="推送时间设置">
              {[{ value: "immediate" as const, title: "立即推送", description: "创建后立即进入发送队列", icon: Send }, { value: "scheduled" as const, title: "定时推送", description: "在指定日期和时间自动发送", icon: CalendarClock }].map((option) => {
                const selected = deliveryMode === option.value
                const Icon = option.icon
                return <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => setDeliveryMode(option.value)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", selected ? "border-violet-200 bg-violet-50/70" : "border-border/80 bg-card")}><span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", selected ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground")}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-xs">{option.title}</strong><small className="mt-0.5 block text-[9px] text-muted-foreground">{option.description}</small></span><span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", selected ? "border-violet-600 bg-violet-600 text-white" : "border-border")}>{selected ? <Check className="h-3 w-3" /> : null}</span></button>
              })}
            </div>
            {deliveryMode === "scheduled" ? <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4"><Field label="计划推送时间"><div className="relative max-w-sm"><Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="datetime-local" min={minimumScheduledAt} aria-label="计划推送时间" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="bg-card pl-9" /></div></Field><p className={cn("mt-2 text-[9px]", hasValidSchedule ? "text-muted-foreground" : "text-rose-600")}>{hasValidSchedule ? "系统将按当前浏览器所在时区执行，仅支持选择未来时间。任务开始后不可取消。" : "计划推送时间必须晚于当前时间。"}</p></div> : null}
            <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-semibold">{deliveryMode === "immediate" ? "确认后立即推送" : "确认后创建定时任务"}</p><p className="mt-1 text-[10px] text-muted-foreground">当前匹配 {number.format(activeCount)} 位达人 · {channels.length} 个推送渠道{deliveryMode === "scheduled" && scheduledAt ? ` · ${scheduledAt.replace("T", " ")}` : ""}{currentTask ? " · 当前已有未结束任务" : ""}</p></div>
              <Button type="button" className="sm:min-w-28" disabled={createLoading || matchLoading || !activeCount || !channels.length || !hasValidSchedule || Boolean(currentTask)} onClick={() => void createPush()}>{createLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{createLoading ? "创建中" : "创建推送"}</Button>
            </div>
          </section>
        </div>
      </CardContent>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => { if (!open && !cancelLoading) setCancelTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>取消定时推送任务</DialogTitle><DialogDescription>仅可取消尚未开始执行的定时任务。取消后该任务不会向达人发送任何消息。</DialogDescription></DialogHeader>
          <div className="mt-5 rounded-xl bg-muted p-4 text-xs"><p className="font-medium">任务 #{cancelTarget?.taskId}</p><p className="mt-1 text-muted-foreground">计划时间：{formatDateTime(cancelTarget?.scheduledTime)}</p></div>
          <DialogFooter><Button type="button" variant="outline" disabled={cancelLoading} onClick={() => setCancelTarget(null)}>返回</Button><Button type="button" disabled={cancelLoading} className="bg-rose-600 hover:bg-rose-700" onClick={() => void confirmCancelTask()}>{cancelLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{cancelLoading ? "取消中" : "确认取消任务"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader><DialogTitle>推送记录</DialogTitle><DialogDescription>输入任务 ID，分页查询本次推送的收件人与站内信、邮件发送结果。</DialogDescription></DialogHeader>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row"><Input value={historyTaskId} onChange={(event) => setHistoryTaskId(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadHistory(historyTaskId) }} placeholder="请输入推送任务 ID" className="font-mono" /><Button type="button" disabled={historyLoading} onClick={() => void loadHistory(historyTaskId)}>{historyLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}查询</Button></div>
          {historyError ? <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">{historyError}</div> : null}
          {historyLoading ? <div className="mt-4 space-y-2">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : <div className="mt-4 overflow-hidden rounded-xl border border-border/70"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>达人</TableHead><TableHead>会员版本</TableHead><TableHead>通知邮箱</TableHead><TableHead>站内信状态</TableHead><TableHead>邮件状态</TableHead><TableHead>重试次数</TableHead><TableHead>发送时间 / 错误</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{historyRecipients?.rows.length ? historyRecipients.rows.map((recipient) => <TableRow key={recipient.id}><TableCell><p className="whitespace-nowrap text-xs font-medium">{recipient.nickname || "--"}</p><p className="mt-0.5 whitespace-nowrap font-mono text-[9px] text-muted-foreground">{recipient.lgiId}</p></TableCell><TableCell className="whitespace-nowrap text-xs">{recipient.membershipName || "--"}</TableCell><TableCell className="whitespace-nowrap text-xs">{recipient.toEmail || "--"}</TableCell><TableCell><Badge variant={statusVariant(recipient.stationStatus)}>{recipient.stationStatus ? statusLabels[recipient.stationStatus] ?? recipient.stationStatus : "未选择"}</Badge></TableCell><TableCell><Badge variant={statusVariant(recipient.emailStatus)}>{recipient.emailStatus ? statusLabels[recipient.emailStatus] ?? recipient.emailStatus : "未选择"}</Badge></TableCell><TableCell className="whitespace-nowrap text-xs">站内信 {recipient.stationRetryCount} · 邮件 {recipient.emailRetryCount}</TableCell><TableCell className="min-w-52 text-[10px]"><p>{formatDateTime(recipient.stationSentTime || recipient.emailSentTime)}</p>{recipient.stationErrorMessage || recipient.emailErrorMessage ? <p className="mt-1 text-rose-600">{recipient.stationErrorMessage || recipient.emailErrorMessage}</p> : null}</TableCell><TableCell className="text-right"><Button type="button" variant="outline" size="sm" className="whitespace-nowrap" onClick={() => void openTaskDetail(historyResultTaskId)}>查看推送详情</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={8} className="h-36 text-center"><div className="mx-auto flex max-w-xs flex-col items-center text-muted-foreground"><History className="mb-3 h-8 w-8 opacity-35" /><p className="text-xs font-medium text-foreground">{historyRecipients ? "暂无推送记录" : "请输入任务 ID 查询"}</p><p className="mt-1 text-[10px]">{historyRecipients ? "该任务尚未产生收件人发送记录" : "查询后将在这里显示收件人和发送状态"}</p></div></TableCell></TableRow>}</TableBody></Table></div>{historyRecipients ? <div className="flex flex-col justify-between gap-3 border-t border-border/70 px-4 py-3 text-[10px] text-muted-foreground sm:flex-row sm:items-center"><span>共 {number.format(historyRecipients.total)} 条 · 第 {historyRecipients.currentPage} / {totalHistoryPages} 页</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={historyLoading || historyRecipients.currentPage <= 1} onClick={() => void loadHistory(historyResultTaskId, historyRecipients.currentPage - 1)}>上一页</Button><Button type="button" variant="outline" size="sm" disabled={historyLoading || historyRecipients.currentPage >= totalHistoryPages} onClick={() => void loadHistory(historyResultTaskId, historyRecipients.currentPage + 1)}>下一页</Button></div></div> : null}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>发送任务详情{detailTaskId ? ` #${detailTaskId}` : ""}</DialogTitle><DialogDescription>展示该任务的目标条件、推送内容、执行状态与时间信息。</DialogDescription></DialogHeader>
          {detailLoading ? <div className="mt-5 space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-36 w-full" /><Skeleton className="h-28 w-full" /></div> : detailError ? <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700"><p>{detailError}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void openTaskDetail(detailTaskId)}><RefreshCw className="h-3.5 w-3.5" />重新加载</Button></div> : detailTask ? <div className="mt-5 space-y-4">
            <section className="grid gap-4 rounded-xl border border-border/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="任务 ID"><span className="font-mono">{detailTask.taskId}</span></DetailItem>
              <DetailItem label="任务状态"><Badge variant={statusVariant(detailTask.status)}>{statusLabels[detailTask.status] ?? detailTask.status}</Badge></DetailItem>
              <DetailItem label="目标类型">{detailTask.targetType}</DetailItem>
              <DetailItem label="匹配达人">{number.format(detailTask.matchedCount)} 位</DetailItem>
              <DetailItem label="推送渠道">{detailTask.channels.map((channel) => channel === "STATION" ? "站内信" : "邮件").join("、") || "--"}</DetailItem>
              <DetailItem label="推送方式">{detailTask.sendType === "SCHEDULED" ? "定时推送" : "立即推送"}</DetailItem>
              <DetailItem label="成功 / 失败 / 跳过">{number.format(detailTask.successCount)} / {number.format(detailTask.failedCount)} / {number.format(detailTask.skippedCount)}</DetailItem>
              <DetailItem label="计划时间">{formatDateTime(detailTask.scheduledTime)}</DetailItem>
              <DetailItem label="创建时间">{formatDateTime(detailTask.createTime)}</DetailItem>
              <DetailItem label="开始时间">{formatDateTime(detailTask.startTime)}</DetailItem>
              <DetailItem label="结束时间">{formatDateTime(detailTask.endTime)}</DetailItem>
              <DetailItem label="执行错误" className="sm:col-span-2 lg:col-span-1"><span className={detailTask.errorMessage ? "text-rose-600" : "text-muted-foreground"}>{detailTask.errorMessage || "--"}</span></DetailItem>
            </section>
            <section className="rounded-xl border border-border/70 p-4"><p className="mb-3 text-xs font-semibold">目标配置</p><pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted/60 p-3 font-mono text-[10px] leading-5">{JSON.stringify(detailTask.target, null, 2)}</pre></section>
            {detailTask.channels.includes("STATION") ? <section className="rounded-xl border border-border/70 p-4"><div className="mb-3 flex items-center gap-2"><Bell className="h-4 w-4 text-emerald-600" /><p className="text-xs font-semibold">站内信内容</p></div><DetailItem label="消息标题">{detailTask.stationTitle || "--"}</DetailItem><div className="mt-4"><DetailItem label="消息正文"><p className="whitespace-pre-wrap font-normal leading-5">{detailTask.stationContent || "--"}</p></DetailItem></div></section> : null}
            {detailTask.channels.includes("EMAIL") ? <section className="rounded-xl border border-border/70 p-4"><div className="mb-3 flex items-center gap-2"><Mail className="h-4 w-4 text-sky-600" /><p className="text-xs font-semibold">邮件内容</p></div><DetailItem label="邮件主题">{detailTask.emailSubject || "--"}</DetailItem><div className="mt-4"><DetailItem label="邮件正文"><p className="whitespace-pre-wrap font-normal leading-5">{detailTask.emailContent || "--"}</p></DetailItem></div></section> : null}
          </div> : null}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
