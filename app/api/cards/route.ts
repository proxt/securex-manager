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

    return NextResponse.json({ cards: rows })
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
    const { title, description, url, username, password } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const [result] = await db.execute(
      "INSERT INTO cards (title, description, url, username, password, creator_id, creator_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, description || null, url || null, username || null, password || null, session.userId, session.username],
    )

    const insertResult = result as any
    const [newCard] = await db.execute("SELECT * FROM cards WHERE id = ?", [insertResult.insertId])

    return NextResponse.json({ card: (newCard as any[])[0] })
  } catch (error) {
    console.error("[v0] Create card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
