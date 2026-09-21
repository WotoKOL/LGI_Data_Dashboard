import { lazy, Suspense, useMemo } from "react"
import type { JoditEditorProps } from "jodit-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const JoditEditor = lazy(() => import("jodit-react"))

export function HtmlEmailEditor({
  id,
  value,
  onChange,
  className,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const config = useMemo<NonNullable<JoditEditorProps["config"]>>(() => ({
    language: "zh_cn",
    height: 340,
    minHeight: 280,
    maxHeight: 520,
    toolbarAdaptive: false,
    toolbarSticky: false,
    askBeforePasteHTML: false,
    showCharsCounter: true,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    placeholder: "请输入邮件正文，可通过工具栏排版或切换至 HTML 源码模式",
    buttons: [
      "source",
      "|",
      "undo",
      "redo",
      "|",
      "paragraph",
      "font",
      "fontsize",
      "brush",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "ul",
      "ol",
      "outdent",
      "indent",
      "|",
      "align",
      "link",
      "image",
      "table",
      "hr",
      "|",
      "preview",
      "fullsize",
    ],
  }), [])

  return (
    <div className={cn(
      "overflow-hidden rounded-xl [&_.jodit-container]:!border-border [&_.jodit-container]:!rounded-xl [&_.jodit-toolbar__box]:!border-border [&_.jodit-workplace]:!border-border",
      className,
    )}>
      <Suspense fallback={<div className="space-y-2 rounded-xl border border-border p-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>}>
        <JoditEditor id={id} value={value} config={config} onChange={onChange} />
      </Suspense>
    </div>
  )
}
