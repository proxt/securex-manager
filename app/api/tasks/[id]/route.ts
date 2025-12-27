import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, status, priority, due_date, assigned_to, assignee_name, card_id, card_title } = body

    await db.execute(
      `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, 
       assigned_to = ?, assignee_name = ?, card_id = ?, card_title = ? WHERE id = ?`,
      [
        title,
        description || null,
        status,
        priority,
        due_date || null,
        assigned_to || null,
        assignee_name || null,
        card_id || null,
        card_title || null,
        id,
      ],
    )

    const [updated] = await db.execute("SELECT * FROM tasks WHERE id = ?", [id])

    return NextResponse.json({ task: (updated as any[])[0] })
  } catch (error) {
    console.error("[v0] Update task error:", error)
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
    await db.execute("DELETE FROM tasks WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
