"use client"

import * as React from "react"
import {
  ArrowUpDown,
  Calendar as CalendarIcon,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  ShoppingBag,
  Coins,
  Store,
  Briefcase,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  PlusCircle,
  Zap,
  Activity,
  TrendingUp,
} from "lucide-react"

import {
  Label,
  Pie,
  PieChart,
  Cell,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { toast } from "sonner"

// Подробные типы транзакций согласно требованиям
const transactionTypes = {
  shop_sell: { label: "Продажа (Магазин)", icon: Store, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  shop_buy: { label: "Покупка (Магазин)", icon: ShoppingBag, color: "text-rose-500", bg: "bg-rose-500/10" },
  shop_add: { label: "Поставка (Магазин)", icon: PlusCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
  market_sell: { label: "Продажа (Рынок)", icon: Store, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  market_buy: { label: "Покупка (Рынок)", icon: ShoppingBag, color: "text-rose-500", bg: "bg-rose-500/10" },
  market_tax: { label: "Комиссия (Рынок)", icon: Info, color: "text-orange-500", bg: "bg-orange-500/10" },
  job_pay: { label: "Оплата услуг", icon: Briefcase, color: "text-rose-500", bg: "bg-rose-500/10" },
  job_gain: { label: "Гонорар", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  job_tax: { label: "Налог на доход", icon: Info, color: "text-orange-500", bg: "bg-orange-500/10" },
  org_create_buy: { label: "Пошлина", icon: Users, color: "text-rose-500", bg: "bg-rose-500/10" },
  org_create_tax: { label: "Регистрационный сбор", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  org_tax: { label: "Налог на организацию", icon: Users, color: "text-orange-500", bg: "bg-orange-500/10" },
  org_member_tax: { label: "Подушевой налог", icon: Users, color: "text-orange-500", bg: "bg-orange-500/10" },
  emission_gain: { label: "Эмиссия", icon: Coins, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  activity_pay: { label: "Выплата за активность", icon: Zap, color: "text-rose-500", bg: "bg-rose-500/10" },
  activity_gain: { label: "Доход за активность", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  gift: { label: "Перевод", icon: Gift, color: "text-purple-500", bg: "bg-purple-500/10" },
}

// Категории групп транзакций
const groupCategories = {
  shop: { label: "Магазин", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Store, chartColor: "var(--chart-1)" },
  market: { label: "Рынок", color: "text-blue-500", bg: "bg-blue-500/10", icon: ShoppingBag, chartColor: "var(--chart-2)" },
  job: { label: "Биржа труда", color: "text-orange-500", bg: "bg-orange-500/10", icon: Briefcase, chartColor: "var(--chart-3)" },
  org: { label: "Организация", color: "text-yellow-600", bg: "bg-yellow-500/10", icon: Users, chartColor: "var(--chart-4)" },
  emission: { label: "Эмиссия", color: "text-purple-500", bg: "bg-purple-500/10", icon: Coins, chartColor: "var(--chart-5)" },
}

const chartConfig = {
  shop: {
    label: "Магазин",
    color: "#10b981",
  },
  market: {
    label: "Рынок",
    color: "#3b82f6",
  },
  job: {
    label: "Биржа труда",
    color: "#f97316",
  },
  org: {
    label: "Организация",
    color: "#ca8a04",
  },
  emission: {
    label: "Эмиссия",
    color: "#a855f7",
  },
} satisfies ChartConfig

const revenueChartData = [
  { category: "shop", amount: 1500, fill: "#10b981" },
  { category: "market", amount: 400, fill: "#3b82f6" },
  { category: "org", amount: 5000, fill: "#ca8a04" },
  { category: "job", amount: 250, fill: "#f97316" },
  { category: "emission", amount: 1200, fill: "#a855f7" },
]

const eventsChartData = [
  { category: "shop", count: 12, fill: "#10b981" },
  { category: "market", count: 8, fill: "#3b82f6" },
  { category: "org", count: 3, fill: "#ca8a04" },
  { category: "job", count: 15, fill: "#f97316" },
  { category: "emission", count: 1, fill: "#a855f7" },
]

const mockGroups = [
  {
    id: 101,
    timestamp: "2026-06-06T14:20:00Z",
    category: "shop",
    description: "Продажа предмета 'VIP Карта'",
    total_server_income: 1500.0,
    transactions: [
      { id: 1, type: "shop_buy", wallet: "User#1234", wallet_id: 12345, amount: -1500.0, desc: "Оплата товара", gold_amount: -0.1 },
      { id: 2, type: "shop_sell", wallet: "Server Treasury", wallet_id: 1, amount: 1500.0, desc: "Выручка в казну", gold_amount: 0.1 },
    ]
  },
  {
    id: 102,
    timestamp: "2026-06-06T12:00:00Z",
    category: "market",
    description: "Сделка на рынке: 'Меч правосудия'",
    total_server_income: 400.0,
    transactions: [
      { id: 3, type: "market_buy", wallet: "Buyer_Pro", wallet_id: 777, amount: -8000.0, desc: "Покупка" },
      { id: 4, type: "market_sell", wallet: "Seller_X", wallet_id: 999, amount: 8000.0, desc: "Продажа" },
      { id: 5, type: "market_tax", wallet: "Seller_X", wallet_id: 999, amount: -400.0, desc: "Комиссия рынка (5%)" },
      { id: 6, type: "market_tax", wallet: "Server Treasury", wallet_id: 1, amount: 400.0, desc: "Налог со сделки" },
    ]
  },
  {
    id: 103,
    timestamp: "2026-06-05T18:30:00Z",
    category: "org",
    description: "Регистрация организации 'OME_DEV'",
    total_server_income: 5000.0,
    transactions: [
      { id: 7, type: "org_create_buy", wallet: "Founder_Bob", wallet_id: 501, amount: -5000.0, desc: "Госпошлина", gold_amount: -1.0 },
      { id: 8, type: "org_create_tax", wallet: "Server Treasury", wallet_id: 1, amount: 5000.0, desc: "Сбор за регистрацию", gold_amount: 1.0 },
    ]
  },
  {
    id: 104,
    timestamp: "2026-06-05T15:45:00Z",
    category: "job",
    description: "Выполнение контракта #442",
    total_server_income: 250.0,
    transactions: [
      { id: 9, type: "job_pay", wallet: "Client_A", wallet_id: 442, amount: -2500.0, desc: "Оплата заказа" },
      { id: 10, type: "job_gain", wallet: "Worker_B", wallet_id: 888, amount: 2500.0, desc: "Гонорар" },
      { id: 11, type: "job_tax", wallet: "Worker_B", wallet_id: 888, amount: -250.0, desc: "Налог на доход (10%)" },
      { id: 12, type: "job_tax", wallet: "Server Treasury", wallet_id: 1, amount: 250.0, desc: "Поступление налога" },
    ]
  }
]

const WalletDisplay = ({ wallet, wallet_id }: { wallet: string, wallet_id: number }) => {
  const isServer = wallet.includes("Server") || wallet.includes("Treasury")
  const isOrg = wallet.includes("Org") || wallet.includes("Organization")
  
  const avatarUrl = isServer 
    ? "https://api.dicebear.com/7.x/identicon/svg?seed=server" 
    : isOrg 
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${wallet}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${wallet}`

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(wallet_id.toString())
    toast.success("ID кошелька скопирован")
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-help w-fit group/wallet">
          <Avatar className="h-6 w-6 border bg-background">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-[10px]">{wallet[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold group-hover/wallet:text-primary transition-colors">{wallet}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-72" side="top" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{wallet[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">{wallet}</span>
              <span className="text-[10px] text-muted-foreground mt-1">
                {isServer ? "Серверный кошелёк" : isOrg ? "Кошелёк организации" : "Личный кошелёк"}
              </span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ID Кошелька</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 relative rounded bg-muted px-2 py-1 font-mono text-[11px] font-semibold overflow-hidden text-ellipsis">
                {wallet_id}
              </code>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 shrink-0"
                onClick={copyId}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default function TransactionsPage() {
  const [mounted, setMounted] = React.useState(false)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleGroup = (id: number) => {
    const next = new Set(expandedGroups)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedGroups(next)
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 py-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Реестр операций</h1>
          <p className="text-muted-foreground">Группировка транзакций по событиям и доходам сервера</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Card */}
        <Card className="flex flex-col overflow-hidden relative border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Выручка казны
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-emerald-600/70">Распределение доходов по источникам</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black tracking-tighter text-emerald-600 leading-none">
                  {revenueChartData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} OMC
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Всего</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex flex-col md:flex-row items-center gap-4">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[180px] w-full md:w-1/2"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={revenueChartData}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  strokeWidth={0}
                >
                  {revenueChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill} 
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            
            <div className="flex-1 grid grid-cols-2 gap-2 w-full md:w-auto pb-4 md:pb-0">
              {revenueChartData.map((item) => {
                const config = chartConfig[item.category as keyof typeof chartConfig]
                return (
                  <div key={item.category} className="flex flex-col p-2 rounded-lg border bg-background/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">{config.label}</span>
                    </div>
                    <div className="text-xs font-black tabular-nums">{item.amount.toLocaleString()} <span className="text-[8px] opacity-50">OMC</span></div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events Card */}
        <Card className="flex flex-col overflow-hidden relative border-blue-500/20 bg-blue-500/[0.02]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" /> Активность событий
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-blue-600/70">Количество транзакций по типам</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black tracking-tighter text-blue-600">
                  {eventsChartData.reduce((acc, curr) => acc + curr.count, 0)}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Транзакций</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex flex-col md:flex-row items-center gap-4">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[180px] w-full md:w-1/2"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={eventsChartData}
                  dataKey="count"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  strokeWidth={0}
                >
                  {eventsChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill} 
                    />
                  ))}
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
                              className="fill-foreground text-2xl font-black tabular-nums"
                            >
                              {eventsChartData.reduce((acc, curr) => acc + curr.count, 0)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground text-[10px] uppercase font-bold tracking-widest"
                            >
                              Событий
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            
            <div className="flex-1 grid grid-cols-2 gap-2 w-full md:w-auto pb-4 md:pb-0">
              {eventsChartData.map((item) => {
                const config = chartConfig[item.category as keyof typeof chartConfig]
                return (
                  <div key={item.category} className="flex flex-col p-2 rounded-lg border bg-background/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">{config.label}</span>
                    </div>
                    <div className="text-xs font-black tabular-nums">{item.count} <span className="text-[8px] opacity-50">ед.</span></div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table with Groups */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по описанию..."
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 font-bold h-9">
              <CalendarIcon className="h-4 w-4" /> Период
            </Button>
            <Button variant="outline" size="sm" className="gap-2 font-bold h-9">
              <Filter className="h-4 w-4" /> Типы
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px] px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">ID Группы</TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead className="px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">Дата и время</TableHead>
              <TableHead className="px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Тип операции</TableHead>
              <TableHead className="px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Описание</TableHead>
              <TableHead className="px-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Доход казны</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.id)
              const catConfig = groupCategories[group.category as keyof typeof groupCategories] || groupCategories.shop
              const Icon = catConfig.icon
              const date = new Date(group.timestamp)
              
              return (
                <React.Fragment key={group.id}>
                  <TableRow 
                    className={cn(
                      "group cursor-pointer transition-colors",
                      isExpanded && "bg-muted/20"
                    )} 
                    onClick={() => toggleGroup(group.id)}
                  >
                    <TableCell className="p-3">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        #{group.id}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <Button variant="ghost" size="icon-xs" className="h-6 w-6">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="p-3 whitespace-nowrap">
                      <span className="font-medium text-xs">
                        {date.toLocaleString("ru-RU", { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge variant="outline" className={cn("gap-1.5 font-bold border-none py-1 px-2", catConfig.bg, catConfig.color)}>
                        <Icon className="h-3 w-3" />
                        {catConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="font-bold">{group.description}</span>
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <span className="font-black text-emerald-500">+{group.total_server_income.toLocaleString()} OMC</span>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/40 border-t-0 animate-in fade-in slide-in-from-top-1 duration-200 hover:bg-muted/40">
                      <TableCell colSpan={6} className="p-0 border-none">
                        <div className="p-4 px-12">
                          <div className="rounded-xl border bg-card overflow-hidden shadow-md">
                            <Table>
                              <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-b">
                                  <TableHead className="h-9 px-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Кошелёк</TableHead>
                                  <TableHead className="h-9 px-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Тип транзакции</TableHead>
                                  <TableHead className="h-9 px-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Описание</TableHead>
                                  <TableHead className="h-9 px-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Сумма</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.transactions.map((tx) => {
                                  const txConfig = transactionTypes[tx.type as keyof typeof transactionTypes] || transactionTypes.gift
                                  return (
                                    <TableRow key={tx.id} className="hover:bg-muted/20 border-b last:border-0">
                                      <TableCell className="py-2.5 px-4">
                                        <WalletDisplay wallet={tx.wallet} wallet_id={tx.wallet_id} />
                                      </TableCell>
                                      <TableCell className="py-2.5 px-4">
                                        <Badge variant="outline" className={cn("text-[10px] font-bold border-none px-2 h-5", txConfig.bg, txConfig.color)}>
                                          {txConfig.label}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-2.5 px-4">
                                        <span className="text-[11px] font-medium">{tx.desc}</span>
                                      </TableCell>
                                      <TableCell className="py-2.5 px-4 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                          <span className={cn(
                                            "text-xs font-black tabular-nums",
                                            tx.amount > 0 ? "text-emerald-500" : "text-rose-500"
                                          )}>
                                            {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} OMC
                                          </span>
                                          {tx.gold_amount && (
                                            <span className="text-[10px] font-bold text-amber-500 tabular-nums">
                                              {tx.gold_amount > 0 ? "+" : ""}{tx.gold_amount} AU
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

