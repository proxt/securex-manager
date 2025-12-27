import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [rows] = await db.execute("SELECT * FROM tasks ORDER BY created_at DESC")

    return NextResponse.json({ tasks: rows })
  } catch (error) {
    console.error("[v0] Get tasks error:", error)
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
    const { title, description, status, priority, due_date, assigned_to, assignee_name, card_id, card_title } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const [result] = await db.execute(
      `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, assignee_name, 
       creator_id, creator_name, card_id, card_title) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        status || "pending",
        priority || "medium",
        due_date || null,
        assigned_to || null,
        assignee_name || null,
        session.userId,
        session.username,
        card_id || null,
        card_title || null,
      ],
    )

    const insertResult = result as any
    const [newTask] = await db.execute("SELECT * FROM tasks WHERE id = ?", [insertResult.insertId])

    return NextResponse.json({ task: (newTask as any[])[0] })
  } catch (error) {
    console.error("[v0] Create task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
