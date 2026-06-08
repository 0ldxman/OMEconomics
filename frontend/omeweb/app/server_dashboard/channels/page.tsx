"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Hash,
  MessageSquare,
  MessageCircle,
  FolderOpen,
  Save,
  Undo2,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data representing server channel structure
const initialChannels = [
  {
    id: "cat-1",
    name: "ИНФОРМАЦИЯ",
    type: "category",
    weight: 0.0,
    enabled: false,
    children: [
      { id: "ch-1", name: "правила", type: "text", weight: 0.0, enabled: false },
      { id: "ch-2", name: "объявления", type: "text", weight: 0.0, enabled: false },
    ]
  },
  {
    id: "cat-2",
    name: "ОСНОВНОЕ",
    type: "category",
    weight: 1.0,
    enabled: true,
    children: [
      { id: "ch-3", name: "флудилка", type: "text", weight: 1.0, enabled: true },
      { id: "ch-4", name: "рынок", type: "forum", weight: 0.8, enabled: true, children: [
        { id: "tr-1", name: "продажа-арбузов", type: "thread", weight: 0.5, enabled: true },
        { id: "tr-2", name: "куплю-гараж", type: "thread", weight: 0.5, enabled: true },
      ]},
      { id: "ch-5", name: "биржа-труда", type: "text", weight: 1.0, enabled: true, children: [
          { id: "tr-3", name: "дизайн-лого", type: "thread", weight: 1.2, enabled: true }
      ]},
    ]
  },
  {
    id: "cat-3",
    name: "РАЗРАБОТКА",
    type: "category",
    weight: 1.0,
    enabled: true,
    children: [
      { id: "ch-6", name: "фидбек", type: "text", weight: 1.0, enabled: true },
      { id: "ch-7", name: "баги", type: "text", weight: 1.0, enabled: true },
    ]
  }
]

interface ChannelItemProps {
  item: any;
  depth?: number;
}

function ChannelRow({ item, depth = 0 }: ChannelItemProps) {
  const [enabled, setEnabled] = React.useState(item.enabled ?? false)
  const [weight, setWeight] = React.useState(item.weight?.toString() ?? "1.0")
  const [isExpanded, setIsExpanded] = React.useState(true)

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setWeight(val)
    if (val !== "" && !enabled) {
      setEnabled(true)
    }
  }

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
  }

  const Icon = item.type === "category" ? FolderOpen : 
               item.type === "forum" ? MessageCircle : 
               item.type === "thread" ? MessageSquare : Hash

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group",
          item.type === "category" ? "bg-muted/30 mb-1" : ""
        )}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {item.children && item.children.length > 0 ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded text-muted-foreground"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <Icon className={cn("h-4 w-4 shrink-0", item.type === "category" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn(
            "truncate text-sm font-medium",
            item.type === "category" ? "uppercase tracking-wider font-bold" : "",
            !enabled ? "text-muted-foreground line-through decoration-1" : ""
          )}>
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
          "flex items-center border rounded-md bg-background overflow-hidden transition-all h-8",
          enabled ? "border-input" : "border-input opacity-60"
        )}>
          <div className={cn(
            "px-2 flex items-center justify-center h-full border-r transition-colors",
            enabled ? "bg-accent/50 border-input" : "bg-muted border-input"
          )}>
            <Checkbox 
              id={`check-${item.id}`}
              checked={enabled}
              onCheckedChange={handleToggle}
              className={cn(
                "h-4 w-4 transition-all",
                "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                !enabled && "border-muted-foreground/50 bg-transparent"
              )}
            />
          </div>
            <Input 
              type="number" 
              step="0.1"
              value={weight}
              onChange={handleWeightChange}
              disabled={!enabled}
              className={cn(
                "h-full w-20 border-0 focus-visible:ring-0 text-xs font-mono text-center bg-transparent transition-colors",
                !enabled && "text-muted-foreground/50"
              )}
              placeholder="0.0"
            />
          </div>
        </div>
      </div>
      
      {isExpanded && item.children && item.children.length > 0 && (
        <div className="flex flex-col mb-2">
          {item.children.map((child: any) => (
            <ChannelRow key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryHeader({ item }: { item: any }) {
  const [enabled, setEnabled] = React.useState(item.enabled ?? false)
  const [weight, setWeight] = React.useState(item.weight?.toString() ?? "1.0")

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setWeight(val)
    if (val !== "" && !enabled) {
      setEnabled(true)
    }
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <FolderOpen className="h-5 w-5 text-primary" />
        <CardTitle className="text-base uppercase tracking-widest">{item.name}</CardTitle>
      </div>
      
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex items-center border rounded-md bg-background overflow-hidden transition-all h-8",
          enabled ? "border-input" : "border-input opacity-60"
        )}>
          <div className={cn(
            "px-2 flex items-center justify-center h-full border-r transition-colors",
            enabled ? "bg-accent/50 border-input" : "bg-muted border-input"
          )}>
            <Checkbox 
              id={`check-${item.id}`}
              checked={enabled}
              onCheckedChange={(checked: boolean) => setEnabled(checked)}
              className={cn(
                "h-4 w-4 transition-all",
                "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                !enabled && "border-muted-foreground/50 bg-transparent"
              )}
            />
          </div>
          <Input 
            type="number" 
            step="0.1"
            value={weight}
            onChange={handleWeightChange}
            disabled={!enabled}
            className={cn(
              "h-full w-20 border-0 focus-visible:ring-0 text-xs font-mono text-center bg-transparent transition-colors",
              !enabled && "text-muted-foreground/50"
            )}
            placeholder="0.0"
          />
        </div>
      </div>
    </div>
  )
}

export default function ChannelsPage() {
  return (
    <div className="flex flex-col gap-8 py-6 max-w-5xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Управление каналами</h1>
          <p className="text-muted-foreground">Настройка весов эмиссии для каждого канала и категории</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Undo2 className="h-4 w-4" /> Сбросить
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6">
            <Save className="h-4 w-4" /> Применить изменения
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {initialChannels.map((category) => (
          <Card key={category.id} className="overflow-hidden border-muted/60 shadow-sm">
            <CardHeader className="bg-muted/20 border-b py-3">
              <CategoryHeader item={category} />
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                {category.children.map((child) => (
                  <ChannelRow key={child.id} item={child} depth={0} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
