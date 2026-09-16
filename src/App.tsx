import { lazy, Suspense, useState } from "react"
import { TopHeader, type PageKey } from "@/components/top-header"

const OverviewPage = lazy(() => import("@/pages/overview-page").then((module) => ({ default: module.OverviewPage })))
const DailyPage = lazy(() => import("@/pages/daily-page").then((module) => ({ default: module.DailyPage })))
const AutomationPage = lazy(() => import("@/pages/automation-page").then((module) => ({ default: module.AutomationPage })))

function PageSkeleton() {
  return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-lg bg-muted" />)}</div><div className="h-80 animate-pulse rounded-lg bg-muted" /></div>
}

export default function App() {
  const [page, setPage] = useState<PageKey>("overview")
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <TopHeader page={page} onNavigate={setPage} />
      <main className="w-full px-4 pb-10 pt-36 sm:px-6 sm:pt-24 lg:px-10 lg:pb-12 lg:pt-[104px] xl:px-12 2xl:px-16">
        <Suspense fallback={<PageSkeleton />}>
          {page === "overview" ? <OverviewPage /> : page === "daily" ? <DailyPage /> : <AutomationPage />}
        </Suspense>
      </main>
    </div>
  )
}
