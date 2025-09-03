"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("[v0] Login form submitted")
    console.log("[v0] Form data - username:", username, "password length:", password.length)
    console.log("[v0] Current auth state before login:", isAuthenticated)

    try {
      console.log("[v0] Calling login function...")
      const success = login(username, password)
      console.log("[v0] Login function returned:", success)

      if (success) {
        console.log("[v0] Login successful, closing dialog and redirecting...")
        onOpenChange(false)
        setUsername("")
        setPassword("")

        setTimeout(() => {
          console.log("[v0] Redirecting to /data page...")
          router.push("/data")
        }, 100)
      } else {
        console.log("[v0] Login failed - setting error message")
        setError("Invalid username or password")
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      console.log("[v0] Setting loading to false")
      setIsLoading(false)
    }
  }

  console.log("[v0] LoginDialog rendering - open:", open, "isLoading:", isLoading, "error:", error)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>Login to access data management features</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
