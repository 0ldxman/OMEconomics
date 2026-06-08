"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  Table as TableIcon,
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Calendar,
  Clock,
  CheckSquare,
  Square
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface ColumnSchema {
  name: string
  type: string
  sql_type: string
  primary_key: boolean
  default: any
  nullable: boolean
  fk?: string
}

interface TableSchema {
  name: string
  columns: ColumnSchema[]
}

export default function TableDataPage({ params }: { params: Promise<{ tableName: string }> }) {
  const { tableName } = use(params)
  const router = useRouter()
  
  const [schema, setSchema] = useState<TableSchema | null>(null)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set())
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [editingJson, setEditingJson] = useState<{col: string, val: string} | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRecordData, setNewRecordData] = useState<any>({})
  
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null)
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false)
  
  const [resetConfirmText, setResetConfirmText] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    if (isCreateDialogOpen && schema) {
      const defaults: any = {}
      schema.columns.forEach(col => {
        if (col.default !== null && col.default !== undefined) {
          defaults[col.name] = col.default
        }
      })
      setNewRecordData(defaults)
    }
  }, [isCreateDialogOpen, schema])

  const fetchData = async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * limit
      let url = `http://localhost:8000/api/db/table/${tableName}?limit=${limit}&offset=${offset}`
      if (sortColumn) {
        url += `&sort_by=${sortColumn}&order=${sortDirection}`
      }
      
      const [schemaRes, dataRes] = await Promise.all([
        fetch(`http://localhost:8000/api/db/schema`),
        fetch(url)
      ])
      
      const schemas = await schemaRes.json()
      const tableSchema = schemas.find((s: any) => s.name === tableName)
      setSchema(tableSchema)
      
      const result = await dataRes.json()
      if (result && result.data) {
        setData(result.data)
        setTotal(result.total || 0)
      } else {
        setData([])
        setTotal(0)
      }
    } catch (err) {
      console.error(err)
      toast.error("Ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [tableName])

  useEffect(() => {
    fetchData()
    
    // Проверка наличия highlight в URL
    const hash = window.location.hash
    if (hash && hash.startsWith('#id-')) {
      setHighlightedId(hash.replace('#id-', ''))
    }
  }, [tableName, page, sortColumn, sortDirection])

  const handleUpdate = async () => {
    if (!schema || !editingRecord) return
    
    const pkCol = schema.columns.find(c => c.primary_key)?.name || "id"
    const pkValue = editingRecord[pkCol]
    
    try {
      const res = await fetch(`http://localhost:8000/api/db/table/${tableName}/${pkValue}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRecord)
      })
      
      if (res.ok) {
        toast.success("Запись обновлена")
        setEditingRecord(null)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(`Ошибка: ${err.detail}`)
      }
    } catch (err) {
      toast.error("Не удалось обновить запись")
    }
  }

  const handleCreate = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/db/table/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecordData)
      })
      
      if (res.ok) {
        toast.success("Запись создана")
        setIsCreateDialogOpen(false)
        setNewRecordData({})
        fetchData()
      } else {
        const err = await res.json()
        toast.error(`Ошибка: ${err.detail}`)
      }
    } catch (err) {
      toast.error("Не удалось создать запись")
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    
    const pkCol = schema?.columns.find(c => c.primary_key)?.name || "id"
    const pkValue = recordToDelete[pkCol]
    
    try {
      const res = await fetch(`http://localhost:8000/api/db/table/${tableName}/${pkValue}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        toast.success("Запись удалена")
        setRecordToDelete(null)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(`Ошибка: ${err.detail}`)
      }
    } catch (err) {
      toast.error("Не удалось удалить запись")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    
    try {
      const res = await fetch(`http://localhost:8000/api/db/bulk-delete/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Array.from(selectedRows))
      })
      
      if (res.ok) {
        toast.success(`${selectedRows.size} записей удалено`)
        setSelectedRows(new Set())
        setIsBulkDeleteAlertOpen(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(`Ошибка: ${err.detail}`)
      }
    } catch (err) {
      toast.error("Не удалось выполнить массовое удаление")
    }
  }

  const handleResetDatabase = async () => {
    if (resetConfirmText.toLowerCase() !== "очистить") {
      toast.error("Неверное слово подтверждения")
      return
    }

    setIsResetting(true)
    try {
      const res = await fetch(`http://localhost:8000/api/db/reset`, {
        method: "POST"
      })
      
      if (res.ok) {
        toast.success("База данных успешно сброшена")
        setResetConfirmText("")
        fetchData()
      } else {
        toast.error("Ошибка при сбросе базы данных")
      }
    } catch (err) {
      toast.error("Не удалось сбросить базу данных")
    } finally {
      setIsResetting(false)
    }
  }

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnName)
      setSortDirection("asc")
    }
    setPage(1)
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set())
    } else {
      const pkCol = schema?.columns.find(c => c.primary_key)?.name || "id"
      setSelectedRows(new Set(filteredData.map(row => row[pkCol])))
    }
  }

  const toggleSelectRow = (pkValue: any) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(pkValue)) {
      newSelected.delete(pkValue)
    } else {
      newSelected.add(pkValue)
    }
    setSelectedRows(newSelected)
  }

  const filteredData = (data || []).filter(row => 
    row && Object.values(row).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  )

  const isTimestamp = (value: any, colName: string) => {
    // Эвристика для определения timestamp: число в диапазоне между 2000 и 2100 годом
    // Или если имя колонки содержит time, date, last_use, created...
    const timeKeywords = ['time', 'date', 'last_', 'created_', 'at', 'emission']
    const isTimeName = timeKeywords.some(key => colName.toLowerCase().includes(key))
    const isLikelyTimestamp = typeof value === 'number' && value > 946684800 && value < 4102444800
    return isTimeName && isLikelyTimestamp
  }

  const renderCellValue = (value: any, col: ColumnSchema) => {
    if (typeof value === 'object' && value !== null) {
      return <Badge variant="outline" className="text-[8px] font-bold uppercase border-muted-foreground/20 bg-muted/20">JSON</Badge>
    }

    if (isTimestamp(value, col.name)) {
      const date = new Date(value * 1000)
      return (
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <span className="cursor-help border-b border-dotted border-muted-foreground/50 pb-0.5">
              {value}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Дата и время</p>
                <p className="text-sm font-bold">{format(date, "d MMMM yyyy", { locale: ru })}</p>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-medium">
                  <Clock className="h-3 w-3" />
                  {format(date, "HH:mm:ss")} (UTC{format(date, "x")})
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    }

    if (col.fk) {
      const targetTable = col.fk.split('.')[0]
      return (
        <Link 
          href={`/dashboard/database/${targetTable}#id-${value}`}
          className="text-primary hover:underline flex items-center gap-1 group/link"
        >
          {String(value ?? "-")}
          <ExternalLink className="h-2 w-2 opacity-0 group-hover/link:opacity-100" />
        </Link>
      )
    }

    return String(value ?? "-")
  }

  const renderInput = (col: ColumnSchema, value: any, onChange: (val: any) => void) => {
    if (col.sql_type === "JSON") {
      const isEditingThis = editingJson?.col === col.name
      const displayValue = isEditingThis 
        ? editingJson.val 
        : (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? ""))

      return (
        <div className="space-y-1">
          <Textarea 
            value={displayValue}
            onChange={(e) => {
              const newVal = e.target.value
              setEditingJson({ col: col.name, val: newVal })
              try {
                const parsed = JSON.parse(newVal)
                onChange(parsed)
              } catch {
                // Не обновляем основное состояние пока JSON невалиден, 
                // но сохраняем текст в буфере редактирования
              }
            }}
            onBlur={() => {
              // При потере фокуса можно попробовать принудительно распарсить или оставить как есть
              setEditingJson(null)
            }}
            className={cn(
              "font-mono text-[10px] min-h-[100px]",
              isEditingThis && "border-primary"
            )}
          />
          {isEditingThis && (
            <p className="text-[8px] font-bold text-primary animate-pulse uppercase tracking-widest">
              Редактирование JSON...
            </p>
          )}
        </div>
      )
    }

    if (isTimestamp(value, col.name) || col.type === 'datetime') {
      const date = value ? new Date(value * 1000) : new Date()
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal h-9",
                !value && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {value ? format(date, "PPP HH:mm:ss", { locale: ru }) : <span className="text-[10px] uppercase font-bold opacity-50">Выберите дату</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  const newDate = new Date(d)
                  newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds())
                  onChange(Math.floor(newDate.getTime() / 1000))
                }
              }}
              initialFocus
            />
            <div className="p-3 border-t bg-muted/20">
               <div className="flex items-center gap-2">
                 <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                 <Input 
                   type="time" 
                   step="1"
                   value={format(date, "HH:mm:ss")}
                   onChange={(e) => {
                     const [h, m, s] = e.target.value.split(':').map(Number)
                     const newDate = new Date(date)
                     newDate.setHours(h || 0, m || 0, s || 0)
                     onChange(Math.floor(newDate.getTime() / 1000))
                   }}
                   className="h-8 text-xs font-mono"
                 />
               </div>
            </div>
          </PopoverContent>
        </Popover>
      )
    }
    
    return (
      <Input 
        type={col.type === 'int' || col.type === 'float' ? 'number' : 'text'}
        value={value ?? ""}
        placeholder={col.default !== null ? `По умолчанию: ${col.default}` : "Введите значение..."}
        onChange={(e) => {
          const val = e.target.value
          if (val === "") {
            onChange(null)
          } else if (col.type === 'int') {
            onChange(parseInt(val))
          } else if (col.type === 'float') {
            onChange(parseFloat(val))
          } else {
            onChange(val)
          }
        }}
        className="h-9"
      />
    )
  }

  if (loading && !schema) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4">
      {/* Breadcrumbs */}
      <div className="px-4">
        <Breadcrumb>
          <BreadcrumbList className="text-[10px] font-black uppercase tracking-widest">
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/database" className="hover:text-primary transition-colors">
                Database
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">{tableName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border rounded-xl bg-card/50 backdrop-blur-sm mx-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-500 hover:text-primary"
            onClick={() => window.location.href = '/dashboard/database'}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase leading-none">
              {tableName}
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
              {schema?.columns.length} колонок • {total} записей всего
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedRows.size > 0 && (
            <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
              <AlertDialogTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-md animate-in fade-in zoom-in duration-200 cursor-pointer hover:bg-primary/20 transition-colors">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                    Выбрано: {selectedRows.size}
                  </span>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black uppercase tracking-widest text-destructive">Массовое удаление</AlertDialogTitle>
                  <AlertDialogDescription className="font-medium text-sm">
                    Вы уверены, что хотите удалить <span className="font-bold text-foreground">{selectedRows.size}</span> записей из таблицы <span className="font-bold text-foreground">{tableName}</span>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-bold uppercase text-[10px]">Отмена</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkDelete}
                    className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px]"
                  >
                    Удалить выбранное
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="ПОИСК..." 
              className="pl-9 w-[250px] h-9 text-[10px] font-bold uppercase tracking-wider"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="icon" onClick={fetchData} className="h-9 w-9">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="h-9 w-9">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black uppercase tracking-widest text-destructive">Опасная зона</AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-sm">
                  Это действие полностью удалит файл базы данных <code className="bg-muted px-1 rounded text-foreground font-bold">economy.db</code> и пересоздаст все таблицы с нуля. Все данные будут безвозвратно потеряны.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Введите слово <span className="text-foreground underline">очистить</span> для подтверждения
                </Label>
                <Input 
                  placeholder="Введите здесь..." 
                  className="h-9 font-bold"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-bold uppercase text-[10px]" onClick={() => setResetConfirmText("")}>Отмена</AlertDialogCancel>
                <Button 
                  variant="destructive" 
                  className="font-black uppercase text-[10px]"
                  disabled={resetConfirmText.toLowerCase() !== "очистить" || isResetting}
                  onClick={handleResetDatabase}
                >
                  {isResetting ? "Сброс..." : "Удалить все данные"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 font-black uppercase text-[10px] tracking-widest gap-2">
                <Plus className="h-4 w-4" /> Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-black uppercase tracking-widest">Новая запись: {tableName}</DialogTitle>
                <DialogDescription className="sr-only">Форма создания новой записи в таблице {tableName}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {schema?.columns.map(col => (
                  <div key={col.name} className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      {col.name}
                      <span className="text-[8px] border border-muted-foreground/20 rounded px-1 font-bold uppercase">
                        {col.type}
                      </span>
                    </Label>
                    {renderInput(col, newRecordData[col.name], (val) => setNewRecordData({...newRecordData, [col.name]: val}))}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="font-bold uppercase text-[10px]">Отмена</Button>
                <Button onClick={handleCreate} className="font-black uppercase text-[10px]">Создать запись</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px] px-4">
                    <Checkbox 
                      checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  {schema?.columns.map(col => (
                    <TableHead 
                      key={col.name} 
                      className="text-[10px] font-black uppercase tracking-widest py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort(col.name)}
                    >
                      <div className="flex items-center gap-2">
                        {col.name}
                        <div className="flex items-center">
                          {sortColumn === col.name ? (
                            sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-20" />
                          )}
                        </div>
                        {col.primary_key && <Badge className="bg-primary/20 text-primary text-[8px] h-4 px-1 border-primary/30">PK</Badge>}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right py-4">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={(schema?.columns.length || 0) + 1} className="h-32 text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">
                      Данные не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, idx) => {
                    const pkCol = schema?.columns.find(c => c.primary_key)?.name || "id"
                    const pkValue = row[pkCol]
                    const isHighlighted = highlightedId === String(pkValue)
                    const isSelected = selectedRows.has(pkValue)
                    
                    return (
                      <TableRow 
                        key={idx} 
                        id={`id-${pkValue}`}
                        className={cn(
                          "group transition-colors border-b border-border/40",
                          isHighlighted ? "bg-primary/20 hover:bg-primary/25 shadow-[inset_4px_0_0_0_#facc15]" : "hover:bg-primary/5",
                          isSelected ? "bg-primary/10" : ""
                        )}
                      >
                        <TableCell className="px-4">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectRow(pkValue)}
                          />
                        </TableCell>
                        {schema?.columns.map(col => (
                          <TableCell key={col.name} className="py-3 text-[11px] font-medium max-w-[200px] truncate">
                            {renderCellValue(row[col.name], col)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                              onClick={() => setEditingRecord({...row})}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => setRecordToDelete(row)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t bg-card/30 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
          Показано <span className="text-foreground">{(page - 1) * limit + 1} - {Math.min(page * limit, total)}</span> из <span className="text-foreground">{total}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] font-black uppercase tracking-widest gap-1"
            disabled={page === 1 || loading}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Назад
          </Button>
          
          <div className="flex items-center gap-1">
            {(() => {
              const totalPages = Math.ceil(total / limit);
              let startPage = Math.max(1, page - 2);
              let endPage = Math.min(totalPages, startPage + 4);
              if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
              
              const pages = [];
              for (let i = startPage; i <= endPage; i++) pages.push(i);
              
              return pages.map(pageNum => (
                <Button 
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 text-[10px] font-black"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ));
            })()}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] font-black uppercase tracking-widest gap-1"
            disabled={page >= Math.ceil(total / limit) || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Вперед <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest">Редактирование записи</DialogTitle>
            <DialogDescription className="sr-only">Форма редактирования существующей записи в таблице {tableName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {schema?.columns.map(col => (
              <div key={col.name} className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  {col.name}
                  <span className="text-[8px] border border-muted-foreground/20 rounded px-1 font-bold uppercase">
                    {col.type}
                  </span>
                  {col.primary_key && <span className="bg-primary/20 text-primary text-[8px] h-4 px-1 border border-primary/30 rounded flex items-center">PK</span>}
                </Label>
                {renderInput(col, editingRecord?.[col.name], (val) => setEditingRecord({...editingRecord, [col.name]: val}))}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)} className="font-bold uppercase text-[10px]">Отмена</Button>
            <Button onClick={handleUpdate} className="font-black uppercase text-[10px] gap-2">
              <Save className="h-4 w-4" /> Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Record Alert */}
      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-widest text-destructive">Удаление записи</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-sm">
              Вы уверены, что хотите удалить эту запись из таблицы <span className="font-bold text-foreground">{tableName}</span>?
              {recordToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-lg font-mono text-[10px] break-all">
                  {JSON.stringify(recordToDelete, null, 2)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase text-[10px]">Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px]"
            >
              Удалить запись
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
