"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UsersManager } from "@/components/users-manager"
import { useAuth } from "@/components/auth-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <DashboardLayout>
      <UsersManager />
    </DashboardLayout>
  )
}
