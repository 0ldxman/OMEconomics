"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { format, subDays } from "date-fns"
import { ru } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { 
  Coins, 
  Play, 
  History, 
  Users, 
  Zap, 
  ShieldCheck,
  Search,
  ChevronRight,
  BarChart3,
  CalendarDays,
  Activity,
  ArrowRight,
  Hash,
  FolderOpen,
  MessageSquare,
  BadgeDollarSign,
  ArrowDownToLine,
  UserCheck,
  Calendar as CalendarIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { useServer } from "@/context/server-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EmissionLog {
  timestamp: string
  level: string
  message: string
  details?: any
  type?: string // 'scan_step' or undefined
}

interface ScanMessage {
  author_name: string
  author_avatar: string
  content: string
  timestamp: string
}

interface ScanState {
  category: string
  channel: string
  messages: ScanMessage[]
}

export default function EmissionPage() {
  const params = useParams()
  const serverId = params.server_id
  const { serverInfo } = useServer()
  
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<EmissionLog[]>([])
  const [scanState, setScanState] = useState<ScanState | null>(null)
  const [scoringDetails, setScoringDetails] = useState<any>(null)
  const [mintingDetails, setMintingDetails] = useState<any>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [result, setResult] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 1),
    to: new Date(),
  })
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8000/ws/emission/${serverId}`)
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === "scan_step") {
        setCurrentStep(1)
        setScanState((prev) => {
          const newMessages = [data.sample, ...(prev?.messages || [])].slice(0, 3)
          return {
            category: data.sample.category_name,
            channel: data.sample.channel_name,
            messages: newMessages
          }
        })
        return
      }

      setLogs((prev) => [...prev, data])
      
      // Автоматическое переключение этапов и сохранение деталей на основе логов
      if (data.message.includes("Сбор активности")) {
        setCurrentStep(1)
      }
      if (data.message.includes("Расчет индивидуальных баллов")) {
        setCurrentStep(2)
      }
      if (data.message.includes("Скоринг завершен") && data.details) {
        setScoringDetails(data.details)
      }
      if (data.message.includes("Монетарный пул сформирован") && data.details) {
        setCurrentStep(3)
        setMintingDetails(data.details)
      }
      if (data.message.includes("Распределение")) {
        setCurrentStep(4)
      }

      if (data.level === "SUCCESS" && data.message.includes("успешно завершена")) {
        setIsRunning(false)
        setCurrentStep(4)
        if (data.details) setResult(data.details)
      }
      if (data.level === "ERROR") {
        setIsRunning(false)
      }
    }

    setWs(socket)
    return () => socket.close()
  }, [serverId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const startEmission = () => {
    if (!ws) return
    setLogs([])
    setResult(null)
    setScanState(null)
    setScoringDetails(null)
    setMintingDetails(null)
    setIsRunning(true)
    setCurrentStep(1)
    ws.send(JSON.stringify({ 
      type: "start_emission",
      from_time: date?.from?.toISOString(),
      to_time: date?.to?.toISOString()
    }))
  }

  // Рендеринг этапа Scanning
  const renderScanning = (state: ScanState) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 text-zinc-400">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <FolderOpen className="h-3 w-3 text-primary/50" />
          <span className="text-[10px] font-black uppercase tracking-widest">{state.category}</span>
        </div>
        <ChevronRight className="h-3 w-3 opacity-20" />
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <Hash className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">{state.channel}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {state.messages.slice(0, 3).map((msg, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-900/20 border border-zinc-800/30 animate-in fade-in slide-in-from-right-4 duration-500">
            <Avatar className="h-10 w-10 rounded-xl border border-zinc-800">
              <AvatarImage src={msg.author_avatar} />
              <AvatarFallback className="bg-zinc-800 text-[10px] font-bold">U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-zinc-100">{msg.author_name}</span>
                <span className="text-[8px] font-bold text-zinc-600 uppercase">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-1 italic">"{msg.content}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Рендеринг этапа Scoring
  const renderScoring = (details: any) => (
    <div className="grid gap-4 animate-in fade-in duration-700">
      {details.scoring?.map((user: any, i: number) => (
        <div key={i} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex items-center gap-6">
          <Avatar className="h-12 w-12 rounded-2xl border-2 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
            <AvatarImage src={user.author_avatar} />
            <AvatarFallback className="bg-zinc-800 font-black">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-zinc-100 uppercase tracking-tight">{user.author_name}</span>
              <span className="text-xs font-black text-primary">{user.score} <span className="text-[8px] opacity-50 uppercase tracking-widest">PTS</span></span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {user.stats.map((s: any, j: number) => (
                <div key={j} className="flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-950/50 border border-zinc-800/30 shrink-0">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-zinc-500 uppercase">
                    <MessageSquare className="h-2 w-2" /> {s.messages}
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-bold text-zinc-500 uppercase">
                    <Zap className="h-2 w-2" /> {s.reactions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Рендеринг этапа Minting
  const renderMinting = (details: any) => (
    <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-8 animate-in zoom-in-95 duration-700">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="p-4 rounded-full bg-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
          <BadgeDollarSign className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-widest text-zinc-100">Генерация OMC</h3>
      </div>

      <div className="grid gap-6">
        <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-3">
            <Play className="h-4 w-4 text-zinc-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Напечатано</span>
          </div>
          <span className="text-xl font-black text-zinc-100">+{details.minted} <span className="text-primary text-xs">OMC</span></span>
        </div>
        
        <div className="flex justify-between items-center p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="h-4 w-4 text-rose-500/50" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/70">В резервный фонд</span>
          </div>
          <span className="text-xl font-black text-rose-400">-{details.reserve} <span className="text-[10px] opacity-50">OMC</span></span>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

        <div className="flex justify-between items-center p-6 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-200">К распределению</span>
          </div>
          <span className="text-3xl font-black text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            {details.distributable} <span className="text-xs">OMC</span>
          </span>
        </div>
      </div>
    </div>
  )

  // Рендеринг этапа Payout
  const renderPayout = (details: any) => (
    <div className="grid gap-4 animate-in fade-in duration-1000">
      {details.payouts?.map((payout: any, i: number) => (
        <div key={i} className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/30 flex items-center gap-6 group hover:bg-zinc-900/50 transition-colors">
          <Avatar className="h-10 w-10 rounded-xl border border-zinc-800">
            <AvatarImage src={payout.author_avatar} />
            <AvatarFallback className="bg-zinc-800 font-bold">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex flex-col">
              <span className="text-xs font-black text-zinc-100 uppercase truncate">{payout.author_name}</span>
              <div className="flex gap-3 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Score: {payout.score}</span>
                <span>Weight: x{payout.weight}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-black text-emerald-400">+{payout.reward} <span className="text-[10px]">OMC</span></span>
              <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Зачислено</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const lastEmissionDate = serverInfo?.last_emission ? 
    new Date(serverInfo.last_emission * 1000).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : "Никогда"

  return (
    <div className="py-12 px-6 max-w-6xl mx-auto w-full space-y-16">
      {/* ... (заголовок остается прежним) ... */}
      {/* 1. Центрированный заголовок и описание */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
          <Coins className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-100">
            Эмиссия OMC
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] max-w-md mx-auto">
            Процесс создания и распределения валюты на основе активности участников
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-12">
          {/* 2. Контроллер запуска (Дизайн карточки) */}
          <div className="flex flex-col items-center gap-6">
            <div 
              onClick={!isRunning ? startEmission : undefined}
              className={cn(
                "w-full max-w-md p-8 rounded-[2.5rem] bg-zinc-900/40 hover:bg-zinc-900/60 transition-all duration-500 group cursor-pointer relative overflow-hidden",
                isRunning && "opacity-50 cursor-wait"
              )}
            >
              {/* Фоновый декор */}
              <div className="absolute -top-12 -right-12 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
                <Coins className="h-64 w-64 rotate-12 text-primary" />
              </div>
              
              <div className="flex items-center gap-8 relative z-10">
                <div className={cn(
                  "p-6 rounded-3xl transition-all duration-700 shadow-[0_0_40px_rgba(var(--primary),0.05)] group-hover:shadow-[0_0_50px_rgba(var(--primary),0.2)]",
                  isRunning ? "bg-zinc-800" : "bg-primary text-black group-hover:scale-105 group-hover:rotate-[2deg]"
                )}>
                  {isRunning ? (
                    <Activity className="h-10 w-10 animate-pulse text-primary" />
                  ) : (
                    <Play className="h-10 w-10 fill-current ml-1" />
                  )}
                </div>
                
                <div className="flex flex-col text-left space-y-1">
                  <span className={cn(
                    "text-2xl font-black uppercase tracking-[0.1em] transition-colors duration-500",
                    isRunning ? "text-zinc-500" : "text-zinc-100 group-hover:text-primary"
                  )}>
                    {isRunning ? "В процессе" : "Запуск"}
                  </span>
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] group-hover:text-zinc-400 transition-colors duration-500">
                    {isRunning ? "Анализируем активность..." : "Начать генерацию OMC"}
                  </span>
                </div>
                
                {!isRunning && (
                  <div className="ml-auto opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/30 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <CalendarDays className="h-3 w-3 text-primary/50" />
              Последний запуск: <span className="text-zinc-400">{lastEmissionDate}</span>
            </div>
          </div>

          {/* 3. Основные параметры эмиссии */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 flex flex-col items-center gap-1">
              <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Базовая база</span>
              <span className="text-lg font-black text-zinc-100">{serverInfo?.settings?.monetary?.base_emission_per_user || 1000} <span className="text-primary text-[10px]">OMC</span></span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 flex flex-col items-center gap-1">
              <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Резервный фонд</span>
              <span className="text-lg font-black text-zinc-100">{(serverInfo?.settings?.monetary?.reserve_percent || 0.1) * 100}% <span className="text-primary text-[10px]">TAX</span></span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 flex flex-col items-center gap-1">
              <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Мин. длина</span>
              <span className="text-lg font-black text-zinc-100">{serverInfo?.settings?.filters?.min_message_length || 10} <span className="text-primary text-[10px]">СИМВ</span></span>
            </div>
          </div>

          {/* 4. Лог без границ с Empty состоянием */}
          <div className="min-h-[400px] flex flex-col space-y-12">
            {logs.length === 0 && !isRunning ? (
              <Empty className="border-none bg-transparent h-full">
                <EmptyMedia>
                  <Activity className="h-12 w-12 text-zinc-800" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700">Система готова к анализу</EmptyTitle>
                  <EmptyDescription className="text-[10px] text-zinc-800 max-w-[200px] mx-auto uppercase font-bold">
                    Логи процесса появятся здесь после запуска эмиссии
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {/* Visual Step Area */}
                <div className="min-h-[200px] animate-in fade-in duration-500">
                  {currentStep === 1 && scanState && renderScanning(scanState)}
                  {currentStep === 2 && scoringDetails && renderScoring(scoringDetails)}
                  {currentStep === 3 && mintingDetails && renderMinting(mintingDetails)}
                  {currentStep === 4 && result && renderPayout(result)}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent" />

                <div 
                  ref={scrollRef}
                  className="w-full font-mono text-[11px] overflow-y-auto max-h-[400px] space-y-3 pr-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
                >
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <span className="text-zinc-700 shrink-0 font-bold tabular-nums">
                        {log.timestamp.split('T')[1].split('.')[0]}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            log.level === "SUCCESS" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                            log.level === "ERROR" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                            "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                          )} />
                          <span className={cn(
                            "text-zinc-400 group-hover:text-zinc-200 transition-colors",
                            log.level === "ERROR" && "text-rose-400 font-bold"
                          )}>
                            {log.message}
                          </span>
                        </div>
                        {log.details && !["SUCCESS", "INFO"].includes(log.level) && (
                          <div className="ml-4 p-3 bg-zinc-900/20 rounded-xl border border-zinc-800/30 text-[10px] text-zinc-500 font-medium">
                            <pre className="whitespace-pre-wrap font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 5. Дерево этапов эмиссии справа */}
        <div className="sticky top-24 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-4">
              Этапы обработки
            </h3>
            <div className="relative space-y-0 px-2">
              {[
                { step: "Scanning", desc: "Сбор активности из Discord", icon: Search },
                { step: "Scoring", desc: "Расчет баллов и коэффициентов", icon: Zap },
                { step: "Minting", desc: "Генерация новой денежной массы", icon: Coins },
                { step: "Payout", desc: "Проведение транзакций игрокам", icon: ArrowRight }
              ].map((s, i) => {
                const isCompleted = result && i < 4; // Упрощенная логика завершения
                return (
                  <div key={i} className="relative flex items-center gap-6 p-4 rounded-2xl hover:bg-zinc-900/30 transition-colors group">
                    <div className={cn(
                      "z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                      isCompleted ? "bg-primary border-primary text-black" : "bg-background border-zinc-800 text-zinc-500 group-hover:border-zinc-700"
                    )}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        isCompleted ? "text-zinc-100" : "text-zinc-500"
                      )}>{s.step}</div>
                      <div className="text-[9px] text-zinc-600 font-bold uppercase">{s.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {result && (
            <Card className="bg-primary/5 border-primary/20 animate-in zoom-in-95 duration-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Итоги эмиссии</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Всего выплачено</span>
                  <span className="text-lg font-black text-zinc-100">
                    {result.total_distributed || 0} <span className="text-primary text-[10px]">OMC</span>
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Участников</span>
                  <span className="text-lg font-black text-zinc-100">
                    {result.user_count || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
