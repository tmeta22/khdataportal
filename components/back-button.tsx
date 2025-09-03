"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // Don't show back button on home page
  if (pathname === "/") {
    return null
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </Button>
  )
}
