"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card"
import { Plus, Trash2, Pencil, ExternalLink, Lock, Eye, Copy, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storage } from "@/lib/storage"
import { useAuth } from "./auth-provider"

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
  type: "title" | "link" | "login" | "password" | "custom"
  label: string
  value: string
  custom_field?: string
  order_index: number
  created_at: string
}

interface CustomField {
  label: string
  value: string
}

export function CardsManager() {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [cardItems, setCardItems] = useState<CardItem[]>([])
  const [editingCard, setEditingCard] = useState<CardData | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({})

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    login: "",
    password: "",
  })

  const [customFields, setCustomFields] = useState<CustomField[]>([])

  const fetchCards = () => {
    try {
      const allCards = storage.getCards()
      setCards(allCards)
    } catch (error) {
      console.error("[v0] Error fetching cards:", error)
      toast({ title: "Ошибка", description: "Не удалось загрузить доступы", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCardItems = (cardId: number) => {
    const items = storage.getCardItemsByCardId(cardId)
    setCardItems(items.sort((a, b) => a.order_index - b.order_index))
  }

  const showDetails = (card: CardData) => {
    setSelectedCard(card)
    fetchCardItems(card.id)
    setDetailsOpen(true)
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast({ title: "Скопировано", description: `${fieldName} скопировано в буфер обмена` })
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingCard) {
        const updated = storage.updateCard(editingCard.id, {
          title: formData.title,
          description: formData.description,
        })

        if (!updated) {
          throw new Error("Не удалось обновить доступ")
        }

        const existingItems = storage.getCardItemsByCardId(editingCard.id)
        existingItems.forEach((item) => storage.deleteCardItem(item.id))

        let orderIndex = 0
        if (formData.url) {
          storage.createCardItem({
            card_id: editingCard.id,
            type: "link",
            label: "URL",
            value: formData.url,
            order_index: orderIndex++,
          })
        }
        if (formData.login) {
          storage.createCardItem({
            card_id: editingCard.id,
            type: "login",
            label: "Логин",
            value: formData.login,
            order_index: orderIndex++,
          })
        }
        if (formData.password) {
          storage.createCardItem({
            card_id: editingCard.id,
            type: "password",
            label: "Пароль",
            value: formData.password,
            order_index: orderIndex++,
          })
        }
        customFields.forEach((field) => {
          storage.createCardItem({
            card_id: editingCard.id,
            type: "custom",
            label: field.label,
            value: field.value,
            order_index: orderIndex++,
          })
        })

        toast({ title: "Успешно", description: "Доступ обновлен" })
      } else {
        if (!user) {
          throw new Error("Пользователь не авторизован")
        }

        const newCard = storage.createCard({
          title: formData.title,
          description: formData.description,
          creator_id: user.id,
          creator_name: user.username,
        })

        let orderIndex = 0
        if (formData.url) {
          storage.createCardItem({
            card_id: newCard.id,
            type: "link",
            label: "URL",
            value: formData.url,
            order_index: orderIndex++,
          })
        }
        if (formData.login) {
          storage.createCardItem({
            card_id: newCard.id,
            type: "login",
            label: "Логин",
            value: formData.login,
            order_index: orderIndex++,
          })
        }
        if (formData.password) {
          storage.createCardItem({
            card_id: newCard.id,
            type: "password",
            label: "Пароль",
            value: formData.password,
            order_index: orderIndex++,
          })
        }
        customFields.forEach((field) => {
          storage.createCardItem({
            card_id: newCard.id,
            type: "custom",
            label: field.label,
            value: field.value,
            order_index: orderIndex++,
          })
        })

        toast({ title: "Успешно", description: "Доступ создан" })
      }

      setOpen(false)
      setEditingCard(null)
      setFormData({ title: "", description: "", url: "", login: "", password: "" })
      setCustomFields([])
      fetchCards()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const handleDelete = (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот доступ?")) return

    try {
      const success = storage.deleteCard(id)

      if (!success) {
        throw new Error("Не удалось удалить доступ")
      }

      toast({ title: "Успешно", description: "Доступ удален" })
      fetchCards()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const openEditDialog = (card: CardData) => {
    setEditingCard(card)
    const items = storage.getCardItemsByCardId(card.id)

    const urlItem = items.find((i) => i.type === "link")
    const loginItem = items.find((i) => i.type === "login")
    const passwordItem = items.find((i) => i.type === "password")
    const customItems = items.filter((i) => i.type === "custom")

    setFormData({
      title: card.title,
      description: card.description || "",
      url: urlItem?.value || "",
      login: loginItem?.value || "",
      password: passwordItem?.value || "",
    })

    setCustomFields(customItems.map((i) => ({ label: i.label, value: i.value })))
    setOpen(true)
  }

  const openCreateDialog = () => {
    setEditingCard(null)
    setFormData({ title: "", description: "", url: "", login: "", password: "" })
    setCustomFields([])
    setOpen(true)
  }

  const addCustomField = () => {
    setCustomFields([...customFields, { label: "", value: "" }])
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (index: number, field: "label" | "value", value: string) => {
    const updated = [...customFields]
    updated[index][field] = value
    setCustomFields(updated)
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Доступы</h1>
          <p className="text-muted-foreground">Управляйте учетными данными для входа на сайты</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить доступ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCard ? "Редактировать доступ" : "Новый доступ"}</DialogTitle>
              <DialogDescription>
                {editingCard ? "Обновите информацию о доступе" : "Создайте новую запись для доступа к сайту"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название сайта *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Например: GitHub, Google, VK"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Ссылка на сайт</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="Введите логин или email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Введите пароль"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Дополнительные заметки об этом доступе"
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Дополнительные поля</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                    <Plus className="h-3 w-3 mr-1" />
                    Добавить поле
                  </Button>
                </div>
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Название поля"
                        value={field.label}
                        onChange={(e) => updateCustomField(index, "label", e.target.value)}
                      />
                      <Input
                        placeholder="Значение"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, "value", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomField(index)}
                      className="mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="submit" className="w-full">
                {editingCard ? "Сохранить" : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {selectedCard?.title}
            </DialogTitle>
            {selectedCard?.description && <DialogDescription>{selectedCard.description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4">
            {cardItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Нет сохраненных данных для этого доступа</p>
            ) : (
              cardItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">{item.label}</Label>
                  <div className="flex items-center gap-2">
                    {item.type === "password" ? (
                      <Input
                        type={showPassword[item.id] ? "text" : "password"}
                        value={item.value}
                        readOnly
                        className="flex-1"
                      />
                    ) : item.type === "link" ? (
                      <Input value={item.value} readOnly className="flex-1" />
                    ) : (
                      <Input value={item.value} readOnly className="flex-1" />
                    )}
                    {item.type === "link" && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(item.value, "_blank")}
                        title="Открыть в новой вкладке"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {item.type === "password" && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword({ ...showPassword, [item.id]: !showPassword[item.id] })}
                        title={showPassword[item.id] ? "Скрыть" : "Показать"}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(item.value, item.label)}
                      title="Копировать"
                    >
                      {copiedField === item.label ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
            {selectedCard && (
              <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                <p>Создал: {selectedCard.creator_name}</p>
                <p>Обновлено: {new Date(selectedCard.updated_at).toLocaleString("ru-RU")}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">У вас пока нет сохраненных доступов</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить первый доступ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-all hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    {card.description && <CardDescription className="mt-1">{card.description}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Создал: {card.creator_name}</p>
                  <p>Обновлено: {new Date(card.updated_at).toLocaleDateString("ru-RU")}</p>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => showDetails(card)}>
                  <Eye className="mr-2 h-3 w-3" />
                  Подробнее
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(card)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(card.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
