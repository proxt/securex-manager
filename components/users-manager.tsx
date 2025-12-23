"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Plus, Trash2, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storage } from "@/lib/storage"

interface User {
  id: number
  username: string
  role: string
  created_at: string
}

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
  })

  const fetchUsers = () => {
    try {
      const usersData = storage.getUsers()
      setUsers(usersData as any)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
      toast({ title: "Ошибка", description: "Не удалось загрузить пользователей", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingUser) {
        const updateData: any = { role: formData.role as "admin" | "user" }
        if (formData.password) {
          updateData.password = formData.password
        }
        if (formData.username && formData.username !== editingUser.username) {
          updateData.username = formData.username
        }

        storage.updateUser(editingUser.id, updateData)
        toast({ title: "Успешно", description: "Пользователь обновлен" })
      } else {
        if (!formData.username || !formData.password) {
          throw new Error("Логин и пароль обязательны")
        }

        storage.createUser({
          username: formData.username,
          password: formData.password,
          role: formData.role as "admin" | "user",
        })

        toast({ title: "Успешно", description: "Пользователь создан" })
      }

      setOpen(false)
      setEditingUser(null)
      setFormData({ username: "", password: "", role: "user" })
      fetchUsers()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const handleDelete = (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return

    try {
      const success = storage.deleteUser(id)
      if (!success) {
        throw new Error("Не удалось удалить пользователя")
      }

      toast({ title: "Успешно", description: "Пользователь удален" })
      fetchUsers()
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({ username: user.username, password: "", role: user.role })
    setOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormData({ username: "", password: "", role: "user" })
    setOpen(true)
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Управление пользователями</h1>
          <p className="text-muted-foreground">Добавляйте и управляйте пользователями системы</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Редактировать пользователя" : "Новый пользователь"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Обновите данные пользователя" : "Создайте нового пользователя системы"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required={!editingUser}
                  placeholder="Введите логин"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Пароль{" "}
                  {editingUser && <span className="text-muted-foreground">(оставьте пустым, чтобы не менять)</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder="Введите пароль"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingUser ? "Сохранить" : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Логин</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "Администратор" : "Пользователь"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString("ru-RU")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
