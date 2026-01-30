import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [rows] = await db.execute("SELECT * FROM cards ORDER BY created_at DESC")

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[v0] Get cards error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, url, login, password, customFields } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Create the card
    const [result] = await db.execute(
      "INSERT INTO cards (title, description, url, username, password, creator_id, creator_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, description || null, url || null, login || null, password || null, session.userId, session.username],
    )

    const insertResult = result as any
    const cardId = insertResult.insertId

    // Create card items for url, login, password
    let orderIndex = 0
    
    if (url) {
      await db.execute(
        "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
        [cardId, "link", "Ссылка", url, orderIndex++]
      )
    }
    
    if (login) {
      await db.execute(
        "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
        [cardId, "login", "Логин", login, orderIndex++]
      )
    }
    
    if (password) {
      await db.execute(
        "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
        [cardId, "password", "Пароль", password, orderIndex++]
      )
    }

    // Create custom fields
    if (customFields && Array.isArray(customFields)) {
      for (const field of customFields) {
        if (field.label && field.value) {
          await db.execute(
            "INSERT INTO card_items (card_id, type, label, value, order_index) VALUES (?, ?, ?, ?, ?)",
            [cardId, "custom", field.label, field.value, orderIndex++]
          )
        }
      }
    }

    const [newCard] = await db.execute("SELECT * FROM cards WHERE id = ?", [cardId])

    return NextResponse.json({ card: (newCard as any[])[0] })
  } catch (error) {
    console.error("[v0] Create card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
