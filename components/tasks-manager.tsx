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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Plus, Trash2, Pencil, Calendar, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./auth-provider"

interface Task {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  assigned_to?: number
  assignee_name?: string
  creator_name: string
  card_id?: number
  card_title?: string
  created_at: string
  updated_at: string
}

interface CardData {
  id: number
  title: string
}

interface UserData {
  id: number
  username: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  "in-progress": "В работе",
  completed: "Завершена",
  cancelled: "Отменена",
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "secondary",
  "in-progress": "default",
  completed: "outline",
  cancelled: "destructive",
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
}

export function TasksManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [cards, setCards] = useState<CardData[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    assigned_to: "",
    card_id: "",
  })

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(Array.isArray(data) ? data : (data.tasks || []))
    } catch (error) {
      console.error("[v0] Error fetching tasks:", error)
      toast({ title: "Ошибка", description: "Не удалось загрузить задачи", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchCards = async () => {
    try {
      const response = await fetch("/api/cards")
      if (!response.ok) return
      const data = await response.json()
      setCards(Array.isArray(data) ? data : (data.cards || []))
    } catch (error) {
      console.error("[v0] Error fetching cards:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) return
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : (data.users || []))
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchCards()
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!user) {
        throw new Error("Пользователь не авторизован")
      }

      const assignedTo = formData.assigned_to ? Number.parseInt(formData.assigned_to) : undefined
      const cardId = formData.card_id ? Number.parseInt(formData.card_id) : undefined

      const assigneeName = assignedTo ? users.find((u) => u.id === assignedTo)?.username : undefined
      const cardTitle = cardId ? cards.find((c) => c.id === cardId)?.title : undefined

      if (editingTask) {
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) throw new Error("Не удалось обновить задачу")

        toast({ title: "Успешно", description: "Задача обновлена" })
      } else {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            creator_id: user.id,
            creator_name: user.username,
          }),
        })

        if (!response.ok) throw new Error("Не удалось создать задачу")

        toast({ title: "Успешно", description: "Задача создана" })
      }

      setOpen(false)
      setEditingTask(null)
      setFormData({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        due_date: "",
        assigned_to: "",
        card_id: "",
      })
      fetchTasks()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту задачу?")) return

    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" })

      if (!response.ok) throw new Error("Не удалось удалить задачу")

      toast({ title: "Успешно", description: "Задача удалена" })
      fetchTasks()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      assigned_to: task.assigned_to?.toString() || "",
      card_id: task.card_id?.toString() || "",
    })
    setOpen(true)
  }

  const openCreateDialog = () => {
    setEditingTask(null)
    setFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      assigned_to: "",
      card_id: "",
    })
    setOpen(true)
  }

  const getFilteredTasks = () => {
    if (activeTab === "all") return tasks
    return tasks.filter((task) => task.status === activeTab)
  }

  const filteredTasks = getFilteredTasks()

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Задачи</h1>
          <p className="text-muted-foreground">Управляйте вашими задачами и отслеживайте прогресс</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Создать задачу
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
              <DialogDescription>{editingTask ? "Обновите данные задачи" : "Создайте новую задачу"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Введите название задачи"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Введите описание задачи"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Срок выполнения</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Исполнитель</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Не назначен</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="card_id">Связанный доступ</Label>
                <Select
                  value={formData.card_id}
                  onValueChange={(value) => setFormData({ ...formData, card_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не связана" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Не связана</SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id.toString()}>
                        {card.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingTask ? "Сохранить" : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Все ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Ожидают ({tasks.filter((t) => t.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="in-progress">
            В работе ({tasks.filter((t) => t.status === "in-progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершены ({tasks.filter((t) => t.status === "completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all" ? "У вас пока нет задач" : "Нет задач с таким статусом"}
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать задачу
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        {task.description && <CardDescription className="mt-2">{task.description}</CardDescription>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <Badge variant={STATUS_COLORS[task.status] as any}>{STATUS_LABELS[task.status]}</Badge>
                      <Badge variant={PRIORITY_COLORS[task.priority] as any}>{PRIORITY_LABELS[task.priority]}</Badge>
                      {task.assignee_name && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{task.assignee_name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.due_date).toLocaleDateString("ru-RU")}</span>
                        </div>
                      )}
                      {task.card_title && (
                        <Badge variant="outline" className="text-xs">
                          {task.card_title}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
