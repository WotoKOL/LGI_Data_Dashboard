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

export const noApplicationWarnings = [
  { id: "CP-90582", title: "Glow Recipe 东南亚夏日护肤", cover: "/campaigns/beauty.svg", brandId: "BR-327700", publishedAt: "2026-09-13 09:20", hours: 76, impressions: 1_284, diagnosis: "曝光量正常但详情页转化偏低。建议补充产品核心卖点，并适当放宽达人国家与粉丝量级限制。" },
  { id: "CP-90561", title: "Anker 移动办公桌面改造", cover: "/campaigns/tech.svg", brandId: "BR-376843", publishedAt: "2026-09-13 18:45", hours: 67, impressions: 986, diagnosis: "商单报价低于同类科技商单均值，且交付要求较多。建议调整合作报酬或减少必选交付项。" },
  { id: "CP-90517", title: "Halara Fall Activewear", cover: "/campaigns/fashion.svg", brandId: "BR-366060", publishedAt: "2026-09-14 08:10", hours: 53, impressions: 742, diagnosis: "目标达人画像范围过窄，可匹配达人数量不足。建议放宽粉丝数范围并增加 Instagram 渠道。" },
  { id: "CP-90493", title: "FOREO 洁面仪种草计划", cover: "/campaigns/beauty.svg", brandId: "BR-379372", publishedAt: "2026-09-14 11:30", hours: 50, impressions: 691, diagnosis: "首图点击率低于美妆个护类均值。建议更换场景化主图，并在标题中突出产品利益点。" },
]

export const reviewTimeoutWarnings = [
  { id: "CP-90376", title: "Roborock Qrevo 测评", cover: "/campaigns/home.svg", brandId: "BR-327700", publishedAt: "2026-09-06 10:30", lastReviewAt: "2026-09-08 14:20", pending: 18, overdueHours: 196, risk: "critical" as const },
  { id: "CP-90411", title: "Cider Autumn Edit", cover: "/campaigns/fashion.svg", brandId: "BR-376843", publishedAt: "2026-09-07 15:10", lastReviewAt: "2026-09-09 05:45", pending: 12, overdueHours: 181, risk: "critical" as const },
  { id: "CP-90489", title: "Insta360 GO 3S Travel", cover: "/campaigns/tech.svg", brandId: "BR-366060", publishedAt: "2026-09-10 09:25", lastReviewAt: "2026-09-12 10:12", pending: 9, overdueHours: 98, risk: "warning" as const },
  { id: "CP-90502", title: "SHEGLAM Color Bloom", cover: "/campaigns/beauty.svg", brandId: "BR-379372", publishedAt: "2026-09-11 11:40", lastReviewAt: "2026-09-12 22:05", pending: 26, overdueHours: 68, risk: "warning" as const },
  { id: "CP-90529", title: "UGREEN Creator Desk", cover: "/campaigns/tech.svg", brandId: "BR-323437", publishedAt: "2026-09-12 08:15", lastReviewAt: "2026-09-13 06:40", pending: 7, overdueHours: 42, risk: "warning" as const },
]

export const newCampaignMatchingRule = {
  title: "新商单自动匹配推荐达人",
  description: "新商单发布后，自动匹配符合申请条件的达人并发送推荐邮件。",
  trigger: "新商单发布 · 状态为招募中",
  mode: "AI 匹配 + 自动推送邮件",
  enabled: true,
  pendingCampaigns: 8,
  processedCampaigns: 1_284,
  matchedToday: 436,
  applicationRate: "42.8%",
  latestExecutedAt: "2026-09-17 15:20",
  templateSubject: "发现与你高度匹配的新商单：{{campaign_title}}",
  templateBody: "Hi {{creator_name}}，\n\nLGI 为你匹配到一个新的品牌合作机会：{{campaign_title}}。该商单与你的内容类型、受众画像和账号数据高度匹配。\n\n合作报酬：{{campaign_reward}}\n申请截止：{{application_deadline}}\n\n立即查看并申请：{{campaign_url}}",
}

export type ReminderPeriod = "3d" | "7d" | "30d" | "all"
export type BrandPlatform = "wotohub" | "wotokol" | "wotopartner"
export type BrandReviewReminder = { brandId: string; platform: BrandPlatform; campaignTotal: number; pendingTotal: number }

export const brandReviewReminderRankings: Record<ReminderPeriod, BrandReviewReminder[]> = {
  "3d": [
    { brandId: "BR-327700", platform: "wotohub", campaignTotal: 12, pendingTotal: 46 },
    { brandId: "BR-376843", platform: "wotokol", campaignTotal: 9, pendingTotal: 38 },
    { brandId: "BR-366060", platform: "wotopartner", campaignTotal: 7, pendingTotal: 31 },
    { brandId: "BR-379372", platform: "wotohub", campaignTotal: 6, pendingTotal: 24 },
    { brandId: "BR-323437", platform: "wotokol", campaignTotal: 5, pendingTotal: 18 },
  ],
  "7d": [
    { brandId: "BR-376843", platform: "wotokol", campaignTotal: 21, pendingTotal: 86 },
    { brandId: "BR-327700", platform: "wotohub", campaignTotal: 26, pendingTotal: 73 },
    { brandId: "BR-366060", platform: "wotopartner", campaignTotal: 18, pendingTotal: 61 },
    { brandId: "BR-323437", platform: "wotokol", campaignTotal: 14, pendingTotal: 47 },
    { brandId: "BR-379372", platform: "wotohub", campaignTotal: 12, pendingTotal: 39 },
  ],
  "30d": [
    { brandId: "BR-366060", platform: "wotopartner", campaignTotal: 64, pendingTotal: 218 },
    { brandId: "BR-376843", platform: "wotokol", campaignTotal: 72, pendingTotal: 194 },
    { brandId: "BR-327700", platform: "wotohub", campaignTotal: 81, pendingTotal: 176 },
    { brandId: "BR-379372", platform: "wotohub", campaignTotal: 49, pendingTotal: 139 },
    { brandId: "BR-323437", platform: "wotokol", campaignTotal: 41, pendingTotal: 112 },
  ],
  all: [
    { brandId: "BR-366060", platform: "wotopartner", campaignTotal: 286, pendingTotal: 684 },
    { brandId: "BR-327700", platform: "wotohub", campaignTotal: 342, pendingTotal: 619 },
    { brandId: "BR-376843", platform: "wotokol", campaignTotal: 301, pendingTotal: 587 },
    { brandId: "BR-323437", platform: "wotokol", campaignTotal: 224, pendingTotal: 463 },
    { brandId: "BR-379372", platform: "wotohub", campaignTotal: 198, pendingTotal: 417 },
  ],
}

export type ErrorLog = {
  id: string
  action: string
  endpoint: string
  type: string
  status: string
  ip: string
  userId: string
  createdAt: string
  input: string
  output: string
}

export const creatorErrorLogs: ErrorLog[] = [
  { id: "887866378835819621", action: "达人侧商单详情", endpoint: "/lgi-ai/api/v2/campaign/creator/dealDetail", type: "接口", status: "失败", ip: "189.215.161.103", userId: "842085240187959399", createdAt: "2026-09-16 09:04:00", input: '{\n  "campaignId": "860820505077553230"\n}', output: "BizCommonException(code=A0019, msg=The business deal information does not exist or the business order has been closed. Please confirm.)\ncom.lgi.ai.manager.impl.CampaignBusinessManagerImpl.getCreatorDealDetail(CampaignBusinessManagerImpl.java:3743)\norg.apache.skywalking.apm.agent.core.plugin.interceptor.enhance.InstMethodsInter.intercept(InstMethodsInter.java:95)" },
  { id: "887859539918259316", action: "达人申请商单", endpoint: "/lgi-ai/api/v2/campaign/apply", type: "接口", status: "失败", ip: "134.228.209.191", userId: "887759341199857728", createdAt: "2026-09-16 08:36:50", input: '{\n  "campaignId": "860816492017225410",\n  "creatorId": "887759341199857728"\n}', output: "ValidationException(code=A1042, msg=Creator profile is incomplete.)\nCreatorCampaignService.apply(CreatorCampaignService.java:418)" },
  { id: "887859500407946260", action: "达人申请商单", endpoint: "/lgi-ai/api/v2/campaign/apply", type: "接口", status: "失败", ip: "134.228.209.191", userId: "887759341199857728", createdAt: "2026-09-16 08:36:41", input: '{\n  "campaignId": "860816492017225410"\n}', output: "DuplicateRequestException(code=A1028, msg=Duplicate campaign application request.)" },
  { id: "887857207100900475", action: "达人侧商单详情", endpoint: "/lgi-ai/api/v2/campaign/creator/dealDetail", type: "接口", status: "失败", ip: "97.219.76.97", userId: "853114012139821121", createdAt: "2026-09-16 08:27:34", input: '{\n  "campaignId": "860812387320855620"\n}', output: "PermissionDeniedException(code=A0031, msg=Creator cannot access this campaign.)" },
  { id: "887834606416468042", action: "LGI用户登录通过邮箱", endpoint: "/lgi-auth/api/v1/login/email", type: "接口", status: "失败", ip: "91.72.24.38", userId: "-", createdAt: "2026-09-16 06:57:45", input: '{\n  "email": "creator@example.com"\n}', output: "AuthException(code=E4012, msg=Email verification code expired.)" },
  { id: "887807879002756145", action: "根据bloggerSocialId和红人链接校验账号", endpoint: "/lgi-ai/api/v1/creator/social/validate", type: "接口", status: "失败", ip: "177.145.69.84", userId: "887804454340957257", createdAt: "2026-09-16 05:11:33", input: '{\n  "platform": "TikTok",\n  "socialId": "7350291841"\n}', output: "SocialAccountException(code=S2007, msg=The social account is already bound.)" },
]

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
