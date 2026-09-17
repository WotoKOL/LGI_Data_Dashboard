import { CalendarDays, ChevronDown, LayoutDashboard, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"

export type PageKey = "overview" | "daily" | "automation"

interface TopHeaderProps {
  page: PageKey
  onNavigate: (page: PageKey) => void
}

export function TopHeader({ page, onNavigate }: TopHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/95 shadow-[0_4px_18px_rgba(17,17,17,0.04)] backdrop-blur-xl">
      <div className="relative h-[124px] w-full px-4 sm:flex sm:h-[76px] sm:items-center sm:gap-3 sm:px-6 lg:px-10 xl:px-12 2xl:px-16">
        <div className="absolute left-4 top-3 flex shrink-0 items-center gap-2.5 sm:static sm:left-auto sm:top-auto">
          <img src="/logo.png" alt="LGI" className="h-10 w-10 rounded-[13px] object-cover" />
          <div className="hidden sm:block">
            <span className="text-sm font-semibold tracking-[-0.02em]">LGI Dashboard</span>
            <p className="mt-0.5 text-[9px] text-muted-foreground">运营与商业化分析</p>
          </div>
        </div>

        <nav className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/[0.07] bg-[#f0f0ed] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.85),0_2px_10px_rgba(17,17,17,.07)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" aria-label="主菜单">
          <button
            onClick={() => onNavigate("overview")}
            aria-current={page === "overview" ? "page" : undefined}
            className={cn("flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium transition-all sm:px-4 sm:text-xs", page === "overview" ? "bg-black text-white shadow-sm" : "text-foreground/55 hover:bg-white/80 hover:text-foreground")}
          >
            <LayoutDashboard className="hidden h-3.5 w-3.5 sm:block" />
            业务总览
          </button>
          <button
            onClick={() => onNavigate("daily")}
            aria-current={page === "daily" ? "page" : undefined}
            className={cn("flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium transition-all sm:px-4 sm:text-xs", page === "daily" ? "bg-black text-white shadow-sm" : "text-foreground/55 hover:bg-white/80 hover:text-foreground")}
          >
            <CalendarDays className="hidden h-3.5 w-3.5 sm:block" />
            每日数据
          </button>
          <button
            onClick={() => onNavigate("automation")}
            aria-current={page === "automation" ? "page" : undefined}
            className={cn("flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium transition-all sm:px-4 sm:text-xs", page === "automation" ? "bg-black text-white shadow-sm" : "text-foreground/55 hover:bg-white/80 hover:text-foreground")}
          >
            <Workflow className="hidden h-3.5 w-3.5 sm:block" />
            自动化运营
          </button>
        </nav>

        <button className="absolute right-4 top-3 flex h-11 items-center gap-2 py-1.5 pl-1.5 pr-1 transition-opacity hover:opacity-70 sm:static sm:right-auto sm:top-auto sm:ml-auto" aria-label="打开用户菜单">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">YU</span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold leading-tight">运营管理员</span>
            <span className="block text-[9px] text-muted-foreground">Admin</span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  )
}
