export const dailyHourlyTrend = [
  { hour: "00:00", registered: 8, verified: 4, active: 207 },
  { hour: "01:00", registered: 6, verified: 3, active: 175 },
  { hour: "02:00", registered: 5, verified: 3, active: 153 },
  { hour: "03:00", registered: 5, verified: 3, active: 139 },
  { hour: "04:00", registered: 7, verified: 4, active: 135 },
  { hour: "05:00", registered: 11, verified: 7, active: 159 },
  { hour: "06:00", registered: 16, verified: 10, active: 231 },
  { hour: "07:00", registered: 22, verified: 14, active: 303 },
  { hour: "08:00", registered: 29, verified: 19, active: 391 },
  { hour: "09:00", registered: 35, verified: 23, active: 449 },
  { hour: "10:00", registered: 39, verified: 28, active: 484 },
  { hour: "11:00", registered: 42, verified: 31, active: 512 },
  { hour: "12:00", registered: 45, verified: 33, active: 534 },
  { hour: "13:00", registered: 44, verified: 32, active: 518 },
  { hour: "14:00", registered: 40, verified: 30, active: 502 },
  { hour: "15:00", registered: 38, verified: 28, active: 488 },
  { hour: "16:00", registered: 36, verified: 27, active: 467 },
  { hour: "17:00", registered: 33, verified: 24, active: 444 },
  { hour: "18:00", registered: 29, verified: 20, active: 417 },
  { hour: "19:00", registered: 25, verified: 18, active: 392 },
  { hour: "20:00", registered: 20, verified: 15, active: 358 },
  { hour: "21:00", registered: 17, verified: 12, active: 320 },
  { hour: "22:00", registered: 12, verified: 8, active: 274 },
  { hour: "23:00", registered: 10, verified: 6, active: 242 },
]

export const dailyCreatorRows = [
  { id: "LGI-854921", name: "Mia Rodriguez", initials: "MR", avatarTone: "bg-violet-100 text-violet-700", country: "美国", registrationType: "TikTok", social: ["TikTok", "Instagram"], time: "14:28:16" },
  { id: "LGI-854918", name: "Nadia Putri", initials: "NP", avatarTone: "bg-amber-100 text-amber-700", country: "印度尼西亚", registrationType: "Google", social: ["TikTok"], time: "14:16:42" },
  { id: "LGI-854901", name: "Chloe Bennett", initials: "CB", avatarTone: "bg-rose-100 text-rose-700", country: "英国", registrationType: "TikTok", social: ["Instagram", "YouTube"], time: "13:52:09" },
  { id: "LGI-854876", name: "Amelia Cruz", initials: "AC", avatarTone: "bg-sky-100 text-sky-700", country: "菲律宾", registrationType: "邮箱", social: ["Instagram"], time: "13:31:27" },
  { id: "LGI-854844", name: "Sofia Martin", initials: "SM", avatarTone: "bg-emerald-100 text-emerald-700", country: "加拿大", registrationType: "Google", social: ["TikTok", "YouTube"], time: "12:48:53" },
  { id: "LGI-854819", name: "Lucas Weber", initials: "LW", avatarTone: "bg-orange-100 text-orange-700", country: "德国", registrationType: "TikTok", social: ["TikTok"], time: "12:17:05" },
  { id: "LGI-854802", name: "Camille Dubois", initials: "CD", avatarTone: "bg-fuchsia-100 text-fuchsia-700", country: "法国", registrationType: "邮箱", social: ["Instagram", "YouTube"], time: "11:56:38" },
  { id: "LGI-854776", name: "Yuki Tanaka", initials: "YT", avatarTone: "bg-cyan-100 text-cyan-700", country: "日本", registrationType: "Google", social: ["YouTube"], time: "11:32:14" },
]

export const dailyPublishedCampaigns = [
  { id: "CP-90621", title: "Germany 7-in-1 Promotion", brand: "Bopcal", product: "Bopcal biteet innovative Hairstyling", budget: "1,000–2,000 EUR", commission: "5%–10%", platform: "TikTok", publishedAt: "14:22", tone: "from-amber-100 to-orange-50" },
  { id: "CP-90618", title: "Hydration Heroes US", brand: "Glow Recipe", product: "Watermelon Glow skincare set", budget: "1,500–2,800 USD", commission: "8%", platform: "Instagram", publishedAt: "13:48", tone: "from-pink-100 to-rose-50" },
  { id: "CP-90611", title: "Creator Desk Upgrade", brand: "UGREEN", product: "USB-C docking station & charger", budget: "800–1,500 USD", commission: "6%–12%", platform: "YouTube", publishedAt: "12:36", tone: "from-emerald-100 to-lime-50" },
  { id: "CP-90598", title: "Autumn Activewear Edit", brand: "Halara", product: "Cloudful air fabric collection", budget: "900–1,800 USD", commission: "10%", platform: "TikTok", publishedAt: "11:20", tone: "from-violet-100 to-purple-50" },
  { id: "CP-90592", title: "Smart Cleaning Stories", brand: "Roborock", product: "Qrevo smart robot vacuum", budget: "1,200–2,200 USD", commission: "5%", platform: "YouTube", publishedAt: "10:05", tone: "from-sky-100 to-blue-50" },
  { id: "CP-90583", title: "Everyday Color Bloom", brand: "SHEGLAM", product: "Liquid blush & lip tint set", budget: "600–1,000 USD", commission: "12%", platform: "Instagram", publishedAt: "09:18", tone: "from-rose-100 to-pink-50" },
]

export type DailySystemActivityType = "registered" | "verified" | "applied" | "approved" | "rejected"

export const dailySystemActivityFeed: Array<{
  id: string
  type: DailySystemActivityType
  actor: string
  detail: string
  time: string
}> = [
  { id: "EV-916302", type: "registered", actor: "Maya Collins", detail: "来自美国 · 通过 TikTok 完成注册", time: "14:42:18" },
  { id: "EV-916298", type: "verified", actor: "Nadia Putri", detail: "完成 Instagram 社媒认证", time: "14:38:51" },
  { id: "EV-916284", type: "applied", actor: "Lena Wilson", detail: "申请商单「Hydration Heroes US」", time: "14:31:08" },
  { id: "EV-916279", type: "approved", actor: "Nadia Putri", detail: "申请「Germany 7-in-1 Promotion」已通过", time: "14:28:42" },
  { id: "EV-916273", type: "applied", actor: "Emily Clark", detail: "申请商单「Autumn Activewear Edit」", time: "14:24:19" },
  { id: "EV-916268", type: "rejected", actor: "Alicia Gomez", detail: "申请「Creator Desk Upgrade」被拒绝", time: "14:18:57" },
  { id: "EV-916259", type: "verified", actor: "Camille Dubois", detail: "完成 YouTube 社媒认证", time: "14:15:26" },
  { id: "EV-916251", type: "approved", actor: "Sofia Martin", detail: "申请「Smart Cleaning Stories」已通过", time: "14:12:35" },
  { id: "EV-916244", type: "registered", actor: "Noah Evans", detail: "来自英国 · 通过 Google 完成注册", time: "14:09:03" },
  { id: "EV-916231", type: "rejected", actor: "Yuki Tanaka", detail: "申请「Hydration Heroes US」被拒绝", time: "13:58:44" },
]
