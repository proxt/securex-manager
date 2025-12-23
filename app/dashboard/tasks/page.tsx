"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { TasksManager } from "@/components/tasks-manager"

export default function TasksPage() {
  return (
    <DashboardLayout>
      <TasksManager />
    </DashboardLayout>
  )
}
