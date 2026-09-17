import { useMemo, useState } from "react"
import { AlertTriangle, BarChart3, Building2, Check, CheckCircle2, Clock3, MailCheck, Settings2, Sparkles, UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  brandReviewReminderRankings,
  newCampaignMatchingRule,
  noApplicationWarnings,
  reviewTimeoutWarnings,
  type BrandPlatform,
  type ReminderPeriod,
} from "@/data/automation-data"
import { cn, number } from "@/lib/utils"

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

function CampaignCover({ src, title }: { src: string; title: string }) {
  return <img src={src} alt={`${title}商单主图`} className="h-20 w-24 shrink-0 rounded-xl border border-white/80 object-cover shadow-sm" />
}

function formatNoApplicationDuration(hours: number) {
  return hours > 72 ? `${Math.floor(hours / 24)} 天无申请` : `${hours} 小时无申请`
}

function formatOverdueDuration(hours: number) {
  return hours > 72 ? `超 ${Math.floor(hours / 24)} 天` : `超 ${hours} 小时`
}

export function CampaignAutomationSection({ onAction }: { onAction: (message: string) => void }) {
  const [processedCampaigns, setProcessedCampaigns] = useState<Set<string>>(() => new Set())
  const [period, setPeriod] = useState<ReminderPeriod>("7d")
  const [matchingEnabled, setMatchingEnabled] = useState(newCampaignMatchingRule.enabled)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateDraft, setTemplateDraft] = useState({ subject: newCampaignMatchingRule.templateSubject, body: newCampaignMatchingRule.templateBody })
  const ranking = useMemo(() => [...brandReviewReminderRankings[period]].sort((a, b) => b.pendingTotal - a.pendingTotal), [period])

  function markProcessed(id: string, title: string) {
    setProcessedCampaigns((current) => new Set(current).add(id))
    onAction(`“${title}”已标记为手动处理`)
  }

  return (
    <div className="space-y-3">
      <Card className="border-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><UsersRound className="h-5 w-5" /></span>
            <div className="flex items-center gap-2"><Badge variant={matchingEnabled ? "success" : "secondary"}>{matchingEnabled ? "已启用" : "已暂停"}</Badge><Switch checked={matchingEnabled} onCheckedChange={setMatchingEnabled} aria-label="新商单自动匹配推荐达人开关" /></div>
          </div>
          <h3 className="mt-4 text-base font-semibold">{newCampaignMatchingRule.title}</h3>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{newCampaignMatchingRule.description}</p>
          <div className="mt-4 rounded-xl bg-muted/60 p-3"><p className="text-[9px] font-medium text-muted-foreground">触发条件</p><p className="mt-1 text-[11px] font-medium">{newCampaignMatchingRule.trigger}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-muted-foreground"><span>{newCampaignMatchingRule.mode}</span><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />最新执行 {newCampaignMatchingRule.latestExecutedAt}</span></div></div>
          <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            <div className="pb-3 sm:pb-0"><p className="text-[9px] text-muted-foreground">待处理商单</p><p className="mt-1 font-mono text-lg font-bold">{number.format(newCampaignMatchingRule.pendingCampaigns)}</p></div>
            <div className="pb-3 pl-3 sm:pb-0"><p className="text-[9px] text-muted-foreground">累计处理商单</p><p className="mt-1 font-mono text-lg font-bold">{number.format(newCampaignMatchingRule.processedCampaigns)}</p></div>
            <div className="pt-3 sm:pl-3 sm:pt-0"><p className="text-[9px] text-muted-foreground">今日匹配达人</p><p className="mt-1 font-mono text-lg font-bold">{number.format(newCampaignMatchingRule.matchedToday)}</p></div>
            <div className="pl-3 pt-3 sm:pt-0"><p className="text-[9px] text-muted-foreground">申请率</p><p className="mt-1 font-mono text-lg font-bold">{newCampaignMatchingRule.applicationRate}</p></div>
          </div>
          <div className="mt-5"><Button type="button" variant="outline" size="sm" onClick={() => setTemplateOpen(true)}><Settings2 className="h-3.5 w-3.5" />邮件模板</Button></div>
        </CardContent>
      </Card>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="border-0">
          <CardHeader>
            <div><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />新商单 48 小时无申请</CardTitle><CardDescription className="mt-1">系统自动诊断无申请原因，运营确认后可标记为已处理</CardDescription></div>
            <Badge variant="warning">{noApplicationWarnings.length - noApplicationWarnings.filter((item) => processedCampaigns.has(item.id)).length} 个待处理</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {noApplicationWarnings.map((campaign) => {
              const processed = processedCampaigns.has(campaign.id)
              return (
                <article key={campaign.id} className={cn("rounded-2xl border border-border/70 p-3.5 transition-opacity", processed && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <CampaignCover src={campaign.cover} title={campaign.title} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2"><h4 className="min-w-0 text-xs font-semibold leading-5">{campaign.title}</h4><Badge variant={processed ? "success" : "warning"} className="shrink-0">{processed ? "已处理" : formatNoApplicationDuration(campaign.hours)}</Badge></div>
                      <div className="mt-2 grid gap-x-3 gap-y-1 text-[9px] text-muted-foreground sm:grid-cols-2">
                        <span>商单 ID <strong className="ml-1 font-mono font-medium text-foreground">{campaign.id}</strong></span>
                        <span>品牌方 ID <strong className="ml-1 font-mono font-medium text-foreground">{campaign.brandId}</strong></span>
                        <span>发布时间 <strong className="ml-1 font-medium text-foreground">{campaign.publishedAt}</strong></span>
                        <span>曝光量 <strong className="ml-1 font-mono font-medium text-foreground">{number.format(campaign.impressions)}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-800"><Sparkles className="h-3.5 w-3.5" />系统诊断分析</p>
                    <p className="mt-1.5 text-[10px] leading-5 text-amber-900/75">{campaign.diagnosis}</p>
                  </div>
                  <div className="mt-3 flex justify-end"><Button type="button" variant={processed ? "ghost" : "outline"} size="sm" disabled={processed} onClick={() => markProcessed(campaign.id, campaign.title)}><CheckCircle2 className="h-3.5 w-3.5" />{processed ? "已处理" : "手动已处理"}</Button></div>
                </article>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardHeader>
            <div><CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-rose-500" />品牌方申请审核超时</CardTitle><CardDescription className="mt-1">跟踪超过审核时限的商单申请，由运营确认处理状态</CardDescription></div>
            <Badge variant="danger">{reviewTimeoutWarnings.length - reviewTimeoutWarnings.filter((item) => processedCampaigns.has(item.id)).length} 个待处理</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {reviewTimeoutWarnings.map((campaign) => {
              const processed = processedCampaigns.has(campaign.id)
              return (
                <article key={campaign.id} className={cn("rounded-2xl border p-3.5 transition-opacity", campaign.risk === "critical" ? "border-rose-100 bg-rose-50/25" : "border-border/70", processed && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <CampaignCover src={campaign.cover} title={campaign.title} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2"><h4 className="min-w-0 text-xs font-semibold leading-5">{campaign.title}</h4><div className="flex shrink-0 flex-wrap justify-end gap-1.5">{processed ? <Badge variant="success">已处理</Badge> : null}<Badge variant={campaign.overdueHours > 72 ? "danger" : "warning"}>{formatOverdueDuration(campaign.overdueHours)}</Badge></div></div>
                      <div className="mt-2 space-y-1 text-[9px] text-muted-foreground">
                        <p>商单 ID <strong className="ml-1 font-mono font-medium text-foreground">{campaign.id}</strong></p>
                        <p>品牌方 ID <strong className="ml-1 font-mono font-medium text-foreground">{campaign.brandId}</strong></p>
                        <p>发布时间 <strong className="ml-1 font-medium text-foreground">{campaign.publishedAt}</strong></p>
                        <p>最后审核时间 <strong className="ml-1 font-medium text-foreground">{campaign.lastReviewAt}</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3"><span className="text-[10px] text-muted-foreground"><strong className="font-mono text-sm text-foreground">{campaign.pending}</strong> 位达人待审核</span><Button type="button" variant={processed ? "ghost" : "outline"} size="sm" disabled={processed} onClick={() => markProcessed(campaign.id, campaign.title)}><CheckCircle2 className="h-3.5 w-3.5" />{processed ? "已处理" : "手动已处理"}</Button></div>
                </article>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0">
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start">
          <div><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-violet-600" />品牌方未审核达人数排行榜</CardTitle><CardDescription className="mt-1">按待审核总数量降序排列，优先跟进积压较多的品牌方</CardDescription></div>
          <div className="flex flex-wrap rounded-full bg-muted p-1" role="radiogroup" aria-label="排行榜时间范围">
            {periodOptions.map((option) => <button key={option.value} type="button" role="radio" aria-checked={period === option.value} onClick={() => setPeriod(option.value)} className={cn("rounded-full px-3 py-1.5 text-[10px] font-medium transition-all", period === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{option.label}</button>)}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader><TableRow><TableHead className="w-20">排名</TableHead><TableHead>品牌方 ID</TableHead><TableHead>品牌方平台</TableHead><TableHead className="text-right">商单总数量</TableHead><TableHead className="text-right">待审核总数量</TableHead></TableRow></TableHeader>
            <TableBody>{ranking.map((brand, index) => <TableRow key={brand.brandId}><TableCell><span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold", index === 0 ? "bg-[#d4f76a] text-black" : index < 3 ? "bg-violet-50 text-violet-700" : "bg-muted text-muted-foreground")}>{String(index + 1).padStart(2, "0")}</span></TableCell><TableCell><span className="flex items-center gap-2 whitespace-nowrap font-mono text-xs font-semibold"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{brand.brandId}</span></TableCell><TableCell><Badge className={cn("border-0", platformStyles[brand.platform])}>{brand.platform}</Badge></TableCell><TableCell className="text-right font-mono text-xs">{number.format(brand.campaignTotal)}</TableCell><TableCell className="text-right"><strong className="font-mono text-sm text-rose-600">{number.format(brand.pendingTotal)}</strong></TableCell></TableRow>)}</TableBody>
          </Table>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 text-[10px] text-muted-foreground"><span>共 {ranking.length} 个品牌方需要重点跟进</span><span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-600" />已按待审核数量排序</span></div>
        </CardContent>
      </Card>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>配置商单推荐邮件模板</DialogTitle><DialogDescription>新商单发布并完成达人匹配后，系统将使用此模板自动发送推荐邮件。</DialogDescription></DialogHeader>
          <div className="mt-5 space-y-4"><label className="block space-y-2"><span className="text-xs font-medium">邮件主题</span><Input value={templateDraft.subject} onChange={(event) => setTemplateDraft((current) => ({ ...current, subject: event.target.value }))} /></label><label className="block space-y-2"><span className="text-xs font-medium">邮件正文</span><Textarea value={templateDraft.body} onChange={(event) => setTemplateDraft((current) => ({ ...current, body: event.target.value }))} className="min-h-52 font-mono text-xs leading-5" /></label><div className="rounded-xl bg-muted p-3 text-[10px] text-muted-foreground">可用变量：<span className="font-mono text-foreground">{"{{creator_name}} {{campaign_title}} {{campaign_reward}} {{application_deadline}} {{campaign_url}}"}</span></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setTemplateOpen(false)}>取消</Button><Button type="button" onClick={() => { setTemplateOpen(false); onAction("“新商单自动匹配推荐达人”邮件模板已保存") }}><MailCheck className="h-4 w-4" />保存模板</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
