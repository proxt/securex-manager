"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { storage, type User } from "@/lib/storage"

interface AuthContextType {
  user: Omit<User, "password"> | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const sessionUser = sessionStorage.getItem("currentUser")
    if (sessionUser) {
      setUser(JSON.parse(sessionUser))
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = storage.getUserByUsername(username)

    if (!foundUser || foundUser.password !== password) {
      return false
    }

    const { password: _, ...userWithoutPassword } = foundUser
    setUser(userWithoutPassword)
    sessionStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))

    return true
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("currentUser")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
