import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const [rows] = await db.execute("SELECT * FROM card_items WHERE card_id = ? ORDER BY order_index ASC", [id])

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[v0] Get card items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { type, label, value, custom_field, order_index } = body

    const [result] = await db.execute(
      "INSERT INTO card_items (card_id, type, label, value, custom_field, order_index) VALUES (?, ?, ?, ?, ?, ?)",
      [id, type, label, value || null, custom_field || null, order_index || 0],
    )

    const insertResult = result as any
    const [newItem] = await db.execute("SELECT * FROM card_items WHERE id = ?", [insertResult.insertId])

    return NextResponse.json({ item: (newItem as any[])[0] })
  } catch (error) {
    console.error("[v0] Create card item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
