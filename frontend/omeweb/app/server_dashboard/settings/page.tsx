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
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Coins,
  Store,
  Briefcase,
  ArrowLeftRight,
  ShoppingBag,
  Building2,
  Filter,
  Save,
  Undo2,
  Percent,
  CircleDollarSign,
  Clock,
  MessageSquare,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

function CollapsibleCard({ 
  title, 
  description, 
  icon: Icon, 
  children,
  defaultOpen = false,
  className
}: { 
  title: string, 
  description: string, 
  icon: any, 
  children: React.ReactNode,
  defaultOpen?: boolean,
  className?: string
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (    <Card className={cn("transition-all duration-200", className)}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="truncate">{description}</CardDescription>
          </div>
          <div className="text-muted-foreground shrink-0">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
      </button>
      {isOpen && (
        <CardContent className="p-6 pt-0 border-t bg-muted/5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="pt-6">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function SettingField({ 
  id, 
  label, 
  description, 
  defaultValue, 
  suffix, 
  icon: Icon,
  step = "1"
}: { 
  id: string, 
  label: string, 
  description?: string, 
  defaultValue: string, 
  suffix?: string,
  icon?: any,
  step?: string
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-semibold">{label}</Label>
        {suffix && <span className="text-[10px] font-bold text-muted-foreground uppercase">{suffix}</span>}
      </div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <Input 
          id={id} 
          type="number" 
          step={step}
          defaultValue={defaultValue} 
          className={cn(Icon ? "pl-9" : "", "bg-background/50 focus-visible:ring-chart-1")}
        />
      </div>
      {description && <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>}
    </div>
  )
}

export default function ServerSettingsPage() {
  return (
    <div className="flex flex-col gap-8 py-6 w-full mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки сервера</h1>
          <p className="text-muted-foreground">Управление экономическими параметрами и правилами сервера</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Undo2 className="h-4 w-4" /> Сбросить
          </Button>
          <Button size="sm" className="gap-2 bg-chart-1 hover:bg-chart-1/90 text-background font-bold px-6">
            <Save className="h-4 w-4" /> Сохранить изменения
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Ряд 1: Монетарная политика + Фильтры и Алгоритмы */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <CollapsibleCard 
            title="Монетарная политика" 
            description="Основные параметры денежной массы" 
            icon={Coins}
            defaultOpen={true}
            className="md:col-span-1 w-full"
          >
            <div className="grid gap-6">
              <SettingField 
                id="reserve-percent" 
                label="Процент резерва от эмиссии" 
                description="Доля новых монет, уходящая в резервный фонд"
                defaultValue="10"
                suffix="%"
                icon={Percent}
              />
              <SettingField 
                id="base-emission" 
                label="Базовая эмиссия" 
                description="Количество монет за уникального активного пользователя"
                defaultValue="100"
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="start-capital" 
                label="Стартовый капитал" 
                description="Начальный баланс при первом появлении в системе"
                defaultValue="500"
                suffix="OMC"
                icon={CircleDollarSign}
              />
            </div>
          </CollapsibleCard>

          <CollapsibleCard 
            title="Фильтры и алгоритмы" 
            description="Тонкая настройка начисления наград за активность" 
            icon={Filter}
            defaultOpen={true}
            className="md:col-span-2 w-full"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SettingField 
                id="min-msg-len" 
                label="Мин. длина сообщения" 
                description="Сообщения короче не учитываются"
                defaultValue="5"
                suffix="СИМВ"
                icon={MessageSquare}
              />
              <SettingField 
                id="len-bonus-weight" 
                label="Вес бонуса длины" 
                description="Коэффициент множителя за объем текста"
                defaultValue="0.2"
                step="0.1"
                suffix="MOD"
                icon={Zap}
              />
              <SettingField 
                id="reaction-bonus" 
                label="Бонус за реакции" 
                description="Награда за каждую полученную реакцию"
                defaultValue="5"
                suffix="OMC"
                icon={Zap}
              />
              <SettingField 
                id="media-bonus" 
                label="Бонус за медиаконтент" 
                description="Дополнительная награда за вложения"
                defaultValue="10"
                suffix="OMC"
                icon={Zap}
              />
              <SettingField 
                id="spam-window" 
                label="Спам окно" 
                description="Минимальная пауза между сообщениями"
                defaultValue="3"
                suffix="СЕК"
                icon={Clock}
              />
              <SettingField 
                id="anomaly-cutoff" 
                label="Отсечение аномалий" 
                description="Процент отклонения для блокировки сделки"
                defaultValue="5"
                suffix="%"
                icon={AlertTriangle}
              />
            </div>
          </CollapsibleCard>
        </div>

        {/* Ряд 2: Рынок, Биржа труда, Транзакции */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <CollapsibleCard 
            title="Рынок" 
            description="Настройки торговой площадки" 
            icon={Store}
            className="w-full"
          >
            <div className="grid gap-6">
              <SettingField 
                id="lot-listing-price" 
                label="Стоимость выставления лота" 
                description="Фиксированная плата за размещение товара"
                defaultValue="50"
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="lot-sale-fee" 
                label="Комиссия с продажи" 
                description="Процент, удерживаемый при успешной сделке"
                defaultValue="5"
                suffix="%"
                icon={Percent}
              />
              <SettingField 
                id="lot-inactivity-limit" 
                label="Предел неактивности лота" 
                description="Время до автоматического снятия лота"
                defaultValue="48"
                suffix="ЧАСЫ"
                icon={Clock}
              />
            </div>
          </CollapsibleCard>

          <CollapsibleCard 
            title="Биржа труда" 
            description="Параметры заказов и контрактов" 
            icon={Briefcase}
            className="w-full"
          >
            <div className="grid gap-6">
              <SettingField 
                id="order-listing-price" 
                label="Стоимость выставления заказа" 
                description="Плата за создание нового объявления о работе"
                defaultValue="100"
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="job-fee" 
                label="Комиссия биржи" 
                description="Процент от выплаты, удерживаемый с исполнителя"
                defaultValue="10"
                suffix="%"
                icon={Percent}
              />
              <SettingField 
                id="order-inactivity-limit" 
                label="Предел неактивности заказа" 
                description="Время до архивации невыполненного заказа"
                defaultValue="72"
                suffix="ЧАСЫ"
                icon={Clock}
              />
            </div>
          </CollapsibleCard>

          <CollapsibleCard 
            title="Транзакции" 
            description="Комиссии на прямые переводы" 
            icon={ArrowLeftRight}
            className="w-full"
          >
            <div className="grid gap-6">
              <SettingField 
                id="tx-fee" 
                label="Комиссия за перевод" 
                description="Налог на передачу средств между пользователями"
                defaultValue="2"
                suffix="%"
                icon={Percent}
              />
            </div>
          </CollapsibleCard>
        </div>

        {/* Ряд 3: Организации + Магазин */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <CollapsibleCard 
            title="Организации" 
            description="Налоги и сборы с объединений" 
            icon={Building2}
            className="md:col-span-2 w-full"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SettingField 
                id="org-reg-price" 
                label="Стоимость регистрации" 
                description="Единоразовый взнос за создание организации"
                defaultValue="5000"
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="org-tax" 
                label="Налог организации" 
                description="Фиксированный налог за владение структурой"
                defaultValue="1000"
                suffix="%"
                icon={Percent}
              />
              <SettingField 
                id="org-per-capita-tax" 
                label="Подушевой налог" 
                description="Сбор за каждого участника организации"
                defaultValue="50"
                suffix="OMC"
                icon={CircleDollarSign}
              />
            </div>
          </CollapsibleCard>

          <CollapsibleCard 
            title="Магазин" 
            description="Настройки системного магазина" 
            icon={ShoppingBag}
            className="md:col-span-1 w-full"
          >
            <div className="grid gap-6">
              <SettingField 
                id="shop-cost-percent" 
                label="Процент себестоимости" 
                description="Доля от цены продажи, уходящая в систему"
                defaultValue="15"
                suffix="%"
                icon={Percent}
              />
            </div>
          </CollapsibleCard>
        </div>
      </div>
    </div>
  )
}
