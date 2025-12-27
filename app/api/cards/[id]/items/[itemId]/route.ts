import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { itemId } = await params
    const body = await request.json()
    const { type, label, value, custom_field, order_index } = body

    await db.execute(
      "UPDATE card_items SET type = ?, label = ?, value = ?, custom_field = ?, order_index = ? WHERE id = ?",
      [type, label, value || null, custom_field || null, order_index, itemId],
    )

    const [updated] = await db.execute("SELECT * FROM card_items WHERE id = ?", [itemId])

    return NextResponse.json({ item: (updated as any[])[0] })
  } catch (error) {
    console.error("[v0] Update card item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { itemId } = await params
    await db.execute("DELETE FROM card_items WHERE id = ?", [itemId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete card item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
