"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  user: { username: string } | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    console.log("[v0] AuthProvider mounted, checking authentication...")

    const checkAuth = () => {
      try {
        if (typeof window === "undefined") {
          console.log("[v0] Window undefined, skipping auth check")
          return
        }

        console.log("[v0] Checking localStorage for auth data...")
        const savedAuth = localStorage.getItem("cambodia-admin-auth")
        console.log("[v0] Saved auth data:", savedAuth)

        if (savedAuth) {
          const authData = JSON.parse(savedAuth)
          console.log("[v0] Parsed auth data:", authData)

          if (authData.isAuthenticated && authData.user) {
            console.log("[v0] Valid auth found, restoring session for:", authData.user.username)
            setIsAuthenticated(true)
            setUser(authData.user)
          } else {
            console.log("[v0] Invalid auth data structure")
          }
        } else {
          console.log("[v0] No saved auth data found")
        }
      } catch (error) {
        console.error("[v0] Error checking auth:", error)
        if (typeof window !== "undefined") {
          localStorage.removeItem("cambodia-admin-auth")
        }
      } finally {
        console.log("[v0] Auth check complete, setting loading to false")
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (username: string, password: string): boolean => {
    console.log("[v0] Login function called with username:", username)
    console.log("[v0] isClient:", isClient, "window available:", typeof window !== "undefined")

    if (!isClient || typeof window === "undefined") {
      console.log("[v0] Login failed - client not ready or window unavailable")
      return false
    }

    console.log("[v0] Validating credentials...")
    console.log("[v0] Expected username: 'Meta', received:", username)
    console.log("[v0] Password length:", password.length)

    // Hardcoded credentials
    if (username === "Meta" && password === "Meta@#2025") {
      console.log("[v0] Credentials valid, creating auth data...")

      const authData = {
        isAuthenticated: true,
        user: { username },
        timestamp: Date.now(),
      }

      try {
        console.log("[v0] Saving auth data to localStorage:", authData)
        localStorage.setItem("cambodia-admin-auth", JSON.stringify(authData))

        console.log("[v0] Updating component state...")
        setIsAuthenticated(true)
        setUser({ username })

        const savedData = localStorage.getItem("cambodia-admin-auth")
        console.log("[v0] Verification - saved data:", savedData)

        console.log("[v0] Login successful, auth state updated")
        return true
      } catch (error) {
        console.error("[v0] Error saving auth:", error)
        return false
      }
    }

    console.log("[v0] Login failed - invalid credentials")
    console.log("[v0] Username match:", username === "Meta")
    console.log("[v0] Password match:", password === "Meta@#2025")
    return false
  }

  const logout = () => {
    console.log("[v0] Logout function called")

    if (!isClient || typeof window === "undefined") {
      console.log("[v0] Logout failed - client not ready or window unavailable")
      return
    }

    console.log("[v0] Removing auth data and updating state...")
    localStorage.removeItem("cambodia-admin-auth")
    setIsAuthenticated(false)
    setUser(null)
    console.log("[v0] Logout complete")
  }

  console.log("[v0] AuthProvider rendering with state:", { isAuthenticated, user: user?.username, isLoading })

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
