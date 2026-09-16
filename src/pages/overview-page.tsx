import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import {
  Archive,
  CircleCheckBig,
  CircleDollarSign,
  CircleX,
  Clapperboard,
  Clock3,
  CreditCard,
  FileSignature,
  HandCoins,
  Mail,
  Megaphone,
  Music2,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
  Video,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartCard, DotLegend, MetricCard, SectionHeading } from "@/components/dashboard-primitives"
import {
  DASHBOARD_API_BASE_URL,
  dashboardEndpoint,
  dashboardFetcher,
  type ActivityDashboardData,
  type BrandMetric,
  type BrandsDashboardData,
  type CampaignsDashboardData,
  type CategoriesDashboardData,
  type CreatorsDashboardData,
  type DistributionItem,
  type SubscriptionsDashboardData,
} from "@/lib/dashboard-api"
import { cn, number } from "@/lib/utils"

const tooltipStyle = {
  borderRadius: 6,
  border: "1px solid #dfe3e8",
  boxShadow: "0 4px 12px rgba(15,23,42,.06)",
  fontSize: 12,
}

const registrationIcons = [Music2, Search, Mail]
const cooperationIcons = [HandCoins, FileSignature, Clapperboard, Video, CircleDollarSign, CircleX]
const chartColors = ["#7659e8", "#ff5335", "#f3ad00", "#26a269", "#3b82f6", "#e76f99"]
const followerTones = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-cyan-100 text-cyan-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"]
const socialPlatformLogos: Record<string, string> = {
  tiktok: "/platform/tiktok.png",
  instagram: "/platform/instagram.webp",
  youtube: "/platform/youtube.png",
}

const swrOptions = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
}

function apiPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function compactDate(value: string) {
  return value.slice(5).replace("-", "/")
}

function reportDateTime(value?: string) {
  if (!value) return "数据加载中"
  const [year, month, day] = value.split("-")
  return `${year}年${month}月${day}日 23:59:59`
}

function currency(value: number, code: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code || "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function ErrorPanel({ message, retry }: { message: string; retry: () => void }) {
  return (
    <Card className="border-0">
      <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center">
        <CircleX className="h-5 w-5 text-rose-500" />
        <div><p className="text-sm font-medium">数据加载失败</p><p className="mt-1 text-xs text-muted-foreground">{message}</p></div>
        <Button variant="outline" size="sm" onClick={retry}><RefreshCw className="h-3.5 w-3.5" />重新加载</Button>
      </CardContent>
    </Card>
  )
}

function SectionSkeleton({ cards = 4, tall = false }: { cards?: number; tall?: boolean }) {
  return (
    <div className="space-y-4" aria-label="数据加载中">
      <div className="h-12 w-60 animate-pulse rounded-lg bg-muted" />
      <div className={cn("grid gap-3", cards > 1 && "sm:grid-cols-2 xl:grid-cols-4")}>
        {Array.from({ length: cards }, (_, index) => <div key={index} className={cn("animate-pulse rounded-xl bg-muted", tall ? "h-80" : "h-28")} />)}
      </div>
    </div>
  )
}

function DonutChart({ data, centerTop, centerBottom }: { data: Array<{ name: string; value: number; color: string }>; centerTop: string; centerBottom: string }) {
  return (
    <div className="relative h-[170px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} stroke="none">
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => number.format(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-bold">{centerTop}</span>
        <span className="text-[10px] text-muted-foreground">{centerBottom}</span>
      </div>
    </div>
  )
}

function SocialAuthCard({ data, total }: { data: CreatorsDashboardData["verificationOverview"]; total: number }) {
  return (
    <ChartCard title="社媒认证情况" description="累计完成至少一个社媒认证的达人">
      <div className="grid gap-3 sm:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-xl bg-[#f1edff] p-4">
          <p className="text-[10px] font-medium text-[#6547c8]">整体认证率</p>
          <div className="mt-2 flex items-end justify-between gap-3"><p className="font-mono text-3xl font-bold tracking-[-0.05em]">{apiPercent(data.verificationRate)}</p><UserRoundCheck className="h-5 w-5 text-[#7659e8]" /></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-[#7659e8]" style={{ width: `${data.verificationRate}%` }} /></div>
          <p className="mt-2 text-[9px] text-[#7659e8]">{number.format(data.verifiedCreatorCount)} / {number.format(total)} 位达人</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          <div className="rounded-xl border border-border/70 p-3"><p className="text-[10px] text-muted-foreground">已认证达人</p><p className="mt-1 font-mono text-lg font-bold">{number.format(data.verifiedCreatorCount)}</p></div>
          <div className="rounded-xl border border-border/70 p-3"><p className="text-[10px] text-muted-foreground">未认证达人</p><p className="mt-1 font-mono text-lg font-bold text-muted-foreground">{number.format(data.unverifiedCreatorCount)}</p></div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {data.platformDistribution.map((platform, index) => (
          <div key={platform.code} className="grid grid-cols-[32px_1fr_auto] items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white"><img src={socialPlatformLogos[platform.code.toLowerCase()]} alt={`${platform.name} 平台`} className="h-5 w-5 object-contain" /></span>
            <div><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="font-medium">{platform.name}</span><span className="text-muted-foreground">{apiPercent(platform.percentage)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${platform.percentage}%`, backgroundColor: chartColors[index] }} /></div></div>
            <span className="w-14 text-right font-mono text-xs font-bold">{number.format(platform.count)}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

function CountryDistributionCard({ data }: { data: CreatorsDashboardData["countryRanking"] }) {
  const maximum = data[0]?.count || 1
  return (
    <ChartCard title="注册达人国家分布" description="按累计注册量排名 · Top 10">
      <div className="space-y-3.5">
        {data.slice(0, 10).map((country, index) => (
          <div key={`${country.code}-${country.rank}`} className="grid grid-cols-[24px_32px_1fr_auto] items-center gap-2.5">
            <span className={cn("font-mono text-[10px] font-semibold", index < 3 ? "text-primary" : "text-muted-foreground")}>{String(country.rank).padStart(2, "0")}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted font-mono text-[9px] font-bold text-muted-foreground">{country.code.slice(0, 3)}</span>
            <div className="min-w-0"><div className="mb-1 flex justify-between text-xs"><span className="truncate font-medium">{country.name}</span><span className="font-mono text-muted-foreground">{apiPercent(country.percentage)}</span></div><Progress value={(country.count / maximum) * 100} indicatorClassName="bg-[#7659e8]" /></div>
            <span className="w-14 text-right font-mono text-[11px] font-semibold">{number.format(country.count)}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

function CreatorCategoryDistributionCard({ data }: { data: CategoriesDashboardData }) {
  const maximum = data.categories[0]?.creatorCount || 1
  return (
    <ChartCard title="达人分类分布" description={`一位达人可对应多个内容分类 · ${data.categoryCount} 个分类`} className="min-w-0 overflow-hidden">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <div><p className="text-[10px] text-muted-foreground">已分类达人</p><p className="mt-1 font-mono text-lg font-bold">{number.format(data.classifiedCreatorCount)}</p></div>
        <div className="text-right"><p className="text-[10px] text-muted-foreground">最高占比分类</p><p className="mt-1 text-xs font-semibold">{data.topCategory?.name ?? "—"} <span className="ml-1 font-mono text-[#7659e8]">{data.topCategory ? apiPercent(data.topCategory.percentage) : "—"}</span></p></div>
      </div>
      <div className="creator-category-grid">
        {data.categories.map((category, index) => (
          <div key={category.code} className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 pb-3">
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-md font-mono text-[10px] font-bold", index < 3 ? "bg-[#f1edff] text-[#6547c8]" : "bg-muted text-muted-foreground")}>{String(category.rank).padStart(2, "0")}</span>
            <div className="min-w-0"><div className="mb-1.5 flex min-w-0 items-center gap-2"><span className="truncate text-xs font-medium" title={category.name}>{category.name}</span><span className="shrink-0 font-mono text-[9px] text-muted-foreground">{category.code}</span></div><Progress value={(category.creatorCount / maximum) * 100} indicatorClassName={index < 3 ? "bg-[#7659e8]" : "bg-[#b8aaf0]"} /></div>
            <div className="w-16 text-right"><p className="font-mono text-[11px] font-semibold">{number.format(category.creatorCount)}</p><p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{apiPercent(category.percentage)}</p></div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

function RegistrationSection({ creators, categories }: { creators: CreatorsDashboardData; categories: CategoriesDashboardData }) {
  const registrationTypes = [
    { name: "TikTok", value: creators.tiktokRegisteredCreatorCount },
    { name: "Google", value: creators.googleRegisteredCreatorCount },
    { name: "邮箱", value: creators.emailRegisteredCreatorCount },
  ]
  return (
    <section className="space-y-4">
      <SectionHeading eyebrow="Creator growth" title="达人增长与用户画像" description="注册来源、地域分布、社媒认证与粉丝量级结构" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="总注册达人数" value={creators.totalRegisteredCreatorCount} icon={UsersRound} />
        {registrationTypes.map((item, index) => <MetricCard key={item.name} label={`${item.name} 注册达人`} value={item.value} icon={registrationIcons[index]} tone={(["primary", "green", "amber"] as const)[index]} />)}
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <ChartCard title="注册与认证趋势" description="最近 30 天新增达人及完成社媒认证人数">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="mb-1 text-[10px] text-muted-foreground">30 天新增注册</p><span className="font-mono text-2xl font-bold">{number.format(creators.registeredCreatorCount30Days)}</span></div>
            <DotLegend items={[{ name: "新增注册", color: "#7c5ce5" }, { name: "完成认证", color: "#ff5335" }]} />
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={creators.registrationVerificationTrend} margin={{ left: -18, right: 4 }}>
                <defs>
                  <linearGradient id="registeredArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c5ce5" stopOpacity={0.2} /><stop offset="100%" stopColor="#7c5ce5" stopOpacity={0} /></linearGradient>
                  <linearGradient id="verifiedArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5335" stopOpacity={0.15} /><stop offset="100%" stopColor="#ff5335" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef0f4" strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={compactDate} interval={4} tickLine={false} axisLine={false} fontSize={10} tick={{ fill: "#9198a6" }} />
                <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: "#9198a6" }} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => String(label)} formatter={(value) => number.format(Number(value))} />
                <Area type="monotone" dataKey="registeredCount" name="新增注册" stroke="#7c5ce5" strokeWidth={2} fill="url(#registeredArea)" />
                <Area type="monotone" dataKey="verifiedCount" name="完成认证" stroke="#ff5335" strokeWidth={2} fill="url(#verifiedArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <SocialAuthCard data={creators.verificationOverview} total={creators.totalRegisteredCreatorCount} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="注册渠道来源码排行" description="各渠道注册数量与占比 · Top 10">
          <div className="space-y-3">
            {creators.registrationSourceRanking.slice(0, 10).map((channel) => (
              <div key={`${channel.code}-${channel.rank}`} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-bold text-muted-foreground">{channel.rank}</span>
                <div className="min-w-0 flex-1"><div className="mb-1 flex items-center justify-between"><span className="truncate text-xs font-medium">{channel.name}<span className="ml-1.5 font-mono text-[9px] text-muted-foreground">{channel.code}</span></span><span className="font-mono text-[10px] text-muted-foreground">{apiPercent(channel.percentage)}</span></div><Progress value={channel.percentage} indicatorClassName="bg-[#ff5335]" /></div>
                <span className="w-12 text-right font-mono text-[11px] font-semibold">{number.format(channel.count)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
        <CountryDistributionCard data={creators.countryRanking} />
        <ChartCard title="粉丝量级分布" description="按已认证社媒账号粉丝量划分 · 5 个层级" className="lg:col-span-2 xl:col-span-1">
          <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-muted">
            {creators.followerTierDistribution.map((tier, index) => <div key={tier.code} style={{ width: `${tier.percentage}%`, backgroundColor: chartColors[index] }} title={`${tier.name}: ${number.format(tier.count)}`} />)}
          </div>
          <div className="space-y-2.5">
            {creators.followerTierDistribution.map((tier, index) => (
              <div key={tier.code} className="flex items-center rounded-md border border-border/60 px-3 py-2.5">
                <span className="mr-3 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-xs font-semibold">{tier.name}</span><Badge className={cn("border-0", followerTones[index])}>{tier.code}</Badge></div><p className="mt-0.5 text-[10px] text-muted-foreground">{tier.description}</p></div>
                <div className="text-right"><p className="font-mono text-xs font-bold">{number.format(tier.count)}</p><p className="text-[9px] text-muted-foreground">{apiPercent(tier.percentage)}</p></div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
      <CreatorCategoryDistributionCard data={categories} />
    </section>
  )
}

function ActivitySection({ data }: { data: ActivityDashboardData }) {
  const metrics = [
    { label: "本日活跃", value: data.todayActiveCreatorCount, rate: data.todayActiveRate, good: true },
    { label: "最近 7 天活跃", value: data.activeCreatorCount7Days, rate: data.activeRate7Days, good: true },
    { label: "最近 30 天活跃", value: data.activeCreatorCount30Days, rate: data.activeRate30Days, good: true },
    { label: "最近 90 天活跃", value: data.activeCreatorCount90Days, rate: data.activeRate90Days, good: true },
    { label: "最近 30 天未使用", value: data.inactiveCreatorCount30Days, rate: data.inactiveRate30Days, good: false },
  ]
  return (
    <section className="space-y-4">
      <SectionHeading eyebrow="Engagement" title="达人活跃度" description="不同时间窗口下的活跃和沉默达人表现" />
      <Card><CardContent className="grid divide-y p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={cn("p-5", index === 2 && "sm:border-t xl:border-t-0")}>
            <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{metric.label}</p><span className={cn("h-2 w-2 rounded-full", metric.good ? "bg-emerald-500" : "bg-amber-500")} /></div>
            <p className="mt-2 font-mono text-xl font-bold">{number.format(metric.value)}</p>
            <p className={cn("mt-1 text-[10px]", metric.good ? "text-emerald-600" : "text-amber-600")}>占全部达人 {apiPercent(metric.rate)}</p>
          </div>
        ))}
      </CardContent></Card>
    </section>
  )
}

function distributionWithColors(data: DistributionItem[]) {
  return data.map((item, index) => ({ name: item.name, value: item.count, percentage: item.percentage, color: chartColors[index] }))
}

function CommerceSection({ data }: { data: CampaignsDashboardData }) {
  const sources = distributionWithColors(data.sourceDistribution)
  const modes = distributionWithColors(data.cooperationModeDistribution)
  const topSource = data.sourceDistribution[0]
  const topMode = data.cooperationModeDistribution.reduce<DistributionItem | undefined>((top, item) => !top || item.percentage > top.percentage ? item : top, undefined)
  const applicationMetrics = [
    { label: "申请总数", value: data.applyOverview.totalApplyCount, color: "#111111" },
    { label: "审核通过", value: data.applyOverview.approvedApplyCount, color: "#26a269" },
    { label: "审核拒绝", value: data.applyOverview.rejectedApplyCount, color: "#ff5335" },
    { label: "待审核", value: data.applyOverview.pendingApplyCount, color: "#f3ad00" },
  ]
  return (
    <section className="space-y-4">
      <SectionHeading eyebrow="Monetization" title="商单与合作转化" description="商单结构、申请审核与合作履约的完整商业化漏斗" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="平台总商单数" value={data.totalCampaignCount} icon={ShoppingBag} />
        <MetricCard label="上架中总商单数" value={data.onShelfCampaignCount} icon={CircleCheckBig} tone="green" />
        <MetricCard label="已下架总商单数" value={data.offShelfCampaignCount} icon={Archive} />
        <MetricCard label="待审核总商单数" value={data.pendingReviewCampaignCount} icon={Clock3} tone="amber" />
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr_1fr]">
        <ChartCard title="最近 30 天商单发布趋势" description="平台发布总数与各业务线发布数">
          <DotLegend className="mb-3" items={[{ name: "发布总数", color: "#111111" }, { name: "WotoHub", color: "#7c5ce5" }, { name: "WotoKOL", color: "#f3ad00" }, { name: "WotoPartner", color: "#ff5335" }]} />
          <div className="h-[170px] min-w-0"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.publishingTrend} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef0f4" strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={compactDate} interval={6} tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "#9198a6" }} />
              <YAxis tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "#9198a6" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => number.format(Number(value))} />
              <Line type="monotone" dataKey="totalCount" name="发布总数" stroke="#111111" strokeWidth={2.25} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="wotoHubCount" name="WotoHub" stroke="#7c5ce5" strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="wotoKolCount" name="WotoKOL" stroke="#f3ad00" strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="wotoPartnerCount" name="WotoPartner" stroke="#ff5335" strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="商单来源分布" description="三个业务平台的商单贡献">
          <DonutChart data={sources} centerTop={topSource ? apiPercent(topSource.percentage) : "—"} centerBottom={topSource ? `${topSource.name} 占比` : "暂无数据"} />
          <DotLegend items={sources} className="justify-center" />
        </ChartCard>
        <ChartCard title="商单报酬类型" description="Paid / Hybrid / Gifted 占比">
          <DonutChart data={modes} centerTop={topMode ? apiPercent(topMode.percentage) : "—"} centerBottom={topMode ? `${topMode.name} 占比` : "暂无数据"} />
          <DotLegend items={modes} className="justify-center" />
        </ChartCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1.4fr]">
        <ChartCard title="达人申请商单概览" description="累计申请处理状态">
          <div className="grid grid-cols-2 gap-3">{applicationMetrics.map((item) => <div key={item.label} className="rounded-md border border-border/70 p-3.5"><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</div><p className="mt-2 font-mono text-lg font-semibold">{number.format(item.value)}</p></div>)}</div>
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">{applicationMetrics.slice(1).map((item) => <span key={item.label} className="block h-full shrink-0" style={{ width: `${data.applyOverview.totalApplyCount ? item.value / data.applyOverview.totalApplyCount * 100 : 0}%`, backgroundColor: item.color }} />)}</div>
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>通过率 <b className="text-foreground">{apiPercent(data.applyOverview.approvedRate)}</b></span><span>拒绝率 <b className="text-foreground">{apiPercent(data.applyOverview.rejectedRate)}</b></span><span>待审核 <b className="text-foreground">{apiPercent(data.applyOverview.pendingRate)}</b></span></div>
        </ChartCard>
        <ChartCard title="达人合作履约进度概览" description="进入合作后的各阶段数量与转化">
          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.fulfillmentProgress.map((stage, index) => {
              const Icon = cooperationIcons[index] ?? HandCoins
              return <div key={stage.code} className={cn("relative rounded-md border p-3.5", stage.code === "cancelled" ? "border-rose-100 bg-rose-50/50" : "border-border/70 bg-muted/20")}><div className="flex items-center justify-between"><span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", stage.code === "cancelled" ? "bg-rose-100 text-rose-600" : "bg-white text-[#7659e8] shadow-sm")}><Icon className="h-3.5 w-3.5" /></span><span className="text-[9px] text-muted-foreground">{apiPercent(stage.percentage)}</span></div><p className="mt-3 text-[10px] text-muted-foreground">{stage.name}</p><p className="mt-0.5 font-mono text-lg font-bold">{number.format(stage.count)}</p></div>
            })}
          </div>
        </ChartCard>
      </div>
    </section>
  )
}

function BrandSection() {
  const [metric, setMetric] = useState<BrandMetric>("published")
  const config: Record<BrandMetric, { label: string; icon: typeof Megaphone }> = {
    published: { label: "发布商单", icon: Megaphone },
    pending: { label: "待审核达人", icon: Clock3 },
    rejected: { label: "拒绝申请", icon: UserRoundX },
  }
  const endpoint = dashboardEndpoint("brands", { metric, limit: 20 })
  const { data, error, isLoading, mutate } = useSWR<BrandsDashboardData>(endpoint, dashboardFetcher, swrOptions)
  const Icon = config[metric].icon
  return (
    <section className="space-y-4">
      <SectionHeading eyebrow="Brand performance" title="品牌方表现" description="品牌发布商单、待审核申请与拒绝申请的排行榜" />
      {isLoading ? <SectionSkeleton cards={1} tall /> : error ? <ErrorPanel message={error.message} retry={() => void mutate()} /> : data ? (
        <ChartCard title="品牌排行榜" description={`按${config[metric].label}数量降序 · 前 20`} action={<div className="flex flex-wrap rounded-lg bg-muted p-0.5">{(Object.keys(config) as BrandMetric[]).map((key) => <button key={key} onClick={() => setMetric(key)} className={cn("rounded-md px-3 py-1.5 text-[10px] font-medium transition-all", metric === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{config[key].label}</button>)}</div>}>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <div className="h-[520px]"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.items} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid horizontal={false} stroke="#eef0f4" strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={10} tick={{ fill: "#9198a6" }} />
                <YAxis type="category" dataKey="brandName" tickLine={false} axisLine={false} width={82} fontSize={10} tick={{ fill: "#49505c" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name={config[metric].label} fill="#7c5ce5" radius={[0, 7, 7, 0]} barSize={10} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer></div>
            <div className="max-h-[520px] overflow-y-auto pr-1"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card"><TableRow><TableHead>排名 / 品牌</TableHead><TableHead>企业 ID</TableHead><TableHead className="text-right">{config[metric].label}</TableHead></TableRow></TableHeader>
              <TableBody>{data.items.map((brand) => <TableRow key={`${brand.brandId}-${brand.rank}`}><TableCell><div className="flex items-center gap-2"><span className={cn("flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10px] font-bold", brand.rank <= 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{brand.rank}</span><span className="font-medium">{brand.brandName}</span></div></TableCell><TableCell className="font-mono text-[10px] text-muted-foreground">{brand.brandId}</TableCell><TableCell className="text-right font-mono font-bold"><span className="inline-flex items-center gap-1"><Icon className="h-3 w-3 text-muted-foreground" />{number.format(brand.count)}</span></TableCell></TableRow>)}</TableBody>
            </Table></div>
          </div>
        </ChartCard>
      ) : null}
    </section>
  )
}

function SubscriptionSection({ data }: { data: SubscriptionsDashboardData }) {
  const versions = distributionWithColors(data.packageDistribution)
  return (
    <section className="space-y-4">
      <SectionHeading eyebrow="Subscription" title="订阅付费" description="付费达人规模、订单表现、版本分布与订阅收入" />
      <div className="grid gap-3 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="border-0"><CardContent className="p-5 sm:p-6">
          <div className="rounded-2xl bg-[#f1edff] p-5 sm:flex sm:items-end sm:justify-between sm:gap-6">
            <div><div className="flex items-center gap-2 text-xs font-medium text-[#6547c8]"><CircleDollarSign className="h-4 w-4" />累计订阅总金额</div><p className="mt-3 font-mono text-4xl font-bold tracking-[-0.05em] text-[#271b4d]">{currency(data.totalSubscriptionAmount, data.currency)}</p></div>
            <Badge className={cn("mt-3 border-0 bg-white shadow-sm sm:mt-0", data.monthOverMonthRate >= 0 ? "text-emerald-700" : "text-rose-600")}>{data.monthOverMonthRate >= 0 ? "↑" : "↓"} {apiPercent(Math.abs(data.monthOverMonthRate))} 较上月</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "订阅达人", value: data.subscribedCreatorCount, icon: UserRoundCheck, hint: "付费用户总数" },
              { label: "订阅订单", value: data.subscriptionOrderCount, icon: ReceiptText, hint: "累计订单" },
              { label: "自动续费", value: data.autoRenewCreatorCount, icon: RefreshCw, hint: `${apiPercent(data.autoRenewRate)} 占比` },
              { label: "单次订阅", value: data.oneTimeCreatorCount, icon: CreditCard, hint: `${apiPercent(data.oneTimeRate)} 占比` },
            ].map((item) => <div key={item.label} className="rounded-xl border border-border/70 p-3.5"><div className="flex items-center justify-between"><p className="text-[10px] text-muted-foreground">{item.label}</p><item.icon className="h-3.5 w-3.5 text-[#7659e8]" /></div><p className="mt-2 font-mono text-lg font-bold">{number.format(item.value)}</p><p className="mt-1 text-[9px] text-muted-foreground">{item.hint}</p></div>)}
          </div>
        </CardContent></Card>
        <Card className="border-0"><CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between"><div><h3 className="text-sm font-semibold">订阅版本分布</h3><p className="mt-1 text-[10px] text-muted-foreground">各付费版本达人占比</p></div><Badge variant="secondary">{number.format(data.subscribedCreatorCount)} 人</Badge></div>
          <div className="mt-7 flex h-3 overflow-hidden rounded-full bg-muted">{versions.map((version) => <span key={version.name} className="h-full" style={{ width: `${version.percentage}%`, backgroundColor: version.color }} />)}</div>
          <div className="mt-6 space-y-3">{versions.map((version) => <div key={version.name} className="rounded-xl border border-border/70 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: version.color }} />{version.name}</div><span className="font-mono text-xs font-semibold">{apiPercent(version.percentage)}</span></div><div className="mt-3 flex items-end justify-between"><p className="font-mono text-xl font-bold">{number.format(version.value)}</p><p className="text-[9px] text-muted-foreground">订阅达人</p></div></div>)}</div>
        </CardContent></Card>
      </div>
    </section>
  )
}

export function OverviewPage() {
  const { mutate: mutateCache } = useSWRConfig()
  const creators = useSWR<CreatorsDashboardData>(dashboardEndpoint("creators"), dashboardFetcher, swrOptions)
  const categories = useSWR<CategoriesDashboardData>(dashboardEndpoint("categories"), dashboardFetcher, swrOptions)
  const activity = useSWR<ActivityDashboardData>(dashboardEndpoint("activity"), dashboardFetcher, swrOptions)
  const campaigns = useSWR<CampaignsDashboardData>(dashboardEndpoint("campaigns"), dashboardFetcher, swrOptions)
  const subscriptions = useSWR<SubscriptionsDashboardData>(dashboardEndpoint("subscriptions"), dashboardFetcher, swrOptions)
  const isRefreshing = creators.isValidating || categories.isValidating || activity.isValidating || campaigns.isValidating || subscriptions.isValidating
  const reportDate = creators.data?.reportDate ?? categories.data?.reportDate ?? activity.data?.reportDate ?? campaigns.data?.reportDate ?? subscriptions.data?.reportDate

  function refreshAll() {
    void mutateCache((key) => typeof key === "string" && key.startsWith(DASHBOARD_API_BASE_URL), undefined, { revalidate: true })
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="text-2xl font-semibold tracking-[-0.03em]">运营数据大盘</h1><p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />数据统计截止至 <time dateTime={reportDate ? `${reportDate}T23:59:59+08:00` : undefined} className="font-mono text-foreground/75">{reportDateTime(reportDate)}</time></p></div>
        <Button variant="outline" size="sm" className="self-start bg-white sm:self-auto" aria-label="刷新运营数据" onClick={refreshAll} disabled={isRefreshing}><RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />{isRefreshing ? "刷新中" : "刷新"}</Button>
      </div>

      {creators.isLoading || categories.isLoading ? <SectionSkeleton cards={4} /> : creators.error || categories.error ? <ErrorPanel message={(creators.error ?? categories.error).message} retry={() => { void creators.mutate(); void categories.mutate() }} /> : creators.data && categories.data ? <RegistrationSection creators={creators.data} categories={categories.data} /> : null}
      {activity.isLoading ? <SectionSkeleton cards={5} /> : activity.error ? <ErrorPanel message={activity.error.message} retry={() => void activity.mutate()} /> : activity.data ? <ActivitySection data={activity.data} /> : null}
      {campaigns.isLoading ? <SectionSkeleton cards={4} tall /> : campaigns.error ? <ErrorPanel message={campaigns.error.message} retry={() => void campaigns.mutate()} /> : campaigns.data ? <CommerceSection data={campaigns.data} /> : null}
      <BrandSection />
      {subscriptions.isLoading ? <SectionSkeleton cards={2} tall /> : subscriptions.error ? <ErrorPanel message={subscriptions.error.message} retry={() => void subscriptions.mutate()} /> : subscriptions.data ? <SubscriptionSection data={subscriptions.data} /> : null}
    </div>
  )
}
