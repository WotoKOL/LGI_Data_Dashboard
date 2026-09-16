import { useMemo, useState } from "react"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Handshake,
  Megaphone,
  Package,
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
  dailyCreatorRows,
  dailyHourlyTrend,
  dailyPublishedCampaigns,
  dailySystemActivityFeed,
} from "@/data/daily-data"
import { cn, number } from "@/lib/utils"

const TODAY = "2026-09-16"
const tooltipStyle = { borderRadius: 6, border: "1px solid #dfe3e8", boxShadow: "0 4px 12px rgba(15,23,42,.06)", fontSize: 12 }
const platformLogos: Record<string, string> = { TikTok: "/platform/tiktok.png", Instagram: "/platform/instagram.webp", YouTube: "/platform/youtube.png" }
const activityMeta = {
  registered: { label: "达人注册", icon: UserPlus, iconClass: "bg-violet-50 text-violet-600", badgeClass: "bg-violet-50 text-violet-700" },
  verified: { label: "社媒认证", icon: BadgeCheck, iconClass: "bg-emerald-50 text-emerald-600", badgeClass: "bg-emerald-50 text-emerald-700" },
  applied: { label: "申请商单", icon: Send, iconClass: "bg-sky-50 text-sky-600", badgeClass: "bg-sky-50 text-sky-700" },
  approved: { label: "审核通过", icon: CheckCircle2, iconClass: "bg-teal-50 text-teal-600", badgeClass: "bg-teal-50 text-teal-700" },
  rejected: { label: "审核拒绝", icon: XCircle, iconClass: "bg-rose-50 text-rose-600", badgeClass: "bg-rose-50 text-rose-700" },
} as const

function offsetDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + amount)
  return value.toLocaleDateString("en-CA")
}

function dateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(parsed)
}

function seedForDate(date: string) {
  if (date === TODAY) return 0
  return Number(date.replaceAll("-", "").slice(-4)) % 37
}

function SocialIcons({ platforms }: { platforms: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {platforms.map((platform) => <span key={platform} className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-white" title={platform}><img src={platformLogos[platform]} alt={platform} className="h-4 w-4 object-contain" /></span>)}
    </div>
  )
}

function DailyHeader({ date, setDate }: { date: string; setDate: (date: string) => void }) {
  const today = date === TODAY
  return (
    <div className="daily-header">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">每日运营数据</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"><span>{dateLabel(date)}</span><span className="text-border">·</span><span>统计周期 00:00–23:59（UTC+8）</span></p>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-border/80 bg-card p-1 shadow-sm sm:self-auto" style={{ width: "max-content" }}>
        <Button variant="ghost" size="icon" onClick={() => setDate(offsetDate(date, -1))} aria-label="前一天"><ChevronLeft className="h-4 w-4" /></Button>
        <Input className="h-8 w-[142px] border-0 bg-muted/70 px-2 text-xs shadow-none focus:ring-0" type="date" max={TODAY} value={date} onChange={(event) => setDate(event.target.value)} aria-label="选择统计日期" />
        <Button variant="ghost" size="icon" disabled={today} onClick={() => setDate(offsetDate(date, 1))} aria-label="后一天"><ChevronRight className="h-4 w-4" /></Button>
        {!today ? <Button size="sm" onClick={() => setDate(TODAY)}>今日</Button> : null}
      </div>
    </div>
  )
}

export function DailyPage() {
  const [date, setDate] = useState(TODAY)
  const seed = useMemo(() => seedForDate(date), [date])
  const today = date === TODAY

  const metrics = {
    registered: 574 - seed,
    verified: 402 - Math.floor(seed * 0.7),
    active: 8_294 - seed * 8,
    applications: 1_486 - seed * 2,
    pending: 268 - (seed % 18),
    approved: 862 - seed,
    cooperationCompleted: 124 - (seed % 16),
    campaigns: 42 - (seed % 8),
  }
  const rejected = metrics.applications - metrics.pending - metrics.approved
  const typeData = [
    { name: "TikTok", value: Math.round(metrics.registered * 0.56), color: "#7c5ce5" },
    { name: "Google", value: Math.round(metrics.registered * 0.3), color: "#ffca28" },
    { name: "邮箱", value: metrics.registered - Math.round(metrics.registered * 0.56) - Math.round(metrics.registered * 0.3), color: "#ff5335" },
  ]
  const platformData = [
    { name: "TikTok", value: Math.round(metrics.verified * 0.48), color: "#7c5ce5" },
    { name: "Instagram", value: Math.round(metrics.verified * 0.34), color: "#ffca28" },
    { name: "YouTube", value: metrics.verified - Math.round(metrics.verified * 0.48) - Math.round(metrics.verified * 0.34), color: "#ff5335" },
  ]
  const trendData = useMemo(() => {
    const registrationFactor = metrics.registered / 574
    const verificationFactor = metrics.verified / 402
    const activeFactor = metrics.active / 8_294
    return dailyHourlyTrend.map((item) => ({ ...item, registered: Math.round(item.registered * registrationFactor), verified: Math.round(item.verified * verificationFactor), active: Math.round(item.active * activeFactor) }))
  }, [metrics.registered, metrics.verified, metrics.active])
  return (
    <div className="space-y-8 pb-10">
      <DailyHeader date={date} setDate={setDate} />

      <section className="space-y-4">
        <SectionHeading eyebrow="Daily pulse" title="核心指标速览" description="当日关键运营数据" />
        <div className="daily-metric-grid">
          <MetricCard label="注册达人数" value={metrics.registered} icon={UserPlus} />
          <MetricCard label="认证社媒数" value={metrics.verified} icon={BadgeCheck} tone="green" />
          <MetricCard label="活跃达人数" value={metrics.active} icon={Activity} tone="amber" />
          <MetricCard label="申请商单数" value={metrics.applications} icon={Send} />
          <MetricCard label="待审核申请数" value={metrics.pending} icon={Clock3} tone="amber" />
          <MetricCard label="审核通过数" value={metrics.approved} icon={CheckCircle2} tone="green" />
          <MetricCard label="审核拒绝数" value={rejected} icon={XCircle} tone="rose" />
          <MetricCard label="合作完成数" value={metrics.cooperationCompleted} icon={Handshake} tone="green" />
          <MetricCard label="新发商单数" value={metrics.campaigns} icon={Megaphone} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Registration" title="注册与社媒认证" description="当日注册类型、认证平台与分时变化" />
        <div className="space-y-3">
          <div className="daily-trend-log-grid">
            <ChartCard className="h-full min-w-0 overflow-hidden" title="24 小时注册、认证与活跃趋势" description="按每小时区间统计注册数、社媒认证数与活跃达人数">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-2xl font-semibold">{number.format(metrics.registered)}</p><p className="text-[10px] text-muted-foreground">当日累计注册</p></div><DotLegend items={[{ name: "注册达人", color: "#7c5ce5" }, { name: "社媒认证", color: "#18a77b" }, { name: "活跃达人", color: "#ff5335" }]} /></div>
              <div className="w-full" style={{ height: 300, minHeight: 300 }}><ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={trendData} margin={{ top: 8, left: -12, right: -6, bottom: 0 }}><CartesianGrid vertical={false} stroke="#ececea" strokeDasharray="3 3"/><XAxis dataKey="hour" interval={2} tickLine={false} axisLine={false} fontSize={9} tick={{fill:"#777"}}/><YAxis yAxisId="creator" tickLine={false} axisLine={false} fontSize={9} tick={{fill:"#777"}}/><YAxis yAxisId="active" orientation="right" tickLine={false} axisLine={false} fontSize={9} tick={{fill:"#999"}}/><Tooltip contentStyle={tooltipStyle}/><Line yAxisId="active" type="monotone" dataKey="active" name="活跃达人" stroke="#ff5335" strokeWidth={2.25} dot={false} activeDot={{r:3}} isAnimationActive={false}/><Line yAxisId="creator" type="monotone" dataKey="registered" name="注册达人" stroke="#7c5ce5" strokeWidth={2.25} dot={false} activeDot={{r:3}} isAnimationActive={false}/><Line yAxisId="creator" type="monotone" dataKey="verified" name="社媒认证" stroke="#18a77b" strokeWidth={2.25} dot={false} activeDot={{r:3}} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>
            </ChartCard>
            <Card className="daily-activity-card min-w-0 border-0">
              <CardHeader><div><CardTitle>系统最新动向</CardTitle><CardDescription className="mt-1">实时记录达人与商单关键事件</CardDescription></div><div className="flex items-center gap-1.5 text-[10px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />实时</div></CardHeader>
              <CardContent className="pt-2">
                <div className="daily-activity-list">
                  {dailySystemActivityFeed.map((item) => {
                    const meta = activityMeta[item.type]
                    const Icon = meta.icon
                    return <div key={item.id} className="flex min-w-0 gap-3 border-b border-border/70 py-3 first:pt-1 last:border-0"><span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.iconClass)}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-semibold">{item.actor}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{item.detail}</p></div><div className="shrink-0 text-right"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium", meta.badgeClass)}>{meta.label}</span><p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.time}</p></div></div></div></div>
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="daily-distribution-grid">
            <ChartCard className="min-w-0" title="注册类型分布" description="当日新注册方式">
              <div className="daily-distribution-content">
                <div className="relative h-[190px]"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={typeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} stroke="none">{typeData.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-xl font-bold">{metrics.registered}</span><span className="text-[10px] text-muted-foreground">注册达人</span></div></div>
                <div className="space-y-3">{typeData.map((item) => <div key={item.name} className="flex items-center text-xs"><span className="mr-2 h-2 w-2 rounded-full" style={{backgroundColor:item.color}}/><span className="flex-1 text-muted-foreground">{item.name}</span><span className="mr-3 font-mono font-semibold">{item.value}</span><span className="w-9 text-right font-mono text-[10px] text-muted-foreground">{(item.value/metrics.registered*100).toFixed(0)}%</span></div>)}</div>
              </div>
            </ChartCard>
            <ChartCard className="min-w-0" title="认证社媒平台" description={`${metrics.verified} 位达人完成认证`}>
              <div className="daily-distribution-content">
                <div className="relative h-[190px]"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={platformData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} stroke="none">{platformData.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-xl font-bold">{(metrics.verified/metrics.registered*100).toFixed(1)}%</span><span className="text-[10px] text-muted-foreground">认证率</span></div></div>
                <div className="space-y-3">{platformData.map((item) => <div key={item.name} className="flex items-center text-xs"><span className="mr-2 h-2 w-2 rounded-full" style={{backgroundColor:item.color}}/><span className="flex-1 text-muted-foreground">{item.name}</span><span className="mr-3 font-mono font-semibold">{item.value}</span><span className="w-9 text-right font-mono text-[10px] text-muted-foreground">{(item.value/metrics.verified*100).toFixed(0)}%</span></div>)}</div>
              </div>
            </ChartCard>
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-4">
        <SectionHeading eyebrow="Campaigns" title={today ? "今日发布商单" : "当日发布商单"} description={`共 ${metrics.campaigns} 个新商单，展示最新发布内容`} />
        <Card className="min-w-0 overflow-hidden border border-border/60"><CardContent className="daily-card-list-grid p-4">
          {dailyPublishedCampaigns.map((campaign) => <div key={campaign.id} className="min-w-0 rounded-xl border border-border/70 p-3.5"><div className="flex min-w-0 gap-3"><div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", campaign.tone)}><Package className="h-6 w-6 text-foreground/55" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-xs font-semibold">{campaign.title}</p><span className="shrink-0 font-mono text-[9px] text-muted-foreground">{campaign.publishedAt}</span></div><p className="mt-1 truncate text-[10px] text-muted-foreground">品牌: {campaign.brand} · 核心产品: {campaign.product}</p><div className="mt-2 flex flex-wrap gap-1"><Badge variant="secondary">预算 {campaign.budget}</Badge><Badge variant="secondary">佣金 {campaign.commission}</Badge><Badge variant="outline" className="gap-1"><img src={platformLogos[campaign.platform]} alt="" className="h-3 w-3 object-contain" />{campaign.platform}</Badge></div></div></div></div>)}
        </CardContent></Card>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Creator details" title="新注册达人明细" description="当日完成注册的达人样本" />
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>达人头像</TableHead><TableHead>达人昵称</TableHead><TableHead>国家</TableHead><TableHead>注册方式</TableHead><TableHead>已认证社媒</TableHead><TableHead className="text-right">注册时间</TableHead></TableRow></TableHeader><TableBody>{dailyCreatorRows.map((creator) => <TableRow key={creator.id}><TableCell><span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold", creator.avatarTone)}>{creator.initials}</span></TableCell><TableCell className="whitespace-nowrap text-xs font-semibold">{creator.name}</TableCell><TableCell className="text-xs">{creator.country}</TableCell><TableCell><Badge variant="secondary">{creator.registrationType}</Badge></TableCell><TableCell><SocialIcons platforms={creator.social} /></TableCell><TableCell className="text-right font-mono text-xs">{creator.time}</TableCell></TableRow>)}</TableBody></Table><div className="flex items-center justify-between border-t border-border px-4 py-3"><span className="text-[10px] text-muted-foreground">显示 {dailyCreatorRows.length} 条，共 {metrics.registered} 条</span><div className="flex gap-1"><Button size="icon" variant="outline" className="h-7 w-7" disabled><ArrowLeft className="h-3 w-3"/></Button><Button size="sm" className="h-7 px-2.5">1</Button><Button size="sm" variant="ghost" className="h-7 px-2.5">2</Button><Button size="icon" variant="outline" className="h-7 w-7"><ArrowRight className="h-3 w-3"/></Button></div></div></CardContent></Card>
      </section>
    </div>
  )
}
