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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  Card as DialogCard,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Package,
  Pencil,
  Truck,
  Trash2,
  Info,
  BadgeRussianRuble,
  Settings2,
  Boxes,
  Store,
  Coins,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Shield,
  MessageCircle,
  Paperclip,
  Code2,
  Users,
  ArrowLeftRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
} from "@/components/ui/combobox"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

// Mock items based on Item class from tables.py
const initialItems = [
  {
    id: 1,
    name: "VIP Карта",
    description: "Дает роль VIP и доступ к закрытым каналам. Включает уникальный префикс в чате и возможность использовать эксклюзивные команды бота.",
    price: 1500,
    stock: 12,
    picture_url: "https://api.dicebear.com/7.x/shapes/svg?seed=vip",
    settings: {
      required_roles: [],
      market: { is_tradable: true, is_marketable: true },
      temporary: { is_temporary: true, expiration_hours: 720 },
      consumable: {
        is_consumable: true,
        max_uses: 1,
        effects: { grant_roles: ["VIP"], message_on_use: "Вы стали VIP!" }
      }
    }
  },
  {
    id: 2,
    name: "Набор смайлов",
    description: "Разблокирует эксклюзивные эмодзи для использования на сервере. Сделайте ваше общение более ярким и выразительным!",
    price: 500,
    stock: 45,
    picture_url: "https://api.dicebear.com/7.x/shapes/svg?seed=emoji",
    settings: {
      required_roles: [],
      market: { is_tradable: false, is_marketable: false },
      temporary: { is_temporary: false, expiration_hours: -1 },
      consumable: {
        is_consumable: false,
        effects: { grant_roles: ["Emoji Pack"] }
      }
    }
  }
]

// Mock data for comboboxes
const mockRoles = [
  { id: "role-1", name: "VIP" },
  { id: "role-2", name: "Moderator" },
  { id: "role-3", name: "Premium" },
  { id: "role-4", name: "OG Member" },
]

const mockItems = [
  { id: "item-1", name: "VIP Карта" },
  { id: "item-2", name: "Набор смайлов" },
  { id: "item-3", name: "Кейс с золотом" },
  { id: "item-4", name: "Меч правосудия" },
]

// Restock table columns
const restockColumns: ColumnDef<typeof initialItems[0]>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="font-bold p-0 hover:bg-transparent"
      >
        Товар
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex flex-col">
          <span className="font-bold text-sm">{item.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase">На складе: {item.stock} шт.</span>
        </div>
      )
    }
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold p-0 hover:bg-transparent"
        >
          Цена за шт.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm">
        {row.getValue("price")} <span className="text-[10px] text-muted-foreground">OMC</span>
      </div>
    )
  },
  {
      id: "quantity",
      header: () => <div className="text-right font-bold w-[80px]">Кол-во</div>,
      cell: ({ row, table }) => {
        const item = row.original
        const meta = table.options.meta as any
        const qty = meta?.restockOrder[item.id] || 0
        return (
          <div className="text-right">
            <Input 
              type="number" 
              min={0}
              value={qty}
              onChange={(e) => meta?.handleRestockQtyChange(item.id, parseInt(e.target.value) || 0)}
              className="h-8 text-right font-bold w-[70px] ml-auto"
            />
          </div>
        )
      }
    }
  ]

export default function ShopPage() {
  const [items, setItems] = React.useState(initialItems)
  const [editingItem, setEditingItem] = React.useState<typeof initialItems[0] | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  
  // Restock state
  const [restockOrder, setRestockOrder] = React.useState<Record<number, number>>({})
  const [showOnlySelected, setShowOnlySelected] = React.useState(false)
  const [showOutOfStock, setShowOutOfStock] = React.useState(false)
  const [mainSearch, setMainSearch] = React.useState("")
  const [mainShowOutOfStock, setMainShowOutOfStock] = React.useState(false)
  const serverBudget = 50000

  const filteredItems = React.useMemo(() => {
    let filtered = items
    if (mainSearch) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(mainSearch.toLowerCase())
      )
    }
    if (mainShowOutOfStock) {
      filtered = filtered.filter(item => item.stock === 0)
    }
    return filtered
  }, [items, mainSearch, mainShowOutOfStock])

  const restockItems = React.useMemo(() => {
    let filtered = items
    if (showOnlySelected) {
      filtered = filtered.filter(item => (restockOrder[item.id] || 0) > 0)
    }
    if (showOutOfStock) {
      filtered = filtered.filter(item => item.stock === 0)
    }
    return filtered
  }, [items, restockOrder, showOnlySelected, showOutOfStock])

  const totalRestockCost = items.reduce((sum, item) => {
    const qty = restockOrder[item.id] || 0
    return sum + (item.price * qty)
  }, 0)

  const handleRestockQtyChange = (itemId: number, qty: number) => {
    setRestockOrder(prev => ({
      ...prev,
      [itemId]: Math.max(0, qty)
    }))
  }

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 py-6 w-full mx-auto px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Магазин сервера</h1>
          <p className="text-muted-foreground">Управление ассортиментом, ценами и поставками товаров</p>
          
          <div className="flex items-center gap-3 mt-4">
            <Input 
              placeholder="Поиск по названию..." 
              className="max-w-xs h-9" 
              value={mainSearch}
              onChange={(e) => setMainSearch(e.target.value)}
            />
            <Toggle 
              variant="outline" 
              size="sm" 
              aria-label="Toggle out of stock"
              pressed={mainShowOutOfStock}
              onPressedChange={setMainShowOutOfStock}
              className="gap-2 font-bold data-[state=on]:bg-chart-1/10 data-[state=on]:text-chart-1 data-[state=on]:border-chart-1"
            >
              <Boxes className="h-4 w-4" />
              Нет в наличии
            </Toggle>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Main Restock Button */}
          <Dialog onOpenChange={(open) => {
            if (!open) {
              setRestockOrder({})
              setShowOnlySelected(false)
              setShowOutOfStock(false)
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 bg-chart-2 hover:bg-chart-2/90 text-background font-bold px-6 transition-all active:scale-95">
                <Truck className="h-5 w-5" /> Поставка товара
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Закупка и поставка</DialogTitle>
                <DialogDescription>Укажите количество товаров для пополнения склада</DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <DataTable 
                  columns={restockColumns} 
                  data={restockItems} 
                  searchKey="name"
                  searchPlaceholder="Поиск по названию..."
                  showPagination={false}
                  scrollable={true}
                  meta={{ restockOrder, handleRestockQtyChange }}
                  getRowClassName={(item) => {
                    const qty = restockOrder[item.id] || 0
                    return qty === 0 ? "opacity-40 grayscale-[0.5]" : "bg-chart-2/5"
                  }}
                >
                  <ToggleGroup type="multiple" variant="outline" size="sm">
                    <ToggleGroupItem 
                      value="selected" 
                      aria-label="Toggle selected"
                      data-state={showOnlySelected ? "on" : "off"}
                      onClick={() => setShowOnlySelected(!showOnlySelected)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Выбранные
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="out-of-stock" 
                      aria-label="Toggle out of stock"
                      data-state={showOutOfStock ? "on" : "off"}
                      onClick={() => setShowOutOfStock(!showOutOfStock)}
                    >
                      <Boxes className="h-4 w-4 mr-2" />
                      Нет в наличии
                    </ToggleGroupItem>
                  </ToggleGroup>
                </DataTable>

                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Бюджет сервера</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn(
                          "text-xl font-black tracking-tighter",
                          serverBudget < totalRestockCost ? "text-destructive" : "text-foreground"
                        )}>{serverBudget}</span>
                        <span className="text-xs font-bold text-muted-foreground/80">OMC</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Итого</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black tracking-tighter text-chart-2">{totalRestockCost}</span>
                        <span className="text-xs font-bold text-muted-foreground/80">OMC</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-xl flex gap-3 border border-dashed">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Средства будут списаны с общего баланса организации сервера. Поставка увеличит доступное количество товара для покупки пользователями.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  className="bg-chart-2 text-background font-black w-full h-11 text-lg active:scale-[0.98] transition-all"
                  disabled={totalRestockCost === 0 || serverBudget < totalRestockCost}
                >
                  Сделать поставку
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="gap-2 border-chart-1 text-chart-1 hover:bg-chart-1/10 font-bold px-6">
                <Plus className="h-5 w-5" /> Новый товар
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh] !w-[90vw]">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Создание нового товара</DialogTitle>
                <DialogDescription>Настройте базовые параметры и эффекты предмета</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <ItemForm />
              </div>
              <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
                <Button type="submit" className="bg-chart-1 text-background font-bold w-full h-11">Создать товар</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Items List */}
      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "group flex flex-col md:flex-row items-start md:items-center gap-6 p-5 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200",
              item.stock === 0 && "opacity-60 grayscale-[0.3] bg-muted/30"
            )}
          >
            {/* Image Section */}
            <div className="relative shrink-0">
              <Avatar className="h-24 w-24 rounded-xl border-2 border-muted bg-muted shadow-inner transition-colors">
                <AvatarImage src={item.picture_url} alt={item.name} className="object-cover rounded-xl" />
                <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
                  <Store className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <Badge 
                variant={item.stock > 0 ? "secondary" : "destructive"} 
                className={cn(
                  "absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter border-2 border-background shadow-sm",
                  item.stock > 10 ? "bg-emerald-500 text-white" : ""
                )}
              >
                {item.stock > 0 ? `${item.stock} шт.` : "Нет в наличии"}
              </Badge>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-xl font-black tracking-tight transition-colors">{item.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Pricing Section */}
            <div className="flex flex-col items-end gap-0.5 px-6 border-l border-r border-dashed min-w-[140px]">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60">Цена продажи</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tighter text-chart-1">{item.price}</span>
                <span className="text-xs font-bold text-muted-foreground/80">OMC</span>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 md:flex-none h-10 md:w-28 gap-2 font-bold transition-colors"
                onClick={() => {
                  setEditingItem(item)
                  setIsEditDialogOpen(true)
                }}
              >
                <Pencil className="h-4 w-4" /> Изменить
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 md:flex-none h-10 md:w-28 gap-2 font-bold text-rose-500 border-rose-500/20 transition-all"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" /> Удалить
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh] !w-[90vw]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Редактирование: {editingItem?.name}</DialogTitle>
            <DialogDescription>Измените параметры товара и его свойства</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {editingItem && <ItemForm item={editingItem} />}
          </div>
          <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
            <Button 
              className="bg-chart-1 text-background font-bold w-full h-11"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ItemForm({ item }: { item?: typeof initialItems[0] }) {
  const [isLimited, setIsLimited] = React.useState(item?.settings.consumable.is_consumable ?? false)
  
  // Scripts state
  const [selectedScripts, setSelectedScripts] = React.useState<{name: string, params: Record<string, string>}[]>(
    item?.settings.consumable.effects.script?.map((s: any) => typeof s === 'string' ? {name: s, params: {}} : s) || []
  )

  // Attachments state
  const [attachments, setAttachments] = React.useState<string[]>(item?.settings.consumable.effects.message_contents || [])
  const [newAttachmentUrl, setNewAttachmentUrl] = React.useState("")
  const [showAttachmentInput, setShowAttachmentInput] = React.useState(false)

  const availableScripts = [
    { name: "custom_reward_v1", params: ["reward_id", "multiplier"] },
    { name: "server_boost_logic", params: ["days", "role_id"] },
    { name: "give_exp", params: ["amount"] }
  ]

  const addScript = (scriptName: string) => {
    if (!scriptName || scriptName === "Выберите скрипт...") return
    if (selectedScripts.some(s => s.name === scriptName)) return
    setSelectedScripts([...selectedScripts, { name: scriptName, params: {} }])
  }

  const removeScript = (index: number) => {
    setSelectedScripts(selectedScripts.filter((_, i) => i !== index))
  }

  const updateScriptParam = (scriptIndex: number, paramKey: string, value: string) => {
    const newScripts = [...selectedScripts]
    newScripts[scriptIndex].params = { ...newScripts[scriptIndex].params, [paramKey]: value }
    setSelectedScripts(newScripts)
  }

  const addAttachment = () => {
    if (newAttachmentUrl.trim()) {
      setAttachments([...attachments, newAttachmentUrl.trim()])
      setNewAttachmentUrl("")
      setShowAttachmentInput(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-6 py-4">
      {/* Basic Info Section */}
      <div className="grid gap-4 p-4 rounded-xl border bg-muted/5">
        <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-primary" /> Основная информация
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="font-bold">Название</Label>
            <Input id="name" defaultValue={item?.name} placeholder="Название предмета" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price" className="font-bold">Цена (OMC)</Label>
            <Input id="price" type="number" defaultValue={item?.price} placeholder="0.0" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="desc" className="font-bold">Описание</Label>
          <Textarea id="desc" defaultValue={item?.description} placeholder="Полное описание товара..." className="min-h-[100px] resize-none" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="img" className="font-bold">URL картинки</Label>
          <Input id="img" defaultValue={item?.picture_url} placeholder="https://..." />
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
          <Settings2 className="h-3 w-3" /> Настройки поведения
        </h4>
        
        <div className="grid gap-3">
          {/* Передаваемый */}
          <BehaviorSection 
            title="Передаваемый" 
            description="Настройки возможности передачи и продажи"
            icon={ArrowLeftRight}
            defaultChecked={item?.settings.market.is_tradable}
          >
            <div className="grid gap-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                <div className="grid gap-0.5">
                  <Label className="font-bold text-sm">Можно продать</Label>
                  <span className="text-[10px] text-muted-foreground">Разрешить прямую продажу между игроками</span>
                </div>
                <Checkbox defaultChecked={item?.settings.market.is_tradable} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                <div className="grid gap-0.5">
                  <Label className="font-bold text-sm">Можно выставить на рынке</Label>
                  <span className="text-[10px] text-muted-foreground">Разрешить создание лотов на торговой площадке</span>
                </div>
                <Checkbox defaultChecked={item?.settings.market.is_marketable} />
              </div>
            </div>
          </BehaviorSection>

          {/* Временный */}
          <BehaviorSection 
            title="Временный" 
            description="Предмет исчезнет через определенное время"
            icon={Clock}
            defaultChecked={item?.settings.temporary.is_temporary}
          >
            <div className="grid gap-4 pt-2">
              <div className="grid gap-2">
                <Label className="font-bold text-sm">Часов до просрочки</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" defaultValue={item?.settings.temporary.expiration_hours || 24} className="pl-9" />
                </div>
                <p className="text-[10px] text-muted-foreground italic">Укажите -1 для бесконечного срока (если чекбокс активен)</p>
              </div>
            </div>
          </BehaviorSection>

          {/* Используемый */}
          <BehaviorSection 
            title="Используемый" 
            description="Настройка эффектов при использовании предмета"
            icon={Zap}
            defaultChecked={item?.settings.consumable.is_consumable}
          >
            <div className="grid gap-6 pt-2">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="is-limited" 
                      checked={isLimited} 
                      onCheckedChange={(checked) => setIsLimited(checked as boolean)} 
                    />
                    <Label htmlFor="is-limited" className="font-bold text-sm cursor-pointer">Расходуемый</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Предмет имеет ограниченное количество использований</p>
                </div>

                {isLimited && (
                  <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <Label className="font-bold text-xs whitespace-nowrap text-muted-foreground uppercase">Кол-во:</Label>
                    <Input 
                      type="number" 
                      defaultValue={item?.settings.consumable.max_uses || 1} 
                      className="w-20 h-9 font-bold text-center"
                    />
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h5 className="text-[11px] font-black uppercase tracking-wider text-chart-1 flex items-center gap-2">
                  <Zap className="h-3 w-3" /> Эффекты при использовании
                </h5>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold">Выдать роль</Label>
                    <SearchableSelect 
                      options={mockRoles} 
                      placeholder="Выберите роль..." 
                      defaultValue={item?.settings.consumable.effects.grant_roles} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold">Снять роль</Label>
                    <SearchableSelect 
                      options={mockRoles} 
                      placeholder="Выберите роль..." 
                      defaultValue={item?.settings.consumable.effects.take_roles} 
                    />
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold">Дать тип предмета</Label>
                    <SearchableSelect 
                      options={mockItems} 
                      placeholder="Выберите предмет..." 
                      defaultValue={item?.settings.consumable.effects.give_items} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold">Забрать тип предмета</Label>
                    <SearchableSelect 
                      options={mockItems} 
                      placeholder="Выберите предмет..." 
                      defaultValue={item?.settings.consumable.effects.take_items} 
                    />
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Coins className="h-3 w-3" /> Выдать деньги
                    </Label>
                    <Input type="number" defaultValue={item?.settings.consumable.effects.cash_bonus || 0.0} placeholder="0.0" className="text-xs h-9" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <BadgeRussianRuble className="h-3 w-3" /> Выдать золото
                    </Label>
                    <Input type="number" defaultValue={item?.settings.consumable.effects.gold_bonus || 0.0} placeholder="0.0" className="text-xs h-9" />
                  </div>
                </div>

                <div className="grid gap-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Code2 className="h-3 w-3" /> Скрипты автоматизации
                    </Label>
                    <select 
                      className="flex h-8 w-48 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(e) => addScript(e.target.value)}
                      value=""
                    >
                      <option value="">Добавить скрипт...</option>
                      {availableScripts.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedScripts.length > 0 && (
                    <div className="grid gap-3 animate-in fade-in slide-in-from-top-2">
                      {selectedScripts.map((script, idx) => {
                        const definition = availableScripts.find(s => s.name === script.name)
                        return (
                          <div key={idx} className="p-3 rounded-lg border bg-muted/30 relative group">
                            <Button 
                              variant="ghost" 
                              size="icon-xs" 
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeScript(idx)}
                            >
                              <Trash2 className="h-3 w-3 text-rose-500" />
                            </Button>
                            <div className="text-xs font-black mb-2 flex items-center gap-2">
                              <Code2 className="h-3.5 w-3.5 text-chart-1" />
                              {script.name}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {definition?.params.map(param => (
                                <div key={param} className="grid gap-1">
                                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{param}</Label>
                                  <Input 
                                    className="h-7 text-[11px]" 
                                    placeholder="Значение..."
                                    value={script.params[param] || ""}
                                    onChange={(e) => updateScriptParam(idx, param, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 border-t pt-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <MessageCircle className="h-3 w-3" /> Сообщение при использовании
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("h-7 gap-1.5 text-xs font-bold", showAttachmentInput ? "text-chart-1" : "text-muted-foreground")}
                        onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {attachments.length > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{attachments.length}</Badge>}
                      </Button>
                    </div>
                    <Textarea 
                      defaultValue={item?.settings.consumable.effects.message_on_use}
                      placeholder="Текст сообщения..." 
                      className="text-xs min-h-[80px] resize-none" 
                    />
                  </div>

                  {showAttachmentInput && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in">
                      <Input 
                        placeholder="URL вложения (картинка, файл)..." 
                        className="text-xs h-9"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addAttachment()}
                      />
                      <Button variant="outline" size="sm" className="h-9" onClick={addAttachment}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((url, idx) => (
                        <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 gap-1 text-[10px] max-w-[200px] truncate group">
                          <Paperclip className="h-3 w-3 shrink-0 opacity-50" />
                          <span className="truncate">{url}</span>
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="h-4 w-4 rounded-full hover:bg-rose-500/20"
                            onClick={() => removeAttachment(idx)}
                          >
                            <Trash2 className="h-2.5 w-2.5 text-rose-500" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BehaviorSection>
        </div>
      </div>
    </div>
  )
}

function SearchableSelect({ 
  options, 
  placeholder,
  defaultValue
}: { 
  options: { id: string, name: string }[], 
  placeholder: string,
  defaultValue?: string[]
}) {
  const [selected, setSelected] = React.useState<string[]>(defaultValue || [])
  const anchorRef = React.useRef<HTMLDivElement>(null)

  // Обновляем состояние только при реальном изменении defaultValue (например, при смене редактируемого предмета)
  React.useEffect(() => {
    if (defaultValue) {
      setSelected(defaultValue)
    } else {
      setSelected([])
    }
  }, [defaultValue])

  return (
    <Combobox 
      multiple 
      value={selected} 
      onValueChange={(val) => setSelected(val as string[])}
    >
      <div ref={anchorRef}>
        <ComboboxChips className="bg-background/50 border-input">
          {selected.map((val) => (
            <ComboboxChip key={val} value={val}>
              {val}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput placeholder={placeholder} className="text-xs" />
        </ComboboxChips>
      </div>
      <ComboboxContent anchor={anchorRef} sideOffset={4}>
        <ComboboxList>
          {options.map((opt) => (
            <ComboboxItem 
              key={opt.id} 
              value={opt.name}
            >
              {opt.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>Ничего не найдено</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}

function BehaviorSection({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  defaultChecked = false 
}: { 
  title: string, 
  description: string, 
  icon: any, 
  children: React.ReactNode,
  defaultChecked?: boolean
}) {
  const [isActive, setIsActive] = React.useState(defaultChecked)
  const [isOpen, setIsOpen] = React.useState(defaultChecked)

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200 overflow-hidden",
      isActive ? "border-chart-1 bg-chart-1/5" : "bg-muted/10"
    )}>
      <div className="flex items-center gap-4 p-4">
        <Checkbox 
          id={`section-${title}`} 
          checked={isActive} 
          onCheckedChange={(checked) => {
            setIsActive(checked as boolean)
            if (checked) setIsOpen(true)
          }} 
        />
        <div 
          className="flex-1 cursor-pointer select-none"
          onClick={() => isActive && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", isActive ? "text-chart-1" : "text-muted-foreground")} />
              <Label 
                htmlFor={`section-${title}`} 
                className={cn(
                  "font-bold text-sm cursor-pointer",
                  !isActive && "text-muted-foreground line-through opacity-50"
                )}
              >
                {title}
              </Label>
            </div>
            {isActive && (
              <div className="text-muted-foreground">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      
      {isActive && isOpen && (
        <div className="px-4 pb-4 border-t border-dashed border-chart-1/20 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
