"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Map, Search, Upload } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { LoginDialog } from "@/components/login-dialog"

export function QuickActions() {
  const { isAuthenticated } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handleRestrictedAction = (action: () => void) => {
    if (isAuthenticated) {
      action()
    } else {
      setShowLoginDialog(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            size="sm"
            onClick={() => handleRestrictedAction(() => console.log("Export data"))}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>

          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            <Map className="w-4 h-4 mr-2" />
            View Full Map
          </Button>

          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            <Search className="w-4 h-4 mr-2" />
            Advanced Search
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            size="sm"
            onClick={() => handleRestrictedAction(() => (window.location.href = "/data"))}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </CardContent>
      </Card>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </>
  )
}
