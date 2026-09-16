import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  CheckCircle2,
  CirclePause,
  Clock3,
  FileCode2,
  Mail,
  MailCheck,
  MessageSquareText,
  RefreshCw,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  WandSparkles,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { SectionHeading } from "@/components/dashboard-primitives"
import {
  creatorAutomationRules,
  creatorErrorLogs,
  feedbackTickets,
  noApplicationWarnings,
  reviewTimeoutWarnings,
  type CreatorRuleId,
  type ErrorLog,
  type FeedbackTicket,
} from "@/data/automation-data"
import { cn, number } from "@/lib/utils"

const creatorRuleIcons: Record<CreatorRuleId, LucideIcon> = {
  "new-registration": UserRoundCheck,
  "new-certified": Sparkles,
  inactive: UsersRound,
}

const creatorRuleTones: Record<CreatorRuleId, string> = {
  "new-registration": "bg-violet-50 text-violet-600",
  "new-certified": "bg-amber-50 text-amber-600",
  inactive: "bg-rose-50 text-rose-600",
}

function SummaryCard({ label, value, note, icon: Icon, tone }: { label: string; value: string | number; note: string; icon: LucideIcon; tone: string }) {
  return (
    <Card className="border-0">
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0"><p className="text-[10px] font-medium text-muted-foreground">{label}</p><p className="mt-1 font-mono text-2xl font-bold tracking-[-0.04em]">{typeof value === "number" ? number.format(value) : value}</p><p className="mt-0.5 truncate text-[9px] text-muted-foreground">{note}</p></div>
      </CardContent>
    </Card>
  )
}

function AutomationPageHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2"><Badge className="border-0 bg-[#e9f9ba] text-[#304600]">Automation Center</Badge><span className="flex items-center gap-1 text-[10px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />5 条规则运行中</span></div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">自动化运营</h1>
        <p className="mt-1.5 text-xs text-muted-foreground">以规则和预警驱动达人激活、商单治理与异常问题闭环。</p>
      </div>
      <div className="flex items-center gap-3"><span className="text-[10px] text-muted-foreground">最后更新 2026-09-16 10:30:08</span><Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-3.5 w-3.5" />刷新</Button></div>
    </div>
  )
}

export function AutomationPage() {
  const [ruleStates, setRuleStates] = useState<Record<CreatorRuleId, boolean>>(() => Object.fromEntries(creatorAutomationRules.map((rule) => [rule.id, rule.enabled])) as Record<CreatorRuleId, boolean>)
  const [templateRuleId, setTemplateRuleId] = useState<CreatorRuleId | null>(null)
  const [templateDraft, setTemplateDraft] = useState({ subject: "", body: "" })
  const [lastAction, setLastAction] = useState("")
  const [processedCampaigns, setProcessedCampaigns] = useState<Set<string>>(() => new Set())
  const [activeIssueTab, setActiveIssueTab] = useState<"logs" | "tickets">("logs")
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)
  const [ticketStatuses, setTicketStatuses] = useState<Record<string, FeedbackTicket["status"]>>(() => Object.fromEntries(feedbackTickets.map((ticket) => [ticket.id, ticket.status])) as Record<string, FeedbackTicket["status"]>)

  const templateRule = creatorAutomationRules.find((rule) => rule.id === templateRuleId)

  function openTemplate(ruleId: CreatorRuleId) {
    const rule = creatorAutomationRules.find((item) => item.id === ruleId)
    if (!rule) return
    setTemplateDraft({ subject: rule.templateSubject, body: rule.templateBody })
    setTemplateRuleId(ruleId)
  }

  function markCampaignProcessed(id: string, message: string) {
    setProcessedCampaigns((current) => new Set(current).add(id))
    setLastAction(message)
  }

  function advanceTicket(ticketId: string) {
    setTicketStatuses((current) => {
      const nextStatus = current[ticketId] === "待处理" ? "处理中" : "已解决"
      setLastAction(`工单 ${ticketId} 已更新为“${nextStatus}”`)
      return { ...current, [ticketId]: nextStatus }
    })
  }

  return (
    <div className="space-y-8 pb-10">
      <AutomationPageHeader onRefresh={() => setLastAction("自动化运营数据已刷新")} />

      {lastAction ? <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{lastAction}</span><button onClick={() => setLastAction("")} className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900">关闭</button></div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="运行中规则" value={5} note="3 条达人规则 · 2 条预警规则" icon={Zap} tone="bg-violet-50 text-violet-600" />
        <SummaryCard label="待激活达人" value={1_246} note="较昨日新增 84 人" icon={UsersRound} tone="bg-amber-50 text-amber-600" />
        <SummaryCard label="待处理商单预警" value={9} note="2 个已超过 7 天" icon={AlertTriangle} tone="bg-rose-50 text-rose-600" />
        <SummaryCard label="异常与待办工单" value={11} note="6 条错误 · 5 个工单" icon={ShieldAlert} tone="bg-sky-50 text-sky-600" />
      </div>

      <section className="space-y-4">
        <SectionHeading eyebrow="Creator automation" title="达人激活自动化" description="按达人生命周期节点自动触达，并对沉默达人进行批量激活" />
        <div className="grid gap-3 xl:grid-cols-3">
          {creatorAutomationRules.map((rule) => {
            const Icon = creatorRuleIcons[rule.id]
            const enabled = ruleStates[rule.id]
            return (
              <Card key={rule.id} className="border-0">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", creatorRuleTones[rule.id])}><Icon className="h-5 w-5" /></span>
                    <div className="flex items-center gap-2"><Badge variant={enabled ? "success" : "secondary"}>{enabled ? "已启用" : "已暂停"}</Badge><Switch checked={enabled} onCheckedChange={(checked) => setRuleStates((current) => ({ ...current, [rule.id]: checked }))} aria-label={`${rule.title}开关`} /></div>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{rule.title}</h3>
                  <p className="mt-1.5 min-h-10 text-xs leading-5 text-muted-foreground">{rule.description}</p>
                  <div className="mt-4 rounded-xl bg-muted/60 p-3"><p className="text-[9px] font-medium text-muted-foreground">触发条件</p><p className="mt-1 text-[11px] font-medium">{rule.trigger}</p><p className="mt-1 text-[9px] text-muted-foreground">{rule.mode}</p></div>
                  <div className="mt-4 grid grid-cols-3 divide-x divide-border">
                    <div><p className="text-[9px] text-muted-foreground">当前人群</p><p className="mt-1 font-mono text-lg font-bold">{number.format(rule.audience)}</p></div>
                    <div className="pl-3"><p className="text-[9px] text-muted-foreground">今日触达</p><p className="mt-1 font-mono text-lg font-bold">{number.format(rule.touchedToday)}</p></div>
                    <div className="pl-3"><p className="text-[9px] text-muted-foreground">激活率</p><p className="mt-1 font-mono text-lg font-bold">{rule.successRate}</p></div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button variant="outline" size="sm" onClick={() => openTemplate(rule.id)}><Settings2 className="h-3.5 w-3.5" />邮件模板</Button>
                    {rule.id === "inactive" ? <Button size="sm" disabled={!enabled} onClick={() => setLastAction(`已将 ${number.format(rule.audience)} 封激活邮件加入发送队列`)}><Send className="h-3.5 w-3.5" />一键发送</Button> : <Button variant="ghost" size="sm" onClick={() => setLastAction(`已加载“${rule.title}”待激活名单`)}>查看人群</Button>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Campaign operations" title="商单预警与诊断" description="聚合无申请商单与品牌方审核超时问题，由运营人工确认处理" />
        <div className="grid gap-3 xl:grid-cols-2">
          <Card className="border-0">
            <CardHeader><div><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />新商单 48 小时无申请</CardTitle><CardDescription className="mt-1">建议检查报酬、达人门槛、国家和内容要求</CardDescription></div><Badge variant="warning">{noApplicationWarnings.length} 个待诊断</Badge></CardHeader>
            <CardContent className="space-y-2 pt-4">
              {noApplicationWarnings.map((campaign) => {
                const processed = processedCampaigns.has(campaign.id)
                return <div key={campaign.id} className="rounded-xl border border-border/70 p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{campaign.title}</p><p className="mt-1 text-[9px] text-muted-foreground">{campaign.brand} · {campaign.id} · 发布于 {campaign.publishedAt}</p></div><Badge variant={processed ? "success" : "warning"}>{processed ? "已诊断" : `${campaign.hours}h 无申请`}</Badge></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">曝光 {number.format(campaign.impressions)} 次</span><Button variant="ghost" size="sm" disabled={processed} onClick={() => markCampaignProcessed(campaign.id, `已生成 ${campaign.id} 的无申请诊断建议`)}><WandSparkles className="h-3.5 w-3.5" />{processed ? "诊断完成" : "开始诊断"}</Button></div></div>
              })}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader><div><CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-rose-500" />品牌方申请审核超时</CardTitle><CardDescription className="mt-1">72 小时未审核需跟进，超过 7 天建议暂停商单</CardDescription></div><Badge variant="danger">{reviewTimeoutWarnings.length} 个需处理</Badge></CardHeader>
            <CardContent className="space-y-2 pt-4">
              {reviewTimeoutWarnings.map((campaign) => {
                const processed = processedCampaigns.has(campaign.id)
                const critical = campaign.risk === "critical"
                return <div key={campaign.id} className={cn("rounded-xl border p-3.5", critical ? "border-rose-100 bg-rose-50/35" : "border-border/70")}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{campaign.title}</p><p className="mt-1 text-[9px] text-muted-foreground">{campaign.brand} · {campaign.id} · 最后审核 {campaign.lastReviewAt}</p></div><Badge variant={processed ? "success" : critical ? "danger" : "warning"}>{processed ? "已处理" : critical ? "超 7 天" : "超 72 小时"}</Badge></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">{campaign.pending} 位达人待审核 · 停留 {campaign.idleHours}h</span><Button variant={critical ? "outline" : "ghost"} size="sm" disabled={processed} onClick={() => markCampaignProcessed(campaign.id, critical ? `已暂停商单 ${campaign.id}` : `已向 ${campaign.brand} 发送审核提醒`)}>{critical ? <CirclePause className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}{critical ? "暂停商单" : "提醒品牌方"}</Button></div></div>
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Issue center" title="异常问题与反馈处理" description="查看达人端错误请求，跟进反馈工单并更新处理状态" />
        <Card className="border-0">
          <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center"><div><CardTitle>{activeIssueTab === "logs" ? "达人错误日志" : "达人反馈工单"}</CardTitle><CardDescription className="mt-1">{activeIssueTab === "logs" ? "点击操作标题查看接口请求与错误详情" : "根据优先级处理用户反馈并跟踪状态"}</CardDescription></div><div className="flex rounded-full bg-muted p-1"><button onClick={() => setActiveIssueTab("logs")} className={cn("rounded-full px-3 py-1.5 text-[11px] font-medium transition-all", activeIssueTab === "logs" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}><FileCode2 className="mr-1.5 inline h-3.5 w-3.5" />错误日志</button><button onClick={() => setActiveIssueTab("tickets")} className={cn("rounded-full px-3 py-1.5 text-[11px] font-medium transition-all", activeIssueTab === "tickets" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}><MessageSquareText className="mr-1.5 inline h-3.5 w-3.5" />反馈工单</button></div></CardHeader>
          <CardContent className="pt-4">
            {activeIssueTab === "logs" ? (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>操作标题</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead><TableHead>请求 IP</TableHead><TableHead>用户 ID</TableHead><TableHead>创建时间</TableHead></TableRow></TableHeader>
                <TableBody>{creatorErrorLogs.map((log) => <TableRow key={log.id}><TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{log.id}</TableCell><TableCell><button onClick={() => setSelectedLog(log)} className="whitespace-nowrap text-xs font-medium text-rose-600 hover:underline">{log.action}</button></TableCell><TableCell className="text-xs">{log.type}</TableCell><TableCell><Badge variant="danger">{log.status}</Badge></TableCell><TableCell className="whitespace-nowrap font-mono text-[10px]">{log.ip}</TableCell><TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{log.userId}</TableCell><TableCell className="whitespace-nowrap text-[10px] text-muted-foreground">{log.createdAt}</TableCell></TableRow>)}</TableBody>
              </Table>
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

      <Dialog open={Boolean(templateRuleId)} onOpenChange={(open) => { if (!open) setTemplateRuleId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>配置激活邮件模板</DialogTitle><DialogDescription>{templateRule?.title} · 支持 creator_name、verify_url、campaign_list 等变量</DialogDescription></DialogHeader>
          <div className="mt-5 space-y-4"><label className="block space-y-2"><span className="text-xs font-medium">邮件主题</span><Input value={templateDraft.subject} onChange={(event) => setTemplateDraft((current) => ({ ...current, subject: event.target.value }))} /></label><label className="block space-y-2"><span className="text-xs font-medium">邮件正文</span><Textarea value={templateDraft.body} onChange={(event) => setTemplateDraft((current) => ({ ...current, body: event.target.value }))} className="min-h-52 font-mono text-xs leading-5" /></label><div className="rounded-xl bg-muted p-3 text-[10px] text-muted-foreground">可用变量：<span className="font-mono text-foreground">{"{{creator_name}} {{verify_url}} {{campaign_list}} {{dashboard_url}}"}</span></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setTemplateRuleId(null)}>取消</Button><Button onClick={() => { setLastAction(`“${templateRule?.title}”邮件模板已保存`); setTemplateRuleId(null) }}><MailCheck className="h-4 w-4" />保存模板</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => { if (!open) setSelectedLog(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>请求详情</DialogTitle><DialogDescription>{selectedLog?.action} · {selectedLog?.createdAt}</DialogDescription></DialogHeader>
          {selectedLog ? <div className="mt-5 space-y-4"><div className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"><div><p className="text-[10px] text-muted-foreground">请求地址</p><p className="mt-1 break-all font-mono text-xs">{selectedLog.endpoint}</p></div><div><p className="text-[10px] text-muted-foreground">操作类型</p><p className="mt-1 text-xs">{selectedLog.type}</p></div><div><p className="text-[10px] text-muted-foreground">状态</p><Badge variant="danger" className="mt-1">{selectedLog.status}</Badge></div><div><p className="text-[10px] text-muted-foreground">请求 IP / 用户 ID</p><p className="mt-1 font-mono text-xs">{selectedLog.ip} / {selectedLog.userId}</p></div></div><div><p className="mb-2 text-xs font-semibold">输入参数</p><pre className="overflow-x-auto rounded-xl bg-[#f5f6f8] p-4 font-mono text-xs leading-5 text-slate-700">{selectedLog.input}</pre></div><div><p className="mb-2 text-xs font-semibold">输出结果</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#171c24] p-4 font-mono text-xs leading-5 text-slate-200">{selectedLog.output}</pre></div></div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedLog(null)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
