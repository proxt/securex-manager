import { NextResponse } from "next/server"
import { getSession, hashPassword } from "@/lib/auth"
import db from "@/lib/db"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { username, password, role } = body

    let query = "UPDATE users SET username = ?, role = ?"
    const values: any[] = [username, role]

    if (password) {
      const hashedPassword = await hashPassword(password)
      query += ", password = ?"
      values.push(hashedPassword)
    }

    query += " WHERE id = ?"
    values.push(id)

    await db.execute(query, values)

    const [updated] = await db.execute("SELECT id, username, role, created_at FROM users WHERE id = ?", [id])

    return NextResponse.json({ user: (updated as any[])[0] })
  } catch (error) {
    console.error("[v0] Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params

    if (Number.parseInt(id) === session.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    await db.execute("DELETE FROM users WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
