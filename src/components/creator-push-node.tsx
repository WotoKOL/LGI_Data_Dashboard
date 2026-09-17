import { useMemo, useState, type ReactNode } from "react"
import {
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Crown,
  Globe2,
  Hash,
  Mail,
  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { creatorCategoryOptions, creatorCountryOptions } from "@/data/creator-filter-options"
import { cn, number } from "@/lib/utils"

type TargetMode = "all" | "ids" | "membership" | "custom"
type Membership = "Starter" | "Growth" | "Pro"
type SocialPlatform = "youtube" | "instagram" | "tiktok"
type MessageChannel = "inbox" | "email"
type DeliveryMode = "immediate" | "scheduled"
type RangeValue = { min?: number; max?: number }
type SelectOption<T extends string> = { value: T; label: string }

const TOTAL_CREATORS = 18_642
const creatorIdPattern = /^(?:\d{6,20}|CR-\d{4,})$/i
const creatorIdSeparatorPattern = /[\s,，;；]+/
const membershipCounts: Record<Membership, number> = { Starter: 11_480, Growth: 5_386, Pro: 1_776 }
const memberships: SelectOption<Membership>[] = [
  { value: "Starter", label: "Starter" },
  { value: "Growth", label: "Growth" },
  { value: "Pro", label: "Pro" },
]
const platforms: SelectOption<SocialPlatform>[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
]
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

function toggleValue<T extends string>(current: T[], value: T) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="block min-w-0 space-y-2"><span className="block text-[10px] font-medium text-muted-foreground">{label}</span>{children}</div>
}

function MultiSelect<T extends string>({ label, options, value, onChange, searchable = false }: { label: string; options: readonly SelectOption<T>[]; value: T[]; onChange: (value: T[]) => void; searchable?: boolean }) {
  const [query, setQuery] = useState("")
  const filteredOptions = options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(query.trim().toLowerCase()))
  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label)
  return (
    <Field label={label}>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" aria-label={`${label}：${selectedLabels.length ? selectedLabels.join("、") : "不限"}`} className="h-10 w-full justify-between rounded-xl px-3 font-normal">
            <span className="truncate">{selectedLabels.length ? selectedLabels.join("、") : "不限"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                  {"value" in option && label === "达人国家" ? <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">{option.value}</span> : null}
                </button>
              )
            }) : <p className="py-6 text-center text-xs text-muted-foreground">暂无匹配选项</p>}
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

function estimateRangeFactor(value: RangeValue, kind: "followers" | "views") {
  if (value.min === undefined && value.max === undefined) return 1
  if (kind === "followers") {
    if (value.max !== undefined && value.max <= 9_999) return 0.24
    if ((value.min ?? 0) >= 1_000_000) return 0.05
    if ((value.min ?? 0) >= 500_000) return 0.09
    if ((value.min ?? 0) >= 100_000) return 0.2
    if ((value.min ?? 0) >= 10_000) return 0.46
    return 0.32
  }
  if (value.max !== undefined && value.max <= 9_999) return 0.34
  if ((value.min ?? 0) >= 500_000) return 0.06
  if ((value.min ?? 0) >= 100_000) return 0.14
  if ((value.min ?? 0) >= 50_000) return 0.2
  if ((value.min ?? 0) >= 10_000) return 0.42
  return 0.3
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

export function CreatorPushNode({ onAction }: { onAction: (message: string) => void }) {
  const [targetMode, setTargetMode] = useState<TargetMode>("all")
  const [creatorIds, setCreatorIds] = useState("887759341199857728\n842085240187959399\n887804454340957257")
  const [memberTargets, setMemberTargets] = useState<Membership[]>(["Growth", "Pro"])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US", "ID"])
  const [selectedMemberships, setSelectedMemberships] = useState<Membership[]>(["Growth"])
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(["youtube", "tiktok"])
  const [followers, setFollowers] = useState<RangeValue>({ min: 10_000, max: 99_999 })
  const [avgViews, setAvgViews] = useState<RangeValue>({ min: 10_000, max: 49_999 })
  const [channels, setChannels] = useState<MessageChannel[]>(["inbox", "email"])
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("immediate")
  const [scheduledAt, setScheduledAt] = useState(createDefaultScheduledAt)
  const [minimumScheduledAt] = useState(() => toLocalDateTimeValue(new Date()))
  const [inboxDraft, setInboxDraft] = useState({ title: "你有新的品牌合作机会", content: "Hi {{creator_name}}，我们为你准备了新的合作与运营信息，点击查看详情。" })
  const [emailDraft, setEmailDraft] = useState({ subject: "LGI 达人运营信息更新", content: "Hi {{creator_name}}，\n\n我们为你准备了新的合作与运营信息，请登录 LGI 查看详情。\n\n{{dashboard_url}}" })

  const parsedCreatorIds = useMemo(() => Array.from(new Set(creatorIds.split(creatorIdSeparatorPattern).map((item) => item.trim()).filter(Boolean))), [creatorIds])
  const validCreatorIds = parsedCreatorIds.filter((id) => creatorIdPattern.test(id))
  const memberMatchCount = memberTargets.reduce((sum, item) => sum + membershipCounts[item], 0)
  const customMatchCount = useMemo(() => {
    const categoryFactor = selectedCategories.length ? Math.min(0.82, 0.16 + (selectedCategories.length - 1) * 0.08) : 1
    const countryFactor = selectedCountries.length ? Math.min(0.88, 0.22 + (selectedCountries.length - 1) * 0.13) : 1
    const membershipFactor = selectedMemberships.length ? selectedMemberships.reduce((sum, item) => sum + membershipCounts[item], 0) / TOTAL_CREATORS : 1
    const platformFactor = selectedPlatforms.length ? Math.min(0.9, 0.55 + (selectedPlatforms.length - 1) * 0.16) : 1
    return Math.max(1, Math.round(TOTAL_CREATORS * categoryFactor * countryFactor * membershipFactor * platformFactor * estimateRangeFactor(followers, "followers") * estimateRangeFactor(avgViews, "views")))
  }, [avgViews, followers, selectedCategories.length, selectedCountries.length, selectedMemberships, selectedPlatforms.length])

  const modeOptions: { value: TargetMode; title: string; description: string; count: number; icon: typeof Globe2 }[] = [
    { value: "all", title: "全域达人", description: "覆盖全部有效达人", count: TOTAL_CREATORS, icon: Globe2 },
    { value: "ids", title: "指定达人 ID", description: "支持批量粘贴达人 ID", count: validCreatorIds.length, icon: Hash },
    { value: "membership", title: "会员版本", description: "按会员等级批量推送", count: memberMatchCount, icon: Crown },
    { value: "custom", title: "自定义筛选", description: "组合画像与数据条件", count: customMatchCount, icon: SlidersHorizontal },
  ]
  const activeCount = modeOptions.find((option) => option.value === targetMode)?.count ?? 0
  const hasValidSchedule = deliveryMode === "immediate" || scheduledAt > minimumScheduledAt

  function toggleChannel(channel: MessageChannel) {
    setChannels((current) => toggleValue(current, channel))
  }

  function createPush() {
    const deliveryText = deliveryMode === "immediate" ? "立即开始推送" : `将于 ${scheduledAt.replace("T", " ")} 定时推送`
    onAction(`达人信息推送已创建，${deliveryText}，预计通过 ${channels.length} 个渠道触达 ${number.format(activeCount)} 位达人`)
  }

  return (
    <Card className="overflow-hidden border-0">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Send className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">达人信息推送</h3><Badge variant="secondary">手动执行</Badge></div><p className="mt-1 text-xs text-muted-foreground">选择目标达人和消息渠道，向匹配人群批量推送运营信息</p></div></div>
          <p className="whitespace-nowrap text-[10px] text-muted-foreground">当前匹配 <strong className="font-mono text-xl text-foreground">{number.format(activeCount)}</strong> 位达人</p>
        </div>

        <div className="space-y-6 p-5">
          <section>
            <div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-semibold">1. 选择目标达人</h4><p className="mt-1 text-[10px] text-muted-foreground">切换模式后将实时重新估算匹配人数</p></div><Badge className="border-0 bg-[#e9f9ba] text-[#304600]">匹配 {number.format(activeCount)} 人</Badge></div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="目标达人模式">
              {modeOptions.map((option) => {
                const selected = targetMode === option.value
                const Icon = option.icon
                return <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => setTargetMode(option.value)} className={cn("rounded-xl border p-3 text-left transition-all hover:border-foreground/20", selected ? "border-black bg-black text-white shadow-sm" : "border-border/80 bg-card")}><Icon className={cn("h-4 w-4", selected ? "text-[#d4f76a]" : "text-muted-foreground")} /><p className="mt-3 text-xs font-semibold">{option.title}</p><p className={cn("mt-1 text-[9px]", selected ? "text-white/60" : "text-muted-foreground")}>{option.description}</p></button>
              })}
            </div>

            <div className="mt-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
              {targetMode === "all" ? <div className="flex items-center gap-3 py-2"><Globe2 className="h-5 w-5 text-violet-500" /><div><p className="text-xs font-semibold">将推送给全部有效达人</p><p className="mt-1 text-[10px] text-muted-foreground">已排除注销、封禁及退订对应消息渠道的账号</p></div></div> : null}
              {targetMode === "ids" ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]"><Field label="达人 ID（支持换行、逗号或空格分隔）"><Textarea aria-label="达人 ID" value={creatorIds} onChange={(event) => setCreatorIds(event.target.value)} className="min-h-28 bg-card font-mono text-xs leading-5" placeholder="输入达人 ID，每行一个" /></Field><div className="rounded-xl bg-card p-4"><p className="text-[10px] text-muted-foreground">识别结果</p><p className="mt-2 font-mono text-2xl font-bold">{validCreatorIds.length}</p><p className="mt-1 text-[10px] text-muted-foreground">个有效 ID{parsedCreatorIds.length > validCreatorIds.length ? ` · ${parsedCreatorIds.length - validCreatorIds.length} 个格式异常` : ""}</p></div></div> : null}
              {targetMode === "membership" ? <div><MultiSelect label="达人会员版本（支持多选）" options={memberships} value={memberTargets} onChange={setMemberTargets} /><p className="mt-3 text-[10px] text-muted-foreground">未选择版本时匹配人数为 0；选择多个版本时自动合并去重。</p></div> : null}
              {targetMode === "custom" ? <div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><MultiSelect label="达人分类" options={creatorCategoryOptions} value={selectedCategories} onChange={setSelectedCategories} searchable /><MultiSelect label="达人国家" options={creatorCountryOptions} value={selectedCountries} onChange={setSelectedCountries} searchable /><RangeSelect label="达人粉丝数" value={followers} presets={followerPresets} onChange={setFollowers} /><MultiSelect label="达人会员版本" options={memberships} value={selectedMemberships} onChange={setSelectedMemberships} /><MultiSelect label="达人社媒平台" options={platforms} value={selectedPlatforms} onChange={setSelectedPlatforms} /><RangeSelect label="达人平均观看量" value={avgViews} presets={viewPresets} onChange={setAvgViews} /></div><div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3"><span className="text-[10px] text-violet-700">匹配人数会随筛选条件实时更新，未设置的条件默认为不限</span><strong className="shrink-0 whitespace-nowrap font-mono text-sm text-violet-800">{number.format(customMatchCount)} 位达人</strong></div></div> : null}
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
            {channels.includes("inbox") ? <div className="rounded-2xl border border-border/70 p-4"><div className="mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-emerald-600" /><h4 className="text-xs font-semibold">站内信内容</h4><Badge variant="secondary">已启用</Badge></div><div className="space-y-4"><Field label="消息标题"><Input aria-label="消息标题" value={inboxDraft.title} onChange={(event) => setInboxDraft((current) => ({ ...current, title: event.target.value }))} /></Field><Field label="消息正文"><Textarea aria-label="消息正文" value={inboxDraft.content} onChange={(event) => setInboxDraft((current) => ({ ...current, content: event.target.value }))} className="min-h-36 text-xs leading-5" /></Field></div></div> : null}
            {channels.includes("email") ? <div className="rounded-2xl border border-border/70 p-4"><div className="mb-4 flex items-center gap-2"><Mail className="h-4 w-4 text-sky-600" /><h4 className="text-xs font-semibold">邮件内容</h4><Badge variant="secondary">已启用</Badge></div><div className="space-y-4"><Field label="邮件主题"><Input aria-label="邮件主题" value={emailDraft.subject} onChange={(event) => setEmailDraft((current) => ({ ...current, subject: event.target.value }))} /></Field><Field label="邮件正文"><Textarea aria-label="邮件正文" value={emailDraft.content} onChange={(event) => setEmailDraft((current) => ({ ...current, content: event.target.value }))} className="min-h-36 font-mono text-xs leading-5" /></Field></div></div> : null}
            <p className="text-[9px] text-muted-foreground xl:col-span-2">可用变量：<span className="font-mono text-foreground">{"{{creator_name}} {{membership}} {{dashboard_url}}"}</span></p>
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
            {deliveryMode === "scheduled" ? <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4"><Field label="计划推送时间"><div className="relative max-w-sm"><Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="datetime-local" min={minimumScheduledAt} aria-label="计划推送时间" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="bg-card pl-9" /></div></Field><p className={cn("mt-2 text-[9px]", hasValidSchedule ? "text-muted-foreground" : "text-rose-600")}>{hasValidSchedule ? "系统将按当前浏览器所在时区执行，仅支持选择未来时间。" : "计划推送时间必须晚于当前时间。"}</p></div> : null}
            <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-semibold">{deliveryMode === "immediate" ? "确认后立即推送" : "确认后创建定时任务"}</p><p className="mt-1 text-[10px] text-muted-foreground">当前匹配 {number.format(activeCount)} 位达人 · {channels.length} 个推送渠道{deliveryMode === "scheduled" && scheduledAt ? ` · ${scheduledAt.replace("T", " ")}` : ""}</p></div>
              <Button type="button" className="sm:min-w-28" disabled={!activeCount || !channels.length || !hasValidSchedule} onClick={createPush}><Send className="h-3.5 w-3.5" />创建推送</Button>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}
