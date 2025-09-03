"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        className="h-8 w-8 p-0"
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light theme</span>
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="h-8 w-8 p-0"
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark theme</span>
      </Button>
      <Button
        variant={theme === "system" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("system")}
        className="h-8 w-8 p-0"
      >
        <Monitor className="h-4 w-4" />
        <span className="sr-only">System theme</span>
      </Button>
    </div>
  )
}
