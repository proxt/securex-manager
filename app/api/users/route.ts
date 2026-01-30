import { NextResponse } from "next/server"
import { getSession, hashPassword } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const [rows] = await db.execute("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC")

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[v0] Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, role } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const [result] = await db.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
      username,
      hashedPassword,
      role || "user",
    ])

    const insertResult = result as any
    const [newUser] = await db.execute("SELECT id, username, role, created_at FROM users WHERE id = ?", [
      insertResult.insertId,
    ])

    return NextResponse.json({ user: (newUser as any[])[0] })
  } catch (error: any) {
    console.error("[v0] Create user error:", error)
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
