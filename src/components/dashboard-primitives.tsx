import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, number } from "@/lib/utils"

export function SectionHeading({ title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function MetricCard({ label, value, trend, note, icon: Icon, tone = "primary", className }: { label: string; value: string | number; trend?: string; note?: string; icon: LucideIcon; tone?: "primary" | "green" | "amber" | "rose"; className?: string }) {
  const tones = {
    primary: "text-primary",
    green: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  }
  const isDown = trend?.trim().startsWith("-")
  return (
    <Card className={cn("overflow-hidden border-0", className)}>
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className={cn("h-4 w-4", tones[tone])} />
        </div>
        <div className="mt-3 font-mono text-[28px] font-medium tracking-[-0.045em]">{typeof value === "number" ? number.format(value) : value}</div>
        {(trend || note) ? <div className="mt-2 flex min-h-4 items-center gap-2 border-t border-border/70 pt-2">
          {trend && <span className={cn("flex items-center text-[10px] font-semibold", isDown ? "text-rose-600" : "text-emerald-600")}>{isDown ? <ArrowDownRight className="mr-0.5 h-3 w-3" /> : <ArrowUpRight className="mr-0.5 h-3 w-3" />}{trend}</span>}
          {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
        </div> : null}
      </CardContent>
    </Card>
  )
}

export function ChartCard({ title, description, children, className, action }: { title: string; description?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <Card className={cn("border-0", className)}>
      <CardHeader>
        <div><CardTitle>{title}</CardTitle>{description && <CardDescription className="mt-1">{description}</CardDescription>}</div>
        {action ?? <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`${title}更多操作`}><MoreHorizontal className="h-4 w-4" /></Button>}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}

export function DotLegend({ items, className }: { items: { name: string; value?: number; color: string }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}>
      {items.map((item) => <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}{item.value !== undefined && <span className="font-mono font-semibold text-foreground">{number.format(item.value)}</span>}</div>)}
    </div>
  )
}
