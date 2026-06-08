"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { 
  Terminal, 
  Cpu, 
  Database, 
  Bot, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface LogEntry {
  timestamp: string
  level: string
  message: string
  details?: any
}

export default function BootPage() {
  const [status, setStatus] = useState<string>("CONNECTING")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/boot")

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === "init") {
        setStatus(data.status)
        setLogs(data.logs)
      } else {
        setLogs((prev) => [...prev, data])
        if (data.level === "SUCCESS" || data.message.includes("готова")) {
          setStatus("READY")
        }
        if (data.level === "ERROR") {
          setStatus("FAILED")
        }
      }
    }

    ws.onopen = () => {
      console.log("Connected to boot stream")
    }

    ws.onclose = () => {
      setStatus("OFFLINE")
    }

    return () => ws.close()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    
    // Эмуляция прогресса на основе логов (упрощенно)
    const totalSteps = 10
    const currentStep = Math.min(logs.length, totalSteps)
    setProgress((currentStep / totalSteps) * 100)
  }, [logs])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "SUCCESS": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "ERROR": return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      case "WARNING": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default: return "bg-primary/10 text-primary border-primary/20"
    }
  }

  const getStepIcon = (msg: string) => {
    if (msg.includes("шина")) return <Cpu className="h-4 w-4" />
    if (msg.includes("базе") || msg.includes("схем")) return <Database className="h-4 w-4" />
    if (msg.includes("Бот")) return <Bot className="h-4 w-4" />
    if (msg.includes("API")) return <Globe className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  return (
    <div className="min-h-svh bg-black selection:bg-primary selection:text-black flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <Card className="w-full max-w-2xl bg-zinc-950/50 border-zinc-800 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900">
           <div 
             className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
             style={{ width: `${status === 'READY' ? 100 : progress}%` }}
           />
        </div>

        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Terminal className="h-6 w-6 text-primary" />
                System Core
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                OMCEconomics v1.0 • Lifecycle Orchestrator
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn(
              "font-black uppercase tracking-widest text-[10px] px-3 py-1",
              status === "READY" ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5" : 
              status === "FAILED" ? "border-rose-500/50 text-rose-500 bg-rose-500/5" : 
              "border-primary/50 text-primary animate-pulse"
            )}>
              {status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div 
            ref={scrollRef}
            className="h-[300px] w-full rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-[11px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-800"
          >
            {logs.length === 0 && (
              <div className="h-full flex items-center justify-center text-zinc-600 gap-2 uppercase font-black tracking-widest italic">
                <Spinner className="h-4 w-4" />
                Waiting for kernel...
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 group animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-zinc-600 shrink-0 select-none">
                  [{log.timestamp.split('T')[1].split('.')[0]}]
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-black uppercase text-[9px] px-1.5 rounded border leading-relaxed",
                      getLevelColor(log.level)
                    )}>
                      {log.level}
                    </span>
                    <span className="text-zinc-300 font-medium">
                      {log.message}
                    </span>
                  </div>
                  {log.details && (
                    <pre className="text-[9px] text-zinc-500 bg-black/30 p-2 rounded border border-zinc-800/50 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                <Activity className="h-3 w-3" /> System Health
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">System Bus</span>
                  {logs.some(l => l.message.includes("Системная шина подключена")) ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Spinner className="h-3 w-3 text-primary" />}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Database</span>
                  {logs.some(l => l.message.includes("База данных готова")) ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Spinner className="h-3 w-3 text-primary" />}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Discord Bot</span>
                  {logs.some(l => l.message.includes("Бот запущен")) ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Spinner className="h-3 w-3 text-primary" />}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-center items-center text-center">
              {status === "READY" ? (
                <Link href="/dashboard" className="w-full h-full flex flex-col items-center justify-center group">
                  <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <ArrowRight className="h-6 w-6 text-primary animate-bounce-x" />
                  </div>
                  <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary">Enter Dashboard</span>
                </Link>
              ) : (
                <div className="space-y-2">
                  <Spinner className="h-6 w-6 text-primary mx-auto" />
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">System Booting...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
