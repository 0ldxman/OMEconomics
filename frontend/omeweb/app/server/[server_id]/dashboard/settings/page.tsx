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
import { useServer } from "@/context/server-context"
import { toast } from "sonner"
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
  value, 
  onChange,
  suffix, 
  icon: Icon,
  step = "1"
}: { 
  id: string, 
  label: string, 
  description?: string, 
  value: any, 
  onChange: (val: string) => void,
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
          value={value ?? ""} 
          onChange={(e) => onChange(e.target.value)}
          className={cn(Icon ? "pl-9" : "", "bg-background/50 focus-visible:ring-chart-1")}
        />
      </div>
      {description && <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>}
    </div>
  )
}

export default function ServerSettingsPage() {
  const { serverId, serverInfo, isLoading, refreshServerInfo } = useServer()
  const [settings, setSettings] = React.useState<any>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (serverInfo?.settings) {
      setSettings(serverInfo.settings)
    }
  }, [serverInfo])

  const handleUpdate = (section: string, key: string, value: string) => {
    const numValue = parseFloat(value)
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: isNaN(numValue) ? 0 : numValue
      }
    }))
  }

  const handleSave = async () => {
    if (!serverId || !settings) return

    try {
      setIsSaving(true)
      const res = await fetch(`http://localhost:8000/api/db/table/server/${serverId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      })

      if (!res.ok) throw new Error("Failed to save settings")
      
      toast.success("Настройки успешно сохранены")
      await refreshServerInfo()
    } catch (err: any) {
      toast.error(err.message || "Ошибка при сохранении")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-6 w-full mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки сервера</h1>
          <p className="text-muted-foreground">Управление экономическими параметрами и правилами сервера</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setSettings(serverInfo?.settings)}
            disabled={isSaving}
          >
            <Undo2 className="h-4 w-4" /> Сбросить
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-chart-1 hover:bg-chart-1/90 text-background font-bold px-6"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Сохранить изменения
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
                description="Доля новых монет, уходящая в резервный фонд (0-1)"
                value={settings.monetary?.reserve_percent}
                onChange={(v) => handleUpdate("monetary", "reserve_percent", v)}
                suffix="MOD"
                step="0.01"
                icon={Percent}
              />
              <SettingField 
                id="base-emission" 
                label="Базовая эмиссия" 
                description="Количество монет за уникального активного пользователя"
                value={settings.monetary?.base_emission_per_user}
                onChange={(v) => handleUpdate("monetary", "base_emission_per_user", v)}
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="start-capital" 
                label="Стартовый капитал" 
                description="Начальный баланс при первом появлении в системе"
                value={settings.monetary?.new_user_gift}
                onChange={(v) => handleUpdate("monetary", "new_user_gift", v)}
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
                value={settings.filters?.min_message_length}
                onChange={(v) => handleUpdate("filters", "min_message_length", v)}
                suffix="СИМВ"
                icon={MessageSquare}
              />
              <SettingField 
                id="len-bonus-weight" 
                label="Вес бонуса длины" 
                description="Коэффициент множителя за объем текста"
                value={settings.filters?.message_length_weight}
                onChange={(v) => handleUpdate("filters", "message_length_weight", v)}
                step="0.1"
                suffix="MOD"
                icon={Zap}
              />
              <SettingField 
                id="reaction-bonus" 
                label="Бонус за реакции" 
                description="Награда за каждую полученную реакцию"
                value={settings.filters?.reaction_bonus}
                onChange={(v) => handleUpdate("filters", "reaction_bonus", v)}
                step="0.1"
                suffix="MOD"
                icon={Zap}
              />
              <SettingField 
                id="media-bonus" 
                label="Бонус за медиаконтент" 
                description="Дополнительная награда за вложения"
                value={settings.filters?.score_bonus_per_media}
                onChange={(v) => handleUpdate("filters", "score_bonus_per_media", v)}
                step="0.1"
                suffix="MOD"
                icon={Zap}
              />
              <SettingField 
                id="spam-window" 
                label="Спам окно" 
                description="Минимальная пауза между сообщениями"
                value={settings.filters?.spam_cooldown_seconds}
                onChange={(v) => handleUpdate("filters", "spam_cooldown_seconds", v)}
                suffix="СЕК"
                icon={Clock}
              />
              <SettingField 
                id="anomaly-cutoff" 
                label="Отсечение аномалий" 
                description="Процент отклонения для блокировки сделки (0-1)"
                value={settings.filters?.outliers_trim_pct}
                onChange={(v) => handleUpdate("filters", "outliers_trim_pct", v)}
                step="0.01"
                suffix="MOD"
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
                value={settings.market?.listing}
                onChange={(v) => handleUpdate("market", "listing", v)}
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="lot-sale-fee" 
                label="Комиссия с продажи" 
                description="Процент, удерживаемый при успешной сделке (0-1)"
                value={settings.market?.sale}
                onChange={(v) => handleUpdate("market", "sale", v)}
                step="0.01"
                suffix="MOD"
                icon={Percent}
              />
              <SettingField 
                id="lot-inactivity-limit" 
                label="Предел неактивности лота" 
                description="Время до автоматического снятия лота"
                value={settings.market?.expiration_hours}
                onChange={(v) => handleUpdate("market", "expiration_hours", v)}
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
                value={settings.task?.listing}
                onChange={(v) => handleUpdate("task", "listing", v)}
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="job-fee" 
                label="Комиссия биржи" 
                description="Процент от выплаты, удерживаемый с исполнителя (0-1)"
                value={settings.task?.escrow}
                onChange={(v) => handleUpdate("task", "escrow", v)}
                step="0.01"
                suffix="MOD"
                icon={Percent}
              />
              <SettingField 
                id="order-inactivity-limit" 
                label="Предел неактивности заказа" 
                description="Время до архивации невыполненного заказа"
                value={settings.task?.expiration_hours}
                onChange={(v) => handleUpdate("task", "expiration_hours", v)}
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
                description="Налог на передачу средств между пользователями (0-1)"
                value={settings.transactions?.tax}
                onChange={(v) => handleUpdate("transactions", "tax", v)}
                step="0.01"
                suffix="MOD"
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
                value={settings.organization?.registration_fee}
                onChange={(v) => handleUpdate("organization", "registration_fee", v)}
                suffix="OMC"
                icon={CircleDollarSign}
              />
              <SettingField 
                id="org-tax" 
                label="Налог организации" 
                description="Фиксированный налог за владение структурой (0-1)"
                value={settings.organization?.tax}
                onChange={(v) => handleUpdate("organization", "tax", v)}
                step="0.01"
                suffix="MOD"
                icon={Percent}
              />
              <SettingField 
                id="org-per-capita-tax" 
                label="Подушевой налог" 
                description="Сбор за каждого участника организации"
                value={settings.organization?.per_member_tax}
                onChange={(v) => handleUpdate("organization", "per_member_tax", v)}
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
                label="Наценка магазина" 
                description="Коэффициент наценки на системные товары (0-1)"
                value={settings.shop?.margin}
                onChange={(v) => handleUpdate("shop", "margin", v)}
                step="0.01"
                suffix="MOD"
                icon={Percent}
              />
            </div>
          </CollapsibleCard>
        </div>
      </div>
    </div>
  )
}
