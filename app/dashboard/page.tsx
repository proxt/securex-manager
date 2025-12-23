"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, CheckSquare, Users, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { storage } from "@/lib/storage"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    cards: 0,
    tasks: 0,
    users: 0,
  })

  useEffect(() => {
    setStats({
      cards: storage.getCards().length,
      tasks: storage.getTasks().filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
      users: storage.getUsers().length,
    })
  }, [])

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Добро пожаловать, {user.username}!</h1>
          <p className="text-muted-foreground">Управляйте вашими доступами и задачами безопасно</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Доступы</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cards}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Сохраненных доступов
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 hover:border-secondary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Задачи</CardTitle>
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckSquare className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasks}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Активных задач
              </p>
            </CardContent>
          </Card>

          {user.role === "admin" && (
            <Card className="border-accent/20 hover:border-accent/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Всего пользователей
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
