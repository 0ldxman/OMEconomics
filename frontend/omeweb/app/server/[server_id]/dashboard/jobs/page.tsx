"use client"

import * as React from "react"
import {
  Briefcase,
  Clock,
  CheckCircle2,
  Timer,
  Users,
  User,
  Calendar,
  Tag,
  Info,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Activity,
  UserPlus,
  Coins,
  History,
  ExternalLink,
  Copy,
  ArrowUpDown,
  Search,
  Filter,
} from "lucide-react"

import {
  Pie,
  PieChart,
  Cell,
  Label,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
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

// --- TYPES ---
type Worker = {
  id: number
  name: string
  avatar?: string
  started_at: string
}

type Task = {
  id: string
  name: string
  description: string
  tags: string[]
  status: "pending" | "in_progress" | "completed" | "cancelled"
  creator: { name: string; avatar?: string; wallet_id: number }
  created_at: string
  updated_at: string
  closed_at?: string
  price: number
  deposit_percent: number
  workers: Worker[]
}

// --- MOCK DATA ---
const mockTasks: Task[] = [
  {
    id: "T-1001",
    name: "Разработка дизайна логотипа",
    description: "Необходимо создать минималистичный логотип для новой организации 'OMEGA'. Предпочтительные цвета: синий и белый.",
    tags: ["Дизайн", "Графика"],
    status: "in_progress",
    creator: { name: "CEO_Omega", wallet_id: 10001 },
    created_at: "2026-06-01 12:00",
    updated_at: "2026-06-05 15:30",
    price: 5000,
    deposit_percent: 100,
    workers: [
      { id: 20001, name: "Artist_X", started_at: "2026-06-02 09:00" },
      { id: 20002, name: "SketchMaster", started_at: "2026-06-02 10:30" }
    ]
  },
  {
    id: "T-1002",
    name: "Написание бота для Discord",
    description: "Нужен простой бот для модерации чата и выдачи ролей по командам.",
    tags: ["Программирование", "Бот"],
    status: "pending",
    creator: { name: "Moderator_Joe", wallet_id: 10002 },
    created_at: "2026-06-04 10:00",
    updated_at: "2026-06-04 10:00",
    price: 3500,
    deposit_percent: 50,
    workers: []
  },
  {
    id: "T-1003",
    name: "Перевод документации",
    description: "Перевод 10 страниц технического текста с английского на русский.",
    tags: ["Текст", "Перевод"],
    status: "completed",
    creator: { name: "Translator_Pro", wallet_id: 10003 },
    created_at: "2026-05-28 14:00",
    updated_at: "2026-06-01 18:00",
    closed_at: "2026-06-01 18:00",
    price: 2000,
    deposit_percent: 100,
    workers: [
      { id: 20005, name: "Translator_Pro", started_at: "2026-05-29 11:00" }
    ]
  },
  {
    id: "T-1004",
    name: "Организация ивента",
    description: "Проведение турнира по мини-играм в эти выходные.",
    tags: ["Ивент", "Организация"],
    status: "in_progress",
    creator: { name: "EventMaker", wallet_id: 10004 },
    created_at: "2026-06-05 08:00",
    updated_at: "2026-06-06 10:00",
    price: 1500,
    deposit_percent: 75,
    workers: [
      { id: 20008, name: "Host_Anna", started_at: "2026-06-06 09:00" }
    ]
  }
]

const activityData = [
  { name: "В работе", value: mockTasks.filter(t => t.status === "in_progress").length, fill: "#3b82f6" },
  { name: "Ожидают", value: mockTasks.filter(t => t.status === "pending").length, fill: "#64748b" },
]

const chartConfig = {
  active: { label: "В работе", color: "#3b82f6" },
  pending: { label: "Ожидают", color: "#64748b" },
} satisfies ChartConfig

// --- COMPONENTS ---

const CreatorHoverCard = ({ creator }: { creator: Task['creator'] }) => {
  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(creator.wallet_id.toString())
    toast.success("ID кошелька скопирован")
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-help w-fit group/creator">
          <Avatar className="h-6 w-6 border">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`} />
            <AvatarFallback className="text-[10px]">{creator.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold group-hover/creator:text-primary transition-colors">{creator.name}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-4 shadow-xl border-2" side="top">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`} />
              <AvatarFallback>{creator.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">{creator.name}</span>
              <span className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-tighter">Работодатель</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ID Кошелька</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 relative rounded bg-muted px-2 py-1 font-mono text-[11px] font-semibold overflow-hidden text-ellipsis italic">
                {creator.wallet_id}
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

const TaskRow = ({ task }: { task: Task }) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasWorkers = task.workers.length > 0

  const statusColors = {
    pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  const statusLabels = {
    pending: "Ожидание",
    in_progress: "В работе",
    completed: "Завершено",
    cancelled: "Отменено",
  }

  return (
    <>
      <TableRow 
        className={cn(
          "group transition-colors",
          hasWorkers ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/10"
        )}
        onClick={() => hasWorkers && setIsExpanded(!isExpanded)}
      >
        <TableCell className="py-4">
          <div className="flex items-center gap-2">
            {hasWorkers && (
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            )}
            <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
              #{task.id}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("text-[9px] font-black uppercase w-fit", statusColors[task.status])}>
            {statusLabels[task.status]}
          </Badge>
        </TableCell>
        <TableCell>
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <div className="flex flex-col gap-0.5 cursor-help">
                <span className="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                  {task.name}
                </span>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map(tag => (
                    <span key={tag} className="text-[8px] font-bold text-muted-foreground/70 uppercase">#{tag}</span>
                  ))}
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 border-2 shadow-xl" side="top" align="start">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-black uppercase">{task.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3 py-1">
                  {task.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[9px] uppercase font-black px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </TableCell>
        <TableCell>
          <CreatorHoverCard creator={task.creator} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold">
            <Clock className="h-3 w-3" /> {task.created_at}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 font-medium italic">
            <History className="h-3 w-3" /> {task.updated_at}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-black text-emerald-500 tabular-nums text-sm">{task.price.toLocaleString()} OMC</span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end gap-1">
            <span className={cn(
              "text-base font-black tabular-nums",
              task.deposit_percent === 100 ? "text-emerald-500" : "text-orange-500"
            )}>
              {task.deposit_percent}%
            </span>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Workers View */}
      {isExpanded && hasWorkers && (
        <TableRow className="bg-muted/20 border-l-4 border-l-primary/40">
          <TableCell colSpan={8} className="p-0">
            <div className="p-4 flex flex-wrap gap-3">
              {task.workers.map(worker => (
                <div key={worker.id} className="flex items-center gap-2.5 p-2 pr-4 rounded-lg border bg-background/50 group/worker hover:border-primary/30 transition-all w-fit">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.name}`} />
                    <AvatarFallback>{worker.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold leading-none">{worker.name}</span>
                    <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                      <Timer className="h-2.5 w-2.5" /> {worker.started_at}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function JobsPage() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const lazinessIndex = 42.5 // Mock index
  const totalTasks = mockTasks.length
  const inProgressCount = mockTasks.filter(t => t.status === "in_progress").length

  return (
    <div className="flex flex-col gap-6 py-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Биржа труда</h1>
          <p className="text-muted-foreground">Управление задачами, мониторинг исполнителей и оплаты труда</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Card */}
        <Card className="flex flex-col overflow-hidden border-primary/10 bg-primary/[0.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Активность биржи
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex flex-col md:flex-row items-center justify-center min-h-[220px]">
            <div className="relative aspect-square max-h-[160px] w-full md:w-1/2">
              <ChartContainer
                config={chartConfig}
                className="size-full"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={activityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={70}
                    stroke="hsl(var(--background))"
                    strokeWidth={4}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-black tabular-nums">
                                {totalTasks}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-[8px] uppercase font-bold tracking-widest">
                                Задач
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
          </CardContent>
        </Card>

        {/* Laziness Index Card */}
        <Card className="flex flex-col overflow-hidden border-red-500/20 h-full p-0">
          <div className="flex flex-col h-full">
            <div className="bg-red-500/10 p-6 flex flex-col items-center justify-center flex-1">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-4 w-4 text-red-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-red-600">Индекс лени</span>
              </div>
              <div className="text-7xl font-black tracking-tighter text-red-600 leading-none">
                {lazinessIndex.toFixed(1)}%
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по задачам..."
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 font-bold h-9">
              <Filter className="h-4 w-4" /> Фильтры
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  ID <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Статус <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Название <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Работодатель <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Создано <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Изменено <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Оплата <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-wider">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Депозит <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
