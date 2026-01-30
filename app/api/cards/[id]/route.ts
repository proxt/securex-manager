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
    const [rows] = await db.execute("SELECT * FROM cards WHERE id = ?", [id])
    const cards = rows as any[]

    if (cards.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    return NextResponse.json({ card: cards[0] })
  } catch (error) {
    console.error("[v0] Get card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, url, login, password, customFields } = body

    // Update main card data
    await db.execute("UPDATE cards SET title = ?, description = ?, url = ?, username = ?, password = ? WHERE id = ?", [
      title,
      description || null,
      url || null,
      login || null,
      password || null,
      id,
    ])

    // Delete existing items and recreate
    await db.execute("DELETE FROM card_items WHERE card_id = ?", [id])

    let orderIndex = 0
    
    if (url) {
      await db.execute(
        "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
        [id, "link", "Ссылка", url, orderIndex++]
      )
    }
    
    if (login) {
      await db.execute(
        "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
        [id, "login", "Логин", login, orderIndex++]
      )
    }
    
    if (password) {
      await db.execute(
        "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
        [id, "password", "Пароль", password, orderIndex++]
      )
    }

    // Create custom fields
    if (customFields && Array.isArray(customFields)) {
      for (const field of customFields) {
        if (field.label && field.value) {
          await db.execute(
            "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
            [id, "custom", field.label, field.value, orderIndex++]
          )
        }
      }
    }

    const [updated] = await db.execute("SELECT * FROM cards WHERE id = ?", [id])

    return NextResponse.json({ card: (updated as any[])[0] })
  } catch (error) {
    console.error("[v0] Update card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    // Delete card items first (foreign key constraint)
    await db.execute("DELETE FROM card_items WHERE card_id = ?", [id])
    await db.execute("DELETE FROM cards WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
