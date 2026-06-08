"use client"

import * as React from "react"
import {
  TrendingUp,
  Users,
  Building2,
  Coins,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Info,
  Globe,
  Skull,
  Crown,
  MessageSquare,
  Heart,
  Paperclip,
  Server,
} from "lucide-react"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  Badge
} from "@/components/ui/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// --- MOCK DATA ---

const AU_TO_OMC_RATE = 450.5 // 1 Au = 450.5 OMC

// 1. Money Mass Data (Timeline)
const rawMoneyMassData = [
  { date: "2026-05-30", omc: 450000, au: 1200, rate: 445.0 },
  { date: "2026-05-31", omc: 480000, au: 1250, rate: 448.2 },
  { date: "2026-06-01", omc: 520000, au: 1300, rate: 450.0 },
  { date: "2026-06-02", omc: 510000, au: 1280, rate: 449.5 },
  { date: "2026-06-03", omc: 550000, au: 1350, rate: 452.1 },
  { date: "2026-06-04", omc: 590000, au: 1400, rate: 451.8 },
  { date: "2026-06-05", omc: 620000, au: 1450, rate: 450.5 },
]

// Convert Au to OMC for the chart
const moneyMassData = rawMoneyMassData.map(d => ({
  ...d,
  au_in_omc: d.au * d.rate
}))

const currentStats = {
  omc: moneyMassData[moneyMassData.length - 1].omc,
  au: moneyMassData[moneyMassData.length - 1].au,
  rate: moneyMassData[moneyMassData.length - 1].rate
}

// 2. User Activity Data (Area Chart)
const userActivityData = [
  { date: "01.06", active: 380, inactive: 70 },
  { date: "02.06", active: 410, inactive: 70 },
  { date: "03.06", active: 440, inactive: 80 },
  { date: "04.06", active: 420, inactive: 90 },
  { date: "05.06", active: 460, inactive: 100 },
  { date: "06.06", active: 490, inactive: 110 },
]

// 3. Detailed Server Emission & Activity Data
const globalTopUsers = [
  { 
    rank: 1, 
    name: "CyberNomad", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber", 
    omc: 450000, 
    au: 120, 
    messages: 1250, 
    reactions: 3400, 
    attachments: 120,
    servers: [
      { name: "Main Server", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Main", messages: 800, reactions: 2100, attachments: 45, emission: 1200 },
      { name: "RP World", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=RP", messages: 300, reactions: 900, attachments: 12, emission: 800 },
      { name: "Dev Hub", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Dev", messages: 150, reactions: 400, attachments: 63, emission: 500 },
    ]
  },
  { 
    rank: 2, 
    name: "GoldenEagle", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eagle", 
    omc: 380000, 
    au: 450, 
    messages: 850, 
    reactions: 1200, 
    attachments: 45,
    servers: [
      { name: "Mining Zone", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Mining", messages: 500, reactions: 800, attachments: 20, emission: 2000 },
      { name: "Main Server", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Main", messages: 350, reactions: 400, attachments: 25, emission: 1200 },
    ]
  },
  { 
    rank: 3, 
    name: "TradeMaster", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Trade", 
    omc: 310000, 
    au: 85, 
    messages: 2100, 
    reactions: 5600, 
    attachments: 12,
    servers: [
      { name: "Trade Hub", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Trade", messages: 1800, reactions: 4500, attachments: 8, emission: 3500 },
      { name: "Social Zone", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Social", messages: 300, reactions: 1100, attachments: 4, emission: 500 },
    ]
  },
  { rank: 4, name: "ShadowFiend", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow", omc: 285000, au: 30, messages: 450, reactions: 1500, attachments: 89, servers: [{ name: "RP World", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=RP", messages: 450, reactions: 1500, attachments: 89, emission: 1200 }] },
  { rank: 5, name: "NeoTokyo", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tokyo", omc: 240000, au: 15, messages: 3400, reactions: 890, attachments: 5, servers: [{ name: "Creative Corner", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Creative", messages: 3400, reactions: 890, attachments: 5, emission: 4500 }] },
  { rank: 6, name: "CryptoKing", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Crypto", omc: 195000, au: 200, messages: 120, reactions: 450, attachments: 34, servers: [{ name: "Trade Hub", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Trade", messages: 120, reactions: 450, attachments: 34, emission: 800 }] },
  { rank: 7, name: "Luna", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna", omc: 150000, au: 10, messages: 5600, reactions: 200, attachments: 150, servers: [{ name: "Social Zone", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Social", messages: 5600, reactions: 200, attachments: 150, emission: 3200 }] },
  { rank: 8, name: "VoidWalker", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Void", omc: 120000, au: 5, messages: 90, reactions: 600, attachments: 12, servers: [{ name: "Gaming Lab", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Game", messages: 90, reactions: 600, attachments: 12, emission: 450 }] },
  { rank: 9, name: "Zenith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zenith", omc: 95000, au: 0, messages: 200, reactions: 150, attachments: 1, servers: [{ name: "Tech World", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Tech", messages: 200, reactions: 150, attachments: 1, emission: 300 }] },
  { rank: 10, name: "PixelArt", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel", omc: 75000, au: 2, messages: 45, reactions: 80, attachments: 45, servers: [{ name: "Creative Corner", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Creative", messages: 45, reactions: 80, attachments: 45, emission: 150 }] },
  { rank: 11, name: "Hunter", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hunter", omc: 68000, au: 1, messages: 300, reactions: 500, attachments: 10, servers: [{ name: "Mining Zone", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Mining", messages: 300, reactions: 500, attachments: 10, emission: 1200 }] },
  { rank: 12, name: "Storm", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Storm", omc: 62000, au: 0, messages: 150, reactions: 200, attachments: 5, servers: [{ name: "Dev Hub", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Dev", messages: 150, reactions: 200, attachments: 5, emission: 400 }] },
  { rank: 13, name: "Phoenix", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Phoenix", omc: 55000, au: 8, messages: 800, reactions: 1200, attachments: 20, servers: [{ name: "Main Server", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Main", messages: 800, reactions: 1200, attachments: 20, emission: 2100 }] },
  { rank: 14, name: "Ghost", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost", omc: 48000, au: 0, messages: 50, reactions: 100, attachments: 0, servers: [{ name: "RP World", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=RP", messages: 50, reactions: 100, attachments: 0, emission: 150 }] },
  { rank: 15, name: "Titan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Titan", omc: 42000, au: 12, messages: 1200, reactions: 450, attachments: 30, servers: [{ name: "Mining Zone", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Mining", messages: 1200, reactions: 450, attachments: 30, emission: 2500 }] },
  { rank: 16, name: "Nova", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nova", omc: 35000, au: 0, messages: 400, reactions: 600, attachments: 15, servers: [{ name: "Creative Corner", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Creative", messages: 400, reactions: 600, attachments: 15, emission: 800 }] },
  { rank: 17, name: "Astra", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Astra", omc: 28000, au: 3, messages: 250, reactions: 300, attachments: 8, servers: [{ name: "Social Zone", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Social", messages: 250, reactions: 300, attachments: 8, emission: 400 }] },
  { rank: 18, name: "Zero", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zero", omc: 22000, au: 0, messages: 100, reactions: 150, attachments: 2, servers: [{ name: "Gaming Lab", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Game", messages: 100, reactions: 150, attachments: 2, emission: 200 }] },
  { rank: 19, name: "Rogue", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rogue", omc: 15000, au: 0, messages: 600, reactions: 800, attachments: 12, servers: [{ name: "Main Server", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Main", messages: 600, reactions: 800, attachments: 12, emission: 1200 }] },
  { rank: 20, name: "Blaze", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Blaze", omc: 10000, au: 5, messages: 150, reactions: 200, attachments: 5, servers: [{ name: "Trade Hub", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Trade", messages: 150, reactions: 200, attachments: 5, emission: 300 }] },
]

// 3. Detailed Server Emission & Activity Data
const serverEmissionData = [
  { 
    rank: 1,
    id: "s1",
    server: "Main Server", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Main",
    value: 4500, 
    fill: "#10b981",
    budget: { omc: 1250000, au: 4500 },
    users: { total: 1200, registered: 850, unique: 450 },
    channels: 12,
    topChannels: [
      { name: "general", weight: 0.45, messages: 1250, reactions: 3400, attachments: 120 },
      { name: "trading", weight: 0.35, messages: 850, reactions: 1200, attachments: 340 },
      { name: "news", weight: 0.12, messages: 150, reactions: 800, attachments: 15 },
      { name: "media", weight: 0.05, messages: 90, reactions: 450, attachments: 280 },
      { name: "support", weight: 0.03, messages: 120, reactions: 210, attachments: 5 },
    ]
  },
  { 
    rank: 2,
    id: "s2",
    server: "RP World", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=RP",
    value: 3200, 
    fill: "#3b82f6",
    budget: { omc: 850000, au: 2100 },
    users: { total: 850, registered: 620, unique: 280 },
    channels: 8,
    topChannels: [
      { name: "roleplay-main", weight: 0.60, messages: 2100, reactions: 5600, attachments: 45 },
      { name: "tavern", weight: 0.20, messages: 1200, reactions: 1500, attachments: 12 },
      { name: "lore", weight: 0.10, messages: 50, reactions: 400, attachments: 5 },
      { name: "screenshots", weight: 0.07, messages: 120, reactions: 890, attachments: 150 },
      { name: "off-topic", weight: 0.03, messages: 450, reactions: 600, attachments: 8 },
    ]
  },
  { 
    rank: 3,
    id: "s3",
    server: "Trade Hub", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Trade",
    value: 1800, 
    fill: "#f59e0b",
    budget: { omc: 420000, au: 1200 },
    users: { total: 540, registered: 410, unique: 120 },
    channels: 6,
    topChannels: [
      { name: "market", weight: 0.70, messages: 3400, reactions: 1200, attachments: 890 },
      { name: "deals", weight: 0.15, messages: 450, reactions: 300, attachments: 40 },
      { name: "feedback", weight: 0.08, messages: 120, reactions: 600, attachments: 0 },
      { name: "auctions", weight: 0.05, messages: 80, reactions: 150, attachments: 30 },
      { name: "general", weight: 0.02, messages: 200, reactions: 400, attachments: 5 },
    ]
  },
  { 
    rank: 4,
    id: "s4",
    server: "Mining Zone", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Mining",
    value: 1200, 
    fill: "#ef4444",
    budget: { omc: 180000, au: 8500 },
    users: { total: 320, registered: 210, unique: 85 },
    channels: 4,
    topChannels: [
      { name: "mining-log", weight: 0.80, messages: 5600, reactions: 200, attachments: 0 },
      { name: "equipment", weight: 0.10, messages: 120, reactions: 450, attachments: 34 },
      { name: "chat", weight: 0.05, messages: 340, reactions: 670, attachments: 12 },
      { name: "tips", weight: 0.03, messages: 45, reactions: 120, attachments: 2 },
      { name: "announcements", weight: 0.02, messages: 10, reactions: 150, attachments: 1 },
    ]
  },
  { 
    rank: 5,
    id: "s5",
    server: "Others", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Other",
    value: 800, 
    fill: "#64748b",
    budget: { omc: 50000, au: 150 },
    users: { total: 150, registered: 90, unique: 30 },
    channels: 15,
    topChannels: [
      { name: "misc", weight: 0.50, messages: 450, reactions: 800, attachments: 45 },
      { name: "test", weight: 0.20, messages: 120, reactions: 150, attachments: 12 },
      { name: "sandbox", weight: 0.15, messages: 80, reactions: 100, attachments: 8 },
      { name: "junk", weight: 0.10, messages: 200, reactions: 50, attachments: 50 },
      { name: "void", weight: 0.05, messages: 10, reactions: 20, attachments: 0 },
    ]
  },
  { 
    rank: 6,
    id: "s6",
    server: "Creative Corner", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Creative",
    value: 750, 
    fill: "#ec4899",
    budget: { omc: 35000, au: 80 },
    users: { total: 280, registered: 150, unique: 45 },
    channels: 5,
    topChannels: [
      { name: "art", weight: 0.75, messages: 1500, reactions: 4000, attachments: 1200 },
      { name: "showcase", weight: 0.25, messages: 300, reactions: 800, attachments: 150 },
    ]
  },
  { 
    rank: 7,
    id: "s7",
    server: "Dev Hub", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Dev",
    value: 600, 
    fill: "#8b5cf6",
    budget: { omc: 48000, au: 20 },
    users: { total: 420, registered: 310, unique: 90 },
    channels: 10,
    topChannels: [
      { name: "coding", weight: 0.80, messages: 2400, reactions: 1200, attachments: 45 },
      { name: "projects", weight: 0.20, messages: 400, reactions: 300, attachments: 12 },
    ]
  },
  { 
    rank: 8,
    id: "s8",
    server: "Gaming Lab", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Game",
    value: 500, 
    fill: "#06b6d4",
    budget: { omc: 22000, au: 5 },
    users: { total: 600, registered: 450, unique: 150 },
    channels: 7,
    topChannels: [
      { name: "squad-up", weight: 0.60, messages: 4500, reactions: 1500, attachments: 10 },
      { name: "clips", weight: 0.40, messages: 800, reactions: 2400, attachments: 340 },
    ]
  },
  { 
    rank: 9,
    id: "s9",
    server: "Social Zone", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Social",
    value: 450, 
    fill: "#f97316",
    budget: { omc: 15000, au: 0 },
    users: { total: 900, registered: 700, unique: 200 },
    channels: 3,
    topChannels: [
      { name: "chat", weight: 0.90, messages: 8900, reactions: 12000, attachments: 45 },
      { name: "voice-log", weight: 0.10, messages: 100, reactions: 50, attachments: 0 },
    ]
  },
  { 
    rank: 10,
    id: "s10",
    server: "Tech World", 
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Tech",
    value: 300, 
    fill: "#4ade80",
    budget: { omc: 10000, au: 2 },
    users: { total: 350, registered: 200, unique: 60 },
    channels: 4,
    topChannels: [
      { name: "hardware", weight: 0.50, messages: 450, reactions: 800, attachments: 45 },
      { name: "software", weight: 0.50, messages: 450, reactions: 800, attachments: 45 },
    ]
  },
]

// --- CONFIGS ---

const moneyMassConfig = {
  omc: { label: "OMC Mass", color: "#10b981" },
  au: { label: "Gold Mass (Au)", color: "#ca8a04" },
} satisfies ChartConfig

const userActivityConfig = {
  active: { label: "Активные", color: "#3b82f6" },
  inactive: { label: "Неактивные", color: "#64748b" },
} satisfies ChartConfig

const emissionConfig = {
  value: { label: "Эмиссия" },
} satisfies ChartConfig

export default function GlobalDashboardPage() {
  const [globalStats, setGlobalStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("http://localhost:8000/api/stats/global")
      .then(res => res.json())
      .then(data => {
        setGlobalStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch global stats:", err)
        setLoading(false)
      })
  }, [])

  // Используем реальные данные если они загружены, иначе моки для графиков
  const currentOmc = loading ? 0 : globalStats?.total_omc || 0
  const currentAu = loading ? 0 : globalStats?.total_gold || 0
  const currentRate = loading ? 450.5 : globalStats?.au_to_omc_rate || 450.5
  const totalUsersCount = loading ? 0 : globalStats?.total_users || 0

  return (
    <div className="flex flex-col gap-6 py-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Глобальный дашборд</h1>
          <p className="text-muted-foreground">Общая статистика экономической системы OME</p>
        </div>
      </div>

      {/* Money Mass and Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Money Mass - Large Area Chart */}
        <Card className="lg:col-span-3 border-border bg-card/50">
          <Tabs defaultValue="all" className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex flex-row items-center gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" /> Денежная масса
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold">Общий объем валюты в обращении (в эквиваленте OMC)</CardDescription>
                </div>
                <div className="hidden md:flex items-center gap-6 border-l pl-6 h-12">
                  <div className="flex flex-col">
                    <span className="text-[18px] font-black text-chart-2 leading-none">{currentOmc.toLocaleString()} <span className="text-[12px] opacity-70">OMC</span></span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">Всего OMC</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[18px] font-black text-yellow-500 leading-none">{currentAu.toLocaleString()} <span className="text-[12px] opacity-70">Au</span></span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">Всего Au</span>
                  </div>
                </div>
              </div>
              <TabsList className="bg-muted/50 border h-8">
                <TabsTrigger value="all" className="text-[10px] font-black uppercase px-3 h-7">Общее</TabsTrigger>
                <TabsTrigger value="omc" className="text-[10px] font-black uppercase px-3 h-7">OMC</TabsTrigger>
                <TabsTrigger value="au" className="text-[10px] font-black uppercase px-3 h-7">Au</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer config={moneyMassConfig} className="h-[350px] w-full">
                <TabsContent value="all" className="mt-0 h-full">
                  <AreaChart data={moneyMassData} margin={{ left: 0, right: 12, top: 12 }}>
                    <CartesianGrid horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.split("-").slice(1).join(".")}
                      className="text-[10px] font-bold"
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-[10px] font-bold"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="fillOmc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-omc)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-omc)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillAu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-au)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-au)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="omc"
                      type="natural"
                      fill="url(#fillOmc)"
                      stroke="var(--color-omc)"
                      strokeWidth={3}
                      stackId="a"
                    />
                    <Area
                      dataKey="au_in_omc"
                      name="au"
                      type="natural"
                      fill="url(#fillAu)"
                      stroke="var(--color-au)"
                      strokeWidth={3}
                      stackId="a"
                    />
                  </AreaChart>
                </TabsContent>
                <TabsContent value="omc" className="mt-0 h-full">
                  <AreaChart data={moneyMassData} margin={{ left: 0, right: 12, top: 12 }}>
                    <CartesianGrid horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.split("-").slice(1).join(".")}
                      className="text-[10px] font-bold"
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-[10px] font-bold"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <defs>
                      <linearGradient id="fillOmcOnly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="omc"
                      type="natural"
                      fill="url(#fillOmcOnly)"
                      stroke="#10b981"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </TabsContent>
                <TabsContent value="au" className="mt-0 h-full">
                  <AreaChart data={moneyMassData} margin={{ left: 0, right: 12, top: 12 }}>
                    <CartesianGrid horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.split("-").slice(1).join(".")}
                      className="text-[10px] font-bold"
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-[10px] font-bold"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <defs>
                      <linearGradient id="fillAuOnly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="au_in_omc"
                      name="au"
                      type="natural"
                      fill="url(#fillAuOnly)"
                      stroke="#ca8a04"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </TabsContent>
              </ChartContainer>
            </CardContent>
          </Tabs>
        </Card>

        {/* Side Column - Rate and Dead Capital */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Exchange Rate Card */}
          <Card className="flex flex-col border-border bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Курс Au → OMC
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="text-5xl font-black tracking-tighter text-foreground leading-none">
                {currentRate}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mt-4 tracking-widest">Текущий рыночный курс</div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-chart-2 uppercase bg-chart-2/5 px-2 py-1 rounded border border-chart-2/10">
                <ArrowUpRight className="h-3 w-3" /> +1.2% за 24ч
              </div>
            </CardContent>
          </Card>

          {/* Dead Capital Card */}
          <Card className="flex flex-col border-border bg-card/50 flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Skull className="h-4 w-4 text-destructive" /> Мёртвый капитал
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 flex-1">
              <div className="text-5xl font-black tracking-tighter text-destructive leading-none">
                12.4<span className="text-2xl ml-1">%</span>
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mt-4 tracking-widest text-center">Коэффициент неактивных средств</div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-destructive uppercase bg-destructive/5 px-2 py-1 rounded border border-destructive/10">
                Критический уровень
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* User Activity - Area Chart */}
          <Card className="flex flex-col border-border bg-card/50 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Активность пользователей
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Динамика активных и неактивных участников</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer config={userActivityConfig} className="h-[350px] w-full">
                <AreaChart data={userActivityData} margin={{ left: 0, right: 12, top: 12 }}>
                  <CartesianGrid horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[10px] font-bold"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[10px] font-bold"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} className="text-[10px] font-bold uppercase mt-4" />
                  <defs>
                    <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-active)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillInactive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-inactive)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-inactive)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="active"
                    type="natural"
                    fill="url(#fillActive)"
                    stroke="var(--color-active)"
                    strokeWidth={3}
                    stackId="a"
                  />
                  <Area
                    dataKey="inactive"
                    type="natural"
                    fill="url(#fillInactive)"
                    stroke="var(--color-inactive)"
                    strokeWidth={3}
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Global Top Users Card */}
          <Card className="flex flex-col border-border bg-card/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Crown className="h-4 w-4 text-chart-4" /> Глобальный топ богачей
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Самые состоятельные пользователи системы</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-6 overflow-hidden">
              <div className="flex flex-col gap-3 overflow-y-auto h-[400px] pr-2 custom-scrollbar">
                {globalTopUsers.map((user, i) => (
                  <div 
                    key={user.name} 
                    className="flex items-center justify-between rounded-lg border bg-card/40 p-3 text-card-foreground shadow-sm hover:bg-card/60 transition-all group gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0 w-[45%]">
                      {/* Rank & Crown */}
                      <div className="flex flex-col items-center justify-center w-8 shrink-0">
                        <span className="text-[10px] font-black text-muted-foreground/50">#{i + 1}</span>
                        {i < 3 && (
                          <Crown 
                            className={cn(
                              "h-4 w-4 mt-0.5 drop-shadow-md",
                              i === 0 ? "text-yellow-500 fill-yellow-500/10" : 
                              i === 1 ? "text-slate-400 fill-slate-400/10" : 
                              "text-amber-700 fill-amber-700/10"
                            )} 
                          />
                        )}
                      </div>
                      
                      {/* Avatar with Status Glow */}
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 border-2 border-border shadow-sm group-hover:border-primary/30 transition-colors">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                            {user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Name section */}
                      <div className="flex flex-col gap-1.5 min-w-0 truncate">
                        <p className="text-sm font-black leading-none truncate tracking-tight text-foreground/90">{user.name}</p>
                      </div>
                    </div>
                    
                    {/* Center: Servers */}
                    <div className="flex-1 flex justify-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer hover:scale-110 transition-transform active:scale-95 shrink-0">
                            <AvatarGroup className="transition-opacity" data-size="sm">
                              {user.servers.slice(0, 3).map((server, idx) => (
                                <Avatar key={idx} className="h-7 w-7 border-2 border-background ring-1 ring-border">
                                  <AvatarImage src={server.avatar} alt={server.name} />
                                  <AvatarFallback className="text-[10px]">{server.name.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                              ))}
                              {user.servers.length > 3 && (
                                <AvatarGroupCount className="h-7 w-7 text-[10px] border-2 border-background ring-1 ring-border">
                                  +{user.servers.length - 3}
                                </AvatarGroupCount>
                              )}
                            </AvatarGroup>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl border-border shadow-2xl backdrop-blur-xl">
                          <DialogHeader>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                              <Server className="h-4 w-4 text-primary" /> Активность {user.name}
                            </DialogTitle>
                            <div className="sr-only" data-slot="dialog-description">
                              Детальная статистика активности пользователя на различных серверах
                            </div>
                          </DialogHeader>
                          <div className="rounded-md border bg-muted/30 overflow-auto max-h-[400px] relative">
                            <table className="w-full caption-bottom text-sm border-collapse">
                              <TableHeader className="sticky top-0 z-20 shadow-sm">
                                <TableRow className="hover:bg-transparent border-b">
                                  <TableHead className="text-[10px] font-black uppercase bg-background/95 backdrop-blur-md sticky top-0">Сервер</TableHead>
                                  <TableHead className="text-center text-[10px] font-black uppercase bg-background/95 backdrop-blur-md sticky top-0">Активность</TableHead>
                                  <TableHead className="text-right text-[10px] font-black uppercase bg-background/95 backdrop-blur-md sticky top-0">Доход</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {user.servers
                                  .sort((a, b) => b.emission - a.emission)
                                  .map((server, idx) => (
                                    <TableRow key={idx} className="hover:bg-primary/5 transition-colors">
                                      <TableCell className="py-2.5">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={server.avatar} />
                                            <AvatarFallback className="text-[8px]">{server.name.substring(0, 1)}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-black text-xs">{server.name}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center py-2.5">
                                        <div className="flex items-center justify-center gap-1">
                                          <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-blue-500/20 text-blue-500 bg-blue-500/5 flex items-center gap-1">
                                            <MessageSquare className="h-2.5 w-2.5" /> {server.messages}
                                          </Badge>
                                          <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 flex items-center gap-1">
                                            <Heart className="h-2.5 w-2.5" /> {server.reactions}
                                          </Badge>
                                          <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-yellow-500/20 text-yellow-600 bg-yellow-500/5 flex items-center gap-1">
                                            <Paperclip className="h-2.5 w-2.5" /> {server.attachments}
                                          </Badge>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right py-2.5">
                                        <span className="font-black text-xs tabular-nums text-emerald-500">{server.emission.toLocaleString()} OMC</span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </table>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="flex flex-col items-end justify-center min-w-[95px] shrink-0">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-sm font-black text-emerald-500 tabular-nums tracking-tighter">
                          {user.omc.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">OMC</span>
                      </div>
                      {user.au > 0 && (
                        <div className="flex items-center justify-end gap-1.5 mt-1 leading-none">
                          <span className="text-sm font-black text-yellow-500 tabular-nums tracking-tighter">
                            {user.au.toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Au</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emission Share - Redesigned with Top Servers Table */}
        <Card className="flex flex-col border-border bg-card/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-2" /> Доли эмиссии и топ серверов
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase">Распределение последнего выпуска и активность серверов</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
              {/* Left Column: Pie Chart (2/5 width on large screens) */}
              <div className="xl:col-span-2 flex flex-col items-center justify-center">
                <ChartContainer config={emissionConfig} className="mx-auto aspect-square w-full max-w-[350px]">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={serverEmissionData}
                      dataKey="value"
                      nameKey="server"
                      innerRadius={90}
                      outerRadius={130}
                      stroke="hsl(var(--background))"
                      strokeWidth={4}
                      paddingAngle={2}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            const totalEmission = serverEmissionData.reduce((acc, curr) => acc + curr.value, 0);
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-black">
                                  {totalEmission.toLocaleString()}
                                </tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                                  OMC Эмиссия
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>

              {/* Right Column: Top Servers Table (3/5 width on large screens) */}
              <div className="xl:col-span-3 flex flex-col h-[400px]">
                <div className="rounded-md border bg-muted/30 overflow-hidden flex flex-col h-full">
                  <div className="overflow-auto flex-1 relative">
                    <table className="w-full caption-bottom text-sm border-collapse">
                      <TableHeader className="sticky top-0 z-20 shadow-sm">
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="w-[50px] text-[10px] font-black uppercase text-center bg-background/95 backdrop-blur-md sticky top-0">№</TableHead>
                          <TableHead className="text-[10px] font-black uppercase bg-background/95 backdrop-blur-md sticky top-0">Сервер</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-center bg-background/95 backdrop-blur-md sticky top-0">Пользователи</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-center bg-background/95 backdrop-blur-md sticky top-0">Каналы</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-center bg-background/95 backdrop-blur-md sticky top-0">Бюджет сервера</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase bg-background/95 backdrop-blur-md sticky top-0">Эмиссия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serverEmissionData.map((server) => (
                          <TableRow key={server.id} className="hover:bg-chart-2/5 transition-colors">
                            <TableCell className="text-center font-black text-muted-foreground">
                              {server.rank === 1 && <Crown className="h-4 w-4 mx-auto text-yellow-500 fill-yellow-500/20" />}
                              {server.rank === 2 && <Crown className="h-4 w-4 mx-auto text-slate-400 fill-slate-400/20" />}
                              {server.rank === 3 && <Crown className="h-4 w-4 mx-auto text-amber-700 fill-amber-700/20" />}
                              {server.rank > 3 && server.rank}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border-2 border-chart-2/20">
                                  <AvatarImage src={server.avatar} />
                                  <AvatarFallback className="text-[10px] font-black uppercase">{server.server.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="font-black text-sm tracking-tight">{server.server}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <HoverCard openDelay={100} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <div className="flex flex-col items-center cursor-help">
                                    <span className="text-xs font-black tabular-nums">{server.users.total}</span>
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                                      <span>{server.users.registered}р</span>
                                      <span>/</span>
                                      <span className="text-primary">{server.users.unique}у</span>
                                    </div>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-64 p-3 border-border shadow-2xl" side="top">
                                  <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Статистика участников</h4>
                                    <div className="grid gap-2 text-[11px]">
                                      <div className="flex justify-between border-b pb-1">
                                        <span className="text-muted-foreground font-bold uppercase">Зарегистрировано</span>
                                        <span className="font-black tabular-nums">{server.users.registered}</span>
                                      </div>
                                      <div className="flex justify-between border-b pb-1">
                                        <span className="text-muted-foreground font-bold uppercase">Уникальные для системы</span>
                                        <span className="font-black text-primary tabular-nums">{server.users.unique}</span>
                                      </div>
                                      <p className="text-[9px] text-muted-foreground font-medium leading-tight">
                                        Уникальные пользователи — те, кто присутствует только на этом сервере среди всех серверов системы.
                                      </p>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell className="text-center">
                              <HoverCard openDelay={100} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-muted/50 border cursor-help hover:border-chart-2/30 transition-colors">
                                    <span className="text-xs font-black text-chart-2 tabular-nums">{server.channels}</span>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-96 p-0 border-border shadow-2xl overflow-hidden" side="left">
                                  <div className="bg-chart-2/10 p-3 border-b border-chart-2/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-chart-2">Топ каналов (Эмиссия)</h4>
                                  </div>
                                  <Table>
                                    <TableHeader className="bg-muted/50">
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[9px] font-black uppercase h-8">Канал</TableHead>
                                        <TableHead className="text-center text-[9px] font-black uppercase h-8">Вес</TableHead>
                                        <TableHead className="text-right text-[9px] font-black uppercase h-8">Активность</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {server.topChannels.map((ch) => (
                                        <TableRow key={ch.name} className="hover:bg-chart-2/5 h-12">
                                          <TableCell className="py-1">
                                            <span className="text-[11px] font-bold text-foreground">#{ch.name}</span>
                                          </TableCell>
                                          <TableCell className="text-center py-1">
                                            <span className="text-[10px] font-black text-chart-2">{(ch.weight * 100).toFixed(0)}%</span>
                                          </TableCell>
                                          <TableCell className="text-right py-1">
                                            <div className="flex items-center justify-end gap-1">
                                              <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 border-blue-500/30 text-blue-500 bg-blue-500/5 flex items-center gap-1">
                                                <MessageSquare className="h-2.5 w-2.5" /> {ch.messages}
                                              </Badge>
                                              <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 flex items-center gap-1">
                                                <Heart className="h-2.5 w-2.5" /> {ch.reactions}
                                              </Badge>
                                              <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 border-yellow-500/30 text-yellow-600 bg-yellow-500/5 flex items-center gap-1">
                                                <Paperclip className="h-2.5 w-2.5" /> {ch.attachments}
                                              </Badge>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-black text-emerald-500 tabular-nums">{server.budget.omc.toLocaleString()}</span>
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase">OMC</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-black text-yellow-500 tabular-nums">{server.budget.au.toLocaleString()}</span>
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase">Au</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-emerald-500 tabular-nums">{server.value.toLocaleString()}</span>
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">OMC</span>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-3 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary transition-all group"
                                  onClick={() => window.location.href = `/server/${server.id}/dashboard`}
                                >
                                  Обзор <ArrowUpRight className="ml-1.5 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
