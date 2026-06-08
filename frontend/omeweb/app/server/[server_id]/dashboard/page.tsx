"use client"

import * as React from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Sector,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import type { PieSectorShapeProps } from "recharts/types/polar/Pie"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  Paperclip, 
  Crown, 
  Wallet, 
  Users as UsersIcon, 
  ArrowUpRight, 
  ArrowDownLeft,
  Activity,
  Info,
  Coins
} from "lucide-react"

// Mock Data
const userDistributionData = [
  { type: "active", count: 156, fill: "var(--chart-1)" },
  { type: "inactive", count: 842, fill: "var(--muted)" },
  { type: "bots", count: 24, fill: "#f97316" },
]

const serverTransactions = [
  { id: 1, type: "Commission", amount: "+124.50", date: "Сегодня, 14:20", label: "Налог с продажи в магазине" },
  { id: 2, type: "Fee", amount: "+45.00", date: "Сегодня, 12:15", label: "Комиссия торговой площадки" },
  { id: 3, type: "Adjustment", amount: "-1000.00", date: "Вчера, 18:30", label: "Выплата по контракту" },
  { id: 4, type: "Tax", amount: "+12.20", date: "Вчера, 15:45", label: "Подоходный налог (эмиссия)" },
  { id: 5, type: "Commission", amount: "+210.00", date: "05.06.2026", label: "Налог с продажи предметов" },
  { id: 6, type: "Fee", amount: "+15.00", date: "04.06.2026", label: "Комиссия за перевод" },
  { id: 7, type: "Reward", amount: "-500.00", date: "03.06.2026", label: "Награда за ивент" },
]

const serverStats = [
  { 
    label: "Индекс сервера", 
    value: "1.05", 
    trend: "+2.1%",
    description: "Общий показатель здоровья экономики" 
  },
  { 
    label: "Индекс залипания", 
    value: "0.84", 
    trend: "-0.5%",
    description: "Показатель стабильности ядра аудитории" 
  },
  { 
    label: "Скорость обращения", 
    value: "12.4", 
    trend: "+1.2",
    description: "Как часто монеты меняют владельца" 
  },
  { 
    label: "Процент Токсичной Эмиссии", 
    value: "0.12", 
    trend: "-0.02",
    description: "Доля необоснованного выпуска валюты" 
  },
  { 
    label: "Коэффициент Джини", 
    value: "0.42", 
    trend: "стабильно",
    description: "Мера имущественного неравенства" 
  },
  { 
    label: "Инфляция", 
    value: "4.2%", 
    trend: "+0.5%",
    description: "Темп роста общего уровня цен" 
  },
]

const serverIndexHistory = [
  { date: "2026-06-02", value: 0.98 },
  { date: "2026-06-03", value: 1.01 },
  { date: "2026-06-04", value: 0.99 },
  { date: "2026-06-05", value: 1.03 },
  { date: "2026-06-06", value: 1.02 },
  { date: "2026-06-07", value: 1.05 },
]

const stickinessHistory = [
  { date: "2026-06-02", value: 4.1 },
  { date: "2026-06-03", value: 4.3 },
  { date: "2026-06-04", value: 4.2 },
  { date: "2026-06-05", value: 4.5 },
  { date: "2026-06-06", value: 4.4 },
  { date: "2026-06-07", value: 4.8 },
]

const giniRadialData = [
  { month: "june", value: 0.42, remaining: 0.58 }
]

const gdpData = [
  { date: "2026-05-10", activity: 45000 },
  { date: "2026-05-17", activity: 52000 },
  { date: "2026-05-24", activity: 48000 },
  { date: "2026-05-31", activity: 61000 },
  { date: "2026-06-07", activity: 55000 },
]

const emissionHistoryData = [
  { date: "17.05.2026", emission: 1200, messages: 4500 },
  { date: "24.05.2026", emission: 1500, messages: 5200 },
  { date: "31.05.2026", emission: 1100, messages: 3800 },
  { date: "07.06.2026", emission: 1800, messages: 6100 },
]

const channelStackedData = [
  { date: "17.05.2026", general: 1240, trading: 850, news: 420, support: 210, other: 150 },
  { date: "24.05.2026", general: 1100, trading: 1200, news: 380, support: 450, other: 120 },
  { date: "31.05.2026", general: 1400, trading: 900, news: 450, support: 150, other: 200 },
  { date: "07.06.2026", general: 1240, trading: 850, news: 420, support: 210, other: 150 },
]

const topChannels = [
  { name: "general", label: "General", type: "text-channel", weight: "1.2", messages: 1240, color: "var(--chart-1)" },
  { name: "trading", label: "Trading", type: "forum", weight: "0.8", messages: 850, color: "var(--chart-2)" },
  { name: "news", label: "News", type: "text-channel", weight: "1.0", messages: 420, color: "var(--chart-3)" },
  { name: "support", label: "Support", type: "thread", weight: "0.5", messages: 210, color: "var(--chart-4)" },
]

const topPlayers = Array.from({ length: 50 }, (_, i) => ({
  name: i === 0 ? "PlayerOne" : `User_${i + 1}`,
  activity: Math.floor(1000 * Math.pow(0.95, i)),
  messages: Math.floor(500 * Math.pow(0.96, i)),
  reactions: Math.floor(200 * Math.pow(0.94, i)),
  attachments: Math.floor(50 * Math.pow(0.92, i)),
  avatar: i === 0 ? "P1" : `U${i + 1}`,
  fill: i === 0 ? "var(--chart-1)" : "var(--muted)"
}))

const activityConcentrationData = [
  ...topPlayers.slice(0, 5).map((p, i) => ({
    name: p.name,
    value: p.activity,
    fill: `var(--chart-${i + 1})`
  })),
  { 
    name: "Остальные", 
    value: topPlayers.slice(5).reduce((acc, p) => acc + p.activity, 0), 
    fill: "hsl(var(--muted))" 
  },
]

const chartConfig = {
  activity: {
    label: "Активность",
    color: "var(--chart-1)",
  },
  emission: {
    label: "Эмиссия",
    color: "var(--chart-1)",
  },
  messages: {
    label: "Сообщения",
    color: "var(--chart-2)",
  },
  general: {
    label: "General",
    color: "var(--chart-1)",
  },
  trading: {
    label: "Trading",
    color: "var(--chart-2)",
  },
  news: {
    label: "News",
    color: "var(--chart-3)",
  },
  support: {
    label: "Support",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
  concentration: {
    label: "Доля в активности",
  },
  active: {
    label: "Активные",
    color: "var(--chart-1)",
  },
  inactive: {
    label: "Неактивные",
    color: "var(--muted)",
  },
  bots: {
    label: "Боты",
    color: "#f97316",
  },
} satisfies ChartConfig

function StatCard({ 
  label, 
  value, 
  trend, 
  description,
  className,
  inverse = false 
}: { 
  label: string, 
  value: string, 
  trend?: string, 
  description?: string,
  className?: string,
  inverse?: boolean
}) {
  const isPositive = trend?.startsWith("+")
  const isNegative = trend?.startsWith("-")
  
  let trendColor = "text-muted-foreground"
  if (isPositive) trendColor = inverse ? "text-rose-500" : "text-emerald-500"
  if (isNegative) trendColor = inverse ? "text-emerald-500" : "text-rose-500"

  return (
    <Card className={cn("p-6", className)}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm font-medium leading-none">
          {label}
        </CardTitle>
        {description && (
          <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0 flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-bold tracking-tighter">{value}</div>
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trendColor)}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ChartStatCard({
  label,
  value,
  trend,
  description,
  data,
  className,
  range,
  onRangeChange
}: {
  label: string,
  value: string,
  trend: string,
  description?: string,
  data: { date: string, value: number }[],
  className?: string,
  range?: string,
  onRangeChange?: (val: string) => void
}) {
  const isPositive = trend.startsWith("+")
  const trendColor = isPositive ? "text-emerald-500" : "text-rose-500"
  const chartColor = "var(--chart-1)"
  const gradientId = `fill-${label.replace(/\s+/g, "-")}`

  return (
    <Card className={cn("p-6 flex flex-col min-w-0 h-full", className)}>
      <CardHeader className="p-0 pb-2 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium leading-none">{label}</CardTitle>
          {description && (
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-tighter">{value}</div>
          <p className={cn("text-[10px] font-medium", trendColor)}>{trend}</p>
        </div>
      </CardHeader>
      <div className="mt-4 h-[120px] w-full min-w-0 overflow-visible">
        <ChartContainer 
          config={{
            value: {
              label: label,
              color: chartColor,
            }
          }}
          className="h-full w-full"
        >
          <AreaChart 
            data={data} 
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartColor}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartColor}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin - 0.05', 'dataMax + 0.05']} />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                    })
                  }}
                />
              } 
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
      {range && onRangeChange && (
        <div className="mt-2 flex justify-center">
          <ToggleGroup 
            type="single" 
            value={range} 
            onValueChange={(val) => val && onRangeChange(val)}
            className="justify-center border rounded-md p-0.5 w-fit"
          >
            <ToggleGroupItem value="week" className="text-[9px] px-1.5 h-6">Н</ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-[9px] px-1.5 h-6">М</ToggleGroupItem>
            <ToggleGroupItem value="year" className="text-[9px] px-1.5 h-6">Г</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </Card>
  )
}

function RadialStatCard({
  label,
  value,
  trend,
  description,
  data,
  className
}: {
  label: string,
  value: string,
  trend: string,
  description?: string,
  data: { month: string, value: number, remaining: number }[],
  className?: string
}) {
  const isPositive = trend.startsWith("+")
  const trendColor = isPositive ? "text-rose-500" : "text-emerald-500"

  return (
    <Card className={cn("p-6 flex flex-col min-w-0 h-full", className)}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm font-medium leading-none">{label}</CardTitle>
        {description && (
          <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <div className="mt-4 flex-1 flex items-center justify-center min-h-[160px] w-full min-w-0">
        <ChartContainer
          config={{
            value: {
              label: "Gini",
              color: "var(--chart-1)",
            },
            remaining: {
              label: "Remaining",
              color: "var(--muted)",
            },
          }}
          className="mx-auto aspect-[2/1] w-full max-w-[240px]"
        >
          <RadialBarChart
            data={data}
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={120}
            cy="100%"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 1]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              fill="var(--chart-1)"
              stackId="a"
              cornerRadius={6}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="remaining"
              fill="var(--muted)"
              stackId="a"
              cornerRadius={6}
              className="stroke-transparent stroke-2"
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 30}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {data[0].value.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 10}
                          className="fill-muted-foreground text-[10px] uppercase font-medium"
                        >
                          Коэффициент
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </div>
    </Card>
  )
}

export default function ServerDashboardPage() {
  const [mounted, setMounted] = React.useState(false)
  const [gdpRange, setGdpRange] = React.useState("week")
  const [indexRange, setIndexRange] = React.useState("week")
  const [stickinessRange, setStickinessRange] = React.useState("week")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const totalUsers = React.useMemo(() => {
    return userDistributionData.reduce((acc, curr) => acc + curr.count, 0)
  }, [])

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка дашборда...</div>
  }

  // Filter stats for different locations
  const topStats = serverStats.filter(s => ["Индекс сервера", "Индекс залипания", "Коэффициент Джини"].includes(s.label))
  const velocityStat = serverStats.find(s => s.label === "Скорость обращения")!
  const toxicStat = serverStats.find(s => s.label === "Процент Токсичной Эмиссии")!
  const inflationStat = serverStats.find(s => s.label === "Инфляция")!

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* New Top Row: Users, Budget, Transactions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* User Distribution Donut */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle className="text-sm font-medium">Аудитория сервера</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Распределение по активности</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={userDistributionData}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalUsers.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-[10px] uppercase font-medium"
                            >
                              Участников
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm pt-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>+12 новых за неделю</span>
            </div>
            <div className="leading-none text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">
              Период между последними эмиссиями
            </div>
          </CardFooter>
        </Card>

        {/* Server Budget Card */}
        <Card className="flex flex-col overflow-hidden border-chart-1/20 h-full p-0">
          <div className="flex flex-col h-full">
            <div className="bg-chart-1/10 p-6 flex flex-col items-center justify-center flex-1">
              <div className="flex items-center gap-2 mb-6">
                <Wallet className="h-4 w-4 text-chart-1" />
                <span className="text-sm font-bold uppercase tracking-widest text-chart-1">Бюджет сервера</span>
              </div>
              <div className="text-5xl font-black tracking-tighter text-chart-1 leading-none">54,200.50</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mt-3 tracking-widest">OMC Баланс</div>
            </div>
            <div className="bg-yellow-500/15 p-6 flex flex-col items-center justify-center flex-1 border-t border-yellow-500/20">
              <div className="text-5xl font-black tracking-tighter text-yellow-600 leading-none">1,250.00</div>
              <div className="text-[10px] font-bold text-yellow-700/80 uppercase mt-3 tracking-widest flex items-center gap-1.5">
                <Coins className="h-3 w-3" /> Золотой запас
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Server Transactions */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Транзакции сервера
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Последние выплаты и комиссии</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto max-h-[220px] no-scrollbar divide-y">
              {serverTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{tx.label}</span>
                    <span className="text-[10px] text-muted-foreground">{tx.date}</span>
                  </div>
                  <div className={cn(
                    "text-xs font-black tabular-nums whitespace-nowrap ml-3",
                    tx.amount.startsWith("+") ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {tx.amount} <span className="text-[10px] font-bold opacity-70">OMC</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-3 border-t bg-muted/5">
            <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest h-7" asChild>
              <a href="/server_dashboard/transactions">Все транзакции сервера</a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Top Indicators Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {topStats.map((stat) => {
          if (stat.label === "Индекс сервера") {
            return (
              <ChartStatCard 
                key={stat.label} 
                {...stat} 
                data={serverIndexHistory}
                className="h-full"
                range={indexRange}
                onRangeChange={setIndexRange}
              />
            )
          }
          if (stat.label === "Индекс залипания") {
            return (
              <ChartStatCard 
                key={stat.label} 
                {...stat} 
                data={stickinessHistory}
                className="h-full"
                range={stickinessRange}
                onRangeChange={setStickinessRange}
              />
            )
          }
          if (stat.label === "Коэффициент Джини") {
            return (
              <RadialStatCard 
                key={stat.label} 
                {...stat} 
                data={giniRadialData}
                className="h-full"
              />
            )
          }
          return <StatCard key={stat.label} {...stat} className="h-full" />
        })}
      </div>

      {/* GDP Activity Section */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1 flex flex-col gap-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium leading-none">Текущий ВВП</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">Общий объем за период</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center gap-6">
              <div className="space-y-1">
                <div className="text-4xl font-bold tracking-tighter">
                  {gdpRange === "day" ? "12,450" : 
                   gdpRange === "week" ? "254,800" : 
                   gdpRange === "month" ? "1,240,000" : "15,400,000"} OMC
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {gdpRange === "week" ? "+12% к прошлой неделе" : "Стабильный рост"}
                </p>
              </div>
              
              <ToggleGroup 
                type="single" 
                value={gdpRange} 
                onValueChange={(val) => val && setGdpRange(val)}
                className="justify-center border rounded-md p-0.5 w-fit"
              >
                <ToggleGroupItem value="day" className="text-[9px] px-1.5 h-6">D</ToggleGroupItem>
                <ToggleGroupItem value="week" className="text-[9px] px-1.5 h-6">W</ToggleGroupItem>
                <ToggleGroupItem value="month" className="text-[9px] px-1.5 h-6">M</ToggleGroupItem>
                <ToggleGroupItem value="year" className="text-[9px] px-1.5 h-6">Y</ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>
          <StatCard {...velocityStat} className="flex-1" />
        </div>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Экономическая активность</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">Суммарный объем транзакций (ВВП сервера)</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tighter">55,000 OMC</div>
              <p className="text-[10px] font-bold text-rose-500 uppercase">
                -9.8% к прошлому периоду
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={gdpData}>
                <defs>
                  <linearGradient id="fillActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.split("-").slice(1).join("/")}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="var(--chart-1)"
                  fill="url(#fillActivity)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Emission History Section */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Эмиссия</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">Сравнение выпуска валюты и объема сообщений</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={emissionHistoryData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="emission"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="messages"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="md:col-span-1 flex flex-col gap-4">
          <StatCard {...toxicStat} inverse className="flex-1" />
          <StatCard {...inflationStat} inverse className="flex-1" />
        </div>
      </div>

      {/* Middle Row: Channel Share (Stacked Expanded) and Top Channels Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Доля каналов в эмиссии</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">Изменение вклада каналов со временем (кол-во сообщений)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart
                data={channelStackedData}
                stackOffset="expand"
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis hide />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      indicator="dot" 
                      labelFormatter={(label) => `Эмиссия от ${label}`}
                    />
                  } 
                />
                <Area
                  type="monotone"
                  dataKey="general"
                  stackId="1"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="trading"
                  stackId="1"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="news"
                  stackId="1"
                  stroke="var(--chart-3)"
                  fill="var(--chart-3)"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="support"
                  stackId="1"
                  stroke="var(--chart-4)"
                  fill="var(--chart-4)"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="other"
                  stackId="1"
                  stroke="var(--chart-5)"
                  fill="var(--chart-5)"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 flex flex-col h-[450px]">
          <CardHeader>
            <CardTitle>Топ каналов</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">
              Самые активные каналы по данным последней эмиссии
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            <div className="grid gap-2">
              {topChannels.map((channel, i) => (
                <div 
                  key={channel.name} 
                  className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-6">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      {i < 3 && (
                        <Crown 
                          className={cn(
                            "h-3 w-3",
                            i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-700"
                          )} 
                        />
                      )}
                    </div>
                    <div 
                      className="h-8 w-1 rounded-full" 
                      style={{ backgroundColor: channel.color.startsWith('var') ? `oklch(var(--${channel.color.split('--')[1]}))` : channel.color }}
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium leading-none">#{channel.label}</p>
                      <p className="text-[9px] text-muted-foreground font-mono italic">
                        {channel.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right border-r pr-4">
                      <p className="text-xs font-bold">{channel.weight}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Вес</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{channel.messages}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">msg</p>
                    </div>
                  </div>
                </div>
              ))}
              {/* Добавим еще моковых данных для проверки скролла */}
              {[1, 2, 3, 4, 5].map((idx) => {
                const i = idx + topChannels.length - 1;
                const weight = (1.0 - idx * 0.1).toFixed(1);
                const type = idx % 2 === 0 ? "forum" : "text-channel";
                return (
                  <div 
                    key={i} 
                    className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground shadow-xs opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-6">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                      </div>
                      <div className="h-8 w-1 rounded-full bg-muted" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium leading-none">#archive-{idx}</p>
                        <p className="text-[9px] text-muted-foreground font-mono italic">
                          {type}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="text-right border-r pr-4">
                        <p className="text-xs font-bold">{weight}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Вес</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{100 - idx * 10}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">msg</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Players and Activity Concentration */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 flex flex-col h-[500px]">
          <CardHeader>
            <CardTitle>Топ активности игроков</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">
              Пользователи с наибольшим вкладом в экономику
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            <div className="grid gap-2">
              {topPlayers.map((player, i) => (
                <div 
                  key={player.name} 
                  className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-6">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      {i < 3 && (
                        <Crown 
                          className={cn(
                            "h-3 w-3",
                            i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-700"
                          )} 
                        />
                      )}
                    </div>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">{player.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-xs font-medium leading-none">{player.name}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 flex gap-0.5 items-center font-normal">
                          <MessageSquare className="h-2.5 w-2.5" /> {player.messages}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 flex gap-0.5 items-center font-normal">
                          <Heart className="h-2.5 w-2.5" /> {player.reactions}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 flex gap-0.5 items-center font-normal">
                          <Paperclip className="h-2.5 w-2.5" /> {player.attachments}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-500">
                      +{Math.floor(player.activity / 10)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">OMC</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Концентрация активности</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider leading-none">Доля Топ-1 пользователя в общей активности</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[350px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={activityConcentrationData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={80}
                  strokeWidth={5}
                  shape={({ 
                    index, 
                    outerRadius = 0, 
                    ...props 
                  }: PieSectorShapeProps) => 
                    index === 0 ? ( 
                      <Sector {...props} outerRadius={outerRadius + 10} /> 
                    ) : ( 
                      <Sector {...props} outerRadius={outerRadius} /> 
                    ) 
                  }
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const total = activityConcentrationData.reduce((acc, d) => acc + d.value, 0)
                        const topValue = activityConcentrationData[0].value
                        const percentage = ((topValue / total) * 100).toFixed(1)
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {percentage}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-xs uppercase"
                            >
                              Доля лидера
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Топ-1 игрок генерирует {((activityConcentrationData[0].value / activityConcentrationData.reduce((acc, d) => acc + d.value, 0)) * 100).toFixed(1)}% активности <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              На основе последних 50 активных пользователей
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
