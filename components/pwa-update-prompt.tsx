"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, X } from "lucide-react"

export function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service worker registered")
          setRegistration(reg)

          // Check for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New version available")
                  setShowUpdatePrompt(true)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.log("[PWA] Service worker registration failed:", error)
        })

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[PWA] Controller changed, reloading page")
        window.location.reload()
      })
    }
  }, [])

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      console.log("[PWA] Updating service worker")
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
      setShowUpdatePrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-blue-200 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-blue-900">Update Available</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs text-gray-600">
            A new version of the app is available with improvements and bug fixes.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button onClick={handleUpdate} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="mr-1 h-3 w-3" />
              Update Now
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm" className="flex-1 bg-transparent">
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
