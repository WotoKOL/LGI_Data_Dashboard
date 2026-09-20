export type CreatorRuleId = "new-registration" | "new-certified" | "inactive"

export const creatorAutomationRules = [
  {
    id: "new-registration" as CreatorRuleId,
    title: "新注册达人激活",
    description: "注册后 72 小时未认证绑定社媒，自动发送提醒邮件。",
    trigger: "注册满 72 小时 · 未绑定社媒",
    mode: "自动执行",
    enabled: true,
    pending: 286,
    processedToday: 94,
    totalProcessed: 8_642,
    latestExecutedAt: "2026-09-17 09:30",
    successRate: "41.8%",
    templateSubject: "完成社媒认证，开启你的品牌合作",
    templateBody: "Hi {{creator_name}}，\n\n你已成功注册 LGI。完成社媒绑定后，我们将根据你的内容风格推荐更匹配的品牌合作。\n\n立即认证：{{verify_url}}",
  },
  {
    id: "new-certified" as CreatorRuleId,
    title: "新认证达人激活",
    description: "认证社媒后 72 小时未申请商单，自动匹配 3 个商单并邮件激活。",
    trigger: "认证满 72 小时 · 零商单申请",
    mode: "AI 匹配 + 自动发送",
    enabled: true,
    pending: 174,
    processedToday: 61,
    totalProcessed: 5_318,
    latestExecutedAt: "2026-09-17 09:15",
    successRate: "28.6%",
    templateSubject: "为你挑选了 3 个高匹配商单",
    templateBody: "Hi {{creator_name}}，\n\n根据你的受众、内容类型和历史表现，我们为你匹配了 3 个合适的商单。\n\n{{campaign_list}}\n\n登录查看：{{dashboard_url}}",
  },
  {
    id: "inactive" as CreatorRuleId,
    title: "不活跃达人激活",
    description: "连续 15 天无登录、申请、消息、交付等关键行为，支持批量激活。",
    trigger: "连续 15 天 · 无关键行为",
    mode: "自动执行",
    enabled: true,
    pending: 786,
    processedToday: 0,
    totalProcessed: 12_406,
    latestExecutedAt: "2026-09-16 18:42",
    successRate: "--",
    templateSubject: "有新的品牌合作正在等你",
    templateBody: "Hi {{creator_name}}，\n\n最近有一批新商单与你的账号画像高度匹配。回到 LGI 即可查看并申请。\n\n{{dashboard_url}}",
  },
]

export type ReminderPeriod = "3d" | "7d" | "30d" | "all"
export type BrandPlatform = "wotohub" | "wotokol" | "wotopartner"

export type FeedbackTicket = {
  id: string
  title: string
  creator: string
  category: string
  priority: "高" | "中" | "低"
  status: "待处理" | "处理中" | "已解决"
  updatedAt: string
}

export const feedbackTickets: FeedbackTicket[] = [
  { id: "TK-260916-018", title: "绑定 TikTok 后粉丝数一直未同步", creator: "Mia Rodriguez", category: "社媒认证", priority: "高", status: "待处理", updatedAt: "09-16 10:24" },
  { id: "TK-260916-014", title: "商单申请页面提示不可用", creator: "Nadia Putri", category: "商单申请", priority: "高", status: "处理中", updatedAt: "09-16 09:48" },
  { id: "TK-260916-009", title: "视频草稿上传失败", creator: "Chloe Bennett", category: "内容交付", priority: "中", status: "待处理", updatedAt: "09-16 08:32" },
  { id: "TK-260915-087", title: "合作款项状态与实际不符", creator: "Amelia Cruz", category: "结算付款", priority: "高", status: "处理中", updatedAt: "09-15 22:16" },
  { id: "TK-260915-063", title: "希望增加按国家筛选商单", creator: "Sofia Martin", category: "产品建议", priority: "低", status: "已解决", updatedAt: "09-15 18:05" },
]
