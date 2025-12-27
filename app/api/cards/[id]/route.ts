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
    const { title, description, url, username, password } = body

    await db.execute("UPDATE cards SET title = ?, description = ?, url = ?, username = ?, password = ? WHERE id = ?", [
      title,
      description || null,
      url || null,
      username || null,
      password || null,
      id,
    ])

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
    await db.execute("DELETE FROM cards WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
