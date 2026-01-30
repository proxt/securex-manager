"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Lock, CheckSquare, Users, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    cards: 0,
    tasks: 0,
    users: 0,
  })
  const [taskStats, setTaskStats] = useState<Array<{ status: string; count: number; fill: string }>>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tasksRes, cardsRes, usersRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/cards"),
          user?.role === "admin" ? fetch("/api/users") : Promise.resolve({ ok: false }),
        ])

        let allTasks: any[] = []
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          allTasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || [])
        }

        let allCards: any[] = []
        if (cardsRes.ok) {
          const cardsData = await cardsRes.json()
          allCards = Array.isArray(cardsData) ? cardsData : (cardsData.cards || [])
        }

        let allUsers: any[] = []
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          allUsers = Array.isArray(usersData) ? usersData : (usersData.users || [])
        }

        const pending = allTasks.filter((t) => t.status === "pending").length
        const inProgress = allTasks.filter((t) => t.status === "in-progress").length
        const completed = allTasks.filter((t) => t.status === "completed").length
        const cancelled = allTasks.filter((t) => t.status === "cancelled").length

        setTaskStats([
          { status: "В ожидании", count: pending, fill: "hsl(var(--chart-1))" },
          { status: "В работе", count: inProgress, fill: "hsl(var(--chart-2))" },
          { status: "Завершено", count: completed, fill: "hsl(var(--chart-3))" },
          { status: "Отменено", count: cancelled, fill: "hsl(var(--chart-4))" },
        ])

        setStats({
          cards: allCards.length,
          tasks: allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
          users: allUsers.length,
        })
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [user])

  const chartConfig = {
    count: {
      label: "Задач",
      color: "hsl(var(--primary))",
    },
  }

  if (authLoading || !user) {
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Статистика задач
            </CardTitle>
            <CardDescription>Распределение задач по статусам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStats}>
                  <XAxis
                    dataKey="status"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
