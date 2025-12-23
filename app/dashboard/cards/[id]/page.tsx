"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CardDetails } from "@/components/card-details"
import { use } from "react"

export default function CardDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <DashboardLayout>
      <CardDetails cardId={Number.parseInt(id)} />
    </DashboardLayout>
  )
}
