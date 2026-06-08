"use client"

import * as React from "react"
import {
  Search,
  Filter,
  ShoppingBag,
  Store,
  Tag,
  Info,
  ArrowUpDown,
  TrendingUp,
  Package,
  CircleDollarSign,
  BarChart3,
  Wallet,
  Copy,
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Item,
  ItemMedia,
} from "@/components/ui/item"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

// --- TYPES ---
type MarketListing = {
  id: string
  seller: { name: string; avatar: string; wallet_id: number }
  item: {
    name: string
    description: string
    picture_url: string
    price: number
    settings: {
      market: { is_tradable: boolean; is_marketable: boolean }
      consumable: { is_consumable: boolean; max_uses?: number }
      temporary: { is_temporary: boolean; expiration_hours?: number }
    }
  }
  price: number
  remaining: number
}

// --- MOCK DATA ---
const mockListings: MarketListing[] = [
  {
    id: "L-7701",
    seller: { name: "PlayerOne", avatar: "P1", wallet_id: 12345 },
    item: {
      name: "VIP Карта",
      description: "Дает уникальный статус и бонусы на сервере.",
      picture_url: "https://api.dicebear.com/7.x/identicon/svg?seed=vip",
      price: 5000,
      settings: {
        market: { is_tradable: true, is_marketable: true },
        consumable: { is_consumable: true, max_uses: 1 },
        temporary: { is_temporary: true, expiration_hours: 720 }
      }
    },
    price: 5500,
    remaining: 20,
  },
  {
    id: "L-7702",
    seller: { name: "Merchant_X", avatar: "MX", wallet_id: 9988 },
    item: {
      name: "Стальной слиток",
      description: "Базовый материал для ковки оружия.",
      picture_url: "https://api.dicebear.com/7.x/identicon/svg?seed=steel",
      price: 40,
      settings: {
        market: { is_tradable: true, is_marketable: true },
        consumable: { is_consumable: false },
        temporary: { is_temporary: false }
      }
    },
    price: 45,
    remaining: 150,
  },
  {
    id: "L-7703",
    seller: { name: "IronSmith", avatar: "IS", wallet_id: 5544 },
    item: {
      name: "Меч Правосудия",
      description: "Легендарный клинок, выкованный в недрах горы.",
      picture_url: "https://api.dicebear.com/7.x/identicon/svg?seed=sword",
      price: 20000,
      settings: {
        market: { is_tradable: true, is_marketable: true },
        consumable: { is_consumable: false },
        temporary: { is_temporary: false }
      }
    },
    price: 25000,
    remaining: 5,
  },
  {
    id: "L-7704",
    seller: { name: "Alchemist", avatar: "AL", wallet_id: 3322 },
    item: {
      name: "Зелье маны",
      description: "Восстанавливает 50 единиц маны.",
      picture_url: "https://api.dicebear.com/7.x/identicon/svg?seed=mana",
      price: 120,
      settings: {
        market: { is_tradable: true, is_marketable: true },
        consumable: { is_consumable: true, max_uses: 1 },
        temporary: { is_temporary: false }
      }
    },
    price: 150,
    remaining: 50,
  },
  {
    id: "L-7705",
    seller: { name: "WoodCutter", avatar: "WC", wallet_id: 1122 },
    item: {
      name: "Дубовые доски",
      description: "Прочная древесина для строительства.",
      picture_url: "https://api.dicebear.com/7.x/identicon/svg?seed=wood",
      price: 15,
      settings: {
        market: { is_tradable: true, is_marketable: true },
        consumable: { is_consumable: false },
        temporary: { is_temporary: false }
      }
    },
    price: 20,
    remaining: 300,
  },
  {
    id: "L-7706",
    seller: { name: "Org_OME", avatar: "OM", wallet_id: 101 },
    item: {
      name: "Инструменты",
      description: "Набор для починки снаряжения.",
      picture_url: "https://api.dicebear.com/7.x/identicon/svg?seed=tools",
      price: 300,
      settings: {
        market: { is_tradable: true, is_marketable: true },
        consumable: { is_consumable: false },
        temporary: { is_temporary: false }
      }
    },
    price: 350,
    remaining: 2,
  }
]

// --- CHART UTILS ---
const generateItemDistribution = (listings: MarketListing[]) => {
  const counts: Record<string, number> = {}
  listings.forEach(l => {
    counts[l.item.name] = (counts[l.item.name] || 0) + l.remaining
  })

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count], index) => {
      const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]
      return {
        name,
        count,
        fill: colors[index % colors.length]
      }
    })

  if (sorted.length > 4) {
    const main = sorted.slice(0, 4)
    const otherCount = sorted.slice(4).reduce((acc, curr) => acc + curr.count, 0)
    return [...main, { name: "Остальное", count: otherCount, fill: "#64748b" }]
  }
  return sorted
}

const itemDistributionData = generateItemDistribution(mockListings)

const marketChartConfig = {
  count: { label: "Количество" },
  ...Object.fromEntries(itemDistributionData.map(d => [d.name, { label: d.name, color: d.fill }]))
} satisfies ChartConfig

// --- COMPONENTS ---

const ItemDisplay = ({ item }: { item: MarketListing['item'] }) => {
  const isConsumable = item.settings.consumable?.is_consumable
  const isTemporary = item.settings.temporary?.is_temporary

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="cursor-help group/item-trigger">
          <Item className="border-none p-0 bg-transparent hover:bg-transparent">
            <ItemMedia variant="image" className="size-8 rounded-md border bg-muted/50 overflow-hidden">
              <img src={item.picture_url} alt={item.name} />
            </ItemMedia>
            <div className="flex flex-col gap-0.5 ml-2">
              <span className="text-xs font-bold transition-colors group-hover/item-trigger:text-primary">
                {item.name}
              </span>
              <div className="flex gap-1">
                {isConsumable && <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 border-emerald-500/50 text-emerald-600">Расходник</Badge>}
                {isTemporary && <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 border-blue-500/50 text-blue-600">Временный</Badge>}
              </div>
            </div>
          </Item>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0 overflow-hidden border-2 shadow-xl" side="top" align="start">
        <div className="bg-primary/10 p-4 flex gap-4">
          <div className="size-20 shrink-0 rounded-xl border-2 border-primary/20 bg-background p-2 shadow-inner">
            <img src={item.picture_url} alt={item.name} className="size-full object-contain" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-black uppercase tracking-tight">{item.name}</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              "{item.description}"
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-[9px] font-bold">
                Базовая цена: {item.price} OMC
              </Badge>
              {item.settings.temporary?.expiration_hours && item.settings.temporary.expiration_hours > 0 && (
                <Badge variant="outline" className="text-[9px] font-bold">
                  Срок: {item.settings.temporary.expiration_hours}ч
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="bg-muted/30 p-2 border-t flex justify-between items-center">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Свойства предмета</span>
          <Info className="h-3 w-3 text-muted-foreground" />
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const SellerDisplay = ({ seller }: { seller: MarketListing['seller'] }) => {
  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(seller.wallet_id.toString())
    toast.success("ID кошелька скопирован")
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-help w-fit group/seller">
          <Avatar className="h-6 w-6 border">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.name}`} />
            <AvatarFallback className="text-[10px]">{seller.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold group-hover/seller:text-primary transition-colors">{seller.name}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-4 shadow-xl border-2" side="top">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.name}`} />
              <AvatarFallback>{seller.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">{seller.name}</span>
              <span className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-tighter">Продавец</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ID Кошелька</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 relative rounded bg-muted px-2 py-1 font-mono text-[11px] font-semibold overflow-hidden text-ellipsis italic">
                {seller.wallet_id}
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

// --- DATA TABLE COLUMNS ---
const columns: ColumnDef<MarketListing>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
      >
        ID Лота
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
        #{row.getValue("id")}
      </span>
    ),
  },
  {
    id: "item_name",
    accessorKey: "item.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
      >
        Предмет
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <ItemDisplay item={row.original.item} />,
  },
  {
    id: "seller_name",
    accessorKey: "seller.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
      >
        Продавец
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <SellerDisplay seller={row.original.seller} />,
  },
  {
    accessorKey: "remaining",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
        >
          Остаток
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <Badge variant="secondary" className="font-black tabular-nums">
          {row.getValue("remaining")} шт.
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
        >
          Стоимость
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-black text-emerald-500 tabular-nums">
          {row.original.price.toLocaleString()} OMC
        </span>
      </div>
    ),
  },
]

export default function MarketPage() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const totalListings = mockListings.length
  const medianPrice = 1250 // Mock median

  return (
    <div className="flex flex-col gap-6 py-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Торговая площадка</h1>
          <p className="text-muted-foreground">Мониторинг активных лотов и рыночных показателей</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Item Distribution Pie */}
        <Card className="flex flex-col overflow-hidden border-primary/10 bg-primary/[0.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Состав рынка
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex flex-col md:flex-row items-center gap-4 min-h-[220px]">
            <ChartContainer
              config={marketChartConfig}
              className="mx-auto aspect-square max-h-[160px] w-full md:w-1/2"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={itemDistributionData}
                  dataKey="count"
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
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-black">
                              {itemDistributionData.reduce((acc, curr) => acc + curr.count, 0)}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-[8px] uppercase font-bold tracking-widest">
                              Предметов
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex-1 w-full md:w-auto h-[160px] overflow-y-auto no-scrollbar py-2">
              <div className="grid grid-cols-1 gap-1.5">
                {itemDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg border bg-background/50">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black tabular-nums">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Median Price Card (Budget Style) */}
        <Card className="flex flex-col overflow-hidden border-emerald-500/20 h-full p-0">
          <div className="flex flex-col h-full">
            <div className="bg-emerald-500/10 p-6 flex flex-col items-center justify-center flex-1">
              <div className="flex items-center gap-2 mb-6">
                <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold uppercase tracking-widest text-emerald-600">Медианная цена</span>
              </div>
              <div className="text-4xl font-black tracking-tighter text-emerald-600 leading-none">
                {medianPrice.toLocaleString()} OMC
              </div>
            </div>
            <div className="bg-muted/50 p-4 flex flex-col items-center justify-center border-t border-border">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                <TrendingUp className="h-3 w-3" /> +5.2% за неделю
              </div>
            </div>
          </div>
        </Card>

        {/* Total Listings Card */}
        <Card className="flex flex-col overflow-hidden border-blue-500/20 bg-blue-500/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" /> Активность рынка
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1 py-10">
            <div className="text-5xl font-black tracking-tighter text-blue-600 leading-none">
              {totalListings}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase mt-4 tracking-widest text-center">
              Активных листингов
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Listings Data Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <DataTable 
          columns={columns} 
          data={mockListings} 
          searchKey="item_name" 
          searchPlaceholder="Поиск по предметам..."
        />
      </div>
    </div>
  )
}
