import { useCallback, useEffect, useRef, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  Handshake,
  Megaphone,
  Package,
  RefreshCw,
  Send,
  UserPlus,
  XCircle,
} from "lucide-react"
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartCard, DotLegend, MetricCard, SectionHeading } from "@/components/dashboard-primitives"
import {
  dailyEndpoint,
  dailyFetcher,
  type DailyCampaign,
  type DailyCampaignsData,
  type DailyCreator,
  type DailyCreatorsData,
  type DailyDistributionsData,
  type DailyDistributionItem,
  type DailyEvent,
  type DailyEventsData,
  type DailyHourlyTrendData,
  type DailySummaryData,
} from "@/lib/daily-api"
import { cn, number } from "@/lib/utils"

const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date())
const tooltipStyle = { borderRadius: 6, border: "1px solid #dfe3e8", boxShadow: "0 4px 12px rgba(15,23,42,.06)", fontSize: 12 }
const platformLogos: Record<string, string> = { tiktok: "/platform/tiktok.png", instagram: "/platform/instagram.webp", youtube: "/platform/youtube.png" }
const distributionColors: Record<string, string> = { tiktok: "#7c5ce5", google: "#ffca28", email: "#ff5335", instagram: "#ffca28", youtube: "#ff5335" }
const avatarTones = ["bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700"]
const swrOptions = { revalidateOnFocus: false, shouldRetryOnError: false }
const AUTO_REFRESH_SECONDS = 30

function offsetDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + amount)
  return value.toLocaleDateString("en-CA")
}

function dateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(parsed)
}

function apiTime(value?: string, includeSeconds = true) {
  if (!value) return "—"
  if (/^\d{2}:\d{2}/.test(value)) return includeSeconds ? value.slice(0, 8) : value.slice(0, 5)
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
    hourCycle: "h23",
  }).format(parsed)
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function platformName(platform: string) {
  const key = platform.toLowerCase()
  if (key === "tiktok") return "TikTok"
  if (key === "instagram") return "Instagram"
  if (key === "youtube") return "YouTube"
  return platform
}

function SocialIcons({ platforms }: { platforms: string[] }) {
  if (!platforms.length) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1.5">
      {platforms.map((platform) => {
        const key = platform.toLowerCase()
        return <span key={platform} className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-white" title={platformName(platform)}>{platformLogos[key] ? <img src={platformLogos[key]} alt={platformName(platform)} className="h-4 w-4 object-contain" /> : <span className="text-[8px] font-semibold">{platform.slice(0, 2).toUpperCase()}</span>}</span>
      })}
    </div>
  )
}

function DailyHeader({ date, setDate, autoRefreshSeconds }: { date: string; setDate: (date: string) => void; autoRefreshSeconds: number }) {
  const today = date === TODAY
  return (
    <div className="daily-header">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">每日数据</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"><span>{dateLabel(date)}</span><span className="text-border">·</span><span>统计周期 00:00–23:59（UTC+8）</span><span className="text-border">·</span><span className="whitespace-nowrap"><span className="font-mono font-semibold text-foreground/70">{autoRefreshSeconds}s</span> 后自动刷新</span></p>
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto sm:justify-end">
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border/80 bg-card p-1 shadow-sm" style={{ width: "max-content" }}>
          <Button variant="ghost" size="icon" onClick={() => setDate(offsetDate(date, -1))} aria-label="前一天"><ChevronLeft className="h-4 w-4" /></Button>
          <Input className="h-8 w-[142px] border-0 bg-muted/70 px-2 text-xs shadow-none focus:ring-0" type="date" max={TODAY} value={date} onChange={(event) => event.target.value && setDate(event.target.value)} aria-label="选择统计日期" />
          <Button variant="ghost" size="icon" disabled={today} onClick={() => setDate(offsetDate(date, 1))} aria-label="后一天"><ChevronRight className="h-4 w-4" /></Button>
          {!today ? <Button size="sm" onClick={() => setDate(TODAY)}>今日</Button> : null}
        </div>
      </div>
    </div>
  )
}

function ErrorPanel({ error, retry, compact = false }: { error: Error; retry: () => void; compact?: boolean }) {
  return (
    <Card className="border-0">
      <CardContent className={cn("flex flex-col items-center justify-center gap-3 p-6 text-center", compact ? "min-h-48" : "min-h-64")}>
        <CircleX className="h-5 w-5 text-rose-500" />
        <div><p className="text-sm font-medium">数据加载失败</p><p className="mt-1 text-xs text-muted-foreground">{error.message}</p></div>
        <Button variant="outline" size="sm" onClick={retry}><RefreshCw className="h-3.5 w-3.5" />重新加载</Button>
      </CardContent>
    </Card>
  )
}

function LoadingPanel({ className = "h-64" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} aria-label="数据加载中" />
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="flex min-h-40 items-center justify-center text-xs text-muted-foreground">{text}</div>
}

function distributionItems(items: DailyDistributionItem[]) {
  return items.map((item) => ({ ...item, value: item.count, color: distributionColors[item.code.toLowerCase()] ?? "#3b82f6" }))
}

function eventMeta(event: DailyEvent) {
  const rawType = event.eventType.toLowerCase()
  if (rawType.includes("register")) return { label: event.eventName, icon: UserPlus, iconClass: "bg-violet-50 text-violet-600", badgeClass: "bg-violet-50 text-violet-700" }
  if (rawType.includes("verif")) return { label: event.eventName, icon: BadgeCheck, iconClass: "bg-emerald-50 text-emerald-600", badgeClass: "bg-emerald-50 text-emerald-700" }
  if (rawType.includes("approv")) return { label: event.eventName, icon: CheckCircle2, iconClass: "bg-teal-50 text-teal-600", badgeClass: "bg-teal-50 text-teal-700" }
  if (rawType.includes("reject")) return { label: event.eventName, icon: XCircle, iconClass: "bg-rose-50 text-rose-600", badgeClass: "bg-rose-50 text-rose-700" }
  return { label: event.eventName, icon: Send, iconClass: "bg-sky-50 text-sky-600", badgeClass: "bg-sky-50 text-sky-700" }
}

function eventRows(data: DailyEventsData) {
  return data.events.slice(0, 20)
}

function creatorAvatar(creator: DailyCreator, index: number) {
  if (creator.avatar) return <img src={creator.avatar} alt={`${creator.nickname}头像`} className="h-9 w-9 rounded-full object-cover" />
  return <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold", avatarTones[index % avatarTones.length])}>{initials(creator.nickname)}</span>
}

function moneyRange(min: number | null, max: number | null, currencyCode: string) {
  if (min == null && max == null) return "—"
  const format = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode || "USD", maximumFractionDigits: 0 }).format(value)
    } catch {
      return `${number.format(value)} ${currencyCode}`.trim()
    }
  }
  if (min != null && max != null && min !== max) return `${format(min)}–${format(max)}`
  return format(min ?? max ?? 0)
}

function rateRange(min: number | null, max: number | null) {
  if (min == null && max == null) return "—"
  if (min != null && max != null && min !== max) return `${min}%–${max}%`
  return `${min ?? max}%`
}

function CampaignCard({ campaign }: { campaign: DailyCampaign }) {
  return (
    <a
      href={`https://lgi365.com/deals/${encodeURIComponent(campaign.campaignId)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block min-w-0 rounded-xl border border-border/70 p-3.5 transition-colors hover:border-foreground/25 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`打开商单：${campaign.campaignTitle}`}
    >
      <div className="flex min-w-0 gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">{campaign.campaignMainImg ? <img src={campaign.campaignMainImg} alt={campaign.campaignTitle} className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-foreground/55" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2"><p className="truncate text-xs font-semibold">{campaign.campaignTitle}</p><span className="shrink-0 font-mono text-[9px] text-muted-foreground">{apiTime(campaign.publishedTime, false)}</span></div>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">品牌: {campaign.brandName || "—"} · 核心产品: {campaign.productName || "—"}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="secondary">预算 {moneyRange(campaign.budgetMin, campaign.budgetMax, campaign.budgetCurrency)}</Badge>
            {(campaign.fixedCompensationMin != null || campaign.fixedCompensationMax != null) ? <Badge variant="secondary">固定报酬 {moneyRange(campaign.fixedCompensationMin, campaign.fixedCompensationMax, campaign.budgetCurrency)}</Badge> : null}
            <Badge variant="secondary">佣金 {rateRange(campaign.commissionRateMin, campaign.commissionRateMax)}</Badge>
            {campaign.platforms.map((platform) => <Badge key={platform} variant="outline" className="gap-1">{platformLogos[platform.toLowerCase()] ? <img src={platformLogos[platform.toLowerCase()]} alt="" className="h-3 w-3 object-contain" /> : null}{platformName(platform)}</Badge>)}
          </div>
        </div>
      </div>
    </a>
  )
}

export function DailyPage() {
  const { mutate: mutateCache } = useSWRConfig()
  const [date, setDate] = useState(TODAY)
  const [creatorPage, setCreatorPage] = useState(1)
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(AUTO_REFRESH_SECONDS)
  const autoRefreshSecondsRef = useRef(AUTO_REFRESH_SECONDS)
  const today = date === TODAY
  const summaryKey = dailyEndpoint("summary", { date })
  const trendKey = dailyEndpoint("hourly-trend", { date })
  const distributionsKey = dailyEndpoint("distributions", { date })
  const campaignsKey = dailyEndpoint("campaigns", { date, limit: 6 })
  const creatorsKey = dailyEndpoint("creators", { date, currentPage: creatorPage, pageSize: 20 })
  const summary = useSWR<DailySummaryData>(summaryKey, dailyFetcher, swrOptions)
  const trend = useSWR<DailyHourlyTrendData>(trendKey, dailyFetcher, swrOptions)
  const distributions = useSWR<DailyDistributionsData>(distributionsKey, dailyFetcher, swrOptions)
  const events = useSWR<DailyEventsData>(dailyEndpoint("events", { date, limit: 20 }), dailyFetcher, {
    ...swrOptions,
    refreshInterval: 3_000,
    refreshWhenHidden: false,
  })
  const campaigns = useSWR<DailyCampaignsData>(campaignsKey, dailyFetcher, swrOptions)
  const creators = useSWR<DailyCreatorsData>(creatorsKey, dailyFetcher, swrOptions)

  const refreshAll = useCallback(async () => {
    autoRefreshSecondsRef.current = AUTO_REFRESH_SECONDS
    setAutoRefreshSeconds(AUTO_REFRESH_SECONDS)
    await Promise.all([summaryKey, trendKey, distributionsKey, campaignsKey, creatorsKey].map((key) => mutateCache(key)))
  }, [campaignsKey, creatorsKey, distributionsKey, mutateCache, summaryKey, trendKey])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextSeconds = autoRefreshSecondsRef.current - 1
      if (nextSeconds <= 0) {
        void refreshAll()
        return
      }
      autoRefreshSecondsRef.current = nextSeconds
      setAutoRefreshSeconds(nextSeconds)
    }, 1_000)

    return () => window.clearInterval(intervalId)
  }, [refreshAll])

  const changeDate = (nextDate: string) => {
    setCreatorPage(1)
    setDate(nextDate)
  }
  const typeData = distributionItems(distributions.data?.registrationMethods ?? [])
  const platformData = distributionItems(distributions.data?.verifiedPlatforms ?? [])
  const currentDateTime = new Date()
  const currentHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", hour: "2-digit", hourCycle: "h23" }).format(currentDateTime))
  const currentTime = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(currentDateTime)
  const trendData = trend.data?.points.map((point) => {
    const isFutureHour = today && point.hour > currentHour
    return {
      hour: point.time,
      registered: isFutureHour ? null : point.registeredCreatorCount,
      verified: isFutureHour ? null : point.verifiedSocialCount,
      active: isFutureHour ? null : point.activeCreatorCount,
    }
  }) ?? []
  const trendPeriod = today ? `当前统计时段 00:00–${currentTime}（UTC+8）` : "完整统计时段 00:00–23:59（UTC+8）"
  const creatorData = creators.data
  const creatorPages = creatorData ? Array.from({ length: Math.min(5, creatorData.totalPages) }, (_, index) => {
    const start = Math.min(Math.max(1, creatorData.currentPage - 2), Math.max(1, creatorData.totalPages - 4))
    return start + index
  }) : []

  return (
    <div className="space-y-8 pb-10">
      <DailyHeader date={date} setDate={changeDate} autoRefreshSeconds={autoRefreshSeconds} />

      <section className="space-y-4">
        <SectionHeading eyebrow="Daily pulse" title="核心指标速览" description="当日关键运营数据" />
        {summary.isLoading ? <LoadingPanel className="h-40" /> : summary.error ? <ErrorPanel error={summary.error} retry={() => void summary.mutate()} compact /> : summary.data ? (
          <div className="daily-metric-grid">
            <MetricCard label="注册达人数" value={summary.data.registeredCreatorCount} icon={UserPlus} />
            <MetricCard label="认证社媒数" value={summary.data.verifiedSocialCount} icon={BadgeCheck} tone="green" />
            <MetricCard label="活跃达人数" value={summary.data.activeCreatorCount} icon={Activity} tone="amber" />
            <MetricCard label="申请商单数" value={summary.data.campaignApplyCount} icon={Send} />
            <MetricCard label="待审核申请数" value={summary.data.pendingReviewApplyCount} icon={Clock3} tone="amber" />
            <MetricCard label="审核通过数" value={summary.data.approvedApplyCount} icon={CheckCircle2} tone="green" />
            <MetricCard label="审核拒绝数" value={summary.data.rejectedApplyCount} icon={XCircle} tone="rose" />
            <MetricCard label="合作完成数" value={summary.data.completedCooperationCount} icon={Handshake} tone="green" />
            <MetricCard label="新发商单数" value={summary.data.publishedCampaignCount} icon={Megaphone} />
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Registration" title="注册与社媒认证" description="当日注册类型、认证平台与分时变化" />
        <div className="space-y-3">
          <div className="daily-trend-log-grid">
            {trend.isLoading ? <LoadingPanel className="h-[430px]" /> : trend.error ? <ErrorPanel error={trend.error} retry={() => void trend.mutate()} /> : trend.data ? (
              <ChartCard className="h-full min-w-0 overflow-hidden" title="24 小时注册、认证与活跃趋势" description={trendPeriod}>
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-2xl font-semibold">{number.format(trend.data.registeredCreatorCount)}</p><p className="text-[10px] text-muted-foreground">当日累计注册</p></div><DotLegend items={[{ name: "注册达人", color: "#7c5ce5" }, { name: "社媒认证", color: "#18a77b" }, { name: "活跃达人", color: "#ff5335" }]} /></div>
                <div className="w-full" style={{ height: 300, minHeight: 300 }}><ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={trendData} margin={{ top: 8, left: -12, right: -6, bottom: 0 }}><CartesianGrid vertical={false} stroke="#ececea" strokeDasharray="3 3"/><XAxis dataKey="hour" interval={2} tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "#777" }}/><YAxis yAxisId="creator" tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "#777" }}/><YAxis yAxisId="active" orientation="right" tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "#999" }}/><Tooltip contentStyle={tooltipStyle}/><Line yAxisId="active" type="monotone" dataKey="active" name="活跃达人" stroke="#ff5335" strokeWidth={2.25} dot={false} activeDot={{ r: 3 }} isAnimationActive={false}/><Line yAxisId="creator" type="monotone" dataKey="registered" name="注册达人" stroke="#7c5ce5" strokeWidth={2.25} dot={false} activeDot={{ r: 3 }} isAnimationActive={false}/><Line yAxisId="creator" type="monotone" dataKey="verified" name="社媒认证" stroke="#18a77b" strokeWidth={2.25} dot={false} activeDot={{ r: 3 }} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>
              </ChartCard>
            ) : null}

            {events.isLoading ? <LoadingPanel className="h-[430px]" /> : events.error ? <ErrorPanel error={events.error} retry={() => void events.mutate()} /> : events.data ? (
              <Card className="daily-activity-card min-w-0 border-0">
                <CardHeader><div><CardTitle>系统最新动向</CardTitle><CardDescription className="mt-1">实时记录达人与商单关键事件</CardDescription></div><div className="flex items-center gap-1.5 text-[10px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />实时</div></CardHeader>
                <CardContent className="pt-2">
                  {eventRows(events.data).length ? <div className="daily-activity-list">{eventRows(events.data).map((item, index) => {
                    const meta = eventMeta(item)
                    const Icon = meta.icon
                    return <div key={`${item.eventType}-${item.subjectId}-${item.occurredAt}-${item.campaignId ?? index}`} className="flex min-w-0 gap-3 border-b border-border/70 py-3 first:pt-1 last:border-0">{item.subjectAvatar ? <img src={item.subjectAvatar} alt={`${item.subjectName}头像`} className="h-8 w-8 shrink-0 rounded-lg object-cover" /> : <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.iconClass)}><Icon className="h-4 w-4" /></span>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="break-words text-xs font-semibold">{item.subjectName || "未知达人"}</p><p className="mt-1 whitespace-normal break-words text-[10px] leading-4 text-muted-foreground">{item.description || meta.label}</p></div><div className="shrink-0 text-right"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium", meta.badgeClass)}>{meta.label}</span><p className="mt-1 font-mono text-[9px] text-muted-foreground">{apiTime(item.occurredAt)}</p></div></div></div></div>
                  })}</div> : <EmptyPanel text="当日暂无系统动态" />}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {distributions.isLoading ? <LoadingPanel className="h-72" /> : distributions.error ? <ErrorPanel error={distributions.error} retry={() => void distributions.mutate()} /> : distributions.data ? (
            <div className="daily-distribution-grid">
              <ChartCard className="min-w-0" title="注册类型分布" description="当日新注册方式">
                {typeData.length ? <div className="daily-distribution-content"><div className="relative h-[190px]"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={typeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} stroke="none">{typeData.map((item) => <Cell key={item.code} fill={item.color}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-xl font-bold">{distributions.data.registeredCreatorCount}</span><span className="text-[10px] text-muted-foreground">注册达人</span></div></div><div className="space-y-3">{typeData.map((item) => <div key={item.code} className="flex items-center text-xs"><span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}/><span className="flex-1 text-muted-foreground">{item.name}</span><span className="mr-3 font-mono font-semibold">{item.count}</span><span className="w-12 text-right font-mono text-[10px] text-muted-foreground">{item.percentage.toFixed(1)}%</span></div>)}</div></div> : <EmptyPanel text="当日暂无注册数据" />}
              </ChartCard>
              <ChartCard className="min-w-0" title="认证社媒平台" description={`${distributions.data.verifiedSocialCount} 个社媒账号完成认证`}>
                {platformData.length ? <div className="daily-distribution-content"><div className="relative h-[190px]"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={platformData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} stroke="none">{platformData.map((item) => <Cell key={item.code} fill={item.color}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-xl font-bold">{distributions.data.verificationRate.toFixed(1)}%</span><span className="text-[10px] text-muted-foreground">认证率</span></div></div><div className="space-y-3">{platformData.map((item) => <div key={item.code} className="flex items-center text-xs"><span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}/><span className="flex-1 text-muted-foreground">{item.name}</span><span className="mr-3 font-mono font-semibold">{item.count}</span><span className="w-12 text-right font-mono text-[10px] text-muted-foreground">{item.percentage.toFixed(1)}%</span></div>)}</div></div> : <EmptyPanel text="当日暂无认证数据" />}
              </ChartCard>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Creator details" title="当日注册达人" description="当日完成注册的达人列表" />
        {creators.isLoading ? <LoadingPanel className="h-96" /> : creators.error ? <ErrorPanel error={creators.error} retry={() => void creators.mutate()} /> : creatorData ? (
          <Card>
            <CardContent className="p-0">
              <Table className="min-w-[900px] table-fixed">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[8%]" />
                  <col className="w-[28%]" />
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <TableHeader><TableRow><TableHead>达人 ID</TableHead><TableHead>达人头像</TableHead><TableHead>达人昵称</TableHead><TableHead>注册方式</TableHead><TableHead>已认证社媒</TableHead><TableHead className="text-right">注册时间</TableHead></TableRow></TableHeader>
                <TableBody>{creatorData.rows.map((creator, index) => <TableRow key={creator.lgiUserId}><TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{creator.lgiUserId}</TableCell><TableCell>{creatorAvatar(creator, index)}</TableCell><TableCell className="max-w-0 truncate whitespace-nowrap text-xs font-semibold" title={creator.nickname}>{creator.nickname || "—"}</TableCell><TableCell><Badge variant="secondary">{creator.registrationMethodName || platformName(creator.registrationMethod)}</Badge></TableCell><TableCell><SocialIcons platforms={creator.verifiedSocialPlatforms} /></TableCell><TableCell className="whitespace-nowrap text-right font-mono text-xs">{apiTime(creator.registeredTime)}</TableCell></TableRow>)}</TableBody>
              </Table>
              {!creatorData.rows.length ? <EmptyPanel text="当日暂无注册达人" /> : null}
              <div className="flex items-center justify-between border-t border-border px-4 py-3"><span className="text-[10px] text-muted-foreground">第 {creatorData.currentPage} / {Math.max(creatorData.totalPages, 1)} 页，共 {creatorData.total} 条</span><div className="flex gap-1"><Button size="icon" variant="outline" className="h-7 w-7" disabled={creatorData.currentPage <= 1} onClick={() => setCreatorPage((page) => Math.max(1, page - 1))} aria-label="上一页"><ArrowLeft className="h-3 w-3"/></Button>{creatorPages.map((page) => <Button key={page} size="sm" variant={page === creatorData.currentPage ? "default" : "ghost"} className="h-7 px-2.5" onClick={() => setCreatorPage(page)}>{page}</Button>)}<Button size="icon" variant="outline" className="h-7 w-7" disabled={creatorData.currentPage >= creatorData.totalPages} onClick={() => setCreatorPage((page) => Math.min(creatorData.totalPages, page + 1))} aria-label="下一页"><ArrowRight className="h-3 w-3"/></Button></div></div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="min-w-0 space-y-4">
        <SectionHeading eyebrow="Campaigns" title={today ? "今日发布商单" : "当日发布商单"} description={`共 ${campaigns.data?.total ?? 0} 个新商单，展示最新发布内容`} />
        {campaigns.isLoading ? <LoadingPanel className="h-64" /> : campaigns.error ? <ErrorPanel error={campaigns.error} retry={() => void campaigns.mutate()} /> : campaigns.data ? <Card className="min-w-0 overflow-hidden border border-border/60"><CardContent className="p-4">{campaigns.data.campaigns.length ? <div className="daily-card-list-grid">{campaigns.data.campaigns.map((campaign) => <CampaignCard key={campaign.campaignId} campaign={campaign} />)}</div> : <EmptyPanel text="当日暂无新发布商单" />}</CardContent></Card> : null}
      </section>
    </div>
  )
}
