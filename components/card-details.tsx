"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import {
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  Link2,
  User,
  Lock,
  Type,
  FileText,
  Eye,
  EyeOff,
  Copy,
  ExternalLinkIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"

interface CardData {
  id: number
  title: string
  description?: string
  creator_name: string
  created_at: string
  updated_at: string
}

interface CardItem {
  id: number
  card_id: number
  type: string
  label: string
  value?: string
  custom_field?: string
  order_index: number
}

const ITEM_TYPES = [
  { value: "link", label: "Ссылка", icon: Link2, placeholder: "https://example.com" },
  { value: "login", label: "Логин", icon: User, placeholder: "username или email" },
  { value: "password", label: "Пароль", icon: Lock, placeholder: "••••••••" },
  { value: "title", label: "Заметка", icon: Type, placeholder: "Дополнительная информация" },
  { value: "custom", label: "Произвольное поле", icon: FileText, placeholder: "Пользовательское значение" },
]

export function CardDetails({ cardId }: { cardId: number }) {
  const [card, setCard] = useState<CardData | null>(null)
  const [items, setItems] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CardItem | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    type: "title",
    label: "",
    value: "",
    custom_field: "",
  })

  const fetchCard = () => {
    try {
      const cardData = storage.getCardById(cardId)
      setCard(cardData || null)
    } catch (error) {
      console.error("[v0] Error fetching card:", error)
      toast({ title: "Ошибка", description: "Не удалось загрузить карточку", variant: "destructive" })
    }
  }

  const fetchItems = () => {
    try {
      const cardItems = storage.getCardItemsByCardId(cardId)
      setItems(cardItems)
    } catch (error) {
      console.error("[v0] Error fetching items:", error)
      toast({ title: "Ошибка", description: "Не удалось загрузить пункты", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCard()
    fetchItems()
  }, [cardId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingItem) {
        const updated = storage.updateCardItem(editingItem.id, {
          type: formData.type as any,
          label: formData.label,
          value: formData.value,
          custom_field: formData.custom_field || undefined,
        })

        if (!updated) {
          throw new Error("Не удалось обновить пункт")
        }

        toast({ title: "Успешно", description: "Пункт обновлен" })
      } else {
        // Calculate next order index
        const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) : 0

        storage.createCardItem({
          card_id: cardId,
          type: formData.type as any,
          label: formData.label,
          value: formData.value,
          custom_field: formData.custom_field || undefined,
          order_index: maxOrder + 1,
        })

        toast({ title: "Успешно", description: "Пункт добавлен" })
      }

      setOpen(false)
      setEditingItem(null)
      setFormData({ type: "title", label: "", value: "", custom_field: "" })
      fetchItems()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const handleDelete = (itemId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот пункт?")) return

    try {
      const success = storage.deleteCardItem(itemId)

      if (!success) {
        throw new Error("Не удалось удалить пункт")
      }

      toast({ title: "Успешно", description: "Пункт удален" })
      fetchItems()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const openEditDialog = (item: CardItem) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      label: item.label,
      value: item.value || "",
      custom_field: item.custom_field || "",
    })
    setOpen(true)
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    setFormData({ type: "title", label: "", value: "", custom_field: "" })
    setOpen(true)
  }

  const togglePasswordVisibility = (itemId: number) => {
    setShowPasswords((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Скопировано", description: `${label} скопирован в буфер обмена` })
  }

  const getItemIcon = (type: string) => {
    const itemType = ITEM_TYPES.find((t) => t.value === type)
    return itemType ? itemType.icon : FileText
  }

  const renderItemValue = (item: CardItem) => {
    if (item.type === "password") {
      return (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono">
            {showPasswords[item.id] ? item.value : "••••••••"}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePasswordVisibility(item.id)}
            title={showPasswords[item.id] ? "Скрыть" : "Показать"}
          >
            {showPasswords[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(item.value || "", "Пароль")}
            title="Копировать"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    if (item.type === "link") {
      return (
        <div className="flex items-center gap-2">
          <a
            href={item.value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm text-primary hover:underline truncate"
          >
            {item.value}
          </a>
          <Button variant="ghost" size="icon" onClick={() => window.open(item.value, "_blank")} title="Открыть">
            <ExternalLinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(item.value || "", "Ссылка")}
            title="Копировать"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    if (item.type === "login") {
      return (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono">{item.value}</code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(item.value || "", "Логин")}
            title="Копировать"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <p className="flex-1 text-sm bg-muted/50 px-3 py-2 rounded">{item.value}</p>
        {item.value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(item.value || "", item.label)}
            title="Копировать"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  if (!card) {
    return <div>Доступ не найден</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{card.title}</h1>
              {card.description && <p className="text-muted-foreground mt-1">{card.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Данные для входа</CardTitle>
              <CardDescription>Добавьте ссылку, логин, пароль и другую информацию</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить поле
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Редактировать поле" : "Новое поле"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Обновите данные поля" : "Добавьте новую информацию о доступе"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип поля</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((type) => {
                          const Icon = type.icon
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Название поля</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      required
                      placeholder={ITEM_TYPES.find((t) => t.value === formData.type)?.label || "Введите название"}
                    />
                  </div>
                  {formData.type === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom_field">Описание поля</Label>
                      <Input
                        id="custom_field"
                        value={formData.custom_field}
                        onChange={(e) => setFormData({ ...formData, custom_field: e.target.value })}
                        placeholder="Дополнительное описание"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="value">Значение</Label>
                    {formData.type === "password" ? (
                      <Input
                        id="value"
                        type="password"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder={ITEM_TYPES.find((t) => t.value === formData.type)?.placeholder}
                      />
                    ) : formData.type === "title" || formData.type === "custom" ? (
                      <Textarea
                        id="value"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder={ITEM_TYPES.find((t) => t.value === formData.type)?.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id="value"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder={ITEM_TYPES.find((t) => t.value === formData.type)?.placeholder}
                      />
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    {editingItem ? "Сохранить" : "Добавить"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="mb-4">Добавьте данные для входа на сайт</p>
              <Button onClick={openCreateDialog} variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Добавить первое поле
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const Icon = getItemIcon(item.type)
                return (
                  <div key={item.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 rounded-md bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{item.label}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {ITEM_TYPES.find((t) => t.value === item.type)?.label}
                          </Badge>
                          {item.custom_field && (
                            <Badge variant="outline" className="text-xs">
                              {item.custom_field}
                            </Badge>
                          )}
                        </div>
                        {item.value && <div className="mt-2">{renderItemValue(item)}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
