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

import { useServer } from "@/context/server-context"
import { toast } from "sonner"

interface ChannelData {
  id: string;
  name: string;
  type: string;
  weight: number;
  enabled: boolean;
  children?: ChannelData[];
}

interface ChannelItemProps {
  item: ChannelData;
  depth?: number;
  onUpdate: (id: string, updates: Partial<ChannelData>) => void;
}

function ChannelRow({ item, depth = 0, onUpdate }: ChannelItemProps) {
  // Проверяем, есть ли активность в этой ветке или её детях для начального состояния
  const hasActivity = (ch: ChannelData): boolean => {
    if (ch.enabled && ch.weight !== 0) return true;
    if (ch.children) return ch.children.some(hasActivity);
    return false;
  }

  const [isExpanded, setIsExpanded] = React.useState(() => hasActivity(item))

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const num = parseFloat(val)
    onUpdate(item.id, { weight: isNaN(num) ? 0 : num, enabled: val !== "" })
  }

  const handleToggle = (checked: boolean) => {
    onUpdate(item.id, { enabled: checked })
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
            !item.enabled ? "text-muted-foreground line-through decoration-1" : ""
          )}>
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
          "flex items-center border rounded-md bg-background overflow-hidden transition-all h-8",
          item.enabled ? "border-input" : "border-input opacity-60"
        )}>
          <div className={cn(
            "px-2 flex items-center justify-center h-full border-r transition-colors",
            item.enabled ? "bg-accent/50 border-input" : "bg-muted border-input"
          )}>
            <Checkbox 
              id={`check-${item.id}`}
              checked={item.enabled}
              onCheckedChange={handleToggle}
              className={cn(
                "h-4 w-4 transition-all",
                "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                !item.enabled && "border-muted-foreground/50 bg-transparent"
              )}
            />
          </div>
            <Input 
              type="number" 
              step="0.1"
              value={item.weight}
              onChange={handleWeightChange}
              disabled={!item.enabled}
              className={cn(
                "h-full w-20 border-0 focus-visible:ring-0 text-xs font-mono text-center bg-transparent transition-colors",
                !item.enabled && "text-muted-foreground/50"
              )}
              placeholder="0.0"
            />
          </div>
        </div>
      </div>
      
      {isExpanded && item.children && item.children.length > 0 && (
        <div className="flex flex-col mb-2">
          {item.children.map((child: any) => (
            <ChannelRow key={child.id} item={child} depth={depth + 1} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryHeader({ 
  item, 
  onUpdate, 
  isOpen, 
  onToggle 
}: { 
  item: ChannelData, 
  onUpdate: (id: string, updates: Partial<ChannelData>) => void,
  isOpen?: boolean,
  onToggle?: () => void
}) {
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const num = parseFloat(val)
    onUpdate(item.id, { weight: isNaN(num) ? 0 : num, enabled: val !== "" })
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <FolderOpen className="h-5 w-5 text-primary" />
        <CardTitle className="text-base uppercase tracking-widest">{item.name}</CardTitle>
        {onToggle && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex items-center border rounded-md bg-background overflow-hidden transition-all h-8",
          item.enabled ? "border-input" : "border-input opacity-60"
        )}>
          <div className={cn(
            "px-2 flex items-center justify-center h-full border-r transition-colors",
            item.enabled ? "bg-accent/50 border-input" : "bg-muted border-input"
          )}>
            <Checkbox 
              id={`check-${item.id}`}
              checked={item.enabled}
              onCheckedChange={(checked: boolean) => onUpdate(item.id, { enabled: checked })}
              className={cn(
                "h-4 w-4 transition-all",
                "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                !item.enabled && "border-muted-foreground/50 bg-transparent"
              )}
            />
          </div>
          <Input 
            type="number" 
            step="0.1"
            value={item.weight}
            onChange={handleWeightChange}
            disabled={!item.enabled}
            className={cn(
              "h-full w-20 border-0 focus-visible:ring-0 text-xs font-mono text-center bg-transparent transition-colors",
              !item.enabled && "text-muted-foreground/50"
            )}
            placeholder="0.0"
          />
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ category, onUpdate }: { category: ChannelData, onUpdate: any }) {
  const hasActivity = (ch: ChannelData): boolean => {
    if (ch.enabled && ch.weight !== 0) return true;
    if (ch.children) return ch.children.some(hasActivity);
    return false;
  }
  const [isOpen, setIsOpen] = React.useState(() => hasActivity(category))

  return (
    <Card className="overflow-hidden border-muted/60 shadow-sm">
      <CardHeader className="bg-muted/20 border-b py-3 flex-row items-center space-y-0">
        <CategoryHeader 
          item={category} 
          onUpdate={onUpdate} 
          isOpen={isOpen} 
          onToggle={() => setIsOpen(!isOpen)} 
        />
      </CardHeader>
      {isOpen && (
        <CardContent className="p-2">
          <div className="flex flex-col gap-1">
            {category.children?.map((child) => (
              <ChannelRow key={child.id} item={child} depth={0} onUpdate={onUpdate} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function ChannelsPage() {
  const { serverId } = useServer()
  const [data, setData] = React.useState<{ categories: ChannelData[], orphans: ChannelData[] } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isOrphansOpen, setIsOrphansOpen] = React.useState(false)

  const fetchChannels = async () => {
    if (!serverId) return
    try {
      setIsLoading(true)
      const res = await fetch(`http://localhost:8000/api/server/${serverId}/channels`)
      if (!res.ok) throw new Error("Failed to fetch channels")
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error(err.message || "Ошибка при загрузке каналов")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchChannels()
  }, [serverId])

  const handleUpdate = (id: string, updates: Partial<ChannelData>) => {
    if (!data) return
    
    const updateRecursive = (items: ChannelData[]): ChannelData[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, ...updates }
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) }
        }
        return item
      })
    }

    setData({
      categories: updateRecursive(data.categories),
      orphans: updateRecursive(data.orphans)
    })
  }

  const handleSave = async () => {
    if (!serverId || !data) return

    // Собираем плоский список изменений
    const updates: any[] = []
    const collect = (items: ChannelData[]) => {
      items.forEach(item => {
        updates.push({
          id: item.id,
          weight: item.weight,
          enabled: item.enabled,
          type: item.type
        })
        if (item.children) collect(item.children)
      })
    }
    collect(data.categories)
    collect(data.orphans)

    try {
      setIsSaving(true)
      const res = await fetch(`http://localhost:8000/api/server/${serverId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: updates })
      })

      if (!res.ok) throw new Error("Failed to save channels")
      toast.success("Изменения успешно применены")
    } catch (err: any) {
      toast.error(err.message || "Ошибка при сохранении")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-6 max-w-5xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Управление каналами</h1>
          <p className="text-muted-foreground">Настройка весов эмиссии для каждого канала и категории</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchChannels} disabled={isSaving}>
            <Undo2 className="h-4 w-4" /> Сбросить
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Применить изменения
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {data.orphans.length > 0 && (
          <Card className="overflow-hidden border-muted/60 shadow-sm">
            <CardHeader className="bg-muted/20 border-b py-3 flex-row items-center gap-2 space-y-0">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-primary" />
                <CardTitle className="text-base uppercase tracking-widest">Без категории</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOrphansOpen(!isOrphansOpen)}
                >
                  {isOrphansOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {isOrphansOpen && (
              <CardContent className="p-2">
                <div className="flex flex-col gap-1">
                  {data.orphans.map((child) => (
                    <ChannelRow key={child.id} item={child} depth={0} onUpdate={handleUpdate} />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {data.categories.map((category) => (
          <CategoryCard key={category.id} category={category} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  )
}
