"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
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
import { TrendingUp } from "lucide-react"

// Mock Data
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
    description: "Среднее время удержания валюты" 
  },
  { 
    label: "Скорость обращения", 
    value: "12.4", 
    trend: "+1.2",
    description: "Как часто монеты меняют владельца" 
  },
  { 
    label: "Коэф. токсичной эмиссии", 
    value: "0.12", 
    trend: "-0.02",
    description: "Доля необоснованного выпуска валюты" 
  },
  { 
    label: "Коэф. Джини (локальный)", 
    value: "0.42", 
    trend: "стабильно",
    description: "Мера имущественного неравенства" 
  },
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
  { name: "general", label: "General", weight: "40%", messages: 1240, color: "var(--chart-1)" },
  { name: "trading", label: "Trading", weight: "25%", messages: 850, color: "var(--chart-2)" },
  { name: "news", label: "News", weight: "15%", messages: 420, color: "var(--chart-3)" },
  { name: "support", label: "Support", weight: "10%", messages: 210, color: "var(--chart-4)" },
]

const topPlayers = Array.from({ length: 50 }, (_, i) => ({
  name: i === 0 ? "PlayerOne" : `User_${i + 1}`,
  activity: Math.floor(1000 * Math.pow(0.95, i)),
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
  }
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
  trend: string, 
  description?: string,
  className?: string,
  inverse?: boolean
}) {
  const isPositive = trend.startsWith("+")
  const isNegative = trend.startsWith("-")
  
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
          <p className="text-[10px] text-muted-foreground leading-none">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0 flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-bold tracking-tighter">{value}</div>
        <p className={cn("text-xs mt-1 font-medium", trendColor)}>
          {trend}
        </p>
      </CardContent>
    </Card>
  )
}

export default function ServerDashboardPage() {
  const [gdpRange, setGdpRange] = React.useState("week")

  // Filter stats for different locations
  const topStats = serverStats.filter(s => ["Индекс сервера", "Индекс залипания", "Коэф. Джини (локальный)"].includes(s.label))
  const velocityStat = serverStats.find(s => s.label === "Скорость обращения")!
  const toxicStat = serverStats.find(s => s.label === "Коэф. токсичной эмиссии")!

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Top Indicators Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {topStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
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
          <CardHeader>
            <CardTitle>Экономическая активность</CardTitle>
            <CardDescription>Суммарный объем транзакций (ВВП сервера)</CardDescription>
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
            <CardTitle>Эмиссия + Активность</CardTitle>
            <CardDescription>Сравнение выпуска валюты и объема сообщений</CardDescription>
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
        <StatCard {...toxicStat} inverse className="md:col-span-1" />
      </div>

      {/* Middle Row: Channel Share (Stacked Expanded) and Top Channels Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Доля каналов в эмиссии</CardTitle>
            <CardDescription>Изменение вклада каналов со временем (кол-во сообщений)</CardDescription>
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
            <CardDescription>
              Самые активные каналы по данным последней эмиссии
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            <div className="grid gap-2">
              {topChannels.map((channel) => (
                <div 
                  key={channel.name} 
                  className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-8 w-1 rounded-full" 
                      style={{ backgroundColor: channel.color.startsWith('var') ? `oklch(var(--${channel.color.split('--')[1]}))` : channel.color }}
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium leading-none">#{channel.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Вес: {channel.weight}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{channel.messages}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">msg</p>
                  </div>
                </div>
              ))}
              {/* Добавим еще моковых данных для проверки скролла */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground shadow-xs opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-muted" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium leading-none">#archive-{i}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Вес: {5 - i}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{100 - i * 10}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">msg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Players and Activity Concentration */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 flex flex-col h-[500px]">
          <CardHeader>
            <CardTitle>Топ активности игроков</CardTitle>
            <CardDescription>
              Пользователи с наибольшим вкладом в экономику
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            <div className="grid gap-2">
              {topPlayers.map((player, i) => (
                <div 
                  key={player.name} 
                  className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">
                      {i + 1}
                    </span>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">{player.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium leading-none">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {player.activity} баллов
                      </p>
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
            <CardDescription>Доля Топ-1 пользователя в общей активности</CardDescription>
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
